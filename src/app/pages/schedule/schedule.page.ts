import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthStorage } from '../../services/auth-storage.service';

declare const initAllSwipers: any;

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

  activeMonthIndex = 0;

  shifts: any[] = [];

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

  ionViewDidEnter() {
    setTimeout(() => {
      if (typeof initAllSwipers === 'function') {
        initAllSwipers();
      }
    }, 50);
  }

  // 🔥 INI YANG PENTING
  async ionViewWillEnter() {
    await this.loadSchedule(true);
    await this.loadAttendances(true);
    this.buildYearCalendar();
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

    if (!day || day.empty) return {};

    if (day.isPast) {
      return {
        background: '#f1f1f1',
        color: '#aaa',
        pointerEvents: 'none'
      };
    }

    if (!day.shifts || day.shifts.length === 0) return {};

    // 🔵 1 shift
    if (day.shifts.length === 1) {
      return {
        background: '#2869FE',
        color: '#fff'
      };
    }

    // 🟣 Multiple shifts (overtime case)
    return {
      background: '#9C27B0',
      color: '#fff'
    };
  }

  // ===============================
  // SELECT DATE
  // ===============================
  selectDate(day: any) {
    if (day.empty || day.isPast || !day.date) return;

    this.selectedDate = day.date;

    this.selectedJobs = (day.shifts || []).map((shift: any) => {

      console.log('SHIFT:', shift);
      console.log('ATTENDANCES:', this.attendances);

      const records = this.attendances.filter(a =>
        Number(a.job_id) === Number(shift.job_id) &&
        Number(a.application_id) === Number(shift.application_id) &&
        a.created_at?.startsWith(day.date)
      );

      records.sort((a, b) =>
        new Date(a.created_at).getTime() -
        new Date(b.created_at).getTime()
      );

      return {
        ...shift,
        attendance: {
          checkin: records.find(r => r.type === 'checkin') || null,
          checkout: records.find(r => r.type === 'checkout') || null
        },
        lateSeconds: this.getLateSeconds(shift)
      };
    });

    console.log('Selected Jobs:', this.selectedJobs);

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
  canCheckIn(shift: any) {
    if (!this.selectedDate) return false;

    if (shift.attendance?.checkin) return false;

    if (this.selectedDate !== this.today) return false;

    const now = new Date();

    const start = new Date(`${this.selectedDate}T${shift.start_time}`);
    const end   = new Date(`${this.selectedDate}T${shift.end_time}`);

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
  async doCheckIn(shift: any) {

    if (!shift.schedule_shift_id) {
      alert('Shift ID tidak ditemukan');
      return;
    }

    if (!shift.job_id || !shift.application_id) {
      alert('Shift belum terhubung ke Job');
      return;
    }

    this.nav.navigateForward('pages/attendance', {
      state: {
        shift: {
          schedule_shift_id: shift.schedule_shift_id,
          job_id: shift.job_id,
          application_id: shift.application_id,
          department: shift.department,
          start_time: shift.start_time,
          end_time: shift.end_time,
          shift_date: this.selectedDate,
          hotel_id: shift.hotel_id,
          hotel_name: shift.hotel_name,
          hotel_latitude: shift.hotel_latitude,
          hotel_longitude: shift.hotel_longitude
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
    const currentMonth = this.currentDate.getMonth();
    this.activeMonthIndex = currentMonth;

    // 🔥 Safety: pastikan shifts array valid
    const shiftMap: Record<string, any[]> = {};

    // Convert shifts array menjadi map supaya lebih cepat & aman
    if (Array.isArray(this.shifts)) {
      for (const item of this.shifts) {
        if (item?.shift_date) {
          shiftMap[item.shift_date] = item.shifts || [];
        }
      }
    }

    for (let month = 0; month < 12; month++) {

      const firstDay = new Date(year, month, 1);
      const lastDay  = new Date(year, month + 1, 0);

      const startWeekDay = firstDay.getDay() === 0
        ? 6
        : firstDay.getDay() - 1;

      const days: any[] = [];

      // padding empty
      for (let i = 0; i < startWeekDay; i++) {
        days.push({ empty: true });
      }

      for (let d = 1; d <= lastDay.getDate(); d++) {

        const dateStr =
          `${year}-${this.pad(month + 1)}-${this.pad(d)}`;

        const shiftsForDay = shiftMap[dateStr] || [];

        days.push({
          day: d,
          date: dateStr,
          shifts: shiftsForDay,
          hasShift: shiftsForDay.length > 0,
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

    console.log('Shifts Loaded:', this.shifts);
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

  private getAppliedJobIds(): Set<number> {
    return new Set(
      this.applications
        .filter(a => a.status === 'accepted')
        .map(a => Number(a.job_id))
        .filter(id => !isNaN(id))
    );
  }

  async loadSchedule(force = false) {

    const cacheKey = 'cache_schedule';

    if (!force) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          this.shifts = JSON.parse(cached);
          this.buildYearCalendar();   // 🔥 tambahkan ini
          return;
        }
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }

    try {
      const token = await this.authStorage.getToken();
      if (!token) return;

      const headers = {
        Authorization: `Bearer ${token}`
      };

      const res: any = await this.http
        .get(`${environment.api_url}/worker/schedule`, { headers })
        .toPromise();

      this.shifts = res?.data || [];

      console.log('Shifts Loaded:', this.shifts);

      localStorage.setItem(cacheKey, JSON.stringify(this.shifts));

      // 🔥 REBUILD CALENDAR SETELAH DATA MASUK
      this.buildYearCalendar();

    } catch (err) {
      console.error('Failed to load schedule', err);
    }
  }

  getShiftColor(type: string) {
    switch (type) {
      case 'regular': return '#4CAF50';
      case 'overtime': return '#FF9800';
      case 'leave': return '#9C27B0';
      case 'off': return '#BDBDBD';
      default: return '#2196F3';
    }
  }
}
