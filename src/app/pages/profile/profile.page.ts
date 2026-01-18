import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';

import { AuthStorage } from '../../services/auth-storage.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ProfilePage implements OnInit {

  constructor(
    private nav: NavController,
    private auth: AuthStorage,
  ) { }

  ngOnInit() {
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

  goPersonalInformation() {
    this.nav.navigateForward('/pages/personal-information');
  }

  goAllJobs() {
    this.nav.navigateForward('/pages/all-job');
  }

  goJobDetail() {
    this.nav.navigateForward('/pages/job-detail');
  }

  goSkillView() {
    this.nav.navigateForward('/pages/skill-view');
  }

  goWorkExperience() {
    this.nav.navigateForward('/pages/work-experience');
  }

  goEducation() {
    this.nav.navigateForward('/pages/education');
  }

  goAwards() {
    this.nav.navigateForward('/pages/awards');
  }

  async confirmLogout() {
    const confirm = window.confirm('Yakin ingin keluar?');
    if (confirm) {
      await this.logout();
    }
  }

  async logout() {
    await this.auth.removeToken();
    this.nav.navigateRoot('/sign-in');
  }
}
