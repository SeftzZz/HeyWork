import { Injectable, NgZone } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WsService {
  private socket?: WebSocket;

  constructor(private zone: NgZone) {}

  connect(onMessage: (data: any) => void) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

    this.socket = new WebSocket(environment.ws_url); // contoh: wss://api.domain/ws

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
      console.log('[WS] disconnected');
      // optional: reconnect
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
