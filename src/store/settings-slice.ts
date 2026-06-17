import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode, AppSettings } from '../core/types/chat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../core/constants';
import { getDatabase } from '../data/database/sqlite-client';

interface SettingsState {
  theme: ThemeMode;
  ttsEnabled: boolean;
  speechRate: number;
  loading: boolean;
}

const initialState: SettingsState = {
  theme: 'system',
  ttsEnabled: false,
  speechRate: 1.0,
  loading: false,
};

export const loadSettings = createAsyncThunk('settings/loadSettings', async () => {
  const theme = (await AsyncStorage.getItem(STORAGE_KEYS.THEME)) as ThemeMode | null;
  const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
  
  if (settingsJson) {
    const parsed = JSON.parse(settingsJson);
    return {
      theme: theme || parsed.theme || 'system',
      ttsEnabled: parsed.ttsEnabled ?? false,
      speechRate: parsed.speechRate ?? 1.0,
    };
  }

  return {
    theme: theme || 'system',
    ttsEnabled: false,
    speechRate: 1.0,
  };
});

export const updateSettings = createAsyncThunk(
  'settings/updateSettings',
  async (settings: Partial<Omit<SettingsState, 'loading'>>, { getState }) => {
    const state = getState() as { settings: SettingsState };
    const newSettings = {
      theme: settings.theme ?? state.settings.theme,
      ttsEnabled: settings.ttsEnabled ?? state.settings.ttsEnabled,
      speechRate: settings.speechRate ?? state.settings.speechRate,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.THEME, newSettings.theme);
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    return newSettings;
  }
);

export const clearDatabase = createAsyncThunk('settings/clearDatabase', async () => {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM messages;
    DELETE FROM conversations;
  `);
  return true;
});

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.theme = action.payload.theme;
        state.ttsEnabled = action.payload.ttsEnabled;
        state.speechRate = action.payload.speechRate;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.theme = action.payload.theme;
        state.ttsEnabled = action.payload.ttsEnabled;
        state.speechRate = action.payload.speechRate;
      });
  },
});

export default settingsSlice.reducer;
