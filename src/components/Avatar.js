import React, { useState, useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Platform } from 'react-native';
import { CHARACTERS, DEFAULT_CHARACTER } from '../constants/characters';
import { AVATAR_Z } from './TileMap';
import ChatBubble from './ChatBubble';

export default function Avatar({
  characterId = DEFAULT_CHARACTER,
  position = { row: 1, col: 1 },
  direction = 'down',
  message = null,
  privateMessage = null,
  highlight = false,
  name = '',
  tileSize = 32,
}) {
  // Frame 1 = idle. Each step flips between frame 0 (left foot) and 2 (right foot).
  const [frame, setFrame] = useState(1);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return undefined;
    }
    setFrame((f) => (f === 0 ? 2 : 0));
    const t = setTimeout(() => setFrame(1), 280);
    return () => clearTimeout(t);
  }, [position.row, position.col]);

  const character = CHARACTERS[characterId] || CHARACTERS[DEFAULT_CHARACTER];
  const sprites = character.sprites[direction] || character.sprites.down;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        { top: position.row * tileSize, left: position.col * tileSize, width: tileSize, height: tileSize, zIndex: AVATAR_Z(position.row) },
      ]}
    >
      {highlight ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.ring]} /> : null}
      {privateMessage ? (
        <ChatBubble text={privateMessage} tileSize={tileSize} variant="private" />
      ) : message ? (
        <ChatBubble text={message} tileSize={tileSize} />
      ) : null}
      <Image source={sprites[frame]} resizeMode="contain" resizeMethod="scale" style={{ width: tileSize, height: tileSize }} />
      {name ? (
        <Text numberOfLines={1} style={[styles.name, { fontSize: Math.max(7, tileSize * 0.24), width: tileSize * 3, left: -tileSize }]}>
          {name}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ring: { borderWidth: 2, borderColor: '#f6e05e', borderRadius: 4 },
  name: {
    position: 'absolute', bottom: -2, textAlign: 'center', color: '#fff',
    textShadowColor: '#000', textShadowRadius: 2, textShadowOffset: { width: 1, height: 1 },
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }), fontWeight: 'bold',
  },
});
