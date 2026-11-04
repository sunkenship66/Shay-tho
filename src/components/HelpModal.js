import React from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { PROXIMITY_RADIUS } from '../constants/gameConfig';

const LINES = [
  ['D-PAD', 'Walk (hold to keep walking). Walk into a player to face them.'],
  ['A', 'Chat: everyone within range sees it'],
  ['B', 'Profile: friends, requests, synergy scores'],
  ['C', 'Send a friend request to the player you are facing'],
  ['D', 'Private message: only the player you are facing sees it'],
  ['L', 'Menu: change character, sign out'],
  ['R', 'This help screen'],
];

export default function HelpModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>HELP</Text>
          <ScrollView>
            {LINES.map(([k, v]) => (
              <View key={k} style={styles.line}>
                <Text style={styles.key}>{k}</Text>
                <Text style={styles.val}>{v}</Text>
              </View>
            ))}
            <Text style={styles.note}>
              Public chat reaches players within {PROXIMITY_RADIUS} tiles. Every private message you and another player
              exchange adds 1 to your synergy score, shown in your profile.
            </Text>
          </ScrollView>
          <Pressable style={styles.btn} onPress={onClose}><Text style={styles.btnText}>OK</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const mono = Platform.select({ ios: 'Courier', default: 'monospace' });
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.7)' },
  box: { maxHeight: '85%', backgroundColor: '#f7fafc', borderWidth: 4, borderColor: '#1a202c', borderRadius: 6, padding: 16 },
  title: { fontFamily: mono, fontWeight: 'bold', fontSize: 18, color: '#1a202c', marginBottom: 10 },
  line: { flexDirection: 'row', marginBottom: 6 },
  key: { width: 56, fontFamily: mono, fontWeight: 'bold', color: '#c53030' },
  val: { flex: 1, fontFamily: mono, color: '#1a202c', fontSize: 12 },
  note: { fontFamily: mono, color: '#4a5568', fontSize: 12, marginTop: 8 },
  btn: { alignSelf: 'flex-end', backgroundColor: '#2b6cb0', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 4, marginTop: 12 },
  btnText: { color: '#fff', fontFamily: mono, fontWeight: 'bold' },
});
