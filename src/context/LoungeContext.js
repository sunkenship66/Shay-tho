import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';
import { isWithinProximity } from '../utils/spatialMath';
import { ROOM_CHANNEL, PROXIMITY_RADIUS, BUBBLE_DURATION_MS } from '../constants/gameConfig';

const LoungeContext = createContext(null);

const TABLE = 'players';
const WRITE_THROTTLE_MS = 250;  // max DB writes while walking
const HEARTBEAT_MS = 3000;      // re-announce myself even when standing still
const POLL_MS = 700;            // how often to read everyone's state
const STALE_MS = 10000;         // drop a player not heard from for this long
const FETCH_WINDOW_MS = 30000;  // ignore table rows older than this

const toRow = (s) => ({
  uid: s.uid,
  name: s.name,
  character: s.character,
  pos_row: s.row,
  pos_col: s.col,
  direction: s.direction,
  chat_id: s.chat?.id ?? null,
  chat_text: s.chat?.text ?? null,
  ts: s.ts,
});

const fromRow = (r) => ({
  uid: r.uid,
  name: r.name,
  character: r.character,
  row: r.pos_row,
  col: r.pos_col,
  direction: r.direction,
  ts: Number(r.ts),
  chat: r.chat_id ? { id: r.chat_id, text: r.chat_text } : null,
});

