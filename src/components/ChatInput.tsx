import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Keyboard,
  Alert,
  Animated as RNAnimated,
  Platform,
} from 'react-native';
import { Send, Mic, Square, MicOff } from 'lucide-react-native';
import { AnimatedWaveform } from './AnimatedWaveform';
import { useSpeechRecognition, isSpeechSupported } from '../hooks/use-speech-recognition';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  isDark: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, isDark }) => {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;

  // ── Pulse animation for recording indicator dot ────────────────────────
  const startPulse = useCallback(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        RNAnimated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  // ── Speech Recognition ─────────────────────────────────────────────────
  const { state: speechState, volume, isListening, start, stop, abort } = useSpeechRecognition({
    lang: 'en-US',
    onTranscript: (transcript) => {
      setText(transcript);
    },
    onEnd: () => {
      stopPulse();
    },
    onError: (message) => {
      stopPulse();
      // Only show alert for non-trivial errors (not just "no speech")
      if (!message.includes('No speech')) {
        Alert.alert('Voice Input Error', message);
      }
    },
  });

  const handleStartRecording = async () => {
    if (disabled) return;
    if (!isSpeechSupported) {
      Alert.alert(
        'Development Build Required',
        'Voice input uses a native module that is not available in Expo Go.\n\nRun `npx expo run:android` (or `run:ios`) to build the app with full native support.',
        [{ text: 'OK' }]
      );
      return;
    }
    Keyboard.dismiss();
    setText(''); // Clear old text before a new voice session
    startPulse();
    await start();
  };

  const handleStopRecording = () => {
    stop();
  };

  const handleAbortRecording = () => {
    stopPulse();
    abort();
    setText('');
  };

  // ── Send ───────────────────────────────────────────────────────────────
  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    // If recording was active when send is pressed, stop it first
    if (isListening) {
      abort();
    }

    onSend(trimmed);
    setText('');
    Keyboard.dismiss();
  };

  const canSend = text.trim().length > 0 && !disabled;

  // ── Themes ─────────────────────────────────────────────────────────────
  const containerBg = isDark ? '#0B0F19' : '#F8FAFC';
  const inputBg = isDark ? '#141B2D' : '#FFFFFF';
  const inputBorderColor = isDark ? '#1E293B' : '#E2E8F0';
  const placeholderColor = isDark ? '#475569' : '#94A3B8';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const borderTopColor = isDark ? '#1E293B' : '#E2E8F0';

  // ── Recording in-progress state ────────────────────────────────────────
  const isRequestingMic = speechState === 'requesting';

  if (isListening || isRequestingMic) {
    return (
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor,
          backgroundColor: containerBg,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        {/* Listening UI */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 20,
            borderWidth: 1,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderColor: 'rgba(239, 68, 68, 0.35)',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
          }}
        >
          {/* Pulsing red dot */}
          <RNAnimated.View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#EF4444',
              marginRight: 10,
              opacity: isRequestingMic ? 0.5 : pulseAnim,
            }}
          />

          {/* Live transcript preview / status label */}
          <View style={{ flex: 1, minWidth: 0 }}>
            {text.length > 0 ? (
              <Text
                numberOfLines={2}
                style={{
                  color: textColor,
                  fontSize: 14,
                  lineHeight: 19,
                }}
              >
                {text}
              </Text>
            ) : (
              <Text
                style={{
                  color: isRequestingMic ? '#94A3B8' : '#EF4444',
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                {isRequestingMic ? 'Starting mic…' : 'Listening…'}
              </Text>
            )}
          </View>

          {/* Waveform — driven by live microphone volume */}
          {!isRequestingMic && (
            <AnimatedWaveform isDark={isDark} volume={volume} />
          )}

          {/* Stop / Send buttons */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, gap: 8 }}>
            {/* Stop (finalise) */}
            <TouchableOpacity
              onPress={handleStopRecording}
              style={{
                backgroundColor: '#EF4444',
                borderRadius: 20,
                padding: 8,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              accessibilityLabel="Stop listening"
            >
              <Square size={14} color="#ffffff" fill="#ffffff" />
            </TouchableOpacity>

            {/* Send immediately if there's text */}
            {text.trim().length > 0 && (
              <TouchableOpacity
                onPress={handleSend}
                style={{
                  backgroundColor: '#6366F1',
                  borderRadius: 20,
                  padding: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                accessibilityLabel="Send voice message"
              >
                <Send size={14} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Dismiss / cancel hint */}
        <TouchableOpacity
          onPress={handleAbortRecording}
          style={{ alignSelf: 'center', marginTop: 6, padding: 4 }}
          accessibilityLabel="Cancel voice input"
        >
          <Text style={{ color: '#64748B', fontSize: 11 }}>Tap to cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Normal (idle) input UI ─────────────────────────────────────────────
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor,
        backgroundColor: containerBg,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
      }}
    >
      {/* Text input box */}
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'flex-end',
          borderRadius: 22,
          borderWidth: 1,
          borderColor: inputBorderColor,
          backgroundColor: inputBg,
          paddingHorizontal: 14,
          paddingVertical: Platform.OS === 'ios' ? 10 : 4,
        }}
      >
        <TextInput
          ref={inputRef}
          style={{
            flex: 1,
            color: textColor,
            fontSize: 15.5,
            maxHeight: 120,
            paddingTop: Platform.OS === 'android' ? 8 : 0,
            paddingBottom: Platform.OS === 'android' ? 8 : 0,
          }}
          placeholder="Message AI Assistant…"
          placeholderTextColor={placeholderColor}
          multiline
          value={text}
          onChangeText={setText}
          editable={!disabled}
          accessibilityLabel="Message input"
        />

        {/* Microphone button (shown when text box is empty) */}
        {!text.trim() && (
          <TouchableOpacity
            onPress={handleStartRecording}
            disabled={disabled}
            style={{
              padding: 4,
              marginLeft: 4,
              opacity: disabled ? 0.4 : isSpeechSupported ? 1 : 0.5,
            }}
            accessibilityLabel={isSpeechSupported ? 'Start voice input' : 'Voice input unavailable in Expo Go'}
          >
            {isSpeechSupported ? (
              <Mic size={21} color='#6366F1' strokeWidth={2} />
            ) : (
              <MicOff size={21} color={isDark ? '#475569' : '#94A3B8'} strokeWidth={2} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Send button */}
      <TouchableOpacity
        onPress={handleSend}
        disabled={!canSend}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: canSend ? '#6366F1' : isDark ? '#1E293B' : '#E2E8F0',
          // Shadow for active state
          ...(canSend && {
            shadowColor: '#6366F1',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 4,
            elevation: 4,
          }),
        }}
        accessibilityLabel="Send message"
      >
        <Send
          size={18}
          color={canSend ? '#ffffff' : isDark ? '#475569' : '#94A3B8'}
        />
      </TouchableOpacity>
    </View>
  );
};
