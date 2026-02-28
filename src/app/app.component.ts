import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { WsService } from './services/ws.service';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {

  constructor(
    private ws: WsService,
    private platform: Platform
  ) {}

  async ngOnInit() {
    this.ws.init();

    await this.platform.ready();

    // 🔥 ini yang penting
    await StatusBar.setOverlaysWebView({ overlay: false });

    await StatusBar.setStyle({ style: Style.Light }); // atau Light
  }
}