import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonModal} from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { Title } from '@angular/platform-browser';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AuthStorage, AuthData } from '../../services/auth-storage.service';
import { ProfileService } from '../../services/profile.service';
import { environment } from '../../../environments/environment';
import { WsService } from '../../services/ws.service';

declare const initAllSwipers: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonModal,
    CommonModule,
    FormsModule
  ]
})
export class HomePage implements OnInit {

  showSidebar = false;
  user: any = null;
  greeting: string = '';
  photoPreview: string | null = null;
  public auth!: AuthData;

  // =========================
  // 🌙 DARK MODE STATE
  // =========================
  isDarkMode = false;
  jobs: any[] = [];
  popular_jobs: any[] = [];

  pendingCount = 0;
  acceptedCount = 0;
  completedCount = 0;
  avatarUrl = 'assets/images/avt/avt-1.jpg';

  constructor(
    private nav: NavController,
    private authStorage: AuthStorage,
    private profileService: ProfileService,
    private title: Title,
    private http: HttpClient,
    private ws: WsService
  ) {}

  initWebSocket() {
    this.ws.connect((event) => {

      switch (event.type) {

        case 'connected':
          console.log('[WS] handshake OK:', event.message);
          break;

        case 'jobs_updated': {
          const ts = Date.now();

          const jobs = (event.data || []).map((job: any) => ({
            ...job,
            hotel_logo: job.hotel_logo
              ? `${environment.base_url}/${job.hotel_logo}?t=${ts}`
              : 'assets/images/jobs/default.png'
          }));

          localStorage.setItem('cache_jobs', JSON.stringify(jobs));
          this.jobs = jobs;
          break;
        }

        case 'application_counts_updated':
          localStorage.setItem('cache_app_counts', JSON.stringify(event.data));

          this.animateCount(event.data.pending   || 0, v => this.pendingCount = v);
          this.animateCount(event.data.accepted  || 0, v => this.acceptedCount = v);
          this.animateCount(event.data.completed || 0, v => this.completedCount = v);
          break;

        case 'most_popular_jobs_updated': {
          const ts = Date.now();

          const jobs = (event.data || []).map((job: any) => ({
            ...job,
            hotel_logo: job.hotel_logo
              ? `${environment.base_url}/${job.hotel_logo}?t=${ts}`
              : 'assets/images/jobs/default.png'
          }));

          localStorage.setItem('cache_popular_jobs', JSON.stringify(jobs));
          this.popular_jobs = jobs;
          break;
        }

        default:
          console.log('[WS] unknown event', event);
      }
    });
  }

  setGreeting() {
    const now = new Date();

    // WIB = UTC + 7
    const jakartaHour = now.getUTCHours() + 7;

    if (jakartaHour >= 5 && jakartaHour < 12) {
      this.greeting = 'Good morning';
    } else if (jakartaHour >= 12 && jakartaHour < 18) {
      this.greeting = 'Good day';
    } else {
      this.greeting = 'Good evening';
    }
  }

  async ngOnInit() {
    this.title.setTitle('Home | Hey! Work');

    // =========================
    // INIT DARK MODE
    // =========================
    this.initDarkMode();

    const loggedIn = await this.authStorage.isLoggedIn();
    if (!loggedIn) {
      this.nav.navigateRoot('/sign-in');
      return;
    }

    // =========================
    // SET GREETING (WIB)
    // =========================
    this.setGreeting();

    await this.loadProfile();
    this.jobs = await this.getJobs();
    await this.loadMostPopularJobs();
  }

  ionViewDidEnter() {
    this.initWebSocket();
    this.loadApplicationCounts();

    setTimeout(() => {
      if (typeof initAllSwipers === 'function') {
        initAllSwipers();
      }
    }, 50);
  }

  // =========================
  // 🌙 DARK MODE HANDLER
  // =========================
  initDarkMode() {
    const html = document.documentElement;
    const theme = localStorage.getItem('toggled');

    this.isDarkMode = theme === 'dark-theme';
    html.classList.toggle('dark-theme', this.isDarkMode);
  }

  toggleDarkMode() {
    const html = document.documentElement;

    html.classList.toggle('dark-theme', this.isDarkMode);

    localStorage.setItem(
      'toggled',
      this.isDarkMode ? 'dark-theme' : 'light-theme'
    );
  }

  // =========================
  // PROFILE & NAV
  // =========================
  async loadProfile() {
    try {
      const auth = await this.authStorage.getAuth();
      if (!auth) throw new Error();

      this.auth = auth;
      this.user = auth.user;

      if (auth?.user?.photo) {
        this.avatarUrl =
          `${environment.base_url}/${auth.user.photo}?t=${Date.now()}`;
      }

    } catch {
      await this.authStorage.removeToken();
      this.nav.navigateRoot('/sign-in');
    }
  }

  openSidebar() {
    this.showSidebar = true;
  }

  closeSidebar() {
    this.showSidebar = false;
  }

  goAllJobs() {
    this.nav.navigateForward('/pages/all-jobs');
  }

  goJobDetail() {
    this.nav.navigateForward('/pages/job-detail');
  }

