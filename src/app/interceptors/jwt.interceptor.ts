import { Injectable } from '@angular/core';
import { HttpInterceptor } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  async intercept(req: any, next: any) {
    const token = await Preferences.get({ key: 'token' });

    if (token.value) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token.value}`
        }
      });
    }

    return next.handle(req);
  }
}
