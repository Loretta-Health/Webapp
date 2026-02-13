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
      console.log(`[Auth:login] LOGIN_MUTATION_START: identifier=${credentials.identifier} | isNative=${isNativePlatform()}`);
      
      let res: Response;
      try {
        res = await apiRequest("POST", "/api/login", credentials);
      } catch (reqErr: any) {
        const reqMsg = reqErr?.message || String(reqErr);
        console.error(`[Auth:login] LOGIN_API_REQUEST_THREW: apiRequest threw during login: ${reqMsg}`);
        if (reqMsg.includes('IOS_ALL_TIERS_EXHAUSTED')) {
          console.error(`[Auth:login] LOGIN_ALL_TIERS_FAILED: All iOS networking tiers failed during login`);
        } else if (reqMsg.includes('IOS_API_REQ_NETWORK_FAIL')) {
          console.error(`[Auth:login] LOGIN_NETWORK_FAIL: Network-level failure during login request`);
        }
        throw reqErr;
      }
      
      console.log(`[Auth:login] LOGIN_RESPONSE_RECEIVED: status=${res.status} ok=${res.ok}`);
      
      const parsed = await safeParseJSON<AuthResponse>(res, 'login');
      if (!parsed.ok) {
        console.error(`[Auth:login] LOGIN_PARSE_FAIL: errorCode=${parsed.errorCode} | desc=${parsed.errorDesc} | rawText=${parsed.rawText?.substring(0, 200)}`);
        if (parsed.errorCode === 'BODY_ALREADY_CONSUMED') {
          console.error(`[Auth:login] LOGIN_BODY_DOUBLE_READ: Response body was already consumed before safeParseJSON - this is a code bug`);
        } else if (parsed.errorCode === 'APP_API_RESPONSE_EMPTY') {
          console.error(`[Auth:login] LOGIN_EMPTY_BODY: Server returned empty body with status=${res.status}`);
        } else if (parsed.errorCode === 'APP_API_RESPONSE_NOT_JSON') {
          console.error(`[Auth:login] LOGIN_HTML_RESPONSE: Server returned HTML instead of JSON (possible proxy/CDN error)`);
        } else if (parsed.errorCode === 'JSON_TRUNCATED') {
          console.error(`[Auth:login] LOGIN_TRUNCATED_RESPONSE: JSON response was truncated mid-transfer`);
        }
        throw new Error(`${parsed.errorCode}: ${parsed.errorDesc}`);
      }
      
      if (!parsed.data) {
        console.error(`[Auth:login] LOGIN_DATA_NULL: safeParseJSON returned ok=true but data is null/undefined`);
        throw new Error('LOGIN_DATA_NULL: Login response parsed successfully but contained no data');
      }
      
      if (!parsed.data.user) {
        console.error(`[Auth:login] LOGIN_NO_USER: Response JSON has no 'user' field. Keys present: ${Object.keys(parsed.data).join(',')}`);
        throw new Error('LOGIN_NO_USER: Login response is missing user data');
      }
      
      if (!parsed.data.user.id) {
        console.error(`[Auth:login] LOGIN_USER_NO_ID: User object exists but has no 'id'. User keys: ${Object.keys(parsed.data.user).join(',')}`);
        throw new Error('LOGIN_USER_NO_ID: Login response user has no ID');
      }
      
      if (isNativePlatform()) {
        if (!parsed.data.authToken) {
          console.error(`[Auth:login] LOGIN_NO_TOKEN_NATIVE: Native platform login succeeded but server did not return authToken. Response keys: ${Object.keys(parsed.data).join(',')}`);
        } else {
          console.log(`[Auth:login] LOGIN_TOKEN_RECEIVED: authToken received (length=${parsed.data.authToken.length})`);
        }
      }
      
      console.log(`[Auth:login] LOGIN_MUTATION_OK: user=${parsed.data.user.username} id=${parsed.data.user.id} hasToken=${!!parsed.data.authToken}`);
      return parsed.data;
    },
    onSuccess: async (data: AuthResponse) => {
      const user = data.user;
      if (data.authToken) {
        try {
          await setAuthToken(data.authToken);
          console.log(`[Auth:login] LOGIN_TOKEN_STORED: Auth token stored successfully`);
        } catch (tokenError: any) {
          console.error(`[Auth:login] LOGIN_TOKEN_STORE_FAIL: Could not store auth token: ${tokenError?.message || tokenError}`);
          toast({
            title: "Warning",
            description: "Logged in but couldn't save your session. You may need to log in again later.",
            variant: "destructive",
          });
        }
      } else if (isNativePlatform()) {
        console.warn(`[Auth:login] LOGIN_SUCCESS_NO_TOKEN: Login succeeded on native but no authToken to store`);
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
      console.log(`[Auth:login] LOGIN_COMPLETE: All post-login steps finished for user=${user.username}`);
      toast({
        title: "Welcome back!",
        description: `You're now logged in as ${user.username}`,
      });
    },
    onError: (error: Error) => {
      const errorMsg = error.message;
      console.error(`[Auth:login] LOGIN_ERROR_HANDLER: ${errorMsg}`);

      let userMessage = errorMsg;
      if (errorMsg.startsWith('APP_') || errorMsg.startsWith('LOGIN_') || errorMsg.startsWith('IOS_')) {
        userMessage = errorMsg.substring(errorMsg.indexOf(':') + 2) || errorMsg;
      }
      try {
        const parsed = JSON.parse(errorMsg);
        if (parsed.message) {
          const classified = classifyAppError('login', parsed.status || 401, parsed.message);
          userMessage = classified.desc;
          console.error(`[Auth:login] LOGIN_ERROR_CLASSIFIED: ${classified.code} -> ${classified.desc}`);
        }
      } catch {
        if (!errorMsg.startsWith('APP_') && !errorMsg.startsWith('LOGIN_') && !errorMsg.startsWith('IOS_') && !errorMsg.startsWith('Network Error')) {
          const statusMatch = errorMsg.match(/^(\d{3}):/);
          if (statusMatch) {
            const status = parseInt(statusMatch[1], 10);
            const classified = classifyAppError('login', status, errorMsg);
            userMessage = classified.desc;
            console.error(`[Auth:login] LOGIN_ERROR_CLASSIFIED_STATUS: ${classified.code} (HTTP ${status})`);
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
      console.log(`[Auth:register] REGISTER_MUTATION_START: email=${credentials.email} | isNative=${isNativePlatform()}`);
      
      let res: Response;
      try {
        res = await apiRequest("POST", "/api/register", credentials);
      } catch (reqErr: any) {
        const reqMsg = reqErr?.message || String(reqErr);
        console.error(`[Auth:register] REGISTER_API_REQUEST_THREW: apiRequest threw during registration: ${reqMsg}`);
        if (reqMsg.includes('IOS_ALL_TIERS_EXHAUSTED')) {
          console.error(`[Auth:register] REGISTER_ALL_TIERS_FAILED: All iOS networking tiers failed during registration`);
        } else if (reqMsg.includes('IOS_API_REQ_NETWORK_FAIL')) {
          console.error(`[Auth:register] REGISTER_NETWORK_FAIL: Network-level failure during registration request`);
        }
        throw reqErr;
      }
      
      console.log(`[Auth:register] REGISTER_RESPONSE_RECEIVED: status=${res.status} ok=${res.ok}`);
      
      const parsed = await safeParseJSON<AuthResponse>(res, 'register');
      if (!parsed.ok) {
        console.error(`[Auth:register] REGISTER_PARSE_FAIL: errorCode=${parsed.errorCode} | desc=${parsed.errorDesc} | rawText=${parsed.rawText?.substring(0, 200)}`);
        if (parsed.errorCode === 'BODY_ALREADY_CONSUMED') {
          console.error(`[Auth:register] REGISTER_BODY_DOUBLE_READ: Response body was already consumed before safeParseJSON - this is a code bug`);
        } else if (parsed.errorCode === 'APP_API_RESPONSE_EMPTY') {
          console.error(`[Auth:register] REGISTER_EMPTY_BODY: Server returned empty body with status=${res.status}`);
        } else if (parsed.errorCode === 'APP_API_RESPONSE_NOT_JSON') {
          console.error(`[Auth:register] REGISTER_HTML_RESPONSE: Server returned HTML instead of JSON (possible proxy/CDN error)`);
        }
        throw new Error(`${parsed.errorCode}: ${parsed.errorDesc}`);
      }
      
      if (!parsed.data) {
        console.error(`[Auth:register] REGISTER_DATA_NULL: safeParseJSON returned ok=true but data is null/undefined`);
        throw new Error('REGISTER_DATA_NULL: Registration response parsed successfully but contained no data');
      }
      
      if (!parsed.data.user) {
        console.error(`[Auth:register] REGISTER_NO_USER: Response JSON has no 'user' field. Keys present: ${Object.keys(parsed.data).join(',')}`);
        throw new Error('REGISTER_NO_USER: Registration response is missing user data');
      }
      
      if (!parsed.data.user.id) {
        console.error(`[Auth:register] REGISTER_USER_NO_ID: User object exists but has no 'id'. User keys: ${Object.keys(parsed.data.user).join(',')}`);
        throw new Error('REGISTER_USER_NO_ID: Registration response user has no ID');
      }
      
      if (isNativePlatform()) {
        if (!parsed.data.authToken) {
          console.error(`[Auth:register] REGISTER_NO_TOKEN_NATIVE: Native platform registration succeeded but server did not return authToken. Response keys: ${Object.keys(parsed.data).join(',')}`);
        } else {
          console.log(`[Auth:register] REGISTER_TOKEN_RECEIVED: authToken received (length=${parsed.data.authToken.length})`);
        }
      }
      
      console.log(`[Auth:register] REGISTER_MUTATION_OK: user=${parsed.data.user.username} id=${parsed.data.user.id} hasToken=${!!parsed.data.authToken}`);
      return parsed.data;
    },
    onSuccess: async (data: AuthResponse) => {
      const user = data.user;
      if (data.authToken) {
        try {
          await setAuthToken(data.authToken);
          console.log(`[Auth:register] REGISTER_TOKEN_STORED: Auth token stored successfully`);
        } catch (tokenError: any) {
          console.error(`[Auth:register] REGISTER_TOKEN_STORE_FAIL: Could not store auth token: ${tokenError?.message || tokenError}`);
          toast({
            title: "Warning",
            description: "Account created but couldn't save your session. You may need to log in again later.",
            variant: "destructive",
          });
        }
      } else if (isNativePlatform()) {
        console.warn(`[Auth:register] REGISTER_SUCCESS_NO_TOKEN: Registration succeeded on native but no authToken to store`);
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
      console.log(`[Auth:register] REGISTER_COMPLETE: All post-registration steps finished for user=${user.username}`);
      toast({
        title: "Account created!",
        description: `Welcome to Loretta, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      const errorMsg = error.message;
      console.error(`[Auth:register] REGISTER_ERROR_HANDLER: ${errorMsg}`);

      let userMessage = errorMsg;
      if (errorMsg.startsWith('APP_') || errorMsg.startsWith('REGISTER_') || errorMsg.startsWith('IOS_')) {
        userMessage = errorMsg.substring(errorMsg.indexOf(':') + 2) || errorMsg;
      }
      try {
        const parsed = JSON.parse(errorMsg);
        if (parsed.message) {
          const classified = classifyAppError('register', parsed.status || 400, parsed.message);
          userMessage = classified.desc;
          console.error(`[Auth:register] REGISTER_ERROR_CLASSIFIED: ${classified.code} -> ${classified.desc}`);
        }
      } catch {
        if (!errorMsg.startsWith('APP_') && !errorMsg.startsWith('REGISTER_') && !errorMsg.startsWith('IOS_') && !errorMsg.startsWith('Network Error')) {
          const statusMatch = errorMsg.match(/^(\d{3}):/);
          if (statusMatch) {
            const status = parseInt(statusMatch[1], 10);
            const classified = classifyAppError('register', status, errorMsg);
            userMessage = classified.desc;
            console.error(`[Auth:register] REGISTER_ERROR_CLASSIFIED_STATUS: ${classified.code} (HTTP ${status})`);
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
