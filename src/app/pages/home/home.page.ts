import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonModal } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';

declare const initAllSwipers: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonModal]
})
export class HomePage implements OnInit {

  showSidebar = false;

  constructor(
    private nav: NavController
  ) { }

  ngOnInit() {
  }

  ionViewDidEnter() {
    setTimeout(() => {
      if (typeof initAllSwipers === 'function') {
        initAllSwipers();
      }
    }, 50);
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

  logout() {
    this.showSidebar = false; // trigger dismiss
  }

  onSidebarDismiss() {
    // NAVIGATE SETELAH MODAL BENAR2 TUTUP
    this.nav.navigateRoot('/sign-in');
  }
}
