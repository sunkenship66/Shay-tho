import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      if (mode === 'signin') await signIn(email, password);
      else await signUp(email, password, name);
    } catch (e) {
      setError((e.code || e.message || 'Something went wrong').replace('auth/', '').replace(/-/g, ' '));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.logo}>SHAY-THO</Text>
      <Text style={styles.tag}>the pixel student lounge</Text>

      {mode === 'signup' && (
        <TextInput style={styles.input} placeholder="Display name" placeholderTextColor="#718096" value={name} onChangeText={setName} maxLength={12} />
      )}
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#718096" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#718096" secureTextEntry value={password} onChangeText={setPassword} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={[styles.btn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{mode === 'signin' ? 'PRESS START' : 'CREATE ACCOUNT'}</Text>}
      </Pressable>

      <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        <Text style={styles.link}>{mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in'}</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const mono = Platform.select({ ios: 'Courier', default: 'monospace' });
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', padding: 28 },
  logo: { color: '#f6e05e', fontFamily: mono, fontWeight: 'bold', fontSize: 40, textAlign: 'center', letterSpacing: 4 },
  tag: { color: '#a0aec0', fontFamily: mono, textAlign: 'center', marginBottom: 28 },
  input: { backgroundColor: '#1a1a24', color: '#fff', fontFamily: mono, borderWidth: 2, borderColor: '#2d3748', borderRadius: 4, padding: 12, marginBottom: 12 },
  btn: { backgroundColor: '#e53e3e', borderWidth: 3, borderColor: '#9b2c2c', borderRadius: 4, padding: 14, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontFamily: mono, fontWeight: 'bold', letterSpacing: 2 },
  link: { color: '#90cdf4', fontFamily: mono, textAlign: 'center', marginTop: 18 },
  error: { color: '#fc8181', fontFamily: mono, marginBottom: 8, textTransform: 'capitalize' },
});
