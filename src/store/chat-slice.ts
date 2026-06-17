import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Message, Conversation, ProviderConfig, MessageRole } from '../core/types/chat';
import { SQLiteConversationRepository } from '../data/repositories/sqlite-conversation-repo';
import { SQLiteMessageRepository } from '../data/repositories/sqlite-message-repo';
import { ProviderFactory } from '../services/ai/provider-factory';
import { SpeechService } from '../services/speech/speech-service';

const conversationRepo = new SQLiteConversationRepository();
const messageRepo = new SQLiteMessageRepository();

// Store non-serializable abort controller outside the Redux state tree
let activeAbortController: AbortController | null = null;

interface ChatState {
  conversations: Conversation[];
  messages: Message[];
  activeConversationId: string | null;
  loadingConversations: boolean;
  loadingMessages: boolean;
  sendingMessage: boolean;
  streamingMessageContent: string;
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  messages: [],
  activeConversationId: null,
  loadingConversations: false,
  loadingMessages: false,
  sendingMessage: false,
  streamingMessageContent: '',
  error: null,
};

export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      return await conversationRepo.getConversations();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load conversations');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      return await messageRepo.getMessages(conversationId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load messages');
    }
  }
);

export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async (
    payload: { id: string; title: string; providerId?: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const conv = await conversationRepo.createConversation(
        payload.id,
        payload.title,
        payload.providerId
      );
      dispatch(fetchConversations());
      return conv;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create conversation');
    }
  }
);

export const renameConversation = createAsyncThunk(
  'chat/renameConversation',
  async (payload: { id: string; title: string }, { rejectWithValue, dispatch }) => {
    try {
      await conversationRepo.updateConversationTitle(payload.id, payload.title);
      dispatch(fetchConversations());
      return payload;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to rename conversation');
    }
  }
);

export const deleteConversation = createAsyncThunk(
  'chat/deleteConversation',
  async (id: string, { rejectWithValue, dispatch }) => {
    try {
      await conversationRepo.deleteConversation(id);
      dispatch(fetchConversations());
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete conversation');
    }
  }
);

export const switchConversationProvider = createAsyncThunk(
  'chat/switchConversationProvider',
  async (
    payload: { conversationId: string; providerId: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      await conversationRepo.updateConversationProvider(payload.conversationId, payload.providerId);
      dispatch(fetchConversations());
      return payload;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to switch conversation provider');
    }
  }
);

interface SendMessagePayload {
  conversationId: string;
  content: string;
}

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (payload: SendMessagePayload, { rejectWithValue, dispatch, getState }) => {
    const { conversationId, content } = payload;
    
    // Stop speech synthesis if speaking
    await SpeechService.stop();

    // 1. Save user message to DB
    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      conversationId,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    try {
      await messageRepo.createMessage(userMsg);
      dispatch(addLocalMessage(userMsg));
    } catch (error: any) {
      return rejectWithValue(`Failed to save message locally: ${error.message}`);
    }

    // 2. Select AI Provider configuration
    const state = getState() as {
      chat: ChatState;
      provider: { providers: ProviderConfig[]; activeProviderId: string };
      settings: { ttsEnabled: boolean; speechRate: number };
    };

    const conversation = state.chat.conversations.find((c) => c.id === conversationId);
    const providerId = conversation?.providerId || state.provider.activeProviderId;
    const providerConfig = state.provider.providers.find((p) => p.id === providerId);

    if (!providerConfig) {
      return rejectWithValue('Active AI provider configuration not found.');
    }

    // 3. Prepare message context for AI request
    const dbMessages = await messageRepo.getMessages(conversationId);
    // Limit context window to last 20 messages for prompt efficiency
    const chatHistory = dbMessages.slice(-20);

    // 4. Create AbortController for cancel operations
    activeAbortController = new AbortController();

    const assistantMsgId = Math.random().toString(36).substring(7);
    let accumulatedContent = '';

    try {
      const adapter = ProviderFactory.getProvider(providerConfig.providerName);

      // Perform streaming
      await adapter.sendMessageStream(
        chatHistory,
        providerConfig,
        (chunk) => {
          accumulatedContent += chunk;
          dispatch(updateStreamingContent(accumulatedContent));
        },
        activeAbortController.signal
      );

      activeAbortController = null;

      // 5. Save final assistant response to DB
      const assistantMsg: Message = {
        id: assistantMsgId,
        conversationId,
        role: 'assistant',
        content: accumulatedContent,
        timestamp: new Date().toISOString(),
      };

      await messageRepo.createMessage(assistantMsg);
      dispatch(addLocalMessage(assistantMsg));
      dispatch(clearStreamingContent());
      dispatch(fetchConversations()); // Refresh conversation list order

      // 6. Trigger Text-to-Speech if enabled
      if (state.settings.ttsEnabled) {
        SpeechService.speak(accumulatedContent, state.settings.speechRate);
      }

      return assistantMsg;
    } catch (error: any) {
      activeAbortController = null;
      dispatch(clearStreamingContent());

      const errorMessage = error.message || 'Failed to generate response.';
      
      // If user cancelled, don't save error message bubble
      if (error.code === 'CANCELLED') {
        return rejectWithValue('Streaming cancelled by user.');
      }

      // Save error feedback message bubble from Assistant
      const errorMsg: Message = {
        id: assistantMsgId,
        conversationId,
        role: 'assistant',
        content: `⚠️ Error: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      };
      
      await messageRepo.createMessage(errorMsg);
      dispatch(addLocalMessage(errorMsg));
      dispatch(fetchConversations());

      return rejectWithValue(errorMessage);
    }
  }
);

export const cancelMessageGeneration = createAsyncThunk(
  'chat/cancelGeneration',
  async (_, { dispatch }) => {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
    dispatch(clearStreamingContent());
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addLocalMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    updateStreamingContent: (state, action: PayloadAction<string>) => {
      state.streamingMessageContent = action.payload;
    },
    clearStreamingContent: (state) => {
      state.streamingMessageContent = '';
    },
    setActiveConversationId: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload;
      if (action.payload === null) {
        state.messages = [];
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchConversations
      .addCase(fetchConversations.pending, (state) => {
        state.loadingConversations = true;
      })
      .addCase(fetchConversations.fulfilled, (state, action: PayloadAction<Conversation[]>) => {
        state.loadingConversations = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loadingConversations = false;
        state.error = action.payload as string;
      })
      // fetchMessages
      .addCase(fetchMessages.pending, (state) => {
        state.loadingMessages = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action: PayloadAction<Message[]>) => {
        state.loadingMessages = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loadingMessages = false;
        state.error = action.payload as string;
      })
      // createConversation
      .addCase(createConversation.fulfilled, (state, action: PayloadAction<Conversation>) => {
        state.activeConversationId = action.payload.id;
        state.messages = [];
      })
      // switchConversationProvider
      .addCase(switchConversationProvider.fulfilled, (state, action) => {
        const index = state.conversations.findIndex((c) => c.id === action.payload.conversationId);
        if (index !== -1) {
          state.conversations[index].providerId = action.payload.providerId;
        }
      })
      // sendMessage
      .addCase(sendMessage.pending, (state) => {
        state.sendingMessage = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state) => {
        state.sendingMessage = false;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        // Don't show state error if user cancelled or error bubble handled it
        if (action.payload !== 'Streaming cancelled by user.') {
          state.error = action.payload as string;
        }
      });
  },
});

export const {
  addLocalMessage,
  updateStreamingContent,
  clearStreamingContent,
  setActiveConversationId,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;
