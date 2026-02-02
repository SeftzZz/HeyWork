import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, LoadingController, ToastController } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthStorage } from '../../services/auth-storage.service';

@Component({
  selector: 'app-education',
  templateUrl: './education.page.html',
  styleUrls: ['./education.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class EducationPage implements OnInit {

  // =============================
  // MODEL SESUAI API
  // =============================
  education: any = {
    level: '',
    title: '',
    instituted_name: '',
    start_date: '',
    end_date: '',
    is_current: false
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
  async saveEducation() {
    if (!this.education.instituted_name || !this.education.start_date) {
      alert('Instituted name & start date are required');
      return;
    }

    if (this.education.is_current) {
      this.education.end_date = null;
    }

    this.isSubmitting = true;

    try {
      const token = await this.authStorage.getToken();

      await this.http.post(
        `${environment.api_url}/worker/education`,
        this.education,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      ).toPromise();
      this.toast('Success to save education ✅');

      this.isSubmitting = false;
      this.nav.back();

    } catch (err) {
      this.isSubmitting = false;
      this.toast('Failed to save education');
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

  goBack() {
    this.nav.back();
  }

  goApplication() {
    this.nav.navigateForward('/pages/application');
  }

  goHome() {
    this.nav.navigateForward('/pages/home');
  }

  goApplyJob() {
    this.nav.navigateForward('/pages/apply-job');
  }

  goMessage() {
    this.nav.navigateForward('/pages/message');
  }

  goMessageInbox() {
    this.nav.navigateForward('/pages/message-inbox');
  }

  goProfile() {
    this.nav.navigateForward('/pages/profile');
  }
}
