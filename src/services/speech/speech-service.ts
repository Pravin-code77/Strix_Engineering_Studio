import * as Speech from 'expo-speech';

export class SpeechService {
  static async speak(text: string, rate = 1.0): Promise<void> {
    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }

      // Strip markdown headers/formatting before speaking for a cleaner audio experience
      const cleanText = text
        .replace(/[#*`~_]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // remove markdown links
        .trim();

      Speech.speak(cleanText, {
        rate,
      });
    } catch (error) {
      console.warn('Speech synthesis failed:', error);
    }
  }

  static async stop(): Promise<void> {
    try {
      await Speech.stop();
    } catch (error) {
      console.warn('Failed to stop speech synthesis:', error);
    }
  }

  static async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch {
      return false;
    }
  }
}
