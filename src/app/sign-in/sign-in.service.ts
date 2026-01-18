import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SignInService {

  constructor(private http: HttpClient) {}

  async login(data: any) {
    const res: any = await this.http
      .post(`${environment.api_url}/authLogin`, data)
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
}
