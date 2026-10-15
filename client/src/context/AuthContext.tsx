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
  useRef,
  type ReactNode,
} from "react";
import {
  loginUser,
  verifyLoginOtp,
  resendLoginOtp,
  registerClient,
  updateUserProfile,
  getUserProfile,
  AuthApiError,
  type AuthUser,
  type LoginResponse,
  type SendOtpResponse,
  type UpdateProfilePayload,
} from "../services/authService.js";

// ─── Shape ───────────────────────────────────────────────────────────────────

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  /**
   * Log in with email + password. Initiates 2FA and returns LoginResponse.
   */
  login: (values: {
    email: string;
    password: string;
  }) => Promise<LoginResponse>;

  /**
   * Verify 6-digit 2FA login code and establish session.
   */
  verifyLogin2FA: (values: { email: string; otp: string }) => Promise<AuthUser>;

  /**
   * Resend 6-digit 2FA login code.
   */
  resendLogin2FA: (email: string) => Promise<SendOtpResponse>;

  /**
   * Register a new Client account. Same error contract as login.
   */
  register: (values: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    otp: string;
  }) => Promise<AuthUser>;

  /**
   * Update profile information and sync user state across context and storage.
   */
  updateProfile: (values: UpdateProfilePayload) => Promise<AuthUser>;

  /** Clears the session from memory and localStorage. */
  logout: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "lb_token";
const USER_KEY = "lb_user";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const loginChallenge = useRef<string | null>(null);
  const [state, setState] = useState<AuthState>(() => {
    // Restore session from localStorage on first render.
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const raw = localStorage.getItem(USER_KEY);
      const user = raw ? (JSON.parse(raw) as AuthUser) : null;
      return { user, token, isLoading: Boolean(token) };
    } catch {
      return { user: null, token: null, isLoading: false };
    }
  });

  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const profileSaveInFlight = useRef(false);
  const activeToken = useRef(state.token);
  activeToken.current = state.token;

  useEffect(() => {
    if (!state.token) { setRestoreError(null); return; }
    const token = state.token;
    const controller = new AbortController();
    setState((prev) => ({ ...prev, isLoading: true }));
    setRestoreError(null);
    getUserProfile(token, controller.signal).then(({ user }) => {
      if (controller.signal.aborted || activeToken.current !== token) return;
      setState((prev) => prev.token === token ? { user, token, isLoading: false } : prev);
    }).catch((error: unknown) => {
      if (controller.signal.aborted || activeToken.current !== token) return;
      if (error instanceof AuthApiError && (error.status === 401 || error.status === 403)) {
        setState((prev) => prev.token === token ? { user: null, token: null, isLoading: false } : prev);
      } else {
        setRestoreError("We could not load your saved account details. Check your connection and try again.");
        setState((prev) => prev.token === token ? { ...prev, isLoading: false } : prev);
      }
    });
    return () => controller.abort();
  }, [state.token, restoreAttempt]);

  // Keep localStorage in sync whenever auth state changes.
  useEffect(() => {
    if (state.isLoading || restoreError) return;
    if (state.token && state.user) {
      localStorage.setItem(TOKEN_KEY, state.token);
      localStorage.setItem(USER_KEY, JSON.stringify(state.user));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }, [state.token, state.user, state.isLoading, restoreError]);

  async function login(values: {
    email: string;
    password: string;
  }): Promise<LoginResponse> {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      loginChallenge.current = null;
      const res = await loginUser(values);
      loginChallenge.current = res.challengeId;
      setState((prev) => ({ ...prev, isLoading: false }));
      return res;
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw err;
    }
  }

  async function verifyLogin2FA(values: {
    email: string;
    otp: string;
  }): Promise<AuthUser> {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      if (!loginChallenge.current) throw new Error("Please sign in with your password again.");
      const { user, token } = await verifyLoginOtp({ ...values, challengeId: loginChallenge.current });
      loginChallenge.current = null;
      setState({ user, token, isLoading: false });
      return user;
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw err;
    }
  }

  async function resendLogin2FA(email: string): Promise<SendOtpResponse> {
    if (!loginChallenge.current) throw new Error("Please sign in with your password again.");
    return resendLoginOtp(email, loginChallenge.current);
  }

  async function register(values: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    otp: string;
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

  async function updateProfile(
    values: UpdateProfilePayload,
  ): Promise<AuthUser> {
    if (!state.token) {
      throw new Error("Authentication required to update profile.");
    }
    if (profileSaveInFlight.current) throw new Error("An account update is already being saved. Please wait.");
    profileSaveInFlight.current = true;
    const token = state.token;
    try {
      const { user: updatedUser, sessionRevoked } = await updateUserProfile(values, token);
      if (activeToken.current !== token) throw new Error("Your session changed. Please sign in again.");
      if (sessionRevoked) { logout(); return updatedUser; }
      setState((prev) => prev.token === token ? { ...prev, user: updatedUser } : prev);
      return updatedUser;
    } catch (error) {
      if (activeToken.current === token && error instanceof AuthApiError && error.status === 401) {
        logout();
      }
      throw error;
    } finally {
      profileSaveInFlight.current = false;
    }
  }

  function logout() {
    loginChallenge.current = null;
    activeToken.current = null;
    setRestoreError(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ user: null, token: null, isLoading: false });
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        verifyLogin2FA,
        resendLogin2FA,
        register,
        updateProfile,
        logout,
      }}
    >
      {restoreError ? (
        <main role="alert" className="mx-auto max-w-lg p-8">
          <p>{restoreError}</p>
          <button type="button" onClick={() => { setState((prev) => ({ ...prev, isLoading: true })); setRestoreError(null); setRestoreAttempt((value) => value + 1); }}>Try again</button>
          <button type="button" onClick={logout}>Sign out</button>
        </main>
      ) : children}
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
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
