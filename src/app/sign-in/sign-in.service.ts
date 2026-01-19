import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../../environments/environment';

import { AuthStorage } from '../services/auth-storage.service';

@Injectable({ providedIn: 'root' })
export class SignInService {

  constructor(
    private http: HttpClient,
    private auth: AuthStorage,
  ) {}

  async login(data: any) {
    const res: any = await this.http
      .post(`${environment.api_url}/auth/login`, data)
      .toPromise();

    const { password, ...safeUser } = res.user;

    await this.auth.setAuth({
      access_token: res.access_token,
      refresh_token: res.refresh_token,
      expires_in: res.expires_in,
      expired_at: Date.now() + res.expires_in * 1000,
      user: safeUser
    });

    return res;
  }

  async loginWithGoogle() {
    const googleToken = '983670743819-kl45cfchuev92q8tp8i7shdf56jup8gk.apps.googleusercontent.com';

    const res: any = await this.http
      .post(`${environment.api_url}/auth/google`, { token: googleToken })
      .toPromise();

    await Preferences.set({
      key: 'token',
      value: res.token
    });
  }

  async loginWithFacebook() {
    const fbToken = 'FACEBOOK_ACCESS_TOKEN';

    const res: any = await this.http
      .post(`${environment.api_url}/auth/facebook`, { token: fbToken })
      .toPromise();

    await Preferences.set({
      key: 'token',
      value: res.token
    });

    return this.http.post('https://api.example.com/login/facebook', {});
  }

  register(data: { name: string; email: string; password: string }) {
    return this.http.post(
      `${environment.api_url}/auth/register`,
      data
    ).toPromise();
  }

}
