import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';

import { SignInService } from '../sign-in/sign-in.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule]
})
export class SignUpPage {

  showPassword = false;
  loading = false;

  form = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  constructor(
    private nav: NavController,
    private signin: SignInService
  ) {}

  // =========================
  // REGISTER
  // =========================
  async register() {
    if (this.form.password !== this.form.confirmPassword) {
      alert('Password dan konfirmasi password tidak sama');
      return;
    }

    this.loading = true;

    try {
      await this.signin.register({
        name: this.form.name,
        email: this.form.email,
        password: this.form.password
      });

      alert('Register berhasil, silakan login');
      this.nav.navigateRoot('/sign-in');

    } catch (err: any) {
      alert(err?.message || 'Register gagal');
    } finally {
      this.loading = false;
    }
  }

  goBack() {
    this.nav.back();
  }

  goSignIn() {
    this.nav.navigateForward('/sign-in');
  }

  // ===== GOOGLE =====
  loginWithGoogle() {
    this.signin.loginWithGoogle();
  }

  // ===== FACEBOOK =====
  loginWithFacebook() {
    this.signin.loginWithFacebook();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
