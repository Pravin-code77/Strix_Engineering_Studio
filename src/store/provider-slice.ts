import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ProviderConfig, ProviderType } from '../core/types/chat';
import { SQLiteProviderRepository } from '../data/repositories/sqlite-provider-repo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../core/constants';

const providerRepo = new SQLiteProviderRepository();

interface ProviderState {
  providers: ProviderConfig[];
  activeProviderId: string;
  loading: boolean;
  error: string | null;
}

const initialState: ProviderState = {
  providers: [],
  activeProviderId: 'openai',
  loading: false,
  error: null,
};

export const loadProviders = createAsyncThunk('provider/loadProviders', async (_, { rejectWithValue }) => {
  try {
    const configs = await providerRepo.getProviders();
    const activeId = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PROVIDER);
    return { configs, activeId: activeId || 'openai' };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to load providers');
  }
});

export const updateProvider = createAsyncThunk(
  'provider/updateProvider',
  async (config: ProviderConfig, { rejectWithValue }) => {
    try {
      await providerRepo.updateProviderConfig(config);
      return config;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update provider config');
    }
  }
);

export const setActiveProviderId = createAsyncThunk(
  'provider/setActiveProviderId',
  async (id: string, { rejectWithValue }) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PROVIDER, id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to set active provider');
    }
  }
);

const providerSlice = createSlice({
  name: 'provider',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // loadProviders
      .addCase(loadProviders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadProviders.fulfilled, (state, action) => {
        state.loading = false;
        state.providers = action.payload.configs;
        state.activeProviderId = action.payload.activeId;
      })
      .addCase(loadProviders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // updateProvider
      .addCase(updateProvider.fulfilled, (state, action) => {
        const index = state.providers.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.providers[index] = action.payload;
        } else {
          state.providers.push(action.payload);
        }
      })
      // setActiveProviderId
      .addCase(setActiveProviderId.fulfilled, (state, action) => {
        state.activeProviderId = action.payload;
      });
  },
});

export default providerSlice.reducer;
