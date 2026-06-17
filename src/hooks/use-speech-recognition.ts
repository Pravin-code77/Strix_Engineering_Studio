import { useState, useEffect, useCallback, useRef } from 'react';

// ── Safe native module loading ─────────────────────────────────────────────
// expo-speech-recognition requires a development build.
// In Expo Go the native module is absent, so we must never do a top-level
// static import — that crashes the entire module graph and breaks routing.
// Instead we load it dynamically and fall back to no-ops when unavailable.

type SpeechRecognitionModule = {
  ExpoSpeechRecognitionModule: {
    requestPermissionsAsync: () => Promise<{ granted: boolean }>;
    start: (opts: Record<string, unknown>) => void;
    stop: () => void;
    abort: () => void;
  };
  useSpeechRecognitionEvent: (
    event: string,
    callback: (payload: any) => void
  ) => void;
};

let _module: SpeechRecognitionModule | null = null;
let _supported = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const m = require('expo-speech-recognition');
  if (m?.ExpoSpeechRecognitionModule && m?.useSpeechRecognitionEvent) {
    _module = m as SpeechRecognitionModule;
    _supported = true;
  }
} catch {
  // Running in Expo Go or an env without the native module — degrade gracefully
}

/** Whether the speech recognition native module is available on this build. */
export const isSpeechSupported = _supported;

// Provide safe no-op wrappers so callers never need to null-check
const noop = () => {};
const noopAsync = async () => ({ granted: false });

const SafeModule = {
  requestPermissionsAsync: _module?.ExpoSpeechRecognitionModule.requestPermissionsAsync ?? noopAsync,
  start: _module?.ExpoSpeechRecognitionModule.start ?? noop,
  stop: _module?.ExpoSpeechRecognitionModule.stop ?? noop,
  abort: _module?.ExpoSpeechRecognitionModule.abort ?? noop,
};

/**
 * Thin wrapper around useSpeechRecognitionEvent that is safe to call when the
 * native module is absent. In that case the hook simply registers nothing.
 */
function useSafeEvent(event: string, callback: (payload: any) => void) {
  if (_module) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    _module.useSpeechRecognitionEvent(event, callback);
  }
}

// ── Public types ───────────────────────────────────────────────────────────

export type SpeechRecognitionState = 'idle' | 'requesting' | 'listening' | 'stopping';

interface UseSpeechRecognitionOptions {
  /** Called with the interim/final transcript string as speech is recognized */
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  /** Called when recognition ends (normally or on error) */
  onEnd?: () => void;
  /** Called on a recognition error with a human-readable message */
  onError?: (message: string) => void;
  /** Language/locale (default: 'en-US') */
  lang?: string;
}

interface UseSpeechRecognitionResult {
  /** Whether the native module is available on this build */
  isSupported: boolean;
  state: SpeechRecognitionState;
  /** Current microphone volume level: −2 to 10 (−2 = inaudible / no data) */
  volume: number;
  /** Convenience: true when state is 'listening' or 'stopping' */
  isListening: boolean;
  start: () => Promise<void>;
  stop: () => void;
  abort: () => void;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionResult {
  const { onTranscript, onEnd, onError, lang = 'en-US' } = options;

  const [state, setState] = useState<SpeechRecognitionState>('idle');
  const [volume, setVolume] = useState<number>(-2);

  // Keep callbacks in refs to avoid stale closures
  const onTranscriptRef = useRef(onTranscript);
  const onEndRef = useRef(onEnd);
  const onErrorRef = useRef(onError);
  onTranscriptRef.current = onTranscript;
  onEndRef.current = onEnd;
  onErrorRef.current = onError;

  // ── Native event listeners ─────────────────────────────────────────────
  useSafeEvent('start', () => {
    setState('listening');
    setVolume(-2);
  });

  useSafeEvent('end', () => {
    setState('idle');
    setVolume(-2);
    onEndRef.current?.();
  });

  useSafeEvent('result', (event: any) => {
    const transcript: string = event?.results?.[0]?.transcript ?? '';
    const isFinal: boolean = event?.isFinal ?? false;
    if (transcript) {
      onTranscriptRef.current?.(transcript, isFinal);
    }
  });

  useSafeEvent('error', (event: any) => {
    // 'aborted' fires when we call abort() — not a real error
    if (event?.error === 'aborted') {
      setState('idle');
      setVolume(-2);
      return;
    }
    setState('idle');
    setVolume(-2);

    let message: string = event?.message ?? 'An unknown speech recognition error occurred.';
    switch (event?.error) {
      case 'not-allowed':
        message = 'Microphone permission is required for voice input.';
        break;
      case 'no-speech':
        message = 'No speech was detected. Please try again.';
        break;
      case 'network':
        message = 'A network error occurred during speech recognition.';
        break;
      case 'audio-capture':
        message = 'Could not capture audio from the microphone.';
        break;
    }
    onErrorRef.current?.(message);
  });

  useSafeEvent('volumechange', (event: any) => {
    setVolume(event?.value ?? -2);
  });

  // Cleanup on unmount — abort any in-progress session
  useEffect(() => {
    return () => {
      try { SafeModule.abort(); } catch {}
    };
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────

  const start = useCallback(async () => {
    if (!_supported) {
      onErrorRef.current?.(
        'Voice input requires a development build.\n\nRun `npx expo run:android` to build the app with native modules.'
      );
      return;
    }
    if (state !== 'idle') return;

    setState('requesting');
    try {
      const { granted } = await SafeModule.requestPermissionsAsync();
      if (!granted) {
        setState('idle');
        onErrorRef.current?.('Microphone permission was denied. Please enable it in Settings.');
        return;
      }

      SafeModule.start({
        lang,
        interimResults: true,
        continuous: false,
        // Enable volume metering to drive the animated waveform
        volumeChangeEventOptions: {
          enabled: true,
          intervalMillis: 100,
        },
      });
      // State transitions to 'listening' once the 'start' event fires
    } catch (e: any) {
      setState('idle');
      onErrorRef.current?.(e?.message ?? 'Failed to start speech recognition.');
    }
  }, [state, lang]);

  const stop = useCallback(() => {
    if (state !== 'listening') return;
    setState('stopping');
    try { SafeModule.stop(); } catch {}
  }, [state]);

  const abort = useCallback(() => {
    setState('idle');
    setVolume(-2);
    try { SafeModule.abort(); } catch {}
  }, []);

  return {
    isSupported: _supported,
    state,
    volume,
    isListening: state === 'listening' || state === 'stopping',
    start,
    stop,
    abort,
  };
}
