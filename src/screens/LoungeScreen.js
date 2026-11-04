import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ResponsiveViewport from '../components/ResponsiveViewport';
import TileMap from '../components/TileMap';
import Avatar from '../components/Avatar';
import RetroControls from '../components/RetroControls';
import MessageModal from '../components/MessageModal';
import MenuModal from '../components/MenuModal';
import HelpModal from '../components/HelpModal';

import { useAuth } from '../context/AuthContext';
import { useLounge } from '../context/LoungeContext';
import useGridMovement from '../hooks/useGridMovement';
import { getRandomSpawn } from '../utils/layerRules';

export default function LoungeScreen() {
  const { user, profile, setCharacter, signOut } = useAuth();
  const { others, bubbles, debug, broadcastState, sendChat, clearBubble } = useLounge();
  const [modal, setModal] = useState(null); // 'message' | 'menu' | 'help' | null

  const othersList = useMemo(() => Object.values(others), [others]);
  const spawn = useMemo(() => getRandomSpawn([]), []);
  const { position, direction, move } = useGridMovement({ initialPosition: spawn, others: othersList });

  const name = user.displayName || user.email?.split('@')[0] || 'Student';

  // Publish my state whenever it changes
  useEffect(() => {
    broadcastState({
      uid: user.uid,
      name,
      character: profile.character,
      row: position.row,
      col: position.col,
      direction,
    });
  }, [user.uid, name, profile.character, position, direction, broadcastState]);

  const close = () => setModal(null);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.online}>
        v3 | others: {othersList.length} | ws: {debug.ws} | rx: {debug.rx}
      </Text>
      {debug.err ? <Text style={styles.error}>{debug.err}</Text> : null}

      <View style={styles.top}>
        <ResponsiveViewport>
          {(tileSize) => (
            <TileMap tileSize={tileSize}>
              {othersList.map((p) => (
                <Avatar
                  key={p.uid}
                  characterId={p.character}
                  position={{ row: p.row, col: p.col }}
                  direction={p.direction}
                  name={p.name}
                  message={bubbles[p.uid]}
                  tileSize={tileSize}
                />
              ))}
              <Avatar
                characterId={profile.character}
                position={position}
                direction={direction}
                name={name}
                message={bubbles[user.uid]}
                tileSize={tileSize}
              />
            </TileMap>
          )}
        </ResponsiveViewport>
      </View>

      <View style={styles.bottom}>
        <RetroControls
          onMove={move}
          onPressA={() => setModal('message')}
          onPressB={() => clearBubble(user.uid)}
          onPressL={() => setModal('menu')}
          onPressR={() => setModal('help')}
        />
      </View>

      <MessageModal visible={modal === 'message'} onSend={sendChat} onClose={close} />
      <MenuModal
        visible={modal === 'menu'}
        onClose={close}
        characterId={profile.character}
        onSelectCharacter={setCharacter}
        onSignOut={() => { close(); signOut(); }}
        userName={name}
      />
      <HelpModal visible={modal === 'help'} onClose={close} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  online: { color: '#f6e05e', textAlign: 'center', fontSize: 11, paddingVertical: 2 },
  error: { color: '#fc8181', textAlign: 'center', fontSize: 10, paddingHorizontal: 8 },
  top: { height: '42%' },
  bottom: { flex: 1 },
});