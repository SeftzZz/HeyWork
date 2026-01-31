import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export interface AuthData {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expired_at?: number;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string | null;
    photo?: string | null;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthStorage {

  private AUTH_KEY = 'auth';
  private LEGACY_TOKEN_KEY = 'token'; // 🔁 fallback lama

  /* =======================
   * SAVE
   * ======================= */
  async setAuth(data: AuthData) {
    await Preferences.set({
      key: this.AUTH_KEY,
      value: JSON.stringify(data)
    });

    // 🔥 cleanup token lama kalau ada
    await Preferences.remove({ key: this.LEGACY_TOKEN_KEY });
  }

  /* =======================
   * GET
   * ======================= */
  async getAuth(): Promise<AuthData | null> {
    try {
      const { value } = await Preferences.get({ key: this.AUTH_KEY });
      if (!value) return null;

      const auth = JSON.parse(value);
      if (!auth?.access_token) return null;

      return auth;
    } catch (e) {
      // ❌ data corrupt
      await this.clear();
      return null;
    }
  }

  async getToken(): Promise<string | null> {
    const auth = await this.getAuth();
    if (auth?.access_token) return auth.access_token;

    // 🔁 fallback token lama (biar tidak auto logout)
    const { value } = await Preferences.get({ key: this.LEGACY_TOKEN_KEY });
    return value || null;
  }

  async getUser() {
    const auth = await this.getAuth();
    return auth?.user || null;
  }

  /* =======================
   * REMOVE
   * ======================= */
  async clear() {
    await Preferences.remove({ key: this.AUTH_KEY });
    await Preferences.remove({ key: this.LEGACY_TOKEN_KEY });
    localStorage.removeItem('cache_attendances');
    localStorage.removeItem('cache_hotels');
    localStorage.removeItem('cache_jobs');
    localStorage.removeItem('cache_popular_jobs');
    localStorage.removeItem('cache_app_counts');
    localStorage.removeItem('cache_applications');
    localStorage.removeItem('selected_job');
  }

  async removeToken() {
    await Preferences.remove({ key: 'auth' });
  }

  /* =======================
   * STATUS
   * ======================= */
  async isLoggedIn(): Promise<boolean> {
    const auth = await this.getAuth();

    // ❌ tidak ada auth
    if (!auth?.access_token) return false;

    // ⏱️ cek expired
    if (auth.expired_at && Date.now() > auth.expired_at) {
      await this.clear();
      return false;
    }

    return true;
  }

  async isTokenExpired(): Promise<boolean> {
    const auth = await this.getAuth();
    if (!auth?.expired_at) return true;
    return Date.now() > auth.expired_at;
  }
}
