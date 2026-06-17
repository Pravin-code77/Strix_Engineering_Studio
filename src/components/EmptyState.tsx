import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MessageSquarePlus, Sparkles, Compass } from 'lucide-react-native';

interface EmptyStateProps {
  type: 'conversations' | 'chat';
  onAction?: (param?: string) => void;
  isDark: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction, isDark }) => {
  const c = {
    text: isDark ? '#F1F5F9' : '#1E293B',
    muted: isDark ? '#94A3B8' : '#64748B',
    iconBg: isDark ? 'rgba(30, 41, 59, 0.5)' : '#F1F5F9',
    cardBg: isDark ? '#151C2C' : '#ffffff',
    cardBorder: isDark ? '#1E293B' : '#E2E8F0',
    promptText: isDark ? '#CBD5E1' : '#475569',
  };

  if (type === 'conversations') {
    return (
      <View style={styles.center}>
        <View style={[styles.iconWrap, { backgroundColor: c.iconBg }]}>
          <MessageSquarePlus size={40} color={isDark ? '#8B5CF6' : '#4F46E5'} />
        </View>
        <Text style={[styles.title, { color: c.text }]}>No conversations yet</Text>
        <Text style={[styles.subtitle, { color: c.muted }]}>
          Your chats will show up here. Create a conversation and configure your preferred AI provider to get started!
        </Text>
        {onAction && (
          <TouchableOpacity onPress={() => onAction()} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>New Conversation</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const samplePrompts = [
    "Explain quantum entanglement like I'm 5",
    'Write a python script to validate an email address',
    'What are 5 healthy high-protein snacks?',
    'Write a polite email asking for project extension',
  ];

  return (
    <View style={styles.chatEmpty}>
      <View
        style={[
          styles.sparkleWrap,
          { backgroundColor: isDark ? 'rgba(30, 27, 75, 0.2)' : '#F1F5F9', borderColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'transparent' },
        ]}
      >
        <Sparkles size={48} color={isDark ? '#6366F1' : '#4F46E5'} />
      </View>

      <Text style={[styles.chatTitle, { color: c.text }]}>Antigravity AI</Text>
      <Text style={[styles.chatSub, { color: c.muted }]}>
        Select a configuration and choose a quick prompt to start chatting.
      </Text>

      <View style={styles.promptList}>
        <View style={styles.promptHeader}>
          <Compass size={14} color={isDark ? '#94A3B8' : '#64748B'} />
          <Text style={[styles.promptHeaderText, { color: c.muted }]}>Sample Prompts</Text>
        </View>

        {samplePrompts.map((prompt, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onAction?.(prompt)}
            style={[styles.promptCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}
            activeOpacity={0.75}
          >
            <Text style={[styles.promptText, { color: c.promptText }]}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconWrap: {
    padding: 24,
    borderRadius: 999,
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  subtitle: {
    fontSize: 13.5,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  actionBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13.5 },
  chatEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  sparkleWrap: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 24,
  },
  chatTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  chatSub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
    maxWidth: 280,
    lineHeight: 19,
  },
  promptList: { width: '100%', gap: 10 },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  promptHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  promptCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  promptText: { fontSize: 13.5, fontWeight: '500', lineHeight: 19 },
});
