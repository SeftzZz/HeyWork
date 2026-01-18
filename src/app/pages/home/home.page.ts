import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  // IonHeader,
  // IonTitle,
  // IonToolbar,
  IonModal
} from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { Title } from '@angular/platform-browser';

import { AuthStorage } from '../../services/auth-storage.service';
import { ProfileService } from '../../services/profile.service';

declare const initAllSwipers: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    // IonHeader,
    // IonTitle,
    // IonToolbar,
    IonModal,
    CommonModule,
    FormsModule
  ]
})
export class HomePage implements OnInit {

  showSidebar = false;
  user: any = null;

  constructor(
    private nav: NavController,
    private auth: AuthStorage,
    private profileService: ProfileService,
    private title: Title
  ) {}

  async ngOnInit() {
    this.title.setTitle('Home | Hey! Work');

    const loggedIn = await this.auth.isLoggedIn();

    if (!loggedIn) {
      this.nav.navigateRoot('/sign-in');
      return;
    }

    await this.loadProfile();
  }

  ionViewDidEnter() {
    setTimeout(() => {
      if (typeof initAllSwipers === 'function') {
        initAllSwipers();
      }
    }, 50);
  }

  async loadProfile() {
    try {
      this.user = await this.profileService.getProfile();
    } catch (e) {
      // token invalid → logout paksa
      await this.auth.removeToken();
      this.nav.navigateRoot('/sign-in');
    }
  }

  openSidebar() {
    this.showSidebar = true;
  }

  closeSidebar() {
    this.showSidebar = false;
  }

  goAllJobs() {
    this.nav.navigateForward('/pages/all-jobs');
  }

  goJobDetail() {
    this.nav.navigateForward('/pages/job-detail');
  }

  goApplyJob() {
    this.nav.navigateForward('/pages/apply-job');
  }

  async confirmLogout() {
    const confirm = window.confirm('Yakin ingin keluar?');
    if (confirm) {
      await this.logout();
    }
  }

  async logout() {
    this.showSidebar = false;
    await this.auth.removeToken();
    this.nav.navigateRoot('/sign-in');
  }

  goApplication() {
    this.nav.navigateForward('/pages/application');
  }

  goHome() {
    this.nav.navigateForward('/pages/home');
  }

  goMessage() {
    this.nav.navigateForward('/pages/message');
  }
}
