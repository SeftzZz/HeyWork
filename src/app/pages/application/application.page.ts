import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-application',
  templateUrl: './application.page.html',
  styleUrls: ['./application.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ApplicationPage implements OnInit {

  constructor(
    private nav: NavController
  ) { }

  ngOnInit() {
  }

  goBack() {
    this.nav.back();
  }

  goApplyJob() {
    this.nav.navigateForward('/pages/apply-job');
  }

  goJobDetail() {
    this.nav.navigateForward('/pages/job-detail');
  }

  goHome() {
    this.nav.navigateForward('/pages/home');
  }

  goApplication() {
    this.nav.navigateForward('/pages/application');
  }

  goMessage() {
    this.nav.navigateForward('/pages/message');
  }

  goProfile() {
    this.nav.navigateForward('/pages/profile');
  }
}
