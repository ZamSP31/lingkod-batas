/**
 * AuthContext.tsx
 * Global auth state. Wraps the app so any component can read the
 * current user or call login/register/logout without prop-drilling.
 *
 * Place this file at: client/src/context/AuthContext.tsx
 *
 * Token is persisted to localStorage so the session survives a page
 * refresh. On mount, we restore the token and user from storage.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  loginUser,
  registerClient,
  type AuthUser,
} from '../services/authService.js';

// ─── Shape ───────────────────────────────────────────────────────────────────

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  /**
   * Log in with email + password. Resolves with the user on success.
   * Throws with an Error whose `.message` is the backend's error string
   * (e.g. "Invalid email or password.") on failure.
   */
  login: (values: { email: string; password: string }) => Promise<AuthUser>;

  /**
   * Register a new Client account. Same error contract as login.
   */
  register: (values: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<AuthUser>;

  /** Clears the session from memory and localStorage. */
  logout: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'lb_token';
const USER_KEY = 'lb_user';

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    // Restore session from localStorage on first render.
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const raw = localStorage.getItem(USER_KEY);
      const user = raw ? (JSON.parse(raw) as AuthUser) : null;
      return { user, token, isLoading: false };
    } catch {
      return { user: null, token: null, isLoading: false };
    }
  });

  // Keep localStorage in sync whenever auth state changes.
  useEffect(() => {
    if (state.token && state.user) {
      localStorage.setItem(TOKEN_KEY, state.token);
      localStorage.setItem(USER_KEY, JSON.stringify(state.user));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }, [state.token, state.user]);

  async function login(values: {
    email: string;
    password: string;
  }): Promise<AuthUser> {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const { user, token } = await loginUser(values);
      setState({ user, token, isLoading: false });
      return user;
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw err;
    }
  }

  async function register(values: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<AuthUser> {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const { user, token } = await registerClient(values);
      setState({ user, token, isLoading: false });
      return user;
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw err;
    }
  }

  function logout() {
    setState({ user: null, token: null, isLoading: false });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useAuth — access auth state and actions from any component.
 * Must be used inside <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
