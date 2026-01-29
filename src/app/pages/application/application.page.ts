import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

import { AuthStorage, AuthData } from '../../services/auth-storage.service';

@Component({
  selector: 'app-application',
  templateUrl: './application.page.html',
  styleUrls: ['./application.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ApplicationPage implements OnInit {

  applications: any[] = [];
  loading = false;

  constructor(
    private nav: NavController,
    private http: HttpClient,
    private authStorage: AuthStorage,
  ) {}

  ngOnInit() {
    this.loadApplications();
  }

  // ===============================
  // LOAD APPLICATION LIST
  // ===============================
  async loadApplications() {
    const cacheKey = 'cache_applications';

    // 1️⃣ cache dulu
    const cached = this.getCache<any[]>(cacheKey);
    if (cached && cached.length) {
      this.applications = this.resolveJobAndHotel(cached);
      return;
    }

    // 2️⃣ API
    try {
      this.loading = true;

      const token = await this.authStorage.getToken();
      if (!token) throw new Error('No auth token');

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      const data = await firstValueFrom(
        this.http.get<any[]>(
          `${environment.api_url}/worker/application-list`,
          { headers }
        )
      );

      const resolved = this.resolveJobAndHotel(data);

      this.setCache(cacheKey, resolved);
      this.applications = resolved;

    } catch (err) {
      console.error('Failed to load applications', err);
      this.applications = [];
    } finally {
      this.loading = false;
    }
  }

  // ===============================
  // RESOLVE JOB + HOTEL FROM CACHE
  // ===============================
  private resolveJobAndHotel(apps: any[]) {
    const jobs = this.getCache<any[]>('cache_jobs') || [];
    const hotels = this.getCache<any[]>('cache_hotels') || [];

    return apps.map(app => {
      const job = jobs.find(j => String(j.id) === String(app.job_id));
      const hotel = hotels.find(h => String(h.id) === String(job?.hotel_id));

      return {
        ...app,
        job: job || null,
        hotel: hotel || null
      };
    });
  }

  // ===============================
  // CACHE HELPERS
  // ===============================
  private getCache<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : null;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  private setCache<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // ===============================
  // NAVIGATION
  // ===============================
  goBack() {
    this.nav.back();
  }

  goJobDetail() {
    this.nav.navigateForward('/pages/job-detail');
  }

  goJobDetailId(job: any) {
    localStorage.setItem('selected_job', JSON.stringify(job));
    this.nav.navigateForward(`/pages/job-detail/${job.id}`);
  }

  goHome() {
    this.nav.navigateForward('/pages/home');
  }

  goApplication() {
    this.nav.navigateForward('/pages/application');
  }

  goMessage() {
    this.nav.navigateForward('/pages/message');
  }

  goProfile() {
    this.nav.navigateForward('/pages/profile');
  }

  // ❌ APPLY JOB TIDAK DIPAKAI LAGI DI PAGE INI
  goApplyJob() {
    this.nav.navigateForward('/pages/home');
  }
}
