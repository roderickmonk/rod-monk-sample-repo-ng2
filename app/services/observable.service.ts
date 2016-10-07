import { Inject, ReflectiveInjector }                   from '@angular/core';
import { BaseRequestOptions, Http,
    HTTP_PROVIDERS, Response }                  from '@angular/http';
import { Headers, RequestOptions }              from '@angular/http';
import { Observable }                           from 'rxjs';

import { UserService }                          from './user.service';
import { PlatformService }                      from './platform.service';

// ObservableService provides some common utilities required by all http services
export class ObservableService {

    protected http: Http;
    protected platformService: PlatformService = new PlatformService();

    constructor(protected userService: UserService) {

        const injector = ReflectiveInjector.resolveAndCreate([HTTP_PROVIDERS]);
        this.http = injector.get(Http);
    }

    protected headerOptions = () => {
        let headers = new Headers();
        // Determine if we should provide an 'x-auth' header
        let token: string;
        (token = this.userService.getToken()) ? headers.append('x-auth', token) : _.noop;
        this.platformService ? headers.append('device', PlatformService.descriptor) : _.noop;
        return new RequestOptions({ headers: headers });
    }

    protected jsonHeader = () => {
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        return new RequestOptions({ headers: headers });
    }

    protected extractData(res: any) {
        const body = res.json();
        return body || {};
    }
}