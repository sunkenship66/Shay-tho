import React, { useRef, useEffect } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { STEP_DELAY_MS } from '../constants/gameConfig';

// D-pad button: moves on press, keeps moving while held.
function DPadButton({ dir, label, onMove, style }) {
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
    <Pressable onPressIn={start} onPressOut={stop} style={({ pressed }) => [styles.dpadBtn, style, pressed && styles.pressed]}>
      <Text style={styles.dpadText}>{label}</Text>
    </Pressable>
  );
}

export default function RetroControls({ onMove, onPressA, onPressB, onPressL, onPressR }) {
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

        <View style={styles.actionContainer}>
          <Pressable style={({ pressed }) => [styles.actionBtn, styles.btnB, pressed && styles.pressed]} onPress={onPressB}>
            <Text style={styles.actionText}>B</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.actionBtn, styles.btnA, pressed && styles.pressed]} onPress={onPressA}>
            <Text style={styles.actionText}>A</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  controlsArea: { flex: 1, backgroundColor: '#1a1a24', paddingHorizontal: 20, paddingVertical: 12, justifyContent: 'space-between' },
  shoulderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  shoulderBtn: { backgroundColor: '#2d3748', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#4a5568' },
  shoulderText: { color: '#e2e8f0', fontWeight: 'bold', fontSize: 12 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 },
  dpad: { alignItems: 'center', justifyContent: 'center' },
  dpadRow: { flexDirection: 'row' },
  dpadBtn: { width: 56, height: 56, backgroundColor: '#2d3748', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#4a5568' },
  dpadCenter: { width: 56, height: 56, backgroundColor: '#2d3748' },
  dpadText: { color: '#fff', fontSize: 20 },
  actionContainer: { flexDirection: 'row', gap: 18, transform: [{ rotate: '-12deg' }] },
  actionBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  btnA: { backgroundColor: '#e53e3e', borderColor: '#9b2c2c' },
  btnB: { backgroundColor: '#dd6b20', borderColor: '#9c4221', marginTop: 22 },
  actionText: { color: '#fff', fontWeight: 'bold', fontSize: 22 },
  pressed: { opacity: 0.6 },
});
