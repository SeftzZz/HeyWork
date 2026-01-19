import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthStorage, AuthData } from './auth-storage.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfileService {  

  constructor(
    private http: HttpClient,
    private auth: AuthStorage
  ) {}

  /* =======================
   * GET PROFILE
   * ======================= */
  async getProfile() {
    const token = await this.auth.getToken();
    if (!token) throw new Error('No auth token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return firstValueFrom(
      this.http.get(`${environment.api_url}/worker/profile`, { headers })
    );
  }

  /* =======================
   * UPDATE PROFILE (PUT)
   * ======================= */
  async updateProfile(payload: {
    name?: string;
    phone?: string;
    dob?: string;
    gender?: string;
  }) {
    const token = await this.auth.getToken();
    if (!token) throw new Error('No auth token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const res: any = await firstValueFrom(
      this.http.put(
        `${environment.api_url}/worker/profile`,
        payload,
        { headers }
      )
    );

    // 🔐 SINKRON KE LOCAL STORAGE (AuthStorage)
    const authData = await this.auth.getAuth();
    if (authData?.user) {
      const updatedAuth: AuthData = {
        ...authData,
        user: {
          ...authData.user,
          ...payload
        }
      };
      await this.auth.setAuth(updatedAuth);
    }

    return res;
  }

  /* =======================
   * UPLOAD FOTO PROFILE (NEW)
   * ======================= */
  async uploadPhoto(file: File) {
    const token = await this.auth.getToken();
    console.log('UPLOAD TOKEN:', token);

    if (!token) throw new Error('No auth token');

    const formData = new FormData();
    formData.append('photo', file);

    let headers = new HttpHeaders();
    headers = headers.set('Authorization', `Bearer ${token}`);

    const res: any = await firstValueFrom(
      this.http.post(
        `${environment.api_url}/worker/upload/photo`,
        formData,
        { headers }
      )
    );

    // 🔐 UPDATE FOTO DI LOCAL STORAGE
    if (res?.photo || res?.url) {
      const authData = await this.auth.getAuth();
      if (authData?.user) {
        const updatedAuth: AuthData = {
          ...authData,
          user: {
            ...authData.user,
            photo: res.photo ?? res.url
          }
        };
        await this.auth.setAuth(updatedAuth);
      }
    }

    return res;
  }
}
