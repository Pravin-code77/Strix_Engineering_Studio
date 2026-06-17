import { Stack, useLocalSearchParams } from "expo-router";
import { Sparkles, Square } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ChatInput } from "../../components/ChatInput";
import { EmptyState } from "../../components/EmptyState";
import { MessageBubble } from "../../components/MessageBubble";
import { MessageSkeleton } from "../../components/SkeletonLoader";
import { PROVIDER_LABELS } from "../../core/constants";
import { ProviderType } from "../../core/types/chat";
import { useIsDark } from "../../hooks/use-is-dark";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  cancelMessageGeneration,
  fetchMessages,
  sendMessage,
  setActiveConversationId,
  switchConversationProvider,
} from "../../store/chat-slice";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const flatListRef = useRef<FlatList>(null);

  const { messages, loadingMessages, sendingMessage, streamingMessageContent } =
    useAppSelector((state) => state.chat);

  const providerState = useAppSelector((state) => state.provider);
  const isDark = useIsDark();

  const conversation = useAppSelector((state) =>
    state.chat.conversations.find((c) => c.id === id)
  );

  const activeConvProviderId =
    conversation?.providerId || providerState.activeProviderId;
  const activeProviderName =
    PROVIDER_LABELS[activeConvProviderId as ProviderType] || "AI Model";

  useEffect(() => {
    if (id) {
      dispatch(setActiveConversationId(id));
      dispatch(fetchMessages(id));
    }
    return () => {
      dispatch(cancelMessageGeneration());
      dispatch(setActiveConversationId(null));
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (messages.length > 0 || streamingMessageContent) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, streamingMessageContent]);

  const handleSend = (text?: string) => {
    if (text && id) {
      dispatch(sendMessage({ conversationId: id, content: text }));
    }
  };

  const handleStopGenerating = () => {
    dispatch(cancelMessageGeneration());
  };

  const handleSwitchProvider = () => {
    const options = Object.entries(PROVIDER_LABELS).map(([key, label]) => ({
      key,
      label,
    }));

    Alert.alert(
      "Switch Provider for Chat",
      `This conversation is currently using: ${activeProviderName}.\nSelect a model override:`,
      [
        { text: "Cancel", style: "cancel" },
        ...options.map((opt) => ({
          text:
            opt.label +
            (opt.key === providerState.activeProviderId ? " (Default)" : ""),
          onPress: () => {
            if (id) {
              dispatch(
                switchConversationProvider({
                  conversationId: id,
                  providerId: opt.key,
                })
              );
            }
          },
        })),
      ]
    );
  };

  const displayMessages = [...messages];
  if (streamingMessageContent) {
    displayMessages.push({
      id: "streaming-temp",
      conversationId: id || "",
      role: "assistant",
      content: streamingMessageContent,
      timestamp: new Date().toISOString(),
    });
  }

  const colors = {
    bg: isDark ? "#0B0F19" : "#F8FAFC",
    titleText: isDark ? "#F1F5F9" : "#0F172A",
    providerText: isDark ? "#818CF8" : "#4F46E5",
  };

  return (
    // ── NO className on SafeAreaView — NativeWind interop + navigation header = crash
    <SafeAreaView style={[styles.flex1, { backgroundColor: colors.bg }]}>
      {/* ── Stack.Screen header: NO className anywhere inside here ── */}
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: isDark ? "#0B0F19" : "#ffffff" },
          headerTintColor: isDark ? "#ffffff" : "#0B0F19",
          headerTitle: () => (
            // Plain View + plain Text — zero className
            <View style={styles.headerTitleContainer}>
              <Text
                style={[styles.headerTitle, { color: colors.titleText }]}
                numberOfLines={1}
              >
                {conversation?.title || "Chat"}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.providerText }]}>
                {activeProviderName}
              </Text>
            </View>
          ),
          headerRight: () => (
            // Plain TouchableOpacity — NO className
            <TouchableOpacity
              onPress={handleSwitchProvider}
              style={styles.headerRightBtn}
            >
              <Sparkles size={18} color="#6366F1" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* ── NO className on KeyboardAvoidingView ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "android" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "android" ? 90 : 0}
        style={styles.flex1}
      >
        {loadingMessages ? (
          <MessageSkeleton isDark={isDark} />
        ) : displayMessages.length === 0 ? (
          <EmptyState type="chat" onAction={handleSend} isDark={isDark} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={displayMessages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble message={item} isDark={isDark} />
            )}
            contentContainerStyle={{ paddingVertical: 16 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Floating Stop Generating Button */}
        {sendingMessage && (
          <View style={styles.stopBtnContainer}>
            <TouchableOpacity
              onPress={handleStopGenerating}
              style={[
                styles.stopBtn,
                {
                  backgroundColor: isDark
                    ? "rgba(15, 23, 42, 0.95)"
                    : "rgba(30, 41, 59, 0.9)",
                },
              ]}
            >
              <Square size={12} color="#EF4444" fill="#EF4444" />
              <Text style={styles.stopBtnText}>Stop Generating</Text>
            </TouchableOpacity>
          </View>
        )}

        <ChatInput
          onSend={handleSend}
          disabled={sendingMessage}
          isDark={isDark}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  headerTitleContainer: { alignItems: "center", paddingVertical: 4 },
  headerTitle: { fontWeight: "bold", fontSize: 15, maxWidth: 180 },
  headerSubtitle: { fontSize: 10, fontWeight: "600", marginTop: 1 },
  headerRightBtn: { padding: 8, marginRight: 4 },
  stopBtnContainer: {
    alignItems: "center",
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
  },
  stopBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stopBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 8,
  },
});
