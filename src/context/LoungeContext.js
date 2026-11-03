import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';
import { isWithinProximity } from '../utils/spatialMath';
import { ROOM_CHANNEL, PROXIMITY_RADIUS, BUBBLE_DURATION_MS } from '../constants/gameConfig';

const LoungeContext = createContext(null);

export function LoungeProvider({ children }) {
  const { user } = useAuth();
  const [others, setOthers] = useState({});   // uid -> { uid, name, character, row, col, direction, ts }
  const [bubbles, setBubbles] = useState({}); // uid -> text

  const channelRef = useRef(null);
  const readyRef = useRef(false);
  const latestRef = useRef(null);             // my latest state
  const timersRef = useRef({});
  const trackTimerRef = useRef(null);

  const clearBubble = useCallback((uid) => {
    clearTimeout(timersRef.current[uid]);
    setBubbles((b) => {
      const { [uid]: _gone, ...rest } = b;
      return rest;
    });
  }, []);

  const showBubble = useCallback(
    (uid, text) => {
      setBubbles((b) => ({ ...b, [uid]: text }));
      clearTimeout(timersRef.current[uid]);
      timersRef.current[uid] = setTimeout(() => clearBubble(uid), BUBBLE_DURATION_MS);
    },
    [clearBubble]
  );

  useEffect(() => {
    if (!user) return undefined;
    const uid = user.uid;
    const timers = timersRef.current;

    const channel = supabase.channel(ROOM_CHANNEL, {
      config: { presence: { key: uid }, broadcast: { self: false } },
    });

    channel
      // Who is online: merge only, never wipe players we know from movement broadcasts
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('[lounge] presence users:', Object.keys(state));
        setOthers((prev) => {
          const next = { ...prev };
          Object.entries(state).forEach(([key, metas]) => {
            if (key === uid || !metas.length) return;
            const meta = metas[metas.length - 1];
            const existing = prev[key];
            if (!existing || (meta.ts || 0) >= (existing.ts || 0)) next[key] = meta;
          });
          return next;
        });
      })
      // Only remove a player if they are really gone, not just refreshing their presence
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key === uid) return;
        if (channel.presenceState()[key]?.length) return;
        setOthers((prev) => {
          const { [key]: _gone, ...rest } = prev;
          return rest;
        });
      })
      // Live movement
      .on('broadcast', { event: 'move' }, ({ payload }) => {
        if (!payload || payload.uid === uid) return;
        setOthers((prev) => ({ ...prev, [payload.uid]: payload }));
      })
      // Chat
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        if (!payload || payload.uid === uid) return;
        const me = latestRef.current;
        if (me && !isWithinProximity(me, payload, PROXIMITY_RADIUS)) return;
        showBubble(payload.uid, payload.text);
      })
      .subscribe(async (status, err) => {
        console.log('[lounge] channel status:', status, err ? err.message : '');
        if (status === 'SUBSCRIBED') {
          readyRef.current = true;
          if (latestRef.current) {
            await channel.track(latestRef.current);
            channel.send({ type: 'broadcast', event: 'move', payload: latestRef.current });
          }
        } else {
          readyRef.current = false;
        }
      });

    channelRef.current = channel;

    return () => {
      readyRef.current = false;
      clearTimeout(trackTimerRef.current);
      trackTimerRef.current = null;
      Object.values(timers).forEach(clearTimeout);
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user, showBubble]);

  // state = { uid, name, character, row, col, direction }
  const broadcastState = useCallback((state) => {
    const full = { ...state, ts: Date.now() };
    latestRef.current = full;
    if (!readyRef.current || !channelRef.current) return;

    // Fast path: every step goes out as a broadcast
    channelRef.current.send({ type: 'broadcast', event: 'move', payload: full });

    // Slow path: refresh presence at most once a second so late joiners see fresh positions
    if (!trackTimerRef.current) {
      trackTimerRef.current = setTimeout(() => {
        trackTimerRef.current = null;
        if (readyRef.current && latestRef.current) channelRef.current?.track(latestRef.current);
      }, 1000);
    }
  }, []);

  const sendChat = useCallback(
    (text) => {
      const me = latestRef.current;
      const clean = text.trim();
      if (!me || !clean) return;
      showBubble(me.uid, clean);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'chat',
        payload: { uid: me.uid, text: clean, row: me.row, col: me.col },
      });
    },
    [showBubble]
  );

  return (
    <LoungeContext.Provider value={{ others, bubbles, broadcastState, sendChat, clearBubble }}>
      {children}
    </LoungeContext.Provider>
  );
}

export const useLounge = () => useContext(LoungeContext);