import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet, Platform } from 'react-native';

// variant: 'public' (white) or 'private' (purple, only the two people involved ever see it)
export default function ChatBubble({ text, tileSize, variant = 'public' }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
  }, [text, anim]);

  const boxWidth = tileSize * 4;
  const priv = variant === 'private';

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        { width: boxWidth, left: (tileSize - boxWidth) / 2, bottom: tileSize * 0.95, opacity: anim, transform: [{ scale: anim }] },
      ]}
    >
      <View style={[styles.bubble, priv && styles.bubblePrivate]}>
        <Text style={[styles.text, priv && styles.textPrivate, { fontSize: Math.max(8, tileSize * 0.3) }]} numberOfLines={3}>
          {priv ? '🔒 ' : ''}{text}
        </Text>
      </View>
      <View style={[styles.tail, priv && styles.tailPrivate]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center' },
  bubble: { backgroundColor: '#fff', borderColor: '#111', borderWidth: 2, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 },
  bubblePrivate: { backgroundColor: '#e9d8fd', borderColor: '#553c9a' },
  tail: {
    width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 5,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#111',
  },
  tailPrivate: { borderTopColor: '#553c9a' },
  text: { color: '#111', fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }), fontWeight: 'bold', textAlign: 'center' },
  textPrivate: { color: '#322659' },
});
