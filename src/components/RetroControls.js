import React, { useRef, useEffect } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { STEP_DELAY_MS } from '../constants/gameConfig';

// D-pad button: moves on press, keeps moving while held.
function DPadButton({ dir, label, onMove }) {
  const timer = useRef(null);
  const stop = () => {
    clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);

  const start = () => {
    onMove(dir);
    stop();
    timer.current = setInterval(() => onMove(dir), STEP_DELAY_MS);
  };

  return (
    <Pressable onPressIn={start} onPressOut={stop} style={({ pressed }) => [styles.dpadBtn, pressed && styles.pressed]}>
      <Text style={styles.dpadText}>{label}</Text>
    </Pressable>
  );
}

function ActionButton({ letter, caption, color, border, onPress, badge = 0 }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionBtn, { backgroundColor: color, borderColor: border }, pressed && styles.pressed]}
    >
      <Text style={styles.actionText}>{letter}</Text>
      <Text style={styles.actionCaption}>{caption}</Text>
      {badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function RetroControls({ onMove, onPressA, onPressB, onPressC, onPressD, onPressL, onPressR, badgeB = 0 }) {
  return (
    <View style={styles.controlsArea}>
      <View style={styles.shoulderRow}>
        <Pressable style={({ pressed }) => [styles.shoulderBtn, pressed && styles.pressed]} onPress={onPressL}>
          <Text style={styles.shoulderText}>[L] MENU</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.shoulderBtn, pressed && styles.pressed]} onPress={onPressR}>
          <Text style={styles.shoulderText}>[R] HELP</Text>
        </Pressable>
      </View>

      <View style={styles.controlsRow}>
        <View style={styles.dpad}>
          <View style={styles.dpadRow}>
            <DPadButton dir="UP" label="▲" onMove={onMove} />
          </View>
          <View style={styles.dpadRow}>
            <DPadButton dir="LEFT" label="◀" onMove={onMove} />
            <View style={styles.dpadCenter} />
            <DPadButton dir="RIGHT" label="▶" onMove={onMove} />
          </View>
          <View style={styles.dpadRow}>
            <DPadButton dir="DOWN" label="▼" onMove={onMove} />
          </View>
        </View>

        <View style={styles.actionGrid}>
          <View style={styles.actionRow}>
            <ActionButton letter="C" caption="FRIEND" color="#38a169" border="#276749" onPress={onPressC} />
            <ActionButton letter="D" caption="PRIVATE" color="#805ad5" border="#553c9a" onPress={onPressD} />
          </View>
          <View style={[styles.actionRow, styles.actionRowLow]}>
            <ActionButton letter="B" caption="PROFILE" color="#dd6b20" border="#9c4221" onPress={onPressB} badge={badgeB} />
            <ActionButton letter="A" caption="CHAT" color="#e53e3e" border="#9b2c2c" onPress={onPressA} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  controlsArea: { flex: 1, backgroundColor: '#1a1a24', paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'space-between' },
  shoulderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  shoulderBtn: { backgroundColor: '#2d3748', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#4a5568' },
  shoulderText: { color: '#e2e8f0', fontWeight: 'bold', fontSize: 12 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 },
  dpad: { alignItems: 'center', justifyContent: 'center' },
  dpadRow: { flexDirection: 'row' },
  dpadBtn: { width: 50, height: 50, backgroundColor: '#2d3748', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#4a5568' },
  dpadCenter: { width: 50, height: 50, backgroundColor: '#2d3748' },
  dpadText: { color: '#fff', fontSize: 20 },
  actionGrid: { transform: [{ rotate: '-12deg' }] },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  actionRowLow: { marginLeft: 14, marginBottom: 0 },
  actionBtn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  actionText: { color: '#fff', fontWeight: 'bold', fontSize: 18, lineHeight: 20 },
  actionCaption: { color: '#fff', fontSize: 7, fontWeight: 'bold', letterSpacing: 0.5 },
  badge: {
    position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: '#f6e05e', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: '#1a202c', fontWeight: 'bold', fontSize: 12 },
  pressed: { opacity: 0.6 },
});
