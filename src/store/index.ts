import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { authService } from '../services/api';

interface AuthState {
  user: { id: string; name: string; email: string; role: string; avatar?: string } | null;
  isAuthenticated: boolean;
}

interface UIState {
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];
  darkMode: boolean;
}

const initialAuth: AuthState = {
  user: authService.getCurrentUser(),
  isAuthenticated: !!authService.getCurrentUser(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuth,
  reducers: {
    setUser(state, action: PayloadAction<AuthState['user']>) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      authService.logout();
    },
  },
});

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    toasts: [],
    darkMode: localStorage.getItem('tf_dark_mode') === 'true',
  } as UIState,
  reducers: {
    addToast(state, action: PayloadAction<{ message: string; type: 'success' | 'error' | 'info' }>) {
      state.toasts.push({ id: Date.now().toString(), ...action.payload });
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode;
      localStorage.setItem('tf_dark_mode', state.darkMode.toString());
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export const { addToast, removeToast, toggleDarkMode } = uiSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
