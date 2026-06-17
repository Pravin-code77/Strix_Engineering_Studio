import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import chatReducer from './chat-slice';
import settingsReducer from './settings-slice';
import providerReducer from './provider-slice';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    settings: settingsReducer,
    provider: providerReducer,
  },
  // Disable serializable checks for parameters (since we handle them safely)
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const appDispatch = store.dispatch;
