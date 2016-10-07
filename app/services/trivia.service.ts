import { bind, Injectable }         from '@angular/core';
import { Observable }               from 'rxjs/Observable';
import { ObservableService }        from './observable.service';
import { UserService }              from './user.service';

@Injectable()
export class TriviaService extends ObservableService {

  constructor(userService: UserService) { super(userService); }

    getTrivia = (): Observable<any> =>
        this.http.get('/api/trivia').map(this.extractData);
}

export var triviaServiceInjectables: Array<any> = [
    bind(TriviaService).toClass(TriviaService)
];
