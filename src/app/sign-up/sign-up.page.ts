import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';

import { SignInService } from '../sign-in/sign-in.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class SignUpPage implements OnInit {

  showPassword = false;

  form = {
    emailUser: '',
    passUser: ''
  };
  
  constructor(
    private nav: NavController,
    private signin: SignInService,
  ) { }

  ngOnInit() {
  }

  goBack() {
    this.nav.back();
  }

  goSignUp() {
    this.nav.navigateForward('/sign-up');
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
