import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthStorage } from './auth-storage.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProfileService {

  API = 'http://heyworkapi.fpp/public/api';

  constructor(
    private http: HttpClient,
    private auth: AuthStorage
  ) {}

  async getProfile() {
    const token = await this.auth.getToken();
    
    console.log(token);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return firstValueFrom(
      this.http.get(`${this.API}/worker/profile`, { headers })
    );
  }
}
