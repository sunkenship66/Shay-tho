import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { MAX_MESSAGE_LENGTH } from '../constants/gameConfig';

// Used for public chat (A) and private messages (D).
export default function MessageModal({
  visible,
  onSend,
  onClose,
  title = 'SAY SOMETHING',
  placeholder = 'Type a message...',
  accent = '#e53e3e',
}) {
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
        <View style={[styles.box, { borderColor: accent }]}>
          <Text style={[styles.title, { color: accent }]}>{title}</Text>
          <TextInput
            autoFocus
            value={text}
            onChangeText={setText}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder={placeholder}
            placeholderTextColor="#718096"
            returnKeyType="send"
            onSubmitEditing={submit}
            style={styles.input}
          />
          <Text style={styles.count}>{text.length}/{MAX_MESSAGE_LENGTH}</Text>
          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}><Text style={styles.btnText}>CANCEL</Text></Pressable>
            <Pressable style={[styles.btn, { backgroundColor: accent }]} onPress={submit}><Text style={styles.btnText}>SEND</Text></Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const mono = Platform.select({ ios: 'Courier', default: 'monospace' });
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  box: { margin: 12, padding: 14, backgroundColor: '#f7fafc', borderWidth: 4, borderRadius: 6 },
  title: { fontFamily: mono, fontWeight: 'bold', marginBottom: 8 },
  input: { fontFamily: mono, fontSize: 16, color: '#1a202c', borderWidth: 2, borderColor: '#1a202c', padding: 8, backgroundColor: '#fff' },
  count: { fontFamily: mono, fontSize: 11, color: '#4a5568', alignSelf: 'flex-end', marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 4 },
  cancel: { backgroundColor: '#718096' },
  btnText: { color: '#fff', fontFamily: mono, fontWeight: 'bold' },
});
