import {Injectable} from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest} from '@angular/common/http';
import * as _ from 'lodash';
import {UaaEventService} from './uaa.event.service';
import {UaaEvent} from './uaa.event';
import {Observable} from 'rxjs/Observable';

import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/retry';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/finally';
import 'rxjs/add/observable/throw';
import {UaaConfigService} from './uaa.config.service';

@Injectable()
export class UaaSessionInterceptor implements HttpInterceptor {

  cachedRequests: Array<HttpRequest<any>> = [];

  constructor(private uaaEventService: UaaEventService,
              private configService: UaaConfigService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.configService.useJwt) {
      return next.handle(req);
    }
    const xRequestedWith = req.clone({
      headers: req.headers.set('X-Requested-With', 'XMLHttpRequest')
        .set('Cache-Control', 'no-cache')
        .set('Pragma', 'no-cache')
        .set('Expires', 'Sat, 01 Jan 2000 00:00:00 GMT')
    });

    const observable = next.handle(xRequestedWith);

    return observable.map((event: HttpEvent<any>) => {
      return event;
    }).catch(error => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401 && !_.endsWith(error.url, '/login')) {
          this.uaaEventService.broadcast(UaaEvent.LOGIN_REQUIRED);
          return this.uaaEventService.getEventSourceObserver().filter(event => {
            return event == UaaEvent.LOGIN_PROVIDED;
          }).concatMap(event => observable.retry(1));
        } else {
          return Observable.throw(error);
          //return Observable.empty() as Observable<HttpEvent<any>>;
        }
      }
    });
  }
}
