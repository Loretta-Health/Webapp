import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const AUTH_TOKEN_KEY = "loretta_auth_token";

export const isNative = () => Capacitor.getPlatform() !== "web";

export async function getAuthToken(): Promise<string | null> {
  if (!isNative()) return null;
  const { value } = await Preferences.get({ key: AUTH_TOKEN_KEY });
  return value;
}

export async function setAuthToken(token: string): Promise<void> {
  if (!isNative()) return;
  await Preferences.set({ key: AUTH_TOKEN_KEY, value: token });
}

export async function clearAuthToken(): Promise<void> {
  if (!isNative()) return;
  await Preferences.remove({ key: AUTH_TOKEN_KEY });
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  if (token) {
    return { "X-Auth-Token": token };
  }
  return {};
}
