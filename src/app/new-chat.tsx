import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MessageSquarePlus, Check } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { useIsDark } from '../hooks/use-is-dark';
import { createConversation } from '../store/chat-slice';
import { PROVIDER_LABELS } from '../core/constants';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(45, 'Title must be less than 45 characters'),
  providerId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewChatModal() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isDark = useIsDark();
  const providerState = useAppSelector((state) => state.provider);

  const defaultTitle = `Chat ${new Date().toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultTitle,
      providerId: providerState.activeProviderId,
    },
  });

  const selectedProviderId = watch('providerId');

  const onSubmit = async (data: FormData) => {
    const uuid = Math.random().toString(36).substring(2, 15);
    try {
      await dispatch(
        createConversation({ id: uuid, title: data.title.trim(), providerId: data.providerId })
      ).unwrap();
      router.replace(`/chat/${uuid}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
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
    activeBg: 'rgba(99, 102, 241, 0.1)',
    iconBg: isDark ? 'rgba(30, 27, 75, 0.4)' : '#EEF2FF',
    errorText: '#EF4444',
    subText: isDark ? '#CBD5E1' : '#475569',
    metaText: isDark ? '#94A3B8' : '#64748B',
  };

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: c.bg }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: c.iconBg }]}>
            <MessageSquarePlus size={28} color="#6366F1" />
          </View>
          <Text style={[styles.heroTitle, { color: c.text }]}>Create Chat Session</Text>
          <Text style={[styles.heroSub, { color: c.label }]}>
            Name your chat and select which active model endpoint should compile responses.
          </Text>
        </View>

        {/* Title Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: c.label }]}>Conversation Title</Text>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: c.inputBg,
                    borderColor: errors.title ? c.errorText : c.inputBorder,
                    color: c.inputText,
                  },
                ]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Name your conversation..."
                placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                autoCorrect={false}
              />
            )}
          />
          {errors.title && (
            <Text style={[styles.errorText, { color: c.errorText }]}>{errors.title.message}</Text>
          )}
        </View>

        {/* Model Picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: c.label }]}>Chat Model Provider</Text>
          <Text style={[styles.sectionHint, { color: c.metaText }]}>
            Choose an active endpoint. You can change this per-conversation inside the chat screen anytime.
          </Text>

          {Object.entries(PROVIDER_LABELS).map(([key, label]) => {
            const isActive = selectedProviderId === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setValue('providerId', key)}
                style={[
                  styles.providerCard,
                  {
                    backgroundColor: isActive ? c.activeBg : c.cardBg,
                    borderColor: isActive ? '#6366F1' : c.cardBorder,
                  },
                ]}
                activeOpacity={0.75}
              >
                <View style={styles.providerLeft}>
                  <Text style={[styles.providerLabel, { color: c.text }]}>{label}</Text>
                  <Text style={[styles.providerMeta, { color: c.metaText }]}>
                    {key === providerState.activeProviderId ? 'Global Default Settings' : 'Custom Override'}
                  </Text>
                </View>

                {/* Radio indicator */}
                <View
                  style={[
                    styles.radio,
                    isActive
                      ? { borderColor: '#6366F1', backgroundColor: '#6366F1' }
                      : { borderColor: isDark ? '#475569' : '#94A3B8', backgroundColor: 'transparent' },
                  ]}
                >
                  {isActive && <Check size={12} color="#ffffff" strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          style={styles.submitBtn}
          activeOpacity={0.85}
        >
          <Text style={styles.submitText}>Launch Conversation</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  container: { gap: 24 },
  hero: { alignItems: 'center', paddingVertical: 8 },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  heroSub: { fontSize: 12, textAlign: 'center', marginTop: 6, maxWidth: 280, lineHeight: 17 },
  section: { gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 2,
  },
  sectionHint: { fontSize: 11, lineHeight: 16, paddingHorizontal: 2, marginTop: -4 },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 14.5,
  },
  errorText: { fontSize: 12, marginTop: 2, paddingHorizontal: 4 },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
  },
  providerLeft: { flex: 1, gap: 3 },
  providerLabel: { fontWeight: '600', fontSize: 13.5 },
  providerMeta: { fontSize: 11 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  submitText: { color: '#ffffff', fontWeight: '700', fontSize: 14.5 },
});
