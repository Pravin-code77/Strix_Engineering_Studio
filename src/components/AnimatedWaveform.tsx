import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

// ── Volume-driven waveform ────────────────────────────────────────────────────
// `volume` is in the range [-2, 10] from expo-speech-recognition's volumechange event.
// We map it to a bar height between minH and maxH.

const MIN_H = 6;
const MAX_H = 40;

/** Normalise the raw volume value (-2..10) to 0..1 */
function normaliseVolume(volume: number): number {
  const clamped = Math.max(-2, Math.min(10, volume));
  return (clamped + 2) / 12; // maps -2→0, 10→1
}

interface WaveBarProps {
  delayMs: number;
  isDark: boolean;
  /** Live volume (0–1). When undefined the bar falls back to idle animation. */
  normalisedVolume?: number;
  /** Amplitude multiplier (0–1) so bars spread across different heights */
  amplitude: number;
}

const WaveBar: React.FC<WaveBarProps> = ({ delayMs, isDark, normalisedVolume, amplitude }) => {
  const height = useSharedValue(MIN_H);

  useEffect(() => {
    if (normalisedVolume !== undefined) {
      // Drive height from real mic volume
      const targetH = MIN_H + (MAX_H - MIN_H) * normalisedVolume * amplitude;
      height.value = withSpring(targetH, { damping: 10, stiffness: 120 });
    } else {
      // Idle: gentle pulse animation
      height.value = withDelay(
        delayMs,
        withRepeat(
          withSequence(
            withTiming(MAX_H * amplitude, { duration: 500 }),
            withTiming(MIN_H, { duration: 500 })
          ),
          -1,
          true
        )
      );
    }
  }, [normalisedVolume, amplitude]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: 4,
          borderRadius: 3,
          backgroundColor: isDark ? '#6366F1' : '#4F46E5',
          marginHorizontal: 3,
        },
      ]}
    />
  );
};

interface AnimatedWaveformProps {
  isDark: boolean;
  /** Raw volume from expo-speech-recognition (-2 to 10). Omit for idle animation. */
  volume?: number;
}

export const AnimatedWaveform: React.FC<AnimatedWaveformProps> = ({ isDark, volume }) => {
  const normVol = volume !== undefined ? normaliseVolume(volume) : undefined;

  // Each bar gets a slightly different amplitude so they look organic
  const amplitudes = [0.55, 0.85, 1.0, 0.85, 0.55];
  const delays = [0, 120, 240, 360, 480];

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 44 }}>
      {amplitudes.map((amp, i) => (
        <WaveBar
          key={i}
          delayMs={delays[i]}
          isDark={isDark}
          normalisedVolume={normVol}
          amplitude={amp}
        />
      ))}
    </View>
  );
};
