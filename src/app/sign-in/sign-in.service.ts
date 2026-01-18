import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';

@Injectable({ providedIn: 'root' })
export class SignInService {

  API = 'http://heyworkapi.fpp/public/api/auth';

  constructor(private http: HttpClient) {}

  async login(data: any) {
    const res: any = await this.http
      .post(`${this.API}/login`, data)
      .toPromise();

    await Preferences.set({
      key: 'token',
      value: res.token
    });

    return res;
  }

  async loginWithGoogle() {
    const googleToken = 'GOOGLE_ID_TOKEN';

    const res: any = await this.http
      .post(`${this.API}/auth/google`, { token: googleToken })
      .toPromise();

    await Preferences.set({
      key: 'token',
      value: res.token
    });
  }

  async loginWithFacebook() {
    const fbToken = 'FACEBOOK_ACCESS_TOKEN';

    const res: any = await this.http
      .post(`${this.API}/auth/facebook`, { token: fbToken })
      .toPromise();

    await Preferences.set({
      key: 'token',
      value: res.token
    });

    return this.http.post('https://api.example.com/login/facebook', {});
  }
}
