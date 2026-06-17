import {
  Database,
  Monitor,
  Moon,
  Sun,
  Volume2
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ProviderConfigForm } from "../../components/ProviderConfigForm";
import { PROVIDER_LABELS } from "../../core/constants";
import { ProviderConfig, ProviderType } from "../../core/types/chat";
import { useIsDark } from "../../hooks/use-is-dark";
import { useAppDispatch, useAppSelector } from "../../store";
import { fetchConversations } from "../../store/chat-slice";
import {
  setActiveProviderId,
  updateProvider,
} from "../../store/provider-slice";
import { clearDatabase, updateSettings } from "../../store/settings-slice";

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);
  const providerState = useAppSelector((state) => state.provider);
  const theme = settings.theme;
  const isDark = useIsDark();

  const [selectedConfigName, setSelectedConfigName] =
    useState<ProviderType>("openai");

  const handleThemeChange = (mode: "light" | "dark" | "system") =>
    dispatch(updateSettings({ theme: mode }));
  const handleTtsToggle = (enabled: boolean) =>
    dispatch(updateSettings({ ttsEnabled: enabled }));
  const handleSpeechRateChange = (rate: number) =>
    dispatch(updateSettings({ speechRate: rate }));
  const handleSaveProviderConfig = async (config: ProviderConfig) =>
    dispatch(updateProvider(config)).unwrap();
  const handleSelectActiveProvider = (id: string) =>
    dispatch(setActiveProviderId(id));

  const handleClearDb = () => {
    Alert.alert(
      "Clean Database",
      "Are you sure you want to delete all conversations and messages? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clean DB",
          style: "destructive",
          onPress: async () => {
            await dispatch(clearDatabase()).unwrap();
            dispatch(fetchConversations());
            Alert.alert("Success", "Database has been cleared successfully.");
          },
        },
      ],
    );
  };

  const currentEditingProvider = providerState.providers.find(
    (p) => p.id === selectedConfigName,
  ) || {
    id: selectedConfigName,
    providerName: selectedConfigName,
    baseUrl: "",
    apiKey: "",
    model: "",
  };

  // ── Color tokens ──────────────────────────────────────────────────────────
  const c = {
    bg: isDark ? "#0B0F19" : "#F8FAFC",
    text: isDark ? "#F1F5F9" : "#1E293B",
    label: isDark ? "#94A3B8" : "#64748B",
    cardBg: isDark ? "#151C2C" : "#ffffff",
    cardBorder: isDark ? "#1E293B" : "#E2E8F0",
    segBg: isDark ? "rgba(15, 23, 42, 0.6)" : "rgba(226, 232, 240, 0.6)",
    segActiveBg: isDark ? "#1E293B" : "#ffffff",
    segActiveText: isDark ? "#818CF8" : "#4F46E5",
    segInactiveText: isDark ? "#64748B" : "#94A3B8",
    divider: isDark ? "rgba(226,232,240,0.1)" : "rgba(226,232,240,0.5)",
    chipBg: isDark ? "#0F172A" : "#F8FAFC",
    chipBorder: isDark ? "#1E293B" : "#E2E8F0",
  };

  const SPEEDS = [0.8, 1.0, 1.2, 1.5] as const;
  const PROVIDERS = [
    "openai",
    "gemini",
    "openrouter",
    "lmstudio",
    "custom",
  ] as const;
  const THEMES = [
    { mode: "light" as const, Icon: Sun, activeColor: "#4F46E5" },
    { mode: "dark" as const, Icon: Moon, activeColor: "#8B5CF6" },
    { mode: "system" as const, Icon: Monitor, activeColor: "#6366F1" },
  ];

  return (
    <ScrollView
      style={[styles.flex1, { backgroundColor: c.bg }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── System Preferences ── */}
      <Text style={[styles.sectionLabel, { color: c.label }]}>
        System Preferences
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: c.cardBg, borderColor: c.cardBorder },
        ]}
      >
        {/* Theme picker */}
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Moon size={16} color={isDark ? "#6366F1" : "#4F46E5"} />
            <Text style={[styles.rowTitle, { color: c.text }]}>
              Interface Theme
            </Text>
          </View>
          <View style={[styles.segControl, { backgroundColor: c.segBg }]}>
            {THEMES.map(({ mode, Icon, activeColor }) => {
              const active = theme === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() => handleThemeChange(mode)}
                  style={[
                    styles.segBtn,
                    active && { backgroundColor: c.segActiveBg },
                  ]}
                  activeOpacity={0.7}
                >
                  <Icon size={15} color={active ? activeColor : "#94A3B8"} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* TTS toggle */}
        <View
          style={[styles.row, styles.divided, { borderTopColor: c.divider }]}
        >
          <View style={styles.rowLeft}>
            <Volume2 size={16} color={isDark ? "#6366F1" : "#4F46E5"} />
            <Text style={[styles.rowTitle, { color: c.text }]}>
              Voice Output (TTS)
            </Text>
          </View>
          <Switch
            value={settings.ttsEnabled}
            onValueChange={(v) => {
              handleTtsToggle(v);
            }}
            trackColor={{ false: "#767577", true: "#6366F1" }}
            thumbColor={settings.ttsEnabled ? "#ffffff" : "#f4f3f4"}
          />
        </View>

        {/* Speech speed */}
        {settings.ttsEnabled && (
          <View
            style={[styles.row, styles.divided, { borderTopColor: c.divider }]}
          >
            <Text style={[styles.rowSubLabel, { color: c.label }]}>
              Speech Speed
            </Text>
            <View style={[styles.segControl, { backgroundColor: c.segBg }]}>
              {SPEEDS.map((speed) => {
                const active = settings.speechRate === speed;
                return (
                  <TouchableOpacity
                    key={speed}
                    onPress={() => handleSpeechRateChange(speed)}
                    style={[
                      styles.speedBtn,
                      active
                        ? { backgroundColor: "#6366F1" }
                        : { backgroundColor: "transparent" },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.speedText,
                        { color: active ? "#ffffff" : c.label },
                      ]}
                    >
                      {speed}x
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* ── Active Provider ── */}
      <Text style={[styles.sectionLabel, { color: c.label }]}>
        Active AI Provider
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: c.cardBg, borderColor: c.cardBorder },
        ]}
      >
        <Text style={[styles.hintText, { color: c.label }]}>
          Choose which AI provider handles new conversation messages by default:
        </Text>
        <View style={styles.chipRow}>
          {Object.keys(PROVIDER_LABELS).map((id) => {
            const active = providerState.activeProviderId === id;
            return (
              <TouchableOpacity
                key={id}
                onPress={() => handleSelectActiveProvider(id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active
                      ? "rgba(99,102,241,0.12)"
                      : c.chipBg,
                    borderColor: active ? "#6366F1" : c.chipBorder,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: active
                        ? isDark
                          ? "#818CF8"
                          : "#4F46E5"
                        : c.label,
                    },
                  ]}
                >
                  {PROVIDER_LABELS[id as ProviderType]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Provider Config ── */}
      <Text style={[styles.sectionLabel, { color: c.label }]}>
        Provider Configuration
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: c.cardBg, borderColor: c.cardBorder },
        ]}
      >
        <Text style={[styles.rowSubLabel, { color: c.label }]}>
          Select Provider to Edit
        </Text>
        <View style={[styles.tabRow, { backgroundColor: c.segBg }]}>
          {PROVIDERS.map((id) => {
            const active = selectedConfigName === id;
            return (
              <TouchableOpacity
                key={id}
                onPress={() => setSelectedConfigName(id)}
                style={[
                  styles.tabBtn,
                  active && { backgroundColor: c.segActiveBg },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: active ? c.segActiveText : c.segInactiveText },
                  ]}
                >
                  {id}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.formWrap}>
          <ProviderConfigForm
            provider={currentEditingProvider}
            onSave={async (config) => {
              await handleSaveProviderConfig(config);
            }}
            isDark={isDark}
          />
        </View>
      </View>

      {/* ── Database ── */}
      <Text style={[styles.sectionLabel, { color: c.label }]}>
        Local Database Persistence
      </Text>
      <View
        style={[
          styles.card,
          styles.rowCard,
          { backgroundColor: c.cardBg, borderColor: c.cardBorder },
        ]}
      >
        <View style={styles.rowLeft}>
          <Database size={16} color="#EF4444" />
          <View style={styles.dbTextWrap}>
            <Text style={[styles.rowTitle, { color: c.text }]}>
              Clear Chat History
            </Text>
            <Text
              style={[styles.rowSubLabel, { color: c.label, marginTop: 2 }]}
            >
              Delete local SQLite conversations
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleClearDb}
          style={styles.dangerBtn}
          activeOpacity={0.75}
        >
          <Text style={styles.dangerText}>Clean DB</Text>
        </TouchableOpacity>
      </View>

      {/* ── About ── */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 60, gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    paddingHorizontal: 4,
    marginTop: 12,
    marginBottom: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  aboutCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  divided: { borderTopWidth: 1, paddingTop: 12 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: "600" },
  rowSubLabel: { fontSize: 11, fontWeight: "500" },
  hintText: { fontSize: 12, lineHeight: 17 },
  segControl: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    gap: 2,
  },
  segBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  speedBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  speedText: { fontSize: 11, fontWeight: "700" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: "700" },
  tabRow: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    gap: 2,
    flexWrap: "nowrap",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  tabText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  formWrap: { marginTop: 4 },
  dbTextWrap: { flex: 1 },
  dangerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderColor: "rgba(239,68,68,0.2)",
  },
  dangerText: { color: "#EF4444", fontWeight: "700", fontSize: 12 },
  aboutText: { flex: 1 },
});
