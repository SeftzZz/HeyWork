import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonModal} from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { Title } from '@angular/platform-browser';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Subscription } from 'rxjs';

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

  categories: { label: string; value: string }[] = [];
  selectedCategoryLabel = 'Choose position';

  filters = {
    category: '',
    location: '',
    jobTypes: [] as string[],
    minSalary: 0,
    maxSalary: 0
  };

  isCategoryOpen = false;

  salaryMin = 0;
  salaryMax = 0;
  salaryStep = 1000; // 1 ribu rupiah (boleh 5000 / 10000)

  salaryBarCount = 30;

  // tinggi histogram (40–100%) → SESUAI TEMPLATE JS
  salaryHistogram = Array.from({ length: this.salaryBarCount }, () =>
    Math.floor(Math.random() * (100 - 40 + 1)) + 40
  );

  hotels: any[] = [];
  applications: any[] = [];
  loading = false;
  private wsSub?: Subscription;
  experiences: any[] = [];
  educations: any[] = [];

  constructor(
    private nav: NavController,
    private authStorage: AuthStorage,
    private profileService: ProfileService,
    private title: Title,
    private http: HttpClient,
    private ws: WsService
  ) {}

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
    this.subscribeWebSocket();
    await this.loadProfile();

    await this.getHotels();

    this.jobs = await this.getJobs();
    await this.loadMostPopularJobs();
    await this.loadApplications();
    await this.loadExperiences();
    await this.loadEducations();
  }

  ngOnDestroy() {
    this.wsSub?.unsubscribe();
  }

  private subscribeWebSocket() {
    this.wsSub = this.ws.events$.subscribe(event => {

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

        case 'hotels_updated': {
          const ts = Date.now();
          const hotels = (event.data || []).map((hotel: any) => ({
            ...hotel,
            logo: this.normalizeHotelLogo(hotel, ts)
          }));

          this.setCache('cache_hotels', hotels);
          this.hotels = hotels;
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

  ionViewDidEnter() {
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

    // tutup sidebar setelah toggle
    setTimeout(() => {
        this.closeSidebar();
    }, 150);
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

  navigateWithClose(url: string) {
      this.showSidebar = false;

      setTimeout(() => {
          this.nav.navigateForward(url);
      }, 150);
  }

  goAllJobs() {
    this.nav.navigateForward('/pages/search-job');
  }

  goJobDetail() {
    this.nav.navigateForward('/pages/job-detail');
  }

  goJobDetailId(job: any) {
    localStorage.setItem('selected_job', JSON.stringify(job));
    this.nav.navigateForward(`/pages/job-detail/${job.id}`);
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
      localStorage.removeItem('cache_hotels');
      localStorage.removeItem('cache_jobs');
      localStorage.removeItem('cache_app_counts');
      localStorage.removeItem('cache_popular_jobs');
      localStorage.removeItem('cache_applications');
      localStorage.removeItem('cache_worker_skills');
      localStorage.removeItem('toggled');
      localStorage.removeItem('cache_worker_educations');
      localStorage.removeItem('cache_worker_experiences');
      this.ws.disconnect();
      await this.authStorage.removeToken();
      this.nav.navigateRoot('/sign-in');
  }

  goApplication() {
      this.nav.navigateForward('/pages/application');
  }

  goHome() {
      this.navigateWithClose('/pages/home');
  }

  goMessage() {
    this.nav.navigateForward('/pages/message');
  }

  goProfile() {
      this.navigateWithClose('/pages/profile');
  }
  
  async getJobs() {
    const cacheKey = 'cache_jobs';

    const cached = this.getCache<any[]>(cacheKey);
    if (cached && cached.length) {
      this.initSalaryFromJobs(cached);
      this.initCategoriesFromJobs(cached); // 🔥 tambah ini
      return cached;
    }

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

      this.setCache(cacheKey, mapped);

      this.initSalaryFromJobs(mapped);
      this.initCategoriesFromJobs(mapped);
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

  toggleJobType(type: string) {
    const i = this.filters.jobTypes.indexOf(type);
    if (i >= 0) this.filters.jobTypes.splice(i, 1);
    else this.filters.jobTypes.push(type);
  }

  applyFilter() {
    this.setCache('job_filters', this.filters);
    this.reloadJobs();
    this.nav.navigateForward('/pages/search-job');
  }

  private normalizeJobLogo(job: any, ts = Date.now()) {
    if (!job.hotel_logo) {
      return 'assets/images/jobs/default.png';
    }

    // kalau sudah absolute URL → biarkan
    if (job.hotel_logo.startsWith('http://') || job.hotel_logo.startsWith('https://')) {
      return job.hotel_logo;
    }

    // kalau relative → prepend base_url
    return `${environment.base_url}/${job.hotel_logo}?t=${ts}`;
  }

  async reloadJobs() {
    const token = await this.authStorage.getToken();
    if (!token) return;

    const params: any = {};

    // ===== FILTER DASAR =====
    if (this.filters.category) params.category = this.filters.category;
    if (this.filters.location) params.location = this.filters.location;
    if (this.filters.jobTypes.length) {
      params.type = this.filters.jobTypes.join(',');
    }

    // ===== SALARY FILTER (DATA-DRIVEN) =====
    // hanya kirim ke API jika range TIDAK full
    if (this.filters.minSalary > this.salaryMin) {
      params.min_salary = this.filters.minSalary;
    }

    if (this.filters.maxSalary < this.salaryMax) {
      params.max_salary = this.filters.maxSalary;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    try {
      const jobs = await firstValueFrom(
        this.http.get<any[]>(
          `${environment.api_url}/worker/jobs`,
          { headers, params }
        )
      );

      const ts = Date.now();

      const mapped = jobs.map(job => ({
        ...job,
        hotel_logo: this.normalizeJobLogo(job, ts)
      }));

      // ===== UPDATE STATE =====
      this.jobs = mapped;
      this.setCache('cache_jobs', mapped);

      // ===== RE-INIT SALARY RANGE DARI HASIL FILTER =====
      // ini PENTING supaya slider & histogram sinkron
      this.initSalaryFromJobs(mapped);
      this.initCategoriesFromJobs(mapped);

    } catch (err) {
      console.error('Failed to reload jobs', err);
    }
  }

  toggleCategoryDropdown() {
    this.isCategoryOpen = !this.isCategoryOpen;
  }

  selectCategory(cat: any) {
    this.filters.category = cat.value;
    this.selectedCategoryLabel = cat.label;

    // 🔥 close dropdown setelah pilih
    this.isCategoryOpen = false;
  }

  onMinSalaryInput() {
    if (this.filters.minSalary > this.filters.maxSalary) {
      this.filters.maxSalary = this.filters.minSalary;
    }
  }

  onMaxSalaryInput() {
    if (this.filters.maxSalary < this.filters.minSalary) {
      this.filters.minSalary = this.filters.maxSalary;
    }
  }

  isBarActive(i: number) {
    if (!this.salaryMax) return false;

    const step = (this.salaryMax - this.salaryMin) / this.salaryBarCount;
    const value = this.salaryMin + i * step;

    return (
      value >= this.filters.minSalary &&
      value <= this.filters.maxSalary
    );
  }

  getSalaryRange() {
    return Math.max(this.salaryMax - this.salaryMin, 1);
  }

  getSalaryLeft() {
    return (
      ((this.filters.minSalary - this.salaryMin) /
        this.getSalaryRange()) *
      100
    );
  }

  getSalaryRight() {
    return (
      ((this.filters.maxSalary - this.salaryMin) /
        this.getSalaryRange()) *
      100
    );
  }

  getSalaryLabelLeft() {
    const mid =
      (this.filters.minSalary + this.filters.maxSalary) / 2;

    return (
      ((mid - this.salaryMin) /
        this.getSalaryRange()) *
      100
    );
  }

  initSalaryFromJobs(jobs: any[]) {
    const fees = jobs
      .map(j => Number(j.fee))
      .filter(v => !isNaN(v));

    if (!fees.length) return;

    this.salaryMin = Math.min(...fees);
    this.salaryMax = Math.max(...fees);

    // kalau semua fee sama → kasih buffer
    if (this.salaryMin === this.salaryMax) {
      const buffer = Math.max(10000, Math.round(this.salaryMin * 0.1));
      this.salaryMin -= buffer;
      this.salaryMax += buffer;
    }

    // set filter sesuai DB
    this.filters.minSalary = this.salaryMin;
    this.filters.maxSalary = this.salaryMax;
  }

  initCategoriesFromJobs(jobs: any[]) {
    const positions = jobs
      .map(j => j.position)
      .filter(p => !!p);

    // unique + sort
    const uniquePositions = Array.from(new Set(positions)).sort();

    this.categories = uniquePositions.map(pos => ({
      label: pos,
      value: pos
    }));
  }

  private normalizeHotelLogo(hotel: any, ts = Date.now()) {
    if (!hotel.logo) {
      return 'assets/images/hotels/default.png';
    }

    if (hotel.logo.startsWith('http://') || hotel.logo.startsWith('https://')) {
      return hotel.logo;
    }

    return `${environment.base_url}/${hotel.logo}?t=${ts}`;
  }

  async getHotels() {
    const cacheKey = 'cache_hotels';

    // 1️⃣ ambil dari cache dulu
    const cached = this.getCache<any[]>(cacheKey);
    if (cached && cached.length) {
      this.hotels = cached;
      return cached;
    }

    // 2️⃣ call API
    try {
      const token = await this.authStorage.getToken();
      if (!token) throw new Error('No auth token');

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      const hotels = await firstValueFrom(
        this.http.get<any[]>(
          `${environment.api_url}/company/hotels`,
          { headers }
        )
      );

      const ts = Date.now();

      const mapped = hotels.map(hotel => ({
        ...hotel,
        logo: this.normalizeHotelLogo(hotel, ts)
      }));

      // 💾 cache
      this.setCache(cacheKey, mapped);
      this.hotels = mapped;

      return mapped;

    } catch (err) {
      console.error('Failed to load hotels', err);
      this.hotels = [];
      return [];
    }
  }

  goSchedule() {
    this.showSidebar = false;
    this.nav.navigateForward('/pages/schedule');
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

  onCategoryClick(type: string) {

    // 🔥 KHUSUS HOTELS
    if (type === 'Hotels') {
      this.filters = {
        category: '',
        location: '',
        jobTypes: [],
        minSalary: 100000,
        maxSalary: 400000
      };

    } else {
      // default behaviour untuk kategori lain
      this.filters.jobTypes = [type];
    }

    this.applyFilter();
  }

  async loadExperiences(force = false) {
    const cacheKey = 'cache_worker_experiences';

    // =========================
    // LOAD FROM CACHE
    // =========================
    const cached = this.getCache<any[]>(cacheKey);
    if (!force && cached && cached.length) {
      this.experiences = cached;
      return;
    }

    // =========================
    // LOAD FROM API
    // =========================
    try {
      const token = await this.authStorage.getToken();
      if (!token) return;

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      const res = await firstValueFrom(
        this.http.get<any[]>(
          `${environment.api_url}/worker/experience`,
          { headers }
        )
      );

      // ambil max 2 untuk preview
      this.experiences = (res || []).slice(0, 2);
      this.setCache(cacheKey, this.experiences);

    } catch (e) {
      console.error('loadExperiences failed', e);
    }
  }

  async loadEducations(force = false) {
    const cacheKey = 'cache_worker_educations';

    const cached = this.getCache<any[]>(cacheKey);
    if (!force && cached && cached.length) {
      this.educations = cached;
      return;
    }

    try {
      const token = await this.authStorage.getToken();
      if (!token) return;

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      const res = await firstValueFrom(
        this.http.get<any[]>(
          `${environment.api_url}/worker/education`,
          { headers }
        )
      );

      this.educations = (res || []).slice(0, 2);
      this.setCache(cacheKey, this.educations);

    } catch (e) {
      console.error('loadEducations failed', e);
    }
  }

  goAttendance() {
    this.nav.navigateForward('/pages/attendance');
  }
}