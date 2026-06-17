import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useRouter, Tabs } from 'expo-router';
import {
  Plus,
  Sparkles,
  Coins,
  Flame,
  Clock,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Activity,
  Award
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '../../store';
import { useIsDark } from '../../hooks/use-is-dark';
import { fetchConversations, createConversation, sendMessage } from '../../store/chat-slice';
import { PROVIDER_LABELS } from '../../core/constants';
import { getRelativeTime } from '../../core/utils/date';
import { getDatabase } from '../../data/database/sqlite-client';
import { ProviderType } from '../../core/types/chat';

interface Challenge {
  type: 'Coding' | 'Vocabulary' | 'Aptitude' | 'Interview';
  title: string;
  question: string;
  answer: string;
}

const CHALLENGES: Record<number, Challenge> = {
  0: { // Sunday
    type: 'Aptitude',
    title: 'Probability Puzzle',
    question: 'What is the probability of getting a sum of 7 when rolling two fair six-sided dice?',
    answer: 'There are 6 pairings that result in a sum of 7: (1,6), (2,5), (3,4), (4,3), (5,2), and (6,1) out of 36 total outcomes. The probability is 6/36 = 1/6 (or ~16.67%).'
  },
  1: { // Monday
    type: 'Coding',
    title: 'Two Sum Problem',
    question: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Can you do it in O(N) time complexity?',
    answer: 'Yes! Use a hash map to store the index of each number. For each element x, check if (target - x) exists in the map. If it does, return [map[target - x], current_index].'
  },
  2: { // Tuesday
    type: 'Vocabulary',
    title: 'Word of the Day: Ephemeral',
    question: 'What does the adjective "Ephemeral" mean, and what is an example of it used in a sentence?',
    answer: 'Ephemeral means lasting for a very short time. Example: "The beauty of cherry blossoms is ephemeral, lasting only a few weeks before falling."'
  },
  3: { // Wednesday
    type: 'Aptitude',
    title: 'Speed & Distance',
    question: 'A train runs at a speed of 60 km/h. How far does it travel in 15 minutes?',
    answer: '15 minutes is 1/4 of an hour. Distance = Speed * Time = 60 * (1/4) = 15 kilometers.'
  },
  4: { // Thursday
    type: 'Interview',
    title: 'Virtual DOM vs Real DOM',
    question: 'Explain the difference between Virtual DOM and Real DOM in web frameworks like React.',
    answer: 'The Real DOM updates slow, represents HTML directly, and causes expensive reflows. The Virtual DOM is a lightweight memory representation. React diffs the Virtual DOM changes first and applies only the minimal diffs to the Real DOM, which is much faster.'
  },
  5: { // Friday
    type: 'Coding',
    title: 'Reverse String in-place',
    question: 'Write a function that reverses a string in-place. What is the space complexity?',
    answer: 'To do it in-place, use a two-pointer approach swapping elements from both ends moving inward. The space complexity is O(1) auxiliary space.'
  },
  6: { // Saturday
    type: 'Vocabulary',
    title: 'Word of the Day: Solitude',
    question: 'Define the noun "Solitude" and describe how it differs from loneliness.',
    answer: 'Solitude is the state of being alone without being lonely. It is a positive, peaceful state of self-communion, whereas loneliness is a negative feeling of isolation.'
  }
};

const FAVORITE_PROMPTS = [
  {
    label: 'Optimize Code',
    desc: 'Refactor code for speed',
    prompt: 'Analyze the following code for performance bottlenecks and optimize it:\n\n```\n\n```'
  },
  {
    label: 'Explain Concept',
    desc: 'Simplify complex ideas',
    prompt: 'Explain this technical concept simply, with a real-world analogy:'
  },
  {
    label: 'Write SQL',
    desc: 'Generate database queries',
    prompt: 'Write a SQL query to solve the following requirements:'
  },
  {
    label: 'Draft Email',
    desc: 'Write professional messages',
    prompt: 'Write a professional email response that conveys:'
  }
];

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isDark = useIsDark();

  const { conversations } = useAppSelector((state) => state.chat);
  const providerState = useAppSelector((state) => state.provider);

  const [revealAnswer, setRevealAnswer] = useState(false);
  const [launchingPrompt, setLaunchingPrompt] = useState(false);

  // Daily Challenge states
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);

  // Productivity Dashboard Statistics state
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    chatsThisWeek: 0,
    timeSavedHours: '0.0h',
    learningStreakDays: 0,
  });

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // Format YYYY-MM-DD local time string
  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Load completed challenges on mount
  useEffect(() => {
    async function loadCompletedChallenges() {
      try {
        const completedJson = await AsyncStorage.getItem('completed_challenge_dates');
        if (completedJson) {
          const parsed: string[] = JSON.parse(completedJson);
          setCompletedChallenges(parsed);
          
          const today = getLocalDateString();
          if (parsed.includes(today)) {
            setRevealAnswer(true);
          }
        }
      } catch (err) {
        console.error('Failed to load completed challenges:', err);
      }
    }
    loadCompletedChallenges();
  }, []);

  const todayStr = getLocalDateString();
  const isChallengeCompletedToday = completedChallenges.includes(todayStr);

  const activeProviderId = providerState.activeProviderId;
  const activeProvider = providerState.providers.find((p) => p.id === activeProviderId);
  const activeProviderLabel = PROVIDER_LABELS[activeProviderId as keyof typeof PROVIDER_LABELS] || 'AI Model';

  // Format display text to show both active provider and the actual active model
  const activeModelInfo = activeProvider 
    ? `${PROVIDER_LABELS[activeProvider.providerName as ProviderType]} (${activeProvider.model})`
    : activeProviderLabel;

  const dayOfWeek = new Date().getDay();
  const challenge = CHALLENGES[dayOfWeek as keyof typeof CHALLENGES] || CHALLENGES[1];

  // Dynamically calculate stats on data changes
  useEffect(() => {
    async function calculateStats() {
      try {
        const db = await getDatabase();
        
        // 1. Total conversations count
        const totalConvs = conversations.length;
        
        // 2. Total user messages count
        const msgResult = await db.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) as count FROM messages WHERE role = 'user'"
        );
        const totalUserMsgs = msgResult?.count || 0;
        
        // Tasks completed = total conversations + total challenges completed
        const tasksCompleted = totalConvs + completedChallenges.length;
        
        // Chats this week = conversations updated in the last 7 days
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const chatsThisWeek = conversations.filter((c) => {
          const t = new Date(c.updatedAt).getTime();
          return t >= oneWeekAgo;
        }).length;
        
        // Time saved = (total user messages * 10 minutes) / 60
        const timeSavedHours = ((totalUserMsgs * 10) / 60).toFixed(1) + 'h';
        
        // 3. Learning streak calculation from user messages + completed challenge dates
        const messageDatesResult = await db.getAllAsync<{ date: string }>(
          "SELECT DISTINCT substr(timestamp, 1, 10) as date FROM messages WHERE role = 'user' ORDER BY date DESC"
        );
        const messageDates = messageDatesResult.map(r => r.date);
        
        const allDatesSet = new Set<string>([...messageDates, ...completedChallenges]);
        
        let streak = 0;
        if (allDatesSet.size > 0) {
          let checkDate = new Date();
          let currentStr = getLocalDateString(checkDate);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = getLocalDateString(yesterday);
          
          // If no activity today, check if yesterday was active to keep streak alive
          if (!allDatesSet.has(currentStr) && allDatesSet.has(yesterdayStr)) {
            checkDate = yesterday;
            currentStr = yesterdayStr;
          }
          
          if (allDatesSet.has(currentStr)) {
            while (allDatesSet.has(currentStr)) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
              currentStr = getLocalDateString(checkDate);
            }
          }
        }
        
        setStats({
          tasksCompleted,
          chatsThisWeek,
          timeSavedHours,
          learningStreakDays: streak,
        });
      } catch (err) {
        console.error('Failed to calculate dashboard stats:', err);
      }
    }
    
    calculateStats();
  }, [conversations, completedChallenges]);

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;
    
    try {
      const today = getLocalDateString();
      if (!completedChallenges.includes(today)) {
        const newCompleted = [...completedChallenges, today];
        setCompletedChallenges(newCompleted);
        await AsyncStorage.setItem('completed_challenge_dates', JSON.stringify(newCompleted));
      }
      setRevealAnswer(true);
      setUserAnswer('');
      setFeedback('Awesome effort! Today\'s challenge is completed.');
    } catch (err) {
      console.error('Failed to submit daily challenge answer:', err);
    }
  };

  const handleLaunchPrompt = async (promptText: string, label: string) => {
    if (launchingPrompt) return;
    setLaunchingPrompt(true);
    const uuid = Math.random().toString(36).substring(2, 15);
    try {
      await dispatch(
        createConversation({ id: uuid, title: `Prompt: ${label}`, providerId: 'gemini' })
      ).unwrap();
      await dispatch(sendMessage({ conversationId: uuid, content: promptText })).unwrap();
      router.push(`/chat/${uuid}`);
    } catch (error) {
      console.error('Failed to launch prompt:', error);
    } finally {
      setLaunchingPrompt(false);
    }
  };

  const handleOpenConversation = (id: string) => {
    router.push(`/chat/${id}`);
  };

  // ── Color tokens ──────────────────────────────────────────────────────────
  const c = {
    bg: isDark ? '#0B0F19' : '#F8FAFC',
    text: isDark ? '#F1F5F9' : '#1E293B',
    label: isDark ? '#94A3B8' : '#64748B',
    cardBg: isDark ? '#151C2C' : '#ffffff',
    cardBorder: isDark ? '#1E293B' : '#E2E8F0',
    primary: '#6366F1',
    primaryLight: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
    accentText: isDark ? '#818CF8' : '#4F46E5',
    progressBg: isDark ? '#1E293B' : '#E2E8F0',
    streakColor: '#F59E0B',
  };

  return (
    <ScrollView style={[styles.scrollView, { backgroundColor: c.bg }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header bar configuration */}
      <Tabs.Screen
        options={{
          headerTitle: 'Command Center',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/new-chat')}
              style={[styles.headerPlusBtn, { backgroundColor: c.primaryLight }]}
              activeOpacity={0.7}
            >
              <Plus size={20} color={c.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* AI COMMAND CENTER */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Activity size={16} color={c.primary} />
          <Text style={[styles.sectionTitle, { color: c.text }]}>AI Command Center</Text>
        </View>

        <View style={[styles.dashboardCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
          {/* Active Model & Credits */}
          <View style={styles.modelRow}>
            <View style={styles.modelInfo}>
              <Text style={[styles.modelLabel, { color: c.label }]}>Current AI Model</Text>
              <Text style={[styles.modelName, { color: c.text }]}>{activeModelInfo}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.creditRow}>
            <View style={styles.creditTextRow}>
              <View style={styles.flexRowGap}>
                <Coins size={14} color={c.accentText} />
                <Text style={[styles.creditLabel, { color: c.label }]}>Remaining Credits/Tokens</Text>
              </View>
              <Text style={[styles.creditVal, { color: c.text }]}>8,542 / 10,000</Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: c.progressBg }]}>
              <View style={[styles.progressBarFill, { width: '85.4%', backgroundColor: c.primary }]} />
            </View>
          </View>
        </View>
      </View>

      {/* FAVORITE PROMPTS */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabelTitle, { color: c.label }]}>Favorite Prompts</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {FAVORITE_PROMPTS.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleLaunchPrompt(item.prompt, item.label)}
              style={[styles.promptCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}
              activeOpacity={0.75}
              disabled={launchingPrompt}
            >
              <View style={styles.promptHeader}>
                <Lightbulb size={16} color={c.primary} />
                <Text style={[styles.promptTitle, { color: c.text }]} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
              <Text style={[styles.promptDesc, { color: c.label }]} numberOfLines={2}>
                {item.desc}
              </Text>
              <View style={styles.promptAction}>
                <Text style={[styles.promptActionText, { color: c.accentText }]}>Launch</Text>
                <ArrowRight size={12} color={c.accentText} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* DAILY CHALLENGE */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Award size={16} color={c.streakColor} />
          <Text style={[styles.sectionTitle, { color: c.text }]}>🎯 Daily Challenge</Text>
        </View>

        <View style={[styles.challengeCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
          <View style={styles.challengeHeader}>
            <View style={[styles.challengeBadge, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
              <Text style={[styles.challengeBadgeText, { color: c.streakColor }]}>{challenge.type}</Text>
            </View>
            <Text style={[styles.challengeTitle, { color: c.text }]}>{challenge.title}</Text>
          </View>

          <Text style={[styles.challengeQuestion, { color: c.text }]}>{challenge.question}</Text>

          {isChallengeCompletedToday ? (
            <View style={styles.completedContainer}>
              <CheckCircle2 size={14} color="#10B981" />
              <Text style={styles.completedText}>Completed Today!</Text>
            </View>
          ) : (
            <View style={styles.challengeInputRow}>
              <TextInput
                style={[
                  styles.challengeInput,
                  {
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#F1F5F9',
                    borderColor: c.cardBorder,
                    color: c.text,
                  },
                ]}
                value={userAnswer}
                onChangeText={setUserAnswer}
                placeholder="Type your answer..."
                placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={handleSubmitAnswer}
                style={[styles.submitBtn, { backgroundColor: c.primary }]}
                activeOpacity={0.8}
              >
                <Text style={styles.submitBtnText}>Submit</Text>
              </TouchableOpacity>
            </View>
          )}

          {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}

          <TouchableOpacity
            onPress={() => setRevealAnswer(!revealAnswer)}
            style={[styles.revealBtn, { backgroundColor: c.progressBg }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.revealBtnText, { color: c.text }]}>
              {revealAnswer ? 'Hide Solution' : 'Reveal Solution'}
            </Text>
            {revealAnswer ? <ChevronUp size={16} color={c.text} /> : <ChevronDown size={16} color={c.text} />}
          </TouchableOpacity>

          {revealAnswer && (
            <View style={[styles.answerBox, { backgroundColor: isDark ? 'rgba(30,41,59,0.3)' : '#F1F5F9' }]}>
              <Text style={[styles.answerText, { color: c.text }]}>{challenge.answer}</Text>
            </View>
          )}
        </View>
      </View>

      {/* PRODUCTIVITY DASHBOARD */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Flame size={16} color={c.streakColor} />
          <Text style={[styles.sectionTitle, { color: c.text }]}>📈 Productivity Dashboard</Text>
        </View>

        <View style={styles.statsGrid}>
          {/* Stat 1 */}
          <View style={[styles.statCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
            <CheckCircle2 size={20} color="#10B981" />
            <Text style={[styles.statVal, { color: c.text }]}>{stats.tasksCompleted}</Text>
            <Text style={[styles.statLabel, { color: c.label }]}>Tasks completed</Text>
          </View>

          {/* Stat 2 */}
          <View style={[styles.statCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
            <MessageSquare size={20} color={c.primary} />
            <Text style={[styles.statVal, { color: c.text }]}>{stats.chatsThisWeek}</Text>
            <Text style={[styles.statLabel, { color: c.label }]}>Chats this week</Text>
          </View>

          {/* Stat 3 */}
          <View style={[styles.statCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
            <Clock size={20} color="#3B82F6" />
            <Text style={[styles.statVal, { color: c.text }]}>{stats.timeSavedHours}</Text>
            <Text style={[styles.statLabel, { color: c.label }]}>Time saved</Text>
          </View>

          {/* Stat 4 */}
          <View style={[styles.statCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
            <Flame size={20} color={c.streakColor} />
            <Text style={[styles.statVal, { color: c.text }]}>
              {stats.learningStreakDays} {stats.learningStreakDays === 1 ? 'day' : 'days'}
            </Text>
            <Text style={[styles.statLabel, { color: c.label }]}>Learning streak</Text>
          </View>
        </View>
      </View>

      {/* RECENT ACTIVITY */}
      <View style={[styles.section, { marginBottom: 30 }]}>
        <Text style={[styles.sectionLabelTitle, { color: c.label }]}>Recent Activity</Text>
        {conversations.length === 0 ? (
          <View style={[styles.emptyActivityCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
            <Text style={[styles.emptyActivityText, { color: c.label }]}>No recent chat sessions.</Text>
            <TouchableOpacity
              onPress={() => router.push('/new-chat')}
              style={[styles.createBtnInline, { backgroundColor: c.primary }]}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#ffffff" />
              <Text style={styles.createBtnInlineText}>New Chat</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.activityListCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
            {conversations.slice(0, 3).map((item, idx) => (
              <View key={item.id}>
                {idx > 0 && <View style={[styles.listDivider, { backgroundColor: c.cardBorder }]} />}
                <TouchableOpacity
                  onPress={() => handleOpenConversation(item.id)}
                  style={styles.activityItem}
                  activeOpacity={0.7}
                >
                  <View style={styles.activityLeft}>
                    <MessageSquare size={16} color={c.primary} />
                    <View style={styles.activityText}>
                      <Text style={[styles.activityTitle, { color: c.text }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={[styles.activityTime, { color: c.label }]}>
                        {getRelativeTime(item.updatedAt)}
                      </Text>
                    </View>
                  </View>
                  <ArrowRight size={14} color={c.label} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, gap: 20 },
  headerPlusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  sectionLabelTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 4 },
  dashboardCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
  },
  modelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modelInfo: { gap: 3 },
  modelLabel: { fontSize: 11, fontWeight: '600' },
  modelName: { fontSize: 15, fontWeight: '700' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    gap: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  separator: { height: 1, backgroundColor: 'rgba(148, 163, 184, 0.15)' },
  creditRow: { gap: 8 },
  creditTextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flexRowGap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  creditLabel: { fontSize: 11, fontWeight: '600' },
  creditVal: { fontSize: 12, fontWeight: '700' },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  horizontalScroll: { paddingHorizontal: 4, gap: 10 },
  promptCard: {
    width: 140,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    justifyContent: 'space-between',
  },
  promptHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  promptTitle: { fontSize: 12, fontWeight: '700', flex: 1 },
  promptDesc: { fontSize: 10.5, lineHeight: 14 },
  promptAction: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  promptActionText: { fontSize: 11, fontWeight: '700' },

  challengeCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  challengeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  challengeBadgeText: { fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase' },
  challengeTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  challengeQuestion: { fontSize: 13, lineHeight: 18 },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  revealBtnText: { fontSize: 12, fontWeight: '700' },
  answerBox: {
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  answerText: { fontSize: 12.5, lineHeight: 18, fontStyle: 'italic' },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10.5, fontWeight: '600', textAlign: 'center' },

  emptyActivityCard: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  emptyActivityText: { fontSize: 12.5, textAlign: 'center' },
  createBtnInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  createBtnInlineText: { color: '#ffffff', fontSize: 12.5, fontWeight: '700' },

  activityListCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  activityLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  activityText: { flex: 1, gap: 2 },
  activityTitle: { fontSize: 13.5, fontWeight: '600' },
  activityTime: { fontSize: 10.5 },
  listDivider: { height: 1 },
  challengeInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  challengeInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 13,
  },
  submitBtn: {
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    textAlign: 'center',
    marginTop: 4,
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
});
