import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface SkeletonProps {
  isDark: boolean;
}

export const ConversationSkeleton: React.FC<SkeletonProps> = ({ isDark }) => {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 600 }),
        withTiming(0.4, { duration: 600 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const cardBg = isDark ? '#151C2C' : '#E2E8F0';
  const lineBg = isDark ? '#1E293B' : '#CBD5E1';

  return (
    <View style={styles.padding}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Animated.View
          key={i}
          style={[
            animatedStyle,
            styles.convCard,
            { backgroundColor: cardBg },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: lineBg }]} />
          <View style={styles.lines}>
            <View style={[styles.lineShort, { backgroundColor: lineBg }]} />
            <View style={[styles.lineLong, { backgroundColor: lineBg }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

export const MessageSkeleton: React.FC<SkeletonProps> = ({ isDark }) => {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 600 }),
        withTiming(0.4, { duration: 600 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const userBubbleBg = isDark ? '#1E293B' : '#E2E8F0';
  const aiBubbleBg = isDark ? '#151C2C' : '#ffffff';
  const aiBubbleBorder = isDark ? '#1E293B' : '#E2E8F0';
  const lineBg = isDark ? '#1E293B' : '#CBD5E1';

  return (
    <View style={[styles.messagePadding, styles.flex1]}>
      {[1, 2, 3].map((i) => {
        const isUser = i % 2 === 0;
        return (
          <Animated.View
            key={i}
            style={[
              animatedStyle,
              styles.msgRow,
              { justifyContent: isUser ? 'flex-end' : 'flex-start' },
            ]}
          >
            <View
              style={[
                styles.msgBubble,
                isUser
                  ? { backgroundColor: userBubbleBg }
                  : {
                      backgroundColor: aiBubbleBg,
                      borderWidth: 1,
                      borderColor: aiBubbleBorder,
                    },
              ]}
            >
              <View style={[styles.msgLine, { backgroundColor: lineBg }]} />
              <View style={[styles.msgLine, styles.msgLineMid, { backgroundColor: lineBg }]} />
              <View style={[styles.msgLineShort, { backgroundColor: lineBg }]} />
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  padding: { padding: 16 },
  messagePadding: { padding: 16, justifyContent: 'flex-end' },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  lines: { flex: 1, gap: 8 },
  lineShort: { height: 14, width: '33%', borderRadius: 6 },
  lineLong: { height: 12, width: '70%', borderRadius: 6 },
  msgRow: { flexDirection: 'row', marginBottom: 16 },
  msgBubble: { padding: 14, borderRadius: 16, width: '65%', gap: 8 },
  msgLine: { height: 14, width: '100%', borderRadius: 6 },
  msgLineMid: { width: '83%' },
  msgLineShort: { height: 12, width: '25%', borderRadius: 6 },
});
