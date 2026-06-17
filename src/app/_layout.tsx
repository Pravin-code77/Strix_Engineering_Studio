import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import * as SplashScreen from 'expo-splash-screen';
import { store, useAppDispatch } from '../store';
import { initializeDatabase } from '../data/database/sqlite-client';
import { loadSettings } from '../store/settings-slice';
import { loadProviders } from '../store/provider-slice';
import { fetchConversations } from '../store/chat-slice';
import { StatusBar } from 'expo-status-bar';
import { useIsDark } from '../hooks/use-is-dark';
import '../global.css';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppContent() {
  const dispatch = useAppDispatch();
  const isDark = useIsDark();
  const [dbReady, setDbReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function prepareApp() {
      try {
        await initializeDatabase();
        setDbReady(true);
        await Promise.all([
          dispatch(loadSettings()).unwrap(),
          dispatch(loadProviders()).unwrap(),
          dispatch(fetchConversations()).unwrap(),
        ]);
      } catch (e) {
        console.warn('Initialization error:', e);
      } finally {
        setLoading(false);
        await SplashScreen.hideAsync().catch(() => {});
      }
    }
    prepareApp();
  }, [dispatch]);

  const showLoading = loading || !dbReady;

  const headerBg = isDark ? '#0B0F19' : '#ffffff';
  const headerText = isDark ? '#ffffff' : '#0B0F19';
  const contentBg = isDark ? '#0B0F19' : '#f8fafc';

  return (
    // ── Plain style — never use className here, it's at the root outside Stack ──
    <View style={styles.flex1}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: headerBg },
          headerTintColor: headerText,
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: contentBg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="chat/[id]"
          options={{ headerTitle: 'Chat Session', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="new-chat"
          options={{ presentation: 'modal', headerTitle: 'New Conversation' }}
        />
      </Stack>

      {/* Loading overlay — NO className, only StyleSheet + inline style */}
      {showLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading Database...</Text>
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0B0F19',
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 12,
  },
});
