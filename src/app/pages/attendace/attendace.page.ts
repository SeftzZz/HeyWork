import { Component, OnInit } from '@angular/core';
import { ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, LoadingController, ToastController } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthStorage } from '../../services/auth-storage.service';
import * as L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  iconUrl: 'assets/leaflet/marker-icon.png',
  shadowUrl: 'assets/leaflet/marker-shadow.png',
});

@Component({
  selector: 'app-attendace',
  templateUrl: './attendace.page.html',
  styleUrls: ['./attendace.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule]
})
export class AttendacePage implements OnInit {

  job: any = null;

  selfieBase64: string | null = null;
  latitude: number | null = null;
  longitude: number | null = null;

  submitting = false;

  map!: L.Map;
  userMarker!: L.Marker;
  hotelMarker!: L.Marker;
  radiusCircle!: L.Circle;

  hotelLat!: number;
  hotelLng!: number;

  distance = 0;
  MAX_DISTANCE = 100; // meter
  distanceRounded: any;

  @ViewChild('mapEl', { static: false })
  mapEl!: ElementRef<HTMLDivElement>;

  constructor(
    private nav: NavController,
    private http: HttpClient,
    private authStorage: AuthStorage,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    const navState = history.state;
    if (!navState?.job) {
      this.nav.back();
      return;
    }

    this.job = navState.job;
    console.log('🧾 JOB DATA:', this.job);
    this.loadHotelLocation();
  }

  async ionViewDidEnter() {
    await this.getLocation();    
  }

  goBack() {
    this.nav.back();
  }

  /* ===============================
   📸 CAMERA SELFIE
  =============================== */
  async takeSelfie() {
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        ...(Capacitor.getPlatform() === 'web'
        ? { direction: CameraDirection.Front }
        : {})
      });

      if (!photo.base64String) return;

      // 🔥 tambahkan watermark
      this.selfieBase64 = await this.addWatermark(
        photo.base64String
      );

    } catch (err: any) {
      // cancel → diam saja
      if (err?.message?.includes('cancel')) return;
      console.error(err);
    }
  }

  /* ===============================
   📍 GET GPS + VALIDATION
  =============================== */
  async getLocation() {

    // 🔴 CEK SUDAH ABSEN
    if (this.isAlreadyCheckedIn()) {
      await this.toast('Anda sudah melakukan check-in hari ini');
      this.goBack();
      return; // ⛔ STOP SEMUA FLOW
    }

    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true
    });

    this.latitude = pos.coords.latitude;
    this.longitude = pos.coords.longitude;

    // 📏 hitung jarak
    if (this.hotelLat && this.hotelLng) {
      this.distance = this.getDistanceMeter(
        this.latitude,
        this.longitude,
        this.hotelLat,
        this.hotelLng
      );
    }

    // 🧾 LOG
    console.group('📍 CHECK-IN LOCATION');
    console.log('👤 YOU:', {
      lat: this.latitude,
      lng: this.longitude
    });
    console.log('🏨 HOTEL:', {
      lat: this.hotelLat,
      lng: this.hotelLng
    });
    console.log('📏 DISTANCE (m):', Math.round(this.distance));
    console.groupEnd();

    // ✅ dalam radius → tampilkan map
    this.initMap();

    // 🔴 JIKA DI LUAR RADIUS
    if (this.distance > this.MAX_DISTANCE) {
      await this.handleOutsideRadius();
      return;
    }

    // 📸 lanjut kamera
    await this.takeSelfie();
  }

  getDistanceMeter(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  /* ===============================
   🚀 SUBMIT CHECK-IN
  =============================== */
  async confirmCheckIn() {

    if (!this.selfieBase64) {
      return this.toast('Selfie wajib diambil');
    }

    if (!this.latitude || !this.longitude) {
      return this.toast('Lokasi GPS belum tersedia');
    }

    const distance = this.getDistanceMeter(
      this.latitude,
      this.longitude,
      parseFloat(this.job.hotel_latitude),
      parseFloat(this.job.hotel_longitude)
    );

    if (distance > this.MAX_DISTANCE) {
      return this.toast(`Anda berada ${Math.round(distance)}m dari hotel`);
    }

    const loading = await this.loadingCtrl.create({
      message: 'Submitting check-in...'
    });
    await loading.present();

    try {
      const token = await this.authStorage.getToken();

      const payload = new FormData();
      payload.append('job_id', this.job.id);
      payload.append('application_id', this.job.application_id);
      payload.append('latitude', String(this.latitude));
      payload.append('longitude', String(this.longitude));
      payload.append('selfie', this.selfieBase64);
      payload.append('device_time', new Date().toISOString());

      await this.http.post(
        `${environment.api_url}/worker/attendance/checkin`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      ).toPromise();

      await loading.dismiss();

      // 🔥 HAPUS CACHE ATTENDANCE
      // localStorage.removeItem('cache_attendances');

      this.toast('Check-in berhasil ✅');

      // 🔥 KEMBALI KE SCHEDULE
      this.nav.navigateBack('pages/schedule');

    } catch (err) {
      await loading.dismiss();
      this.toast('Gagal check-in');
      console.error(err);
    }
  }

  async toast(msg: string) {
    const t = await this.toastCtrl.create({
      message: msg,
      duration: 2500,
      position: 'top', // 🔥 WAJIB
      cssClass: 'camera-toast', // 🔥 custom class
    });
    await t.present();
  }

  loadHotelLocation() {
    if (!this.job.hotel_latitude || !this.job.hotel_longitude) {
      console.error('❌ HOTEL COORDINATE MISSING IN JOB');
      return;
    }

    this.hotelLat = parseFloat(this.job.hotel_latitude);
    this.hotelLng = parseFloat(this.job.hotel_longitude);

    console.log('🏨 HOTEL FROM NAV STATE:', {
      lat: this.hotelLat,
      lng: this.hotelLng
    });
  }

  initMap() {
    if (!this.hasLocation() || !this.hotelLat || !this.hotelLng || !this.mapEl) {
      console.warn('❌ MAP NOT READY', {
        hasLocation: this.hasLocation(),
        hotelLat: this.hotelLat,
        hotelLng: this.hotelLng,
        mapEl: !!this.mapEl
      });
      return;
    }

    console.log('🗺️ INIT MAP');

    if (this.map) {
      this.map.remove();
    }

    this.map = L.map(this.mapEl.nativeElement).setView(
      [this.latitude!, this.longitude!],
      18
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
      .addTo(this.map);

    this.userMarker = L.marker([this.latitude!, this.longitude!])
      .addTo(this.map)
      .bindPopup('You');

    this.hotelMarker = L.marker([this.hotelLat, this.hotelLng])
      .addTo(this.map)
      .bindPopup('Hotel');

    this.radiusCircle = L.circle(
      [this.hotelLat, this.hotelLng],
      { radius: this.MAX_DISTANCE }
    ).addTo(this.map);

    setTimeout(() => {
      this.map.invalidateSize();
      console.log('✅ MAP READY');
    }, 300);
  }

  hasLocation(): this is this & {
    latitude: number;
    longitude: number;
  } {
    return this.latitude !== null && this.longitude !== null;
  }

  async handleOutsideRadius() {
    // ❌ batalkan selfie
    this.selfieBase64 = null;

    // 🔔 toast peringatan
    await this.toast(
      `Anda berada di luar radius ${this.MAX_DISTANCE}m dari hotel`
    );

    // // ⛔ opsional: langsung keluar halaman check-in
    // setTimeout(() => {
    //   this.nav.back();
    // }, 500);
  }

  async addWatermark(base64: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      const logo = new Image();

      img.src = 'data:image/jpeg;base64,' + base64;
      logo.src = 'assets/images/logo/LogoHW-1.png';

      let imgLoaded = false;
      let logoLoaded = false;

      const tryDraw = () => {
        if (!imgLoaded || !logoLoaded) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        canvas.width = img.width;
        canvas.height = img.height;

        // =========================
        // DRAW ORIGINAL PHOTO
        // =========================
        ctx.drawImage(img, 0, 0);

        // =========================
        // DRAW LOGO (BOTTOM LEFT)
        // =========================
        const padding = 24;
        const logoMaxWidth = img.width * 0.22; // 🔥 22% dari lebar foto
        const scale = logoMaxWidth / logo.width;

        const logoWidth = logo.width * scale;
        const logoHeight = logo.height * scale;

        ctx.globalAlpha = 0.9; // transparansi logo
        ctx.drawImage(
          logo,
          padding,
          canvas.height - logoHeight - padding,
          logoWidth,
          logoHeight
        );
        ctx.globalAlpha = 1;

        // =========================
        // WATERMARK TEXT (BOTTOM RIGHT)
        // =========================
        const fontSize = Math.max(24, img.width * 0.035);

        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.textAlign = 'right';

        // shadow biar kebaca
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const hotel = this.job?.hotel_name || '';
        const time = new Date().toLocaleString();
        const coords =
          this.latitude && this.longitude
            ? `Lat:${this.latitude.toFixed(5)} Lng:${this.longitude.toFixed(5)}`
            : '';

        const lines = [
          hotel,
          time,
          coords
        ];

        lines.forEach((text, i) => {
          ctx.fillText(
            text,
            canvas.width - padding,
            canvas.height - padding - (lines.length - 1 - i) * (fontSize + 6)
          );
        });

        // =========================
        // EXPORT BASE64
        // =========================
        const result = canvas
          .toDataURL('image/jpeg', 0.85)
          .replace(/^data:image\/jpeg;base64,/, '');

        resolve(result);
      };

      img.onload = () => {
        imgLoaded = true;
        tryDraw();
      };

      logo.onload = () => {
        logoLoaded = true;
        tryDraw();
      };
    });
  }

  isAlreadyCheckedIn(): boolean {
    try {
      const cached = localStorage.getItem('cache_attendances');
      if (!cached) return false;

      const attendances = JSON.parse(cached);

      return attendances.some((a: any) =>
        String(a.job_id) === String(this.job.id) &&
        String(a.application_id) === String(this.job.application_id) &&
        a.type === 'checkin' &&
        a.created_at?.startsWith(this.job.job_date)
      );

    } catch (e) {
      console.error('Failed to read cache_attendances', e);
      return false;
    }
  }
}
