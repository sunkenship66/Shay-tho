import React from 'react';
import { View, Image, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { CHARACTERS, CHARACTER_IDS } from '../constants/characters';

export default function CharacterGrid({ selected, onSelect, numColumns = 4 }) {
  return (
    <FlatList
      data={CHARACTER_IDS}
      keyExtractor={(id) => id}
      numColumns={numColumns}
      contentContainerStyle={styles.list}
      renderItem={({ item: id }) => {
        const active = id === selected;
        return (
          <Pressable onPress={() => onSelect(id)} style={[styles.cell, active && styles.active]}>
            <Image source={CHARACTERS[id].sprites.down[1]} style={styles.img} resizeMode="contain" resizeMethod="scale" />
            <Text style={styles.label} numberOfLines={1}>{CHARACTERS[id].name}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 8 },
  cell: { flex: 1, margin: 4, paddingVertical: 8, alignItems: 'center', backgroundColor: '#1a1a24', borderWidth: 2, borderColor: '#2d3748', borderRadius: 6 },
  active: { borderColor: '#f6e05e', backgroundColor: '#2d3748' },
  img: { width: 48, height: 48 },
  label: { color: '#e2e8f0', fontSize: 9, marginTop: 4 },
});
