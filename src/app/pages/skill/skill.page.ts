import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-skill-view',
  templateUrl: './skill-view.page.html',
  styleUrls: ['./skill-view.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class SkillViewPage implements OnInit {

  constructor(
    private nav: NavController,
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
}
