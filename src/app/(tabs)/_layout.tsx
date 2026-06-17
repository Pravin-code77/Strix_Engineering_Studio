import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Search, Settings } from 'lucide-react-native';
import { useIsDark } from '../../hooks/use-is-dark';

export default function TabsLayout() {
  const isDark = useIsDark();

  const activeColor = '#6366F1'; // Brand Indigo
  const inactiveColor = isDark ? '#475569' : '#94A3B8';
  const tabBg = isDark ? '#0B0F19' : '#ffffff';
  const tabBorder = isDark ? '#1E293B' : '#E2E8F0';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: tabBg,
          borderTopColor: tabBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: tabBg,
          borderBottomColor: tabBorder,
          shadowOpacity: 0,
          elevation: 0,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: isDark ? '#ffffff' : '#0B0F19',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
