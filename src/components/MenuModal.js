import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import CharacterGrid from './CharacterGrid';

export default function MenuModal({ visible, onClose, characterId, onSelectCharacter, onSignOut, userName }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>MENU</Text>
          <Text style={styles.sub}>Signed in as {userName || 'Student'}</Text>
          <Text style={styles.section}>CHARACTER</Text>
          <View style={styles.grid}>
            <CharacterGrid selected={characterId} onSelect={onSelectCharacter} />
          </View>
          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.danger]} onPress={onSignOut}><Text style={styles.btnText}>SIGN OUT</Text></Pressable>
            <Pressable style={[styles.btn, styles.primary]} onPress={onClose}><Text style={styles.btnText}>CLOSE</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const mono = Platform.select({ ios: 'Courier', default: 'monospace' });
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  box: { height: '75%', backgroundColor: '#0f0f17', borderTopWidth: 4, borderColor: '#4a5568', padding: 12 },
  title: { color: '#f6e05e', fontFamily: mono, fontWeight: 'bold', fontSize: 18 },
  sub: { color: '#a0aec0', fontFamily: mono, fontSize: 12, marginBottom: 8 },
  section: { color: '#e2e8f0', fontFamily: mono, fontWeight: 'bold', marginTop: 4 },
  grid: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  btn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 4 },
  danger: { backgroundColor: '#9b2c2c' },
  primary: { backgroundColor: '#2b6cb0' },
  btnText: { color: '#fff', fontFamily: mono, fontWeight: 'bold' },
});
