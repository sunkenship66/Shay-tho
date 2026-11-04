import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ResponsiveViewport from '../components/ResponsiveViewport';
import TileMap from '../components/TileMap';
import Avatar from '../components/Avatar';
import RetroControls from '../components/RetroControls';
import MessageModal from '../components/MessageModal';
import ProfileModal from '../components/ProfileModal';
import MenuModal from '../components/MenuModal';
import HelpModal from '../components/HelpModal';

import { useAuth } from '../context/AuthContext';
import { useLounge } from '../context/LoungeContext';
import { useSocial } from '../context/SocialContext';
import useGridMovement from '../hooks/useGridMovement';
import { getRandomSpawn } from '../utils/layerRules';
import { getFacingTarget } from '../utils/spatialMath';

export default function LoungeScreen() {
  const { user, profile, setCharacter, signOut } = useAuth();
  const { others, bubbles, debug, broadcastState, sendChat } = useLounge();
  const social = useSocial();

  const [modal, setModal] = useState(null); // 'message' | 'dm' | 'profile' | 'menu' | 'help' | null
  const [dmTarget, setDmTarget] = useState(null);
  const [banner, setBanner] = useState('');
  const bannerTimer = useRef(null);

  const othersList = useMemo(() => Object.values(others), [others]);
  const onlineUids = useMemo(() => new Set(othersList.map((p) => p.uid)), [othersList]);
  const spawn = useMemo(() => getRandomSpawn([]), []);
  const { position, direction, move } = useGridMovement({ initialPosition: spawn, others: othersList });

  const name = user.displayName || user.email?.split('@')[0] || 'Student';
  const target = useMemo(() => getFacingTarget(position, direction, othersList), [position, direction, othersList]);

  const flash = useCallback((text) => {
    if (!text) return;
    setBanner(text);
    clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(''), 3500);
  }, []);
  useEffect(() => () => clearTimeout(bannerTimer.current), []);

  // Show social notices (new friend request, request accepted)
  useEffect(() => {
    if (social.notice) flash(social.notice.text);
  }, [social.notice, flash]);

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

  const onFriend = async () => {
    if (!target) return flash('Face a player first: walk into them.');
    const res = await social.sendFriendRequest({ uid: target.uid, name: target.name });
    flash(res.msg);
  };

  const onPrivate = () => {
    if (!target) return flash('Face a player first: walk into them.');
    setDmTarget({ uid: target.uid, name: target.name });
    setModal('dm');
  };

  const sendDm = async (text) => {
    const res = await social.sendPrivate(dmTarget, text);
    flash(res.msg);
  };

  const respond = async (id, accept) => {
    const res = await social.respondRequest(id, accept);
    flash(res.msg);
  };

  const errorText = debug.err || social.error;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.online}>
        v4 | others: {othersList.length} | ws: {debug.ws}
      </Text>
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
      <View style={styles.hintBox}>
        <Text style={[styles.hint, banner ? styles.banner : null]} numberOfLines={1}>
          {banner || (target ? `Facing: ${target.name}  (C friend, D private)` : 'Walk into a player to face them')}
        </Text>
      </View>

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
                  privateMessage={social.privateBubbles[p.uid]}
                  highlight={target?.uid === p.uid}
                  tileSize={tileSize}
                />
              ))}
              <Avatar
                characterId={profile.character}
                position={position}
                direction={direction}
                name={name}
                message={bubbles[user.uid]}
                privateMessage={social.privateBubbles[user.uid]}
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
          onPressB={() => setModal('profile')}
          onPressC={onFriend}
          onPressD={onPrivate}
          onPressL={() => setModal('menu')}
          onPressR={() => setModal('help')}
          badgeB={social.incoming.length}
        />
      </View>

      <MessageModal visible={modal === 'message'} onSend={sendChat} onClose={close} />
      <MessageModal
        visible={modal === 'dm'}
        onSend={sendDm}
        onClose={close}
        title={`PRIVATE TO ${(dmTarget?.name || '').toUpperCase()}`}
        placeholder="Only they will see this..."
        accent="#805ad5"
      />
      <ProfileModal
        visible={modal === 'profile'}
        onClose={close}
        name={name}
        characterId={profile.character}
        friends={social.friends}
        incoming={social.incoming}
        outgoing={social.outgoing}
        synergy={social.synergy}
        onlineUids={onlineUids}
        onRespond={respond}
      />
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
  online: { color: '#718096', textAlign: 'center', fontSize: 10, paddingTop: 2 },
  error: { color: '#fc8181', textAlign: 'center', fontSize: 10, paddingHorizontal: 8 },
  hintBox: { height: 24, justifyContent: 'center', paddingHorizontal: 8 },
  hint: { color: '#a0aec0', textAlign: 'center', fontSize: 11 },
  banner: { color: '#1a202c', backgroundColor: '#f6e05e', fontWeight: 'bold', paddingVertical: 2, borderRadius: 3, overflow: 'hidden' },
  top: { height: '40%' },
  bottom: { flex: 1 },
});
