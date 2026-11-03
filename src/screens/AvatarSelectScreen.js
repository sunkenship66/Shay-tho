import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CharacterGrid from '../components/CharacterGrid';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_CHARACTER } from '../constants/characters';

export default function AvatarSelectScreen() {
  const { setCharacter } = useAuth();
  const [selected, setSelected] = useState(DEFAULT_CHARACTER);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>CHOOSE YOUR CHARACTER</Text>
      <View style={{ flex: 1 }}>
        <CharacterGrid selected={selected} onSelect={setSelected} />
      </View>
      <Pressable style={styles.btn} onPress={() => setCharacter(selected)}>
        <Text style={styles.btnText}>ENTER LOUNGE</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const mono = Platform.select({ ios: 'Courier', default: 'monospace' });
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 12 },
  title: { color: '#f6e05e', fontFamily: mono, fontWeight: 'bold', fontSize: 18, textAlign: 'center', marginVertical: 12 },
  btn: { backgroundColor: '#e53e3e', borderWidth: 3, borderColor: '#9b2c2c', borderRadius: 4, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontFamily: mono, fontWeight: 'bold', letterSpacing: 2 },
});
