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
} from "react";
import {
  loginUser,
  verifyLoginOtp,
  resendLoginOtp,
  registerClient,
  updateUserProfile,
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
  }): Promise<LoginResponse> {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await loginUser(values);
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
      const { user, token } = await verifyLoginOtp(values);
      setState({ user, token, isLoading: false });
      return user;
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw err;
    }
  }

  async function resendLogin2FA(email: string): Promise<SendOtpResponse> {
    return resendLoginOtp(email);
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
    const updatedUser = await updateUserProfile(values, state.token);
    setState((prev) => ({
      ...prev,
      user: {
        ...(prev.user || {}),
        ...updatedUser,
      },
    }));
    return updatedUser;
  }

  function logout() {
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
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
