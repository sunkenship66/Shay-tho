import React, { useState } from 'react';
import { Modal, View, Text, Image, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { CHARACTERS, DEFAULT_CHARACTER } from '../constants/characters';

const LEVELS = [
  { min: 30, label: 'Soulmates' },
  { min: 15, label: 'Close pals' },
  { min: 5, label: 'Chatty' },
  { min: 1, label: 'Warming up' },
  { min: 0, label: 'Strangers' },
];
const synergyLevel = (score) => LEVELS.find((l) => score >= l.min).label;

export default function ProfileModal({
  visible,
  onClose,
  name,
  characterId,
  friends = [],
  incoming = [],
  outgoing = [],
  synergy = [],
  onlineUids = new Set(),
  onRespond,
}) {
  const [tab, setTab] = useState('friends');
  const character = CHARACTERS[characterId] || CHARACTERS[DEFAULT_CHARACTER];
  const scoreOf = (uid) => synergy.find((s) => s.uid === uid)?.score || 0;
  const total = synergy.reduce((sum, s) => sum + s.score, 0);

  const Tab = ({ id, label }) => (
    <Pressable style={[styles.tab, tab === id && styles.tabActive]} onPress={() => setTab(id)}>
      <Text style={[styles.tabText, tab === id && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={styles.header}>
            <Image source={character.sprites.down[1]} style={styles.avatar} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{name}</Text>
              <Text style={styles.sub}>{character.name}</Text>
              <Text style={styles.sub}>Friends: {friends.length}   Total synergy: {total}</Text>
            </View>
          </View>

          <View style={styles.tabs}>
            <Tab id="friends" label="FRIENDS" />
            <Tab id="requests" label={`REQUESTS${incoming.length ? ` (${incoming.length})` : ''}`} />
            <Tab id="synergy" label="SYNERGY" />
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 8 }}>
            {tab === 'friends' && (
              <>
                {friends.length === 0 && (
                  <Text style={styles.empty}>No friends yet. Face a player and press C to send a request.</Text>
                )}
                {friends.map((f) => (
                  <View key={f.id} style={styles.row}>
                    <View style={[styles.dot, onlineUids.has(f.uid) ? styles.dotOn : styles.dotOff]} />
                    <Text style={styles.rowName} numberOfLines={1}>{f.name}</Text>
                    <Text style={styles.rowMeta}>{onlineUids.has(f.uid) ? 'online' : 'offline'}   ♥ {scoreOf(f.uid)}</Text>
                  </View>
                ))}
              </>
            )}

            {tab === 'requests' && (
              <>
                {incoming.length === 0 && outgoing.length === 0 && <Text style={styles.empty}>No pending requests.</Text>}
                {incoming.map((r) => (
                  <View key={r.id} style={styles.row}>
                    <Text style={styles.rowName} numberOfLines={1}>{r.name}</Text>
                    <Pressable style={[styles.smallBtn, styles.accept]} onPress={() => onRespond(r.id, true)}>
                      <Text style={styles.smallBtnText}>ACCEPT</Text>
                    </Pressable>
                    <Pressable style={[styles.smallBtn, styles.decline]} onPress={() => onRespond(r.id, false)}>
                      <Text style={styles.smallBtnText}>DECLINE</Text>
                    </Pressable>
                  </View>
                ))}
                {outgoing.map((r) => (
                  <View key={r.id} style={styles.row}>
                    <Text style={styles.rowName} numberOfLines={1}>{r.name}</Text>
                    <Text style={styles.rowMeta}>waiting for reply...</Text>
                  </View>
                ))}
              </>
            )}

            {tab === 'synergy' && (
              <>
                {synergy.length === 0 && (
                  <Text style={styles.empty}>
                    No synergy yet. Face a player and press D to send a private message. Every private message between
                    two players adds 1.
                  </Text>
                )}
                {synergy.map((s) => (
                  <View key={s.uid} style={styles.synRow}>
                    <View style={styles.synTop}>
                      <Text style={styles.rowName} numberOfLines={1}>{s.name}</Text>
                      <Text style={styles.score}>♥ {s.score}</Text>
                    </View>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: `${Math.min(100, (s.score / 30) * 100)}%` }]} />
                    </View>
                    <Text style={styles.rowMeta}>{synergyLevel(s.score)}</Text>
                  </View>
                ))}
              </>
            )}
          </ScrollView>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>CLOSE</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const mono = Platform.select({ ios: 'Courier', default: 'monospace' });
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  box: { height: '80%', backgroundColor: '#0f0f17', borderTopWidth: 4, borderColor: '#4a5568', padding: 12 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 56, height: 56, marginRight: 10, backgroundColor: '#1a1a24', borderWidth: 2, borderColor: '#2d3748' },
  name: { color: '#f6e05e', fontFamily: mono, fontWeight: 'bold', fontSize: 18 },
  sub: { color: '#a0aec0', fontFamily: mono, fontSize: 11 },
  tabs: { flexDirection: 'row', marginBottom: 8, gap: 6 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: '#1a1a24', borderWidth: 2, borderColor: '#2d3748', borderRadius: 4 },
  tabActive: { borderColor: '#f6e05e', backgroundColor: '#2d3748' },
  tabText: { color: '#a0aec0', fontFamily: mono, fontWeight: 'bold', fontSize: 11 },
  tabTextActive: { color: '#f6e05e' },
  body: { flex: 1 },
  empty: { color: '#a0aec0', fontFamily: mono, fontSize: 12, padding: 12, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a24', borderWidth: 2, borderColor: '#2d3748', borderRadius: 4, padding: 10, marginBottom: 6 },
  rowName: { flex: 1, color: '#e2e8f0', fontFamily: mono, fontWeight: 'bold' },
  rowMeta: { color: '#a0aec0', fontFamily: mono, fontSize: 11 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  dotOn: { backgroundColor: '#48bb78' },
  dotOff: { backgroundColor: '#4a5568' },
  smallBtn: { paddingVertical: 6, paddingHorizontal: 8, borderRadius: 4, marginLeft: 6 },
  accept: { backgroundColor: '#38a169' },
  decline: { backgroundColor: '#9b2c2c' },
  smallBtnText: { color: '#fff', fontFamily: mono, fontWeight: 'bold', fontSize: 10 },
  synRow: { backgroundColor: '#1a1a24', borderWidth: 2, borderColor: '#2d3748', borderRadius: 4, padding: 10, marginBottom: 6 },
  synTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  score: { color: '#fc8181', fontFamily: mono, fontWeight: 'bold' },
  barBg: { height: 8, backgroundColor: '#2d3748', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  barFill: { height: 8, backgroundColor: '#fc8181' },
  closeBtn: { backgroundColor: '#2b6cb0', paddingVertical: 12, alignItems: 'center', borderRadius: 4, marginTop: 8 },
  closeText: { color: '#fff', fontFamily: mono, fontWeight: 'bold' },
});
