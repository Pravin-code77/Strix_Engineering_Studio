import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, MessageSquare, MessageCircle, Calendar, Trash2, Sparkles } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { useIsDark } from '../../hooks/use-is-dark';
import { SQLiteConversationRepository } from '../../data/repositories/sqlite-conversation-repo';
import { SQLiteMessageRepository } from '../../data/repositories/sqlite-message-repo';
import { setActiveConversationId, fetchConversations, deleteConversation } from '../../store/chat-slice';
import { Conversation, Message } from '../../core/types/chat';
import { getRelativeTime } from '../../core/utils/date';
import { PROVIDER_LABELS } from '../../core/constants';

const conversationRepo = new SQLiteConversationRepository();
const messageRepo = new SQLiteMessageRepository();

type Segment = 'all' | 'conversations' | 'messages';

export default function SearchScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isDark = useIsDark();

  const { conversations } = useAppSelector((state) => state.chat);

  const [searchText, setSearchText] = useState('');
  const [filterSegment, setFilterSegment] = useState<Segment>('all');
  const [convResults, setConvResults] = useState<Conversation[]>([]);
  const [msgResults, setMsgResults] = useState<Message[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  useEffect(() => {
    if (!searchText.trim()) {
      setConvResults([]);
      setMsgResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const [conversations, messages] = await Promise.all([
          conversationRepo.searchConversations(searchText),
          messageRepo.searchMessages(searchText),
        ]);
        setConvResults(conversations);
        setMsgResults(messages);
      } catch (err) {
        console.warn('Search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const handleOpenConversation = (id: string) => {
    dispatch(setActiveConversationId(id));
    router.push(`/chat/${id}`);
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete "${title}"? This will erase all message history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteConversation(id)),
        },
      ]
    );
  };

  const getFilteredData = () => {
    if (!searchText.trim()) {
      if (filterSegment === 'all' || filterSegment === 'conversations') {
        return conversations.map((c) => ({ type: 'recent_conversation' as const, item: c }));
      }
      return [];
    }
    const combined: Array<{ type: 'conversation' | 'message' | 'recent_conversation'; item: any }> = [];
    if (filterSegment !== 'messages') convResults.forEach((c) => combined.push({ type: 'conversation', item: c }));
    if (filterSegment !== 'conversations') msgResults.forEach((m) => combined.push({ type: 'message', item: m }));
    return combined;
  };

  // ── Color tokens ──────────────────────────────────────────────────────────
  const c = {
    bg: isDark ? '#0B0F19' : '#F8FAFC',
    text: isDark ? '#F1F5F9' : '#1E293B',
    label: isDark ? '#94A3B8' : '#64748B',
    inputBg: isDark ? '#151C2C' : '#ffffff',
    inputBorder: isDark ? '#1E293B' : '#E2E8F0',
    inputText: isDark ? '#F1F5F9' : '#1E293B',
    cardBg: isDark ? '#151C2C' : '#ffffff',
    cardBorder: isDark ? '#1E293B' : '#E2E8F0',
    segBg: isDark ? 'rgba(15,23,42,0.5)' : 'rgba(226,232,240,0.6)',
    segActiveBg: isDark ? '#1E293B' : '#ffffff',
    segActiveText: isDark ? '#818CF8' : '#4F46E5',
    iconBg: isDark ? 'rgba(30, 27, 75, 0.4)' : '#EEF2FF',
    deleteBg: isDark ? 'rgba(30, 41, 59, 0.2)' : '#FEF2F2',
  };

  const SEGMENTS: Segment[] = ['all', 'conversations', 'messages'];
  const filteredData = getFilteredData();

  const renderListHeader = () => {
    if (!searchText.trim() && (filterSegment === 'all' || filterSegment === 'conversations') && conversations.length > 0) {
      return (
        <View style={styles.listHeader}>
          <Text style={[styles.listLabel, { color: c.label }]}>
            Recent Conversations
          </Text>
          <View style={styles.countRow}>
            <Sparkles size={12} color={isDark ? '#6366F1' : '#4F46E5'} />
            <Text style={[styles.countText, { color: isDark ? '#818CF8' : '#4F46E5' }]}>
              {conversations.length} total
            </Text>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={[styles.flex1, { backgroundColor: c.bg }]}>
      {/* Search bar + filter */}
      <View style={styles.topBar}>
        {/* Input */}
        <View style={[styles.inputRow, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
          <Search size={18} color={c.label} />
          <TextInput
            style={[styles.input, { color: c.inputText }]}
            placeholder="Search titles or messages..."
            placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
            value={searchText}
            onChangeText={setSearchText}
            autoCorrect={false}
          />
        </View>

        {/* Segment filter */}
        <View style={[styles.segRow, { backgroundColor: c.segBg }]}>
          {SEGMENTS.map((seg) => {
            const active = filterSegment === seg;
            return (
              <TouchableOpacity
                key={seg}
                onPress={() => setFilterSegment(seg)}
                style={[styles.segBtn, active && { backgroundColor: c.segActiveBg }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.segText, { color: active ? c.segActiveText : c.label }]}>
                  {seg.charAt(0).toUpperCase() + seg.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Results area */}
      {searching ? (
        <View style={styles.centeredMessage}>
          <ActivityIndicator size="small" color="#6366F1" />
          <Text style={[styles.centeredText, { color: c.label }]}>Searching Local DB...</Text>
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.centeredMessage}>
          <Text style={[styles.emptyTitle, { color: c.text }]}>
            {!searchText.trim() ? (
              filterSegment === 'messages' ? 'Search Messages' : 'No Conversations Yet'
            ) : (
              'No matches found'
            )}
          </Text>
          <Text style={[styles.emptySubtitle, { color: c.label }]}>
            {!searchText.trim() ? (
              filterSegment === 'messages'
                ? 'Type in the search bar to search through your message histories.'
                : 'Start a new chat session on the Home tab.'
            ) : (
              'Try modifying your search keywords.'
            )}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item, i) => `${item.type}-${item.item.id}-${i}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderListHeader}
          renderItem={({ item: { type, item } }) => {
            if (type === 'recent_conversation') {
              const date = getRelativeTime(item.updatedAt);
              return (
                <TouchableOpacity
                  onPress={() => handleOpenConversation(item.id)}
                  style={[
                    styles.recentCard,
                    {
                      backgroundColor: c.cardBg,
                      borderColor: c.cardBorder,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <View style={styles.recentCardLeft}>
                    <View style={[styles.recentIconBox, { backgroundColor: c.iconBg }]}>
                      <MessageSquare size={18} color="#6366F1" />
                    </View>
                    <View style={styles.recentCardText}>
                      <Text style={[styles.recentCardTitle, { color: c.text }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={[styles.recentCardMeta, { color: c.label }]}>
                        {item.providerId
                          ? PROVIDER_LABELS[item.providerId as keyof typeof PROVIDER_LABELS] || 'Configured AI'
                          : 'Active Model'}{' '}
                        • {date}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDelete(item.id, item.title)}
                    style={[styles.recentDeleteBtn, { backgroundColor: c.deleteBg }]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }

            const isConv = type === 'conversation';
            const date = new Date(isConv ? item.updatedAt : item.timestamp).toLocaleDateString();
            return (
              <TouchableOpacity
                onPress={() => handleOpenConversation(isConv ? item.id : item.conversationId)}
                style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}
                activeOpacity={0.75}
              >
                {/* Card header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    {isConv
                      ? <MessageSquare size={15} color="#6366F1" />
                      : <MessageCircle size={15} color="#8B5CF6" />
                    }
                    <Text style={[styles.cardType, { color: isConv ? '#818CF8' : '#A78BFA' }]}>
                      {isConv ? 'Conversation' : 'Message Match'}
                    </Text>
                  </View>
                  <View style={styles.dateRow}>
                    <Calendar size={11} color={c.label} />
                    <Text style={[styles.dateText, { color: c.label }]}>{date}</Text>
                  </View>
                </View>

                {/* Card body */}
                {isConv ? (
                  <Text style={[styles.cardTitle, { color: c.text }]}>{item.title}</Text>
                ) : (
                  <View>
                    <Text style={[styles.cardMeta, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      In conversation history:
                    </Text>
                    <Text style={[styles.cardBody, { color: c.text }]} numberOfLines={2}>
                      "{item.content}"
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  topBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 10 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, padding: 0 },
  segRow: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    gap: 2,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  segText: { fontSize: 12, fontWeight: '600' },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  centeredText: { fontSize: 12, marginTop: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 4 },
  card: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardType: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 11 },
  cardTitle: { fontSize: 14, fontWeight: '600' },
  cardMeta: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  cardBody: { fontSize: 13.5, fontStyle: 'italic', lineHeight: 19 },

  // Recent Conversation styles
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
    paddingHorizontal: 4,
  },
  listLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countText: { fontSize: 11, fontWeight: '600' },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  recentCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  recentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentCardText: { flex: 1 },
  recentCardTitle: { fontWeight: '600', fontSize: 13.5 },
  recentCardMeta: { fontSize: 11, marginTop: 3 },
  recentDeleteBtn: { padding: 8, borderRadius: 999 },
});
