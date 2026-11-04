import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';
import { BUBBLE_DURATION_MS } from '../constants/gameConfig';

const SocialContext = createContext(null);

const DM_POLL_MS = 1000;
const REQUEST_POLL_MS = 2500;
const SYNERGY_POLL_MS = 8000;

export function SocialProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const myName = user ? user.displayName || user.email?.split('@')[0] || 'Student' : '';

  const [requests, setRequests] = useState([]);         // friend_requests rows that involve me
  const [synergyRows, setSynergyRows] = useState([]);   // synergy_scores rows that involve me
  const [privateBubbles, setPrivateBubbles] = useState({}); // uid -> text (private bubble above that avatar)
  const [notice, setNotice] = useState(null);           // { key, text }
  const [error, setError] = useState('');

  const myNameRef = useRef(myName);
  const requestsRef = useRef([]);
  const knownReqRef = useRef({});     // request id -> last known status
  const dmCursorRef = useRef(null);   // null = not initialised yet
  const seenDmRef = useRef(new Set());
  const bubbleTimers = useRef({});
  const errsRef = useRef({});
  const reqFetchingRef = useRef(false);

  myNameRef.current = myName;

  const setErr = useCallback((key, msg) => {
    errsRef.current[key] = msg;
    const first = Object.values(errsRef.current).find(Boolean) || '';
    setError((prev) => (prev === first ? prev : first));
  }, []);

  const showPrivate = useCallback((id, text) => {
    setPrivateBubbles((b) => ({ ...b, [id]: text }));
    clearTimeout(bubbleTimers.current[id]);
    bubbleTimers.current[id] = setTimeout(() => {
      setPrivateBubbles((b) => {
        const { [id]: _gone, ...rest } = b;
        return rest;
      });
    }, BUBBLE_DURATION_MS);
  }, []);

  const refreshSynergy = useCallback(async () => {
    if (!uid) return;
    try {
      const { data, error: err } = await supabase
        .from('synergy_scores')
        .select('*')
        .or(`uid_a.eq.${uid},uid_b.eq.${uid}`);
      if (err) throw err;
      setSynergyRows(data || []);
      setErr('syn', '');
    } catch (e) {
      setErr('syn', `synergy: ${e.message || e}`);
    }
  }, [uid, setErr]);

  const loadRequests = useCallback(async () => {
    if (!uid || reqFetchingRef.current) return;
    reqFetchingRef.current = true;
    try {
      const { data, error: err } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`from_uid.eq.${uid},to_uid.eq.${uid}`);
      if (err) throw err;

      const notices = [];
      (data || []).forEach((r) => {
        const prev = knownReqRef.current[r.id];
        if (r.to_uid === uid && r.status === 'pending' && prev !== 'pending') {
          notices.push(`${r.from_name || 'Someone'} sent you a friend request! Press B`);
        }
        if (r.from_uid === uid && r.status === 'accepted' && prev && prev !== 'accepted') {
          notices.push(`${r.to_name || 'Someone'} accepted your friend request!`);
        }
        knownReqRef.current[r.id] = r.status;
      });
      if (notices.length) setNotice({ key: Date.now(), text: notices[notices.length - 1] });

      requestsRef.current = data || [];
      setRequests(data || []);
      setErr('req', '');
    } catch (e) {
      setErr('req', `friends: ${e.message || e}`);
    } finally {
      reqFetchingRef.current = false;
    }
  }, [uid, setErr]);

  useEffect(() => {
    if (!uid) return undefined;
    const timers = bubbleTimers.current;
    let dmFetching = false;

    const pollDm = async () => {
      if (dmFetching) return;
      dmFetching = true;
      try {
        if (dmCursorRef.current === null) {
          // Start from the newest message that already exists, so old messages never replay
          const { data, error: err } = await supabase
            .from('private_messages')
            .select('created_at')
            .eq('to_uid', uid)
            .order('created_at', { ascending: false })
            .limit(1);
          if (err) throw err;
          dmCursorRef.current = data && data.length ? data[0].created_at : '1970-01-01T00:00:00Z';
        } else {
          const { data, error: err } = await supabase
            .from('private_messages')
            .select('*')
            .eq('to_uid', uid)
            .gt('created_at', dmCursorRef.current)
            .order('created_at', { ascending: true });
          if (err) throw err;
          if (data && data.length) {
            data.forEach((m) => {
              if (seenDmRef.current.has(m.id)) return;
              seenDmRef.current.add(m.id);
              showPrivate(m.from_uid, m.text);
            });
            dmCursorRef.current = data[data.length - 1].created_at;
            refreshSynergy();
          }
        }
        setErr('dm', '');
      } catch (e) {
        setErr('dm', `messages: ${e.message || e}`);
      } finally {
        dmFetching = false;
      }
    };

    pollDm();
    loadRequests();
    refreshSynergy();
    const t1 = setInterval(pollDm, DM_POLL_MS);
    const t2 = setInterval(loadRequests, REQUEST_POLL_MS);
    const t3 = setInterval(refreshSynergy, SYNERGY_POLL_MS);

    return () => {
      clearInterval(t1);
      clearInterval(t2);
      clearInterval(t3);
      Object.values(timers).forEach(clearTimeout);
    };
  }, [uid, loadRequests, refreshSynergy, showPrivate, setErr]);

  // ---------- actions ----------
  // target = { uid, name }
  const sendFriendRequest = useCallback(
    async (target) => {
      if (!uid || !target) return { ok: false, msg: 'Face a player first.' };
      const rows = requestsRef.current.filter(
        (r) => (r.from_uid === uid && r.to_uid === target.uid) || (r.from_uid === target.uid && r.to_uid === uid)
      );
      if (rows.some((r) => r.status === 'accepted')) {
        return { ok: false, msg: `You and ${target.name} are already friends.` };
      }
      if (rows.some((r) => r.status === 'pending' && r.from_uid === uid)) {
        return { ok: false, msg: `Your request to ${target.name} is already waiting.` };
      }
      try {
        const theirs = rows.find((r) => r.status === 'pending' && r.to_uid === uid);
        if (theirs) {
          // They already asked me: accept instead of creating a second request
          const { error: err } = await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', theirs.id);
          if (err) throw err;
          await loadRequests();
          return { ok: true, msg: `You are now friends with ${target.name}!` };
        }
        const { error: err } = await supabase.from('friend_requests').upsert(
          { from_uid: uid, from_name: myNameRef.current, to_uid: target.uid, to_name: target.name, status: 'pending' },
          { onConflict: 'from_uid,to_uid' }
        );
        if (err) throw err;
        await loadRequests();
        return { ok: true, msg: `Friend request sent to ${target.name}!` };
      } catch (e) {
        return { ok: false, msg: `Could not send request: ${e.message || e}` };
      }
    },
    [uid, loadRequests]
  );

  const respondRequest = useCallback(
    async (id, accept) => {
      try {
        const { error: err } = await supabase
          .from('friend_requests')
          .update({ status: accept ? 'accepted' : 'declined' })
          .eq('id', id);
        if (err) throw err;
        await loadRequests();
        return { ok: true, msg: accept ? 'Friend added!' : 'Request declined.' };
      } catch (e) {
        return { ok: false, msg: `Could not update request: ${e.message || e}` };
      }
    },
    [loadRequests]
  );

  const sendPrivate = useCallback(
    async (target, text) => {
      const clean = (text || '').trim();
      if (!uid || !target || !clean) return { ok: false, msg: '' };
      try {
        const { error: err } = await supabase.from('private_messages').insert({
          from_uid: uid,
          from_name: myNameRef.current,
          to_uid: target.uid,
          to_name: target.name,
          text: clean,
        });
        if (err) throw err;
        showPrivate(uid, clean); // my own private bubble above my head
        refreshSynergy();
        return { ok: true, msg: `Private message sent to ${target.name}` };
      } catch (e) {
        return { ok: false, msg: `Could not send: ${e.message || e}` };
      }
    },
    [uid, showPrivate, refreshSynergy]
  );

  // ---------- derived data ----------
  const { friends, incoming, outgoing } = useMemo(() => {
    const f = [];
    const inc = [];
    const out = [];
    requests.forEach((r) => {
      const mine = r.from_uid === uid;
      const other = { id: r.id, uid: mine ? r.to_uid : r.from_uid, name: (mine ? r.to_name : r.from_name) || 'Student' };
      if (r.status === 'accepted') f.push(other);
      else if (r.status === 'pending') (mine ? out : inc).push(other);
    });
    return { friends: f, incoming: inc, outgoing: out };
  }, [requests, uid]);

  const synergy = useMemo(
    () =>
      synergyRows
        .map((r) => {
          const iAmA = r.uid_a === uid;
          return { uid: iAmA ? r.uid_b : r.uid_a, name: (iAmA ? r.name_b : r.name_a) || 'Student', score: r.score };
        })
        .sort((a, b) => b.score - a.score),
    [synergyRows, uid]
  );

  const value = {
    friends,
    incoming,
    outgoing,
    synergy,
    privateBubbles,
    notice,
    error,
    sendFriendRequest,
    respondRequest,
    sendPrivate,
  };
  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export const useSocial = () => useContext(SocialContext);
