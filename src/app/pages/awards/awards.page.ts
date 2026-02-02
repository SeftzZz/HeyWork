import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { AuthStorage } from '../../services/auth-storage.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-awards',
  templateUrl: './awards.page.html',
  styleUrls: ['./awards.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class AwardsPage implements OnInit {

  // ===== FORM STATE =====
  type: 'ktp' | 'certificate' | 'other' = 'certificate';
  file?: File;
  isSubmitting = false;

  documents: any[] = [];

  constructor(
    private nav: NavController,
    private http: HttpClient,
    private authStorage: AuthStorage,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    await this.loadDocuments();
  }

  // ===== FILE HANDLER =====
  onFileChange(event: any) {
    this.file = event.target.files?.[0];
  }

  // ===== UPLOAD =====
  async saveDocument() {
    if (!this.file) {
      this.toast('Please choose a file');
      return;
    }

    this.isSubmitting = true;

    try {
      const token = await this.authStorage.getToken();

      const formData = new FormData();
      formData.append('file', this.file);
      formData.append('type', this.type);

      await this.http.post(
        `${environment.api_url}/worker/upload/document`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      ).toPromise();

      this.toast('Document uploaded ✅');
      this.file = undefined;

      await this.loadDocuments();

    } catch (err) {
      console.error(err);
      this.toast('Failed to upload document');
    } finally {
      this.isSubmitting = false;
    }
  }

  // ===== LOAD LIST =====
  async loadDocuments() {
    try {
      const token = await this.authStorage.getToken();
      this.documents = await this.http.get<any[]>(
        `${environment.api_url}/worker/documents`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      ).toPromise() || [];
    } catch (e) {
      console.error(e);
    }
  }

  async toast(msg: string) {
    const t = await this.toastCtrl.create({
      message: msg,
      duration: 2500,
      position: 'top'
    });
    await t.present();
  }

  getFileUrl(path: string) {
    return `${environment.base_url}/${path}`;
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
