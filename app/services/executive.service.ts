import { bind, Injectable }         from '@angular/core';
import { Http, Response }           from '@angular/http';
import { Observable }               from 'rxjs/Observable';


import { ObservableService }        from './observable.service';
import { UserService }              from './user.service';

@Injectable()
export class ExecutiveService extends ObservableService {

  constructor(userService: UserService) { super(userService); }

    getExecutive = () =>
        this.http.get('/api/executive', this.headerOptions()).map(this.extractData);
}

export var executiveServiceInjectables: Array<any> = [
    bind(ExecutiveService).toClass(ExecutiveService)
];
