import { Injectable, NgZone } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthStorage } from './auth-storage.service';

@Injectable({ providedIn: 'root' })
export class WsService {
  private socket?: WebSocket;

  constructor(
    private zone: NgZone,
    private auth: AuthStorage
  ) {}

  async connect(onMessage: (data: any) => void) {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    const accessToken = await this.auth.getToken();
    if (!accessToken) {
      console.warn('[WS] no token');
      return;
    }

    const wsUrl = `${environment.ws_url}?token=${accessToken}`;
    console.log('[WS] connecting:', wsUrl);

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('[WS] connected');
    };

    this.socket.onmessage = (event) => {
      this.zone.run(() => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (e) {
          console.error('[WS] invalid message', e);
        }
      });
    };

    this.socket.onclose = () => {
      console.log('[WS] disconnected, retrying...');
      setTimeout(() => this.connect(onMessage), 3000);
    };

    this.socket.onerror = (err) => {
      console.error('[WS] error', err);
    };
  }

  disconnect() {
    this.socket?.close();
    this.socket = undefined;
  }
}