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
import { TimeAgoPipe } from '../../pipes/time-ago-pipe';

@Component({
  selector: 'app-search-job',
  templateUrl: './search-job.page.html',
  styleUrls: ['./search-job.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonModal,
    CommonModule,
    FormsModule,
    TimeAgoPipe
  ]
})
export class SearchJobPage implements OnInit {

  jobs: any[] = [];
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

          const filtered = this.applyJobFilters(jobs);
          this.jobs = filtered;

          break;
        }

        default:
          console.log('[WS] unknown event', event);
      }
    });
  }

  ngOnInit() {
    const cachedFilters = localStorage.getItem('job_filters');
    if (cachedFilters) {
      this.filters = JSON.parse(cachedFilters);
    }

    const cachedJobs = localStorage.getItem('cache_jobs');
    if (cachedJobs) {
      const jobs = JSON.parse(cachedJobs);

      const filtered = this.applyJobFilters(jobs);

      this.jobs = filtered;
      this.initSalaryFromJobs(filtered);
      this.initCategoriesFromJobs(jobs); // categories dari ALL job
    }

  }

  ionViewDidEnter() {
    this.initWebSocket();
  }

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
      const filtered = this.applyJobFilters(mapped);

      this.jobs = filtered;
      this.setCache('cache_jobs', mapped);

      // salary & category
      this.initSalaryFromJobs(filtered);
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

  applyJobFilters(jobs: any[]): any[] {
    return jobs.filter(job => {

      // CATEGORY (position)
      if (this.filters.category) {
        if (job.position !== this.filters.category) return false;
      }

      // LOCATION
      if (this.filters.location) {
        if (!job.location?.toLowerCase().includes(this.filters.location.toLowerCase())) {
          return false;
        }
      }

      // JOB TYPE
      if (this.filters.jobTypes.length) {
        const jobCategory = this.normalizeJobType(job.category);
        const selectedTypes = this.filters.jobTypes.map(t =>
          this.normalizeJobType(t)
        );

        if (!selectedTypes.includes(jobCategory)) return false;
      }

      // SALARY
      const fee = Number(job.fee);
      if (!isNaN(fee)) {
        if (fee < this.filters.minSalary) return false;
        if (fee > this.filters.maxSalary) return false;
      }

      return true;
    });
  }

  normalizeJobType(value: string): string {
    return value
      .toLowerCase()
      .replace(/\s+/g, '_'); // "Daily Worker" → "daily_worker"
  }

}
