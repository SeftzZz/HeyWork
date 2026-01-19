import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AuthStorage, AuthData } from '../../services/auth-storage.service';
import { ProfileService } from '../../services/profile.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-personal-information',
  templateUrl: './personal-information.page.html',
  styleUrls: ['./personal-information.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class PersonalInformationPage implements OnInit {

  form = {
    name: '',
    phone: '',
    dob: '',
    gender: 'male'
  };

  public auth!: AuthData;

  photoFile: File | null = null;
  photoPreview: string | null = null;

  constructor(
    private nav: NavController,
    private authStorage: AuthStorage,
    private profileService: ProfileService
  ) { }

  async ngOnInit() {
    // 🔐 Ambil auth dari local storage
    const auth = await this.authStorage.getAuth();
    if (!auth?.user) {
      this.nav.navigateRoot('/sign-in');
      return;
    }

    this.auth = auth;

    // 🧠 Prefill form dari auth.user
    this.form.name = auth.user.name || '';
    this.form.phone = auth.user.phone || '';
  }

  /* =========================
   * SAVE PROFILE (LOCAL)
   * ========================= */
  async saveProfile() {
    try {

      let photoUrl: string | undefined;

      /* =========================
       * 0️⃣ UPLOAD FOTO
       * ========================= */
      if (this.photoFile) {
        const uploadRes: any = await this.profileService.uploadPhoto(this.photoFile);

        if (uploadRes?.photo || uploadRes?.url) {
          const rawPath = uploadRes.photo ?? uploadRes.url;
          photoUrl = `${environment.base_url}/${rawPath}?t=${Date.now()}`;
        }
      }

      /* =========================
       * 1️⃣ UPDATE PROFILE API
       * ========================= */
      await this.profileService.updateProfile({
        name: this.form.name,
        phone: this.form.phone,
        dob: this.form.dob,
        gender: this.form.gender
      });

      /* =========================
       * 2️⃣ UPDATE AUTH STORAGE
       * ========================= */
      const updatedAuth: AuthData = {
        ...this.auth,
        user: {
          ...this.auth.user!,
          name: this.form.name,
          phone: this.form.phone,
          photo: photoUrl ?? this.auth.user?.photo
        }
      };

      await this.authStorage.setAuth(updatedAuth);
      this.auth = updatedAuth; // ✅ penting

      /* =========================
       * 3️⃣ REDIRECT
       * ========================= */
      this.nav.navigateRoot('/pages/home', { replaceUrl: true });

    } catch (err) {
      console.error('❌ Update profile failed', err);
      alert('Failed to update profile');
    }
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

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    this.photoFile = input.files[0];

    // preview
    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreview = reader.result as string;
    };
    reader.readAsDataURL(this.photoFile);
  }

}