  goApplyJob() {
    this.nav.navigateForward('/pages/apply-job');
  }

  async confirmLogout() {
    const confirm = window.confirm('Yakin ingin keluar?');
    if (confirm) {
      await this.logout();
    }
  }

  async logout() {
    this.showSidebar = false;
    localStorage.removeItem('cache_jobs');
    localStorage.removeItem('cache_app_counts');
    this.ws.disconnect();
    await this.authStorage.removeToken();
    this.nav.navigateRoot('/sign-in');
  }

  goApplication() {
    this.nav.navigateForward('/pages/application');
  }

  goHome() {
    this.nav.navigateForward('/pages/home');
  }

  goMessage() {
    this.nav.navigateForward('/pages/message');
  }

  goProfile() {
    this.showSidebar = false;
    this.nav.navigateForward('/pages/profile');
  }

  async getJobs() {
    const cacheKey = 'cache_jobs';

    // 1️⃣ ambil dari localStorage dulu
    const cached = this.getCache<any[]>(cacheKey);
    if (cached && cached.length) {
      return cached;
    }

    // 2️⃣ kalau belum ada → call API
    try {
      const token = await this.authStorage.getToken();
      if (!token) throw new Error('No auth token');

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      const jobs = await firstValueFrom(
        this.http.get<any[]>(`${environment.api_url}/worker/jobs`, { headers })
      );

      const ts = Date.now();
      const mapped = jobs.map(job => ({
        ...job,
        hotel_logo: job.hotel_logo
          ? `${environment.base_url}/${job.hotel_logo}?t=${ts}`
          : 'assets/images/jobs/default.png'
      }));

      // 💾 simpan ke localStorage
      this.setCache(cacheKey, mapped);

      return mapped;

    } catch (err) {
      console.error('Failed to load jobs', err);
      return [];
    }
  }


  truncate27(text?: string, limit = 27): string {
    if (!text) return '-';
    return text.length > limit
      ? text.slice(0, limit) + '...'
      : text;
  }

  truncate15(text?: string, limit = 15): string {
    if (!text) return '-';
    return text.length > limit
      ? text.slice(0, limit) + '...'
      : text;
  }

  async loadApplicationCounts() {
    const cacheKey = 'cache_app_counts';

    // 1️⃣ ambil dari cache
    const cached = this.getCache<any>(cacheKey);
    if (cached) {
      this.animateCount(cached.pending   || 0, v => this.pendingCount = v);
      this.animateCount(cached.accepted  || 0, v => this.acceptedCount = v);
      this.animateCount(cached.completed || 0, v => this.completedCount = v);
      return;
    }

    // 2️⃣ call API kalau belum ada
    try {
      const token = await this.authStorage.getToken();
      if (!token) throw new Error();

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      const res = await firstValueFrom(
        this.http.get<any>(
          `${environment.api_url}/worker/applications`,
          { headers }
        )
      );

      // 💾 simpan ke cache
      this.setCache(cacheKey, res);

      this.animateCount(res.pending   || 0, v => this.pendingCount = v);
      this.animateCount(res.accepted  || 0, v => this.acceptedCount = v);
      this.animateCount(res.completed || 0, v => this.completedCount = v);

    } catch (err) {
      console.error('Failed to load application counts', err);
    }
  }

  animateCount(
    target: number,
    setter: (val: number) => void,
    duration = 800
  ) {
    let start = 0;
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const value = Math.floor(progress * target);
      setter(value);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setter(target);
      }
    };

    requestAnimationFrame(step);
  }

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

  onJobsUpdatedFromSocket(newJobs: any[]) {
    this.setCache('cache_jobs', newJobs);
    this.jobs = newJobs;
  }

  onApplicationUpdatedFromSocket(summary: any) {
    this.setCache('cache_app_counts', summary);

    this.animateCount(summary.pending,   v => this.pendingCount = v);
    this.animateCount(summary.accepted,  v => this.acceptedCount = v);
    this.animateCount(summary.completed, v => this.completedCount = v);
  }

  async loadMostPopularJobs() {
    const cacheKey = 'cache_popular_jobs';

    // 1️⃣ ambil dari localStorage dulu
    const cached = this.getCache<any[]>(cacheKey);
    if (cached && cached.length) {
      this.popular_jobs = cached;
      return cached;
    }

    // 2️⃣ kalau belum ada → call API
    try {
      const token = await this.authStorage.getToken();
      if (!token) throw new Error('No auth token');

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      const jobs = await firstValueFrom(
        this.http.get<any[]>(
          `${environment.api_url}/worker/most-popular`,
          { headers }
        )
      );

      const ts = Date.now();

      const mapped = jobs.map((job: any) => ({
        ...job,
        hotel_logo: job.hotel_logo
          ? `${environment.base_url}/${job.hotel_logo}?t=${ts}`
          : 'assets/images/jobs/default.png'
      }));

      // 💾 simpan ke cache
      this.setCache(cacheKey, mapped);
      this.popular_jobs = mapped;

      return mapped;

    } catch (err) {
      console.error('Failed to load most popular jobs', err);
      this.popular_jobs = [];
      return [];
    }
  }

}