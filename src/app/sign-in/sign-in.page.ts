import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  // IonHeader,
  // IonTitle,
  // IonToolbar
} from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { SignInService } from './sign-in.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.page.html',
  styleUrls: ['./sign-in.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    // IonHeader,
    // IonTitle,
    // IonToolbar,
    CommonModule,
    FormsModule
  ]
})
export class SignInPage implements OnInit {

  showPassword = false;

  form = {
    emailUser: '',
    passUser: ''
  };

  constructor(
    private nav: NavController,
    private signin: SignInService,
    private router: Router,
    private title: Title
  ) {}

  ngOnInit() {
    this.title.setTitle('Login | Hey! Work');
  }

  goBack() {
    this.nav.back();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  // ===== LOGIN EMAIL =====
  async onLogin() {
    try {
      await this.signin.login(this.form);
      this.router.navigate(['/pages/home']);
    } catch (err) {
      alert('Login gagal');
    }
  }

  // ===== GOOGLE =====
  loginWithGoogle() {
    this.signin.loginWithGoogle();
  }

  // ===== FACEBOOK =====
  loginWithFacebook() {
    this.signin.loginWithFacebook();
  }
}
