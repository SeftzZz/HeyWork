import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, LoadingController, ToastController } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthStorage } from '../../services/auth-storage.service';

@Component({
  selector: 'app-work-experience',
  templateUrl: './work-experience.page.html',
  styleUrls: ['./work-experience.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class WorkExperiencePage implements OnInit {

  // =============================
  // MODEL SESUAI API
  // =============================
  experience: any = {
    company_name: '',
    company_business: '',
    job_title: '',
    department: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: ''
  };

  isSubmitting = false;

  constructor(
    private nav: NavController,
    private http: HttpClient,
    private authStorage: AuthStorage,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {}

  // =============================
  // SUBMIT KE API
  // =============================
  async saveExperience() {
    if (!this.experience.company_name || !this.experience.start_date) {
      alert('Company name & start date are required');
      return;
    }

    if (this.experience.is_current) {
      this.experience.end_date = null;
    }

    this.isSubmitting = true;

    try {
      const token = await this.authStorage.getToken();

      await this.http.post(
        `${environment.api_url}/worker/experience`,
        this.experience,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      ).toPromise();
      this.toast('Success to save experience ✅');

      this.isSubmitting = false;
      this.nav.back();

    } catch (err) {
      this.isSubmitting = false;
      this.toast('Failed to save experience');
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

  // =============================
  // NAVIGATION
  // =============================
  goBack() { this.nav.back(); }
  goHome() { this.nav.navigateForward('/pages/home'); }
  goApplication() { this.nav.navigateForward('/pages/application'); }
  goApplyJob() { this.nav.navigateForward('/pages/apply-job'); }
  goMessage() { this.nav.navigateForward('/pages/message'); }
  goMessageInbox() { this.nav.navigateForward('/pages/message-inbox'); }
  goProfile() { this.nav.navigateForward('/pages/profile'); }
}
