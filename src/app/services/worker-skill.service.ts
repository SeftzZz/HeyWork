import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthStorage } from './auth-storage.service';

@Injectable({ providedIn: 'root' })
export class WorkerSkillService {

  constructor(
    private http: HttpClient,
    private auth: AuthStorage
  ) {}

  private async headers() {
    const token = await this.auth.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  async getAllSkills(): Promise<any[]> {
    const res: any = await this.http
      .get(`${environment.api_url}/worker/skills`, await this.headers())
      .toPromise();
    return res.data || [];
  }

  async getMySkills(): Promise<any[]> {
    const res: any = await this.http
      .get(`${environment.api_url}/worker/my-skills`, await this.headers())
      .toPromise();
    return res.data || [];
  }

  async saveSkills(skillIds: number[]): Promise<void> {
    await this.http.post(
      `${environment.api_url}/worker/skills`,
      { skill_ids: skillIds },
      await this.headers()
    ).toPromise();
  }
}
