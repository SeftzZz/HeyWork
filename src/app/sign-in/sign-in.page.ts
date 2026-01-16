import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.page.html',
  styleUrls: ['./sign-in.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class SignInPage implements OnInit {

  showPassword = false;

  constructor(
    private nav: NavController,
  ) { }

  ngOnInit() {
  }

  goBack() {
    this.nav.back();
  }

  onLogin() {
    console.log('Login clicked');

    // nanti:
    // call API
    // simpan token
    // redirect
    this.nav.navigateRoot('/pages/home');
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

}
