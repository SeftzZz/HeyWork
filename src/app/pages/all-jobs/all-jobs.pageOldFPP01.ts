import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-all-jobs',
  templateUrl: './all-jobs.page.html',
  styleUrls: ['./all-jobs.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class AllJobsPage implements OnInit {

  constructor(
    private nav: NavController
  ) { }

  ngOnInit() {
  }

  goBack() {
    this.nav.back();
  }

  goJobDetail() {
    this.nav.navigateForward('/pages/job-detail');
  }
}
