import { bind, Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

// UserService provides a means for the controllers to share user login status and user role
@Injectable()
export class UserService {

    private JWT: string;
    private exec: string;
    private permissions: string[];
    private localStorageSupported: boolean;
    private loginStatus: Subject<boolean> = new Subject<boolean>();

    constructor() {

        this.localStorageSupported = this.isLocalStorageSupported();

        console.log('UserService Constructor');

        if (this.localStorageSupported) {
            if ((this.JWT = localStorage.getItem('JWT')) === 'null') {
                this.JWT = null;
            }
            this.exec = localStorage.getItem('exec');
            if (!!localStorage.getItem('permissions')) {
                this.permissions = localStorage.getItem('permissions').split(',');
            } else {
                this.permissions = [];
            }
        }
    }

    loginStatus$ = (): Observable<boolean> => {
        return this.loginStatus.asObservable();
    }

    // Confirm or not whether LocalStorage is available
    private isLocalStorageSupported = () => {
        const testKey = 'test',
            storage = window.localStorage;
        try {
            storage.setItem(testKey, '1');
            storage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    loggedIn = (privileges: any) => {

        if (this.localStorageSupported) {
            localStorage.setItem('JWT', privileges.jwt);
            localStorage.setItem('exec', privileges.exec);
            localStorage.setItem('permissions', privileges.permissions);
        }

        this.JWT = privileges.jwt;
        this.exec = privileges.exec;
        this.permissions = privileges.permissions;

        // Let everyone know that we have been logged in
        this.loginStatus.next(true);
    }

    loggedOut = () => {

        if (this.localStorageSupported) {
            localStorage.setItem('JWT', null);
            localStorage.setItem('exec', null);
            localStorage.setItem('permissions', null);
        }

        this.JWT = null;
        this.exec = null;
        this.permissions = null;

        // Let everyone know that we have been logged out
        this.loginStatus.next(false);
    }

    isLoggedIn = () => !!this.JWT;


    getToken = () => this.JWT;


    getExec = () => this.exec;

    getPermissions = () => this.permissions;

    hasPermission = (permission: string) => !!this.permissions && this.permissions.indexOf(permission) >= 0;
}

export var userServiceInjectables: Array<any> = [
    bind(UserService).toClass(UserService)
];
