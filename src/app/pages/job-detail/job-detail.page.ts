import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

import { AuthStorage, AuthData } from '../../services/auth-storage.service';

@Component({
  selector: 'app-job-detail',
  templateUrl: './job-detail.page.html',
  styleUrls: ['./job-detail.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule
  ]
})
export class JobDetailPage implements OnInit {

  job: any | null = null;
  hotel: any | null = null;

  constructor(
    private nav: NavController,
    private route: ActivatedRoute,
    private http: HttpClient,
    private authStorage: AuthStorage,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.loadJobDetail(id);
  }

  loadJobDetail(id: string) {

    // ===============================
    // 1️⃣ PRIORITAS TERTINGGI: selected_job
    // ===============================
    const selected = localStorage.getItem('selected_job');
    if (selected) {
      const job = JSON.parse(selected);
      if (String(job.id) === String(id)) {
        this.job = job;

        // 🔥 TAMBAHKAN
        this.resolveHotelFromCache(job);
        return;
      }
    }

    // ===============================
    // 2️⃣ FALLBACK: cache_jobs
    // ===============================
    const cached = localStorage.getItem('cache_jobs');
    if (cached) {
      const jobs = JSON.parse(cached);
      const found = jobs.find((j: any) => String(j.id) === String(id));
      if (found) {
        this.job = found;

        // 🔥 TAMBAHKAN
        this.resolveHotelFromCache(found);
        return;
      }
    }

    // ===============================
    // 3️⃣ TERAKHIR: API
    // ===============================
    this.fetchJobFromApi(id);
  }

  async fetchJobFromApi(id: string) {
    try {
      const token = await this.authStorage.getToken();
      if (!token) throw new Error('No auth token');

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      const job = await firstValueFrom(
        this.http.get<any>(`${environment.api_url}/worker/jobs/${id}`, { headers })
      );

      this.job = job;

      // 🔥 resolve hotel dari cache
      this.resolveHotelFromCache(job);

    } catch (err) {
      console.error('Failed to load job detail', err);
    }
  }

  goBack() {
    this.nav.back();
  }

  async goApplyJob() {
    if (!this.job?.id) return;

    const confirm = window.confirm('Yakin ingin melamar pekerjaan ini?');
    if (!confirm) return;

    try {
      const token = await this.authStorage.getToken();
      if (!token) throw new Error('No auth token');

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      await firstValueFrom(
        this.http.post(
          `${environment.api_url}/jobs/${this.job.id}/apply`,
          {},
          { headers }
        )
      );

      alert('Lamaran berhasil dikirim ✅');

      // optional: ke halaman application
      this.nav.navigateForward('/pages/application');

    } catch (err: any) {
      console.error('Apply job failed', err);

      const msg =
        err?.error?.message ||
        'Gagal melamar pekerjaan. Silakan coba lagi.';

      alert(msg);
    }
  }

  private resolveHotelFromCache(job: any) {
    if (!job?.hotel_id) return;

    const cached = localStorage.getItem('cache_hotels');
    if (!cached) return;

    try {
      const hotels = JSON.parse(cached);
      const found = hotels.find(
        (h: any) => String(h.id) === String(job.hotel_id)
      );

      if (found) {
        this.hotel = found;

        // 🔥 inject ke job supaya template simpel
        this.job = {
          ...this.job,
          hotel: found
        };
      }
    } catch {
      localStorage.removeItem('cache_hotels');
    }
  }

}
