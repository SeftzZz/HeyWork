import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthStorage } from '../../services/auth-storage.service';

@Component({
  selector: 'app-attendace',
  templateUrl: './attendace.page.html',
  styleUrls: ['./attendace.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class AttendacePage implements OnInit {

  attendances: any[] = [];
  loading = false;
  attendanceGroups: any[] = [];

  constructor(
    private nav: NavController,
    private http: HttpClient,
    private authStorage: AuthStorage
  ) {}

  async ngOnInit() {
    await this.loadAttendances();
  }

  // ===============================
  // LOAD ATTENDANCE LIST
  // ===============================
  async loadAttendances() {
    const cacheKey = 'cache_attendances';

    // 1️⃣ CACHE FIRST
    const cached = this.getCache<any[]>(cacheKey);
    if (cached && cached.length) {
      this.attendances = cached;
      this.groupAttendances(); // 🔥 WAJIB
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
          `${environment.api_url}/worker/attendance`,
          { headers }
        )
      );

      this.attendances = data || [];
      this.groupAttendances(); // 🔥 WAJIB
      this.setCache(cacheKey, this.attendances);

    } catch (err) {
      console.error('Failed to load attendances', err);
      this.attendances = [];
      this.attendanceGroups = [];
    } finally {
      this.loading = false;
    }
  }

  getLateMinutes(row: any): number {
    if (row.type !== 'checkin') return 0;

    const jobs = this.getCache<any[]>('cache_jobs') || [];
    const job = jobs.find(j => String(j.id) === String(row.job_id));

    if (!job || !job.start_time || job.start_time === '00:00:00') {
      return 0;
    }

    const checkin = new Date(row.created_at);
    const jobDate = row.created_at.substring(0, 10);
    const start = new Date(`${jobDate}T${job.start_time}`);

    const diff = Math.floor((checkin.getTime() - start.getTime()) / 60000);
    return diff > 0 ? diff : 0;
  }

  groupAttendances() {
    const jobs = this.getCache<any[]>('cache_jobs') || [];

    const map: Record<string, any> = {};

    for (const row of this.attendances) {
      const date = row.created_at.substring(0, 10);
      const key = `${row.job_id}_${date}`;

      if (!map[key]) {
        const job = jobs.find(j => String(j.id) === String(row.job_id));

        map[key] = {
          job_id: row.job_id,
          date,
          position: row.position,
          hotel_name: row.hotel_name,
          job_date_start: row.job_date_start,
          job_date_end: row.job_date_end,
          start_time: job?.start_time,
          checkin: null,
          checkout: null
        };
      }

      if (row.type === 'checkin') {
        map[key].checkin = row;
      }

      if (row.type === 'checkout') {
        map[key].checkout = row;
      }
    }

    this.attendanceGroups = Object.values(map);
  }

  getLateMinutesFromGroup(group: any): number {
    if (!group.checkin || !group.start_time) return 0;

    const checkinTime = new Date(group.checkin.created_at);
    const start = new Date(`${group.date}T${group.start_time}`);

    const diff = Math.floor((checkinTime.getTime() - start.getTime()) / 60000);
    return diff > 0 ? diff : 0;
  }

  // ===============================
  // HELPERS
  // ===============================
  isCheckIn(row: any) {
    return row.type === 'checkin';
  }

  isCheckOut(row: any) {
    return row.type === 'checkout';
  }

  formatTime(datetime?: string) {
    if (!datetime) return '-';
    return datetime.substring(11, 16); // HH:mm
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
