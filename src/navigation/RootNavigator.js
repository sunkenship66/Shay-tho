import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { LoungeProvider } from '../context/LoungeContext';
import { SocialProvider } from '../context/SocialContext';
import HomeScreen from '../screens/HomeScreen';
import AvatarSelectScreen from '../screens/AvatarSelectScreen';
import LoungeScreen from '../screens/LoungeScreen';

const Stack = createNativeStackNavigator();

const LoungeRoute = () => (
  <LoungeProvider>
    <SocialProvider>
      <LoungeScreen />
    </SocialProvider>
  </LoungeProvider>
);

export default function RootNavigator() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center' }}>
        <ActivityIndicator color="#f6e05e" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : !profile.character ? (
          <Stack.Screen name="AvatarSelect" component={AvatarSelectScreen} />
        ) : (
          <Stack.Screen name="Lounge" component={LoungeRoute} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
