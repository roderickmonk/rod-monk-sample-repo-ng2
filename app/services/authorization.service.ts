import { bind, Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import * as io from 'socket.io-client';

import { UserService } from '../services/user.service';

@Injectable()
export class AuthorizationService {
	socket;

	constructor() {
		console.log('ResetPasswordService constructor');
		this.socket = io();
	}

	getAuthorizationKey = (firstname: string, emailaddress: string) =>
		new Observable(observer => {
			// Remotely configure socket.io to return a message back
			this.socket.emit('request-clientid', `${firstname}|${emailaddress}`);

			// Listen for the response
			this.socket.on('clientid', authorizationKey => observer.next(authorizationKey));
		});

	getLoginDetails = (authorizationKey) =>
		new Observable(observer => {
			this.socket.emit('request-firstname-emailaddress', authorizationKey);
			this.socket.on('firstname-emailaddress', data => observer.next(data));
		});
}

export var SocketIoServiceInjectables: Array<any> = [
    bind(AuthorizationService).toClass(AuthorizationService)
];