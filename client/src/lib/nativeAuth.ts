import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const AUTH_TOKEN_KEY = "loretta_auth_token";

export const isNative = () => Capacitor.getPlatform() !== "web";

export async function getAuthToken(): Promise<string | null> {
  if (!isNative()) return null;
  try {
    const { value } = await Preferences.get({ key: AUTH_TOKEN_KEY });
    if (value === null || value === undefined) {
      console.log('[nativeAuth] TOKEN_GET_EMPTY: No auth token stored in Capacitor Preferences');
      return null;
    }
    if (typeof value !== 'string' || value.trim().length === 0) {
      console.warn(`[nativeAuth] TOKEN_GET_INVALID_TYPE: Stored token is not a valid string (type=${typeof value}, length=${String(value).length})`);
      return null;
    }
    return value;
  } catch (error: any) {
    const msg = error?.message || String(error);
    const code = error?.code || 'UNKNOWN';
    console.error(`[nativeAuth] TOKEN_GET_FAIL: Capacitor Preferences.get threw: code=${code} msg=${msg}`);
    console.error(`[nativeAuth] TOKEN_GET_FAIL_DETAIL: platform=${Capacitor.getPlatform()} native=${Capacitor.isNativePlatform()} key=${AUTH_TOKEN_KEY}`);
    return null;
  }
}

export async function setAuthToken(token: string): Promise<void> {
  if (!isNative()) return;
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    const errMsg = `TOKEN_SET_INVALID_INPUT: Cannot store empty/invalid token (type=${typeof token}, length=${token?.length || 0})`;
    console.error(`[nativeAuth] ${errMsg}`);
    throw new Error(errMsg);
  }
  try {
    await Preferences.set({ key: AUTH_TOKEN_KEY, value: token });
    console.log(`[nativeAuth] TOKEN_SET_OK: Auth token stored successfully (length=${token.length})`);
  } catch (error: any) {
    const msg = error?.message || String(error);
    const code = error?.code || 'UNKNOWN';
    const errMsg = `TOKEN_SET_FAIL: Capacitor Preferences.set threw: code=${code} msg=${msg} platform=${Capacitor.getPlatform()} tokenLength=${token.length}`;
    console.error(`[nativeAuth] ${errMsg}`);
    throw new Error(errMsg);
  }
  try {
    const verify = await Preferences.get({ key: AUTH_TOKEN_KEY });
    if (verify.value !== token) {
      const errMsg = `TOKEN_SET_VERIFY_FAIL: Token readback mismatch after write (written=${token.length} chars, readback=${verify.value?.length || 'null'} chars)`;
      console.error(`[nativeAuth] ${errMsg}`);
      throw new Error(errMsg);
    }
  } catch (verifyError: any) {
    if (verifyError?.message?.startsWith('TOKEN_SET_VERIFY_FAIL')) throw verifyError;
    console.warn(`[nativeAuth] TOKEN_SET_VERIFY_READ_FAIL: Could not verify token was written: ${verifyError?.message || verifyError}`);
  }
}

export async function clearAuthToken(): Promise<void> {
  if (!isNative()) return;
  try {
    await Preferences.remove({ key: AUTH_TOKEN_KEY });
    console.log('[nativeAuth] TOKEN_CLEAR_OK: Auth token removed from Capacitor Preferences');
  } catch (error: any) {
    const msg = error?.message || String(error);
    const code = error?.code || 'UNKNOWN';
    const errMsg = `TOKEN_CLEAR_FAIL: Capacitor Preferences.remove threw: code=${code} msg=${msg} platform=${Capacitor.getPlatform()}`;
    console.error(`[nativeAuth] ${errMsg}`);
    throw new Error(errMsg);
  }
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const token = await getAuthToken();
    if (token) {
      return { "X-Auth-Token": token };
    }
  } catch (error: any) {
    console.error(`[nativeAuth] AUTH_HEADERS_FAIL: Could not retrieve auth token for headers: ${error?.message || error}`);
  }
  return {};
}
