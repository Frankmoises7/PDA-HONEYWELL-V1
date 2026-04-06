import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class NoCacheInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const url = req.url || '';
    const isCriticalEndpoint =
      url.includes('getInventariosProductos') || url.includes('getProductosEscaneados');

    if (!isCriticalEndpoint) {
      return next.handle(req);
    }

    const isGet = req.method.toUpperCase() === 'GET';

    const headers = req.headers
      .set('Cache-Control', 'no-cache, no-store, must-revalidate')
      .set('Pragma', 'no-cache')
      .set('Expires', '0');

    const requestNoCache = isGet
      ? req.clone({
          headers,
          params: req.params.set('_ts', Date.now().toString())
        })
      : req.clone({ headers });

    return next.handle(requestNoCache);
  }
}

