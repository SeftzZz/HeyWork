import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthStorage } from '../../services/auth-storage.service';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.page.html',
  styleUrls: ['./schedule.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class SchedulePage implements OnInit {

  currentDate = new Date();
  calendarDays: any[] = [];

  selectedDate: string | null = null;
  selectedJobs: any[] = [];

  today = this.formatLocalDate(new Date());

  jobs: any[] = [];
  attendances: any[] = [];

  jobColors: Record<number, string> = {};

  intervalId: any;
  lateTimer: any;

  yearCalendars: any[] = [];

  applications: any[] = [];
  hotels: any[] = [];

  constructor(
    private nav: NavController,
    private http: HttpClient,
    private authStorage: AuthStorage
  ) {}

  async ngOnInit() {
    const loggedIn = await this.authStorage.isLoggedIn();
    if (!loggedIn) {
      this.nav.navigateRoot('/sign-in');
      return;
    }

    this.loadJobsFromCache();
    this.loadApplicationsFromCache();
    this.loadHotelsFromCache();

    this.assignJobColors();
    this.buildYearCalendar();
  }

  // 🔥 INI YANG PENTING
  async ionViewWillEnter() {
    await this.loadAttendances(true); // force reload
    this.refreshSelectedJobs();
  }

  goBack() {
    this.nav.back();
  }

  formatLocalDate(date: Date) {
    const y = date.getFullYear();
    const m = ('0' + (date.getMonth() + 1)).slice(-2);
    const d = ('0' + date.getDate()).slice(-2);
    return `${y}-${m}-${d}`;
  }

  // ===============================
  // LOAD CACHE
  // ===============================
  loadJobsFromCache() {
    try {
      this.jobs = JSON.parse(localStorage.getItem('cache_jobs') || '[]');
    } catch {
      this.jobs = [];
    }
  }

  // ===============================
  // COLOR PER JOB
  // ===============================
  assignJobColors() {
    const palette = [
      '#2869FE', '#FF9800', '#4CAF50',
      '#9C27B0', '#E91E63', '#009688'
    ];

    let i = 0;
    for (const job of this.jobs) {
      if (!this.jobColors[job.id]) {
        this.jobColors[job.id] = palette[i % palette.length];
        i++;
      }
    }
  }

  getJobColor(jobId: number) {
    return this.jobColors[jobId] || '#2869FE';
  }

  isDateInRange(date: string, start: string, end?: string) {
    const d = new Date(date);
    const s = new Date(start);
    const e = end ? new Date(end) : s;
    return d >= s && d <= e;
  }

  // ===============================
  // DAY STYLE (HIGHLIGHT + DISABLE)
  // ===============================
  getDayStyle(day: any) {
    if (day.empty) return {};

    if (day.isPast) {
      return {
        background: '#f1f1f1',
        color: '#aaa',
        pointerEvents: 'none'
      };
    }

    if (!day.jobs || !day.jobs.length) return {};

    if (day.jobs.length === 1) {
      return {
        background: this.getJobColor(day.jobs[0].id),
        color: '#fff'
      };
    }

    const colors = day.jobs.map((j: any) => this.getJobColor(j.id));
    return {
      background: `linear-gradient(135deg, ${colors.join(',')})`,
      color: '#fff'
    };
  }

  // ===============================
  // SELECT DATE
  // ===============================
  selectDate(day: any) {
    if (day.empty || day.isPast || !day.date) return;

    this.selectedDate = day.date;

    this.selectedJobs = (day.jobs || []).map((job: any) => {
      const app = this.applications.find(
        a => Number(a.job_id) === Number(job.id)
      );

      const records = this.attendances.filter(a =>
        a.job_id === job.id &&
        a.created_at?.startsWith(day.date)
      );

      console.log('Applications:', this.applications);
      console.log('Job:', job.id);
      console.log('Matched app:', app);

      return {
        ...job,
        application_id: app?.application_id || null,
        application_status: app?.status || null,
        attendance: {
          checkin: records.find(r => r.type === 'checkin') || null,
          checkout: records.find(r => r.type === 'checkout') || null
        },
        lateSeconds: this.getLateSeconds(job)
      };
    });

    // 🔥 START REALTIME LATE TIMER
    this.startLateTimer();
  }

  // ===============================
  // ATTENDANCE STATUS
  // ===============================
  getAttendanceStatus(job: any) {
    if (!job.attendance?.checkin) return 'Belum Check-in';
    if (!job.attendance?.checkout) return 'Sudah Check-in';
    return 'Selesai';
  }

  // ===============================
  // UTIL
  // ===============================
  pad(n: number) {
    return n < 10 ? '0' + n : n;
  }

  // ===============================
  // LOAD ATTENDANCES (CACHE + API)
  // ===============================
  async loadAttendances(force = false) {
    const cacheKey = 'cache_attendances';

    // 1️⃣ CACHE FIRST
    if (!force) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          this.attendances = JSON.parse(cached);
          return;
        }
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }

    // 2️⃣ API
    try {
      const token = await this.authStorage.getToken();
      if (!token) return;

      const headers = {
        Authorization: `Bearer ${token}`
      };

      const data = await this.http
        .get<any[]>(`${environment.api_url}/worker/attendance`, { headers })
        .toPromise();

      this.attendances = data || [];
      localStorage.setItem(cacheKey, JSON.stringify(this.attendances));

    } catch (err) {
      console.error('Failed to load attendances', err);
    }
  }

  // ===============================
  // CHECK-IN WINDOW
  // ===============================
  canCheckIn(job: any) {
    if (!this.selectedDate) return false;

    // sudah check-in
    if (job.attendance?.checkin) return false;

    // harus accepted
    if (job.application_status !== 'accepted') return false;

    if (!job.application_id) return false;

    // hanya di hari ini
    if (this.selectedDate !== this.today) return false;

    const now = new Date();

    // =========================
    // NORMALIZE START & END TIME
    // =========================
    const startTime =
      job.start_time && job.start_time !== '00:00:00'
        ? job.start_time
        : '00:00:00';

    const endTime =
      job.end_time && job.end_time !== '00:00:00'
        ? job.end_time
        : '23:59:59';

    const start = new Date(`${this.selectedDate}T${startTime}`);
    const end   = new Date(`${this.selectedDate}T${endTime}`);

    return now >= start && now <= end;
  }

  // ===============================
  // LATE CALCULATION
  // ===============================
  getLateMinutes(job: any): number {
    if (!this.selectedDate) return 0;
    if (job.attendance?.checkin) return 0;
    if (this.selectedDate !== this.today) return 0;

    let startTime = job.start_time;

    // kalau null → default 08:00
    if (!startTime) {
      startTime = '08:00:00';
    }

    const start = new Date(`${this.selectedDate}T${startTime}`);
    const now = new Date();

    const diff = Math.floor((now.getTime() - start.getTime()) / 60000);
    return diff > 0 ? diff : 0;
  }

  formatLate(job: any) {
    const min = this.getLateMinutes(job);
    return min > 0 ? `Late ${min} min` : 'On time';
  }

  // ===============================
  // CHECK-IN ACTION
  // ===============================
  async doCheckIn(job: any) {
    if (!job.application_id) {
      alert('Application ID tidak ditemukan');
      return;
    }

    // 🔥 cari hotel dari cache
    const hotel = this.hotels.find(
      h =>
        h.hotel_name?.toLowerCase().trim() ===
        job.hotel_name?.toLowerCase().trim()
    );

    if (!hotel) {
      alert('Hotel tidak ditemukan di cache');
      console.error('HOTEL NOT FOUND', {
        jobHotelName: job.hotel_name,
        hotels: this.hotels
      });
      return;
    }

    // 🔥 KIRIM DATA LENGKAP
    this.nav.navigateForward('pages/attendance', {
      state: {
        job: {
          id: job.id,
          application_id: job.application_id,
          position: job.position,
          hotel_id: hotel.id,
          hotel_name: hotel.hotel_name,
          hotel_latitude: hotel.latitude,
          hotel_longitude: hotel.longitude,
          start_time: job.start_time,
          end_time: job.end_time,
          job_date: this.selectedDate
        }
      }
    });
  }

  startLateTimer() {
    if (this.lateTimer) clearInterval(this.lateTimer);

    this.lateTimer = setInterval(() => {
      if (this.selectedDate !== this.today) return;

      this.selectedJobs = this.selectedJobs.map(job => ({
        ...job,
        lateSeconds: this.getLateSeconds(job)
      }));
    }, 1000); // 🔥 tiap detik
  }

  getLateSeconds(job: any): number {
    if (!this.selectedDate) return 0;
    if (job.attendance?.checkin) return 0;
    if (this.selectedDate !== this.today) return 0;

    let startTime = job.start_time;

    // fallback kalau null
    if (!startTime) {
      startTime = '08:00:00';
    }

    const start = new Date(`${this.selectedDate}T${startTime}`);
    const now = new Date();

    const diffSec = Math.floor((now.getTime() - start.getTime()) / 1000);
    return diffSec > 0 ? diffSec : 0;
  }

  formatSeconds(sec: number): string {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;

    return (
      this.pad(h) + ':' +
      this.pad(m) + ':' +
      this.pad(s)
    );
  }

  buildYearCalendar() {
    this.yearCalendars = [];

    const year = this.currentDate.getFullYear();

    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(year, month, 1);
      const lastDay  = new Date(year, month + 1, 0);

      const startWeekDay = firstDay.getDay() === 0
        ? 6
        : firstDay.getDay() - 1;

      const days: any[] = [];

      // empty cells
      for (let i = 0; i < startWeekDay; i++) {
        days.push({ empty: true });
      }

      // actual days
      for (let d = 1; d <= lastDay.getDate(); d++) {
        const dateStr = `${year}-${this.pad(month + 1)}-${this.pad(d)}`;

        const jobsOnDay = this.jobs.filter(job =>
          this.isDateInRange(dateStr, job.job_date_start, job.job_date_end)
        );

        days.push({
          day: d,
          date: dateStr,
          jobs: jobsOnDay,
          hasJob: jobsOnDay.length > 0,
          isPast: dateStr < this.today
        });
      }

      this.yearCalendars.push({
        month,
        year,
        label: firstDay.toLocaleString('default', { month: 'long' }),
        days
      });
    }
  }

  loadApplicationsFromCache() {
    try {
      this.applications = JSON.parse(
        localStorage.getItem('cache_applications') || '[]'
      );
    } catch {
      this.applications = [];
    }
  }

  loadHotelsFromCache() {
    try {
      this.hotels = JSON.parse(
        localStorage.getItem('cache_hotels') || '[]'
      );
    } catch {
      this.hotels = [];
    }
  }

  refreshSelectedJobs() {
    if (!this.selectedDate) return;

    let selectedDay: any = null;

    for (const month of this.yearCalendars) {
      for (const day of month.days) {
        if (day.date === this.selectedDate) {
          selectedDay = day;
          break;
        }
      }
      if (selectedDay) break;
    }

    if (!selectedDay) return;

    this.selectDate(selectedDay);
  }

}
