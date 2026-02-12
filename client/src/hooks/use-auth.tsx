import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient, safeParseJSON, classifyAppError, isNativePlatform } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { trackAuth, identifyUser } from "@/lib/clarity";
import { setAuthToken, clearAuthToken } from "@/lib/nativeAuth";

type AuthResponse = { user: SelectUser; authToken?: string };

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<AuthResponse, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<AuthResponse, Error, InsertUser>;
};

type LoginData = { identifier: string; password: string };

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      const parsed = await safeParseJSON<AuthResponse>(res, 'login');
      if (!parsed.ok) {
        console.error(`[Auth:login] ${parsed.errorCode}: ${parsed.errorDesc}`);
        throw new Error(`${parsed.errorCode}: ${parsed.errorDesc}`);
      }
      if (!parsed.data?.user) {
        console.error('[Auth:login] APP_LOGIN_NO_USER_RETURNED: response missing user object');
        throw new Error('APP_LOGIN_NO_USER_RETURNED: Login response is missing user data');
      }
      if (isNativePlatform() && !parsed.data.authToken) {
        console.warn('[Auth:login] APP_LOGIN_NO_TOKEN_RETURNED: native platform but no authToken in response');
      }
      return parsed.data;
    },
    onSuccess: async (data: AuthResponse) => {
      const user = data.user;
      if (data.authToken) {
        try {
          await setAuthToken(data.authToken);
        } catch (tokenError: any) {
          console.error(`[Auth:login] APP_LOGIN_TOKEN_STORE_FAILED: ${tokenError?.message || tokenError}`);
          toast({
            title: "Warning",
            description: "Logged in but couldn't save your session. You may need to log in again later.",
            variant: "destructive",
          });
        }
      }
      localStorage.removeItem('loretta_profile');
      localStorage.removeItem('loretta_questionnaire_answers');
      localStorage.removeItem('loretta_questionnaire');
      localStorage.removeItem('loretta_risk_score');
      localStorage.removeItem('loretta_user');
      localStorage.removeItem('loretta_invite');
      localStorage.removeItem('loretta_pending_invite');
      localStorage.removeItem('loretta_pending_friend_invite');
      
      queryClient.clear();
      queryClient.setQueryData(["/api/user"], user);
      trackAuth('login');
      identifyUser(String(user.id), { username: user.username });
      toast({
        title: "Welcome back!",
        description: `You're now logged in as ${user.username}`,
      });
    },
    onError: (error: Error) => {
      const errorMsg = error.message;
      console.error(`[Auth:login] Error: ${errorMsg}`);

      let userMessage = errorMsg;
      if (errorMsg.startsWith('APP_')) {
        userMessage = errorMsg.substring(errorMsg.indexOf(':') + 2) || errorMsg;
      }
      try {
        const parsed = JSON.parse(errorMsg);
        if (parsed.message) {
          const classified = classifyAppError('login', parsed.status || 401, parsed.message);
          userMessage = classified.desc;
          console.error(`[Auth:login] Classified: ${classified.code}`);
        }
      } catch {
        if (!errorMsg.startsWith('APP_') && !errorMsg.startsWith('Network Error')) {
          const statusMatch = errorMsg.match(/^(\d{3}):/);
          if (statusMatch) {
            const status = parseInt(statusMatch[1], 10);
            const classified = classifyAppError('login', status, errorMsg);
            userMessage = classified.desc;
            console.error(`[Auth:login] Classified: ${classified.code}`);
          }
        }
      }

      toast({
        title: "Login failed",
        description: userMessage,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      const parsed = await safeParseJSON<AuthResponse>(res, 'register');
      if (!parsed.ok) {
        console.error(`[Auth:register] ${parsed.errorCode}: ${parsed.errorDesc}`);
        throw new Error(`${parsed.errorCode}: ${parsed.errorDesc}`);
      }
      if (!parsed.data?.user) {
        console.error('[Auth:register] APP_REGISTER_NO_USER: response missing user object');
        throw new Error('APP_REGISTER_NO_USER: Registration response is missing user data');
      }
      return parsed.data;
    },
    onSuccess: async (data: AuthResponse) => {
      const user = data.user;
      if (data.authToken) {
        try {
          await setAuthToken(data.authToken);
        } catch (tokenError: any) {
          console.error(`[Auth:register] APP_REGISTER_TOKEN_STORE_FAILED: ${tokenError?.message || tokenError}`);
          toast({
            title: "Warning",
            description: "Account created but couldn't save your session. You may need to log in again later.",
            variant: "destructive",
          });
        }
      }
      localStorage.removeItem('loretta_profile');
      localStorage.removeItem('loretta_questionnaire_answers');
      localStorage.removeItem('loretta_questionnaire');
      localStorage.removeItem('loretta_risk_score');
      localStorage.removeItem('loretta_user');
      localStorage.removeItem('loretta_invite');
      localStorage.removeItem('loretta_pending_invite');
      localStorage.removeItem('loretta_pending_friend_invite');
      
      queryClient.clear();
      queryClient.setQueryData(["/api/user"], user);
      trackAuth('signup');
      identifyUser(String(user.id), { username: user.username });
      toast({
        title: "Account created!",
        description: `Welcome to Loretta, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      const errorMsg = error.message;
      console.error(`[Auth:register] Error: ${errorMsg}`);

      let userMessage = errorMsg;
      if (errorMsg.startsWith('APP_')) {
        userMessage = errorMsg.substring(errorMsg.indexOf(':') + 2) || errorMsg;
      }
      try {
        const parsed = JSON.parse(errorMsg);
        if (parsed.message) {
          const classified = classifyAppError('register', parsed.status || 400, parsed.message);
          userMessage = classified.desc;
          console.error(`[Auth:register] Classified: ${classified.code}`);
        }
      } catch {
        if (!errorMsg.startsWith('APP_') && !errorMsg.startsWith('Network Error')) {
          const statusMatch = errorMsg.match(/^(\d{3}):/);
          if (statusMatch) {
            const status = parseInt(statusMatch[1], 10);
            const classified = classifyAppError('register', status, errorMsg);
            userMessage = classified.desc;
            console.error(`[Auth:register] Classified: ${classified.code}`);
          }
        }
      }

      toast({
        title: "Registration failed",
        description: userMessage,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Clear user-specific localStorage before logout (while we still have the user ID)
      if (user?.id) {
        const userId = user.id;
        localStorage.removeItem(`loretta_profile_${userId}`);
        localStorage.removeItem(`loretta_questionnaire_answers_${userId}`);
        localStorage.removeItem(`loretta_questionnaire_${userId}`);
        localStorage.removeItem(`loretta_risk_score_${userId}`);
      }
      // Also clear legacy non-user-specific keys and session-related data
      localStorage.removeItem('loretta_profile');
      localStorage.removeItem('loretta_questionnaire_answers');
      localStorage.removeItem('loretta_questionnaire');
      localStorage.removeItem('loretta_risk_score');
      localStorage.removeItem('loretta_user');
      localStorage.removeItem('loretta_invite');
      localStorage.removeItem('loretta_pending_invite');
      localStorage.removeItem('loretta_pending_friend_invite');
      
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: async () => {
      try {
        await clearAuthToken();
      } catch (clearError: any) {
        console.error(`[Auth:logout] APP_AUTH_TOKEN_CLEAR_FAILED: ${clearError?.message || clearError}`);
      }
      queryClient.clear();
      trackAuth('logout');
      toast({
        title: "Signed out",
        description: "You've been logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
