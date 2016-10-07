import { ExceptionHandler, provide } from '@angular/core';
import { ROUTER_PROVIDERS } from '@angular/router-deprecated';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { bootstrap } from '@angular/platform-browser-dynamic';
import { AppComponent } from './app.component';
import { BaseRequestOptions, Http, HTTP_PROVIDERS, Response } from '@angular/http';
import { Headers, RequestOptions } from '@angular/http';
import { enableProdMode } from '@angular/core';
import { disableDeprecatedForms, provideForms } from '@angular/forms';
import { servicesInjectables } from './services/services';

import { AuthorizationService } from './services/authorization.service';
import { UserService }          from './services/user.service';
import { MemberService }        from './services/member.service';
import { PlatformService }      from './services/platform.service';
import { RankingService }       from './services/ranking.service';
import { LogService }           from './services/log.service';
import { FeesService }           from './services/fees.service';

class AppExceptionHandler {

    call(error, stackTrace = null, reason = null) {
        console.log('App Detected Error');
        _.isNull(error.stack) ? _.noop : console.log('error: ', error);
        _.isNull(stackTrace) ? _.noop : console.log('stackTrace: ', stackTrace);
        _.isNull(reason) ? _.noop : console.log('reason: ', reason);

        // ToDo: Send a log message to the server, probably a POST /api/log
    }
}

// ToDo: enableProdMode(); 

class AppHttpOptions extends BaseRequestOptions {

    public headers: Headers;
    constructor() {
        super();
        this.headers = new Headers();
        this.headers.append('Content-Type', 'application/json');
    }
};

bootstrap(AppComponent, [
    provide(UserService, { useClass: UserService }),
    provide(AuthorizationService, { useClass: AuthorizationService }),
    provide(MemberService, { useClass: MemberService }),
    provide(PlatformService, { useClass: PlatformService }),
    provide(RankingService, { useClass: RankingService }),
    provide(LogService, { useClass: LogService }),
    provide(FeesService, { useClass: FeesService }),
    HTTP_PROVIDERS,
    provide(RequestOptions, { useClass: AppHttpOptions }),
    servicesInjectables,
    disableDeprecatedForms(),
    provideForms(),
    ROUTER_PROVIDERS,
    provide(ExceptionHandler, { useClass: AppExceptionHandler }),
    provide(LocationStrategy, { useClass: HashLocationStrategy })
]);
