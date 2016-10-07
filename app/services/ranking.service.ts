import { bind, Injectable }         from '@angular/core';
import { Observable }               from 'rxjs/Observable';
import { ObservableService }        from './observable.service';
import { UserService }              from './user.service';

@Injectable()
export class RankingService extends ObservableService {

  constructor(userService: UserService) { super(userService); }

    getRankings = (): Observable<any> =>
        this.http.get('/api/rankings').cache().map(this.extractData);
}

export var rankingServiceInjectables: Array<any> = [
    bind(RankingService).toClass(RankingService)
];
