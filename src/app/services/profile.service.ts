import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthStorage } from './auth-storage.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfileService {  

  constructor(
    private http: HttpClient,
    private auth: AuthStorage
  ) {}

  async getProfile() {
    const token = await this.auth.getToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return firstValueFrom(
      this.http.get(`${environment.api_url}/worker/profile`, { headers })
    );
  }
}
