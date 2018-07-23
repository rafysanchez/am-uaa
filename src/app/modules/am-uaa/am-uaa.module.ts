import {Inject, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {UaaEventService} from './uaa.event.service';
import {IdentityResolver} from './identity.resolver';
import {HTTP_INTERCEPTORS, HttpClient} from '@angular/common/http';
import {UaaSessionInterceptor} from './uaa.session.interceptor';
import {UaaJwtService} from './uaa.jwt.service';
import {StorageService} from '@bi8/am-storage';
import {UaaSessionService} from './uaa.session.service';
import {UaaService} from './uaa.service';
import {UaaConfigService} from './uaa.config.service';
import {UaaJwtInterceptor} from './uaa.jwt.interceptor';
import {JwtService} from './jwt.service';

@NgModule({
  imports: [
    CommonModule,
  ],
  providers: [UaaEventService, IdentityResolver, UaaConfigService, JwtService, {
    provide: HTTP_INTERCEPTORS,
    useClass: UaaSessionInterceptor,
    multi: true,
  }, {
    provide: HTTP_INTERCEPTORS,
    useClass: UaaJwtInterceptor,
    multi: true,
  },
  {
    provide: UaaService,
    useFactory: uaaServiceFactory,
    deps: [UaaConfigService, HttpClient, StorageService, UaaEventService, JwtService],
    multi: false
  }],
  declarations: []
})
export class AmUaaModule {
}

export function uaaServiceFactory(configService: UaaConfigService, hc: HttpClient,
                                  storageService: StorageService, uaaEventService: UaaEventService,
                                  jwtService: JwtService)  {
  if (!configService.useJwt) {
    return new UaaSessionService(hc, storageService, uaaEventService);
  } else {
    return new UaaJwtService(hc, storageService, uaaEventService, jwtService);
  }
}
