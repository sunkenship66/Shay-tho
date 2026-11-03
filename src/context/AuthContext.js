import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut,
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext(null);
const key = (uid) => `shaytho:profile:${uid}`;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ character: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const raw = await AsyncStorage.getItem(key(u.uid));
          setProfile(raw ? JSON.parse(raw) : { character: null });
        } catch {
          setProfile({ character: null });
        }
      } else {
        setProfile({ character: null });
      }
      setUser(u);
      setLoading(false);
    });
  }, []);

  const setCharacter = useCallback(
    async (character) => {
      const next = { ...profile, character };
      setProfile(next);
      if (user) await AsyncStorage.setItem(key(user.uid), JSON.stringify(next));
    },
    [profile, user]
  );

  const signIn = (email, password) => signInWithEmailAndPassword(auth, email.trim(), password);

  const signUp = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName) await updateProfile(cred.user, { displayName: displayName.trim() });
    return cred;
  };

  const signOut = () => fbSignOut(auth);

  const value = { user, profile, loading, setCharacter, signIn, signUp, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
