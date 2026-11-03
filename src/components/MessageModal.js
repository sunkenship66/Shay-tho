import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { MAX_MESSAGE_LENGTH } from '../constants/gameConfig';

export default function MessageModal({ visible, onSend, onClose }) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (visible) setText('');
  }, [visible]);

  const submit = () => {
    if (!text.trim()) return;
    onSend(text);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.box}>
          <Text style={styles.title}>SAY SOMETHING</Text>
          <TextInput
            autoFocus
            value={text}
            onChangeText={setText}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder="Type a message..."
            placeholderTextColor="#718096"
            returnKeyType="send"
            onSubmitEditing={submit}
            style={styles.input}
          />
          <Text style={styles.count}>{text.length}/{MAX_MESSAGE_LENGTH}</Text>
          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}><Text style={styles.btnText}>B: CANCEL</Text></Pressable>
            <Pressable style={[styles.btn, styles.send]} onPress={submit}><Text style={styles.btnText}>A: SEND</Text></Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const mono = Platform.select({ ios: 'Courier', default: 'monospace' });
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  box: { margin: 12, padding: 14, backgroundColor: '#f7fafc', borderWidth: 4, borderColor: '#1a202c', borderRadius: 6 },
  title: { fontFamily: mono, fontWeight: 'bold', color: '#1a202c', marginBottom: 8 },
  input: { fontFamily: mono, fontSize: 16, color: '#1a202c', borderWidth: 2, borderColor: '#1a202c', padding: 8, backgroundColor: '#fff' },
  count: { fontFamily: mono, fontSize: 11, color: '#4a5568', alignSelf: 'flex-end', marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 4 },
  cancel: { backgroundColor: '#dd6b20' },
  send: { backgroundColor: '#e53e3e' },
  btnText: { color: '#fff', fontFamily: mono, fontWeight: 'bold' },
});
