import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
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
      return await res.json();
    },
    onSuccess: async (data: AuthResponse) => {
      const user = data.user;
      if (data.authToken) {
        await setAuthToken(data.authToken);
      }
      // Clear any stale localStorage from previous users on this device
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
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: async (data: AuthResponse) => {
      const user = data.user;
      if (data.authToken) {
        await setAuthToken(data.authToken);
      }
      // Clear legacy localStorage keys after registration - registration data is now on server
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
      toast({
        title: "Registration failed",
        description: error.message,
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
      await clearAuthToken();
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
