import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';

declare const initAllSwipers: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonContent],
})
export class HomePage {
  constructor() {}

  ionViewDidEnter() {
    setTimeout(() => {
      if (typeof initAllSwipers === 'function') {
        initAllSwipers();
      }
    }, 50);
  }
}