export function LoungeProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.uid;

  const [others, setOthers] = useState({});
  const [bubbles, setBubbles] = useState({});
  const [debug, setDebug] = useState({ ws: 'connecting', rx: 0, err: '' });

  const latestRef = useRef(null);      // my current state (incl. chat)
  const seenRef = useRef({});          // uid -> { ts, seenAt, pruned }
  const seenChatRef = useRef({});      // uid -> last chat id shown
  const channelRef = useRef(null);
  const readyRef = useRef(false);
  const writeTimerRef = useRef(null);
  const lastWriteRef = useRef(0);
  const chatClearRef = useRef(null);
  const bubbleTimers = useRef({});
  const wsStatusRef = useRef('connecting');
  const rxRef = useRef(0);
  const readErrRef = useRef('');
  const writeErrRef = useRef('');

  const clearBubble = useCallback((id) => {
    clearTimeout(bubbleTimers.current[id]);
    setBubbles((b) => {
      const { [id]: _gone, ...rest } = b;
      return rest;
    });
  }, []);

  const showBubble = useCallback(
    (id, text) => {
      setBubbles((b) => ({ ...b, [id]: text }));
      clearTimeout(bubbleTimers.current[id]);
      bubbleTimers.current[id] = setTimeout(() => clearBubble(id), BUBBLE_DURATION_MS);
    },
    [clearBubble]
  );

  // Another player's chat: show once, only if close enough and recent
  const handleChat = useCallback(
    (s) => {
      const chat = s.chat;
      if (!chat || !chat.id || !chat.text) return;
      if (seenChatRef.current[s.uid] === chat.id) return;
      seenChatRef.current[s.uid] = chat.id;
      const sentAt = Number(String(chat.id).split('-').pop());
      if (sentAt && Math.abs(Date.now() - sentAt) > 15000) return;
      const me = latestRef.current;
      if (me && !isWithinProximity(me, s, PROXIMITY_RADIUS)) return;
      showBubble(s.uid, chat.text);
    },
    [showBubble]
  );

  // A state update about another player (from the database OR the websocket)
  const applyRemote = useCallback(
    (s) => {
      if (!s || !s.uid || s.uid === uid || !s.ts) return;
      const seen = seenRef.current[s.uid];
      if (seen && s.ts <= seen.ts) return; // nothing new (also blocks pruned ghosts)
      seenRef.current[s.uid] = { ts: s.ts, seenAt: Date.now(), pruned: false };
      setOthers((prev) => ({ ...prev, [s.uid]: s }));
      handleChat(s);
    },
    [uid, handleChat]
  );

  const sendFast = useCallback(() => {
    if (!readyRef.current || !channelRef.current || !latestRef.current) return;
    channelRef.current.send({ type: 'broadcast', event: 'state', payload: latestRef.current });
  }, []);

  const upsertMe = useCallback(async () => {
    clearTimeout(writeTimerRef.current);
    writeTimerRef.current = null;
    const me = latestRef.current;
    if (!me) return;
    lastWriteRef.current = Date.now();
    try {
      const { error } = await supabase.from(TABLE).upsert(toRow(me), { onConflict: 'uid' });
      writeErrRef.current = error ? `write: ${error.message}` : '';
    } catch (e) {
      writeErrRef.current = `write: ${e.message || e}`;
    }
  }, []);

  const scheduleWrite = useCallback(() => {
    if (writeTimerRef.current) return;
    const wait = Math.max(0, WRITE_THROTTLE_MS - (Date.now() - lastWriteRef.current));
    writeTimerRef.current = setTimeout(upsertMe, wait);
  }, [upsertMe]);

  useEffect(() => {
    if (!uid) return undefined;
    const bTimers = bubbleTimers.current;
    let fetching = false;

    // 1) Websocket = fast path only (nice-to-have)
    const channel = supabase.channel(ROOM_CHANNEL, { config: { broadcast: { self: false } } });
    channelRef.current = channel;
    channel
      .on('broadcast', { event: 'state' }, ({ payload }) => {
        rxRef.current += 1;
        applyRemote(payload);
      })
      .subscribe((status) => {
        wsStatusRef.current = status;
        readyRef.current = status === 'SUBSCRIBED';
      });

    // 2) Database = source of truth (plain HTTPS, always works)
    const poll = async () => {
      if (fetching) return;
      fetching = true;
      try {
        const since = new Date(Date.now() - FETCH_WINDOW_MS).toISOString();
        const { data, error } = await supabase.from(TABLE).select('*').gte('updated_at', since);
        if (error) throw error;
        readErrRef.current = '';
        (data || []).forEach((r) => applyRemote(fromRow(r)));
      } catch (e) {
        readErrRef.current = `read: ${e.message || e}`;
      } finally {
        fetching = false;
      }
    };
    poll();
    const pollTimer = setInterval(poll, POLL_MS);

    // 3) Heartbeat: change my ts every few seconds so everyone knows I'm alive
    const heartbeat = setInterval(() => {
      if (!latestRef.current) return;
      latestRef.current = { ...latestRef.current, ts: Date.now() };
      upsertMe();
      sendFast();
    }, HEARTBEAT_MS);

    // 4) Housekeeping: drop silent players, refresh debug info
    const housekeeping = setInterval(() => {
      const now = Date.now();
      const gone = [];
      Object.entries(seenRef.current).forEach(([k, v]) => {
        if (!v.pruned && now - v.seenAt > STALE_MS) {
          v.pruned = true;
          gone.push(k);
        }
      });
      if (gone.length) {
        setOthers((prev) => {
          const next = { ...prev };
          gone.forEach((k) => delete next[k]);
          return next;
        });
      }
      const err = readErrRef.current || writeErrRef.current;
      setDebug((d) =>
        d.ws === wsStatusRef.current && d.rx === rxRef.current && d.err === err
          ? d
          : { ws: wsStatusRef.current, rx: rxRef.current, err }
      );
    }, 1000);

    return () => {
      clearInterval(pollTimer);
      clearInterval(heartbeat);
      clearInterval(housekeeping);
      clearTimeout(writeTimerRef.current);
      clearTimeout(chatClearRef.current);
      writeTimerRef.current = null;
      readyRef.current = false;
      Object.values(bTimers).forEach(clearTimeout);
      supabase.removeChannel(channel);
      channelRef.current = null;
      supabase.from(TABLE).delete().eq('uid', uid).then(() => {}, () => {});
    };
  }, [uid, applyRemote, sendFast, upsertMe]);

  // state = { uid, name, character, row, col, direction }
  const broadcastState = useCallback(
    (state) => {
      latestRef.current = { ...state, chat: latestRef.current?.chat ?? null, ts: Date.now() };
      sendFast();
      scheduleWrite();
    },
    [sendFast, scheduleWrite]
  );

  const sendChat = useCallback(
    (text) => {
      const me = latestRef.current;
      const clean = text.trim();
      if (!me || !clean) return;

      const chat = { id: `${me.uid}-${Date.now()}`, text: clean };
      latestRef.current = { ...me, chat, ts: Date.now() };
      showBubble(me.uid, clean);
      upsertMe();
      sendFast();

      // Remove the chat from my row once the bubble has expired
      clearTimeout(chatClearRef.current);
      chatClearRef.current = setTimeout(() => {
        if (latestRef.current) {
          latestRef.current = { ...latestRef.current, chat: null, ts: Date.now() };
          upsertMe();
        }
      }, BUBBLE_DURATION_MS + 500);
    },
    [showBubble, upsertMe, sendFast]
  );

  return (
    <LoungeContext.Provider value={{ others, bubbles, debug, broadcastState, sendChat, clearBubble }}>
      {children}
    </LoungeContext.Provider>
  );
}

export const useLounge = () => useContext(LoungeContext);