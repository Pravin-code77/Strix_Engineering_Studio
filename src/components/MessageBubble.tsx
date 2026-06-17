import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Clipboard } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Volume2, VolumeX, Copy, Check } from 'lucide-react-native';
import { Message } from '../core/types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SpeechService } from '../services/speech/speech-service';

interface MessageBubbleProps {
  message: Message;
  isDark: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isDark }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const handleCopy = () => {
    Clipboard.setString(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = async () => {
    if (speaking) {
      await SpeechService.stop();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      await SpeechService.speak(message.content);
      // Poll to check when speaking completes
      const interval = setInterval(async () => {
        const active = await SpeechService.isSpeaking();
        if (!active) {
          setSpeaking(false);
          clearInterval(interval);
        }
      }, 500);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (isUser) {
    return (
      <Animated.View
        entering={FadeInUp.duration(350)}
        className="flex-row my-2 px-4 justify-end"
      >
        <View
          className="max-w-[85%] rounded-3xl px-5 py-3 bg-brand-accent"
          style={{ backgroundColor: '#6366F1' }}
        >
          <Text className="text-white text-[15px] leading-[22px]">{message.content}</Text>
          <View className="flex-row items-center justify-end mt-1 pt-0.5">
            <Text className="text-[10px] text-indigo-200">
              {formatTime(message.timestamp)}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInUp.duration(350)}
      className="my-4 px-6 flex-row justify-start"
    >
      <View className="w-full">
        <Text className={`text-[12px] font-semibold uppercase tracking-wider mb-2 ${
          isDark ? 'text-slate-400' : 'text-slate-400'
        }`}>
          Fast answer
        </Text>

        <MarkdownRenderer content={message.content} isDark={isDark} />

        <View
          className="flex-row items-center justify-between mt-3 pt-2 border-t"
          style={{ borderTopColor: 'rgba(226, 232, 240, 0.08)' }}
        >
          <Text className={`text-[10px] ${isDark ? 'text-brand-muted' : 'text-slate-400'}`}>
            {formatTime(message.timestamp)}
          </Text>

          <View className="flex-row items-center space-x-3 gap-2">
            <TouchableOpacity onPress={handleSpeak} className="p-1">
              {speaking ? (
                <VolumeX size={14} color={isDark ? '#94A3B8' : '#64748B'} />
              ) : (
                <Volume2 size={14} color={isDark ? '#94A3B8' : '#64748B'} />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCopy} className="p-1">
              {copied ? (
                <Check size={14} color="#10B981" />
              ) : (
                <Copy size={14} color={isDark ? '#94A3B8' : '#64748B'} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};
