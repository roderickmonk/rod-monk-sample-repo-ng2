/// <reference path="../../typings/globals/require/index.d.ts" />

import { Component, OnInit, ViewChild } from '@angular/core';
import { Response }             from '@angular/http';
import { Router }               from '@angular/router-deprecated';
import {
    FORM_DIRECTIVES,
    REACTIVE_FORM_DIRECTIVES,
    FormBuilder,
    FormGroup,
    FormControl,
    Validators
} from '@angular/forms';

import { Member }               from '../models/member';
import { MemberService }        from '../services/member.service';
import { UserService }          from '../services/user.service';
import { ValidationService }    from '../services/validation.service';
import { LogService } 			from '../services/log.service';
import { AuthorizationService } from '../services/authorization.service';
import { MessageComponent }     from '../message/message.component';
import * as constant            from '../constants';

@Component({
    selector: 'reset-password',
    directives: [
        FORM_DIRECTIVES,
        REACTIVE_FORM_DIRECTIVES,
        MessageComponent],
    templateUrl: 'app/reset-password/reset-password.component.html',
})

export class ResetPasswordComponent implements OnInit {

    @ViewChild(MessageComponent) message: MessageComponent;
    private socketIoConnection: any;
    private firstName: string;
    private emailAddress: string;

    public ResetPasswordForm: FormGroup;

    private changepassword = { first: '', second: '' };

    constructor(private memberService: MemberService,
        private logService: LogService,
        public userService: UserService,
        public authorizationService: AuthorizationService,
        private router: Router,
        public fb: FormBuilder) {
        this.ResetPasswordForm = fb.group({
            'newpassword': ['', Validators.compose([Validators.required, ValidationService.password])],
            'confirmpassword': ['', Validators.compose([Validators.required, ValidationService.password])],
        });
    }

    private handleError = (err: Response) => {
        if (err.status === 440) {
            this.router.navigate(['Home']);
            this.userService.loggedOut();
            this.message.showMessage(constant.SESSION_TIMEOUT);
        } else {
            this.logService.logMessage('Server Failure: ' + JSON.stringify(err, null, 4));
            this.message.showMessage(constant.SOFTWARE_FAILURE);
        }
    }

    resetPassword = () => {

        let member = new Member();
        member.firstname = this.firstName;
        member.emailaddress = this.emailAddress;
        member.password = this.changepassword.first;

        // Resetting the password also does a login
        this.memberService.resetPassword(member)
            .subscribe(
            privileges => {
                console.log(privileges);
                this.userService.loggedIn(privileges);
                this.message.showMessage(constant.NEW_PASSWORD_SAVED);
            },
            this.handleError);
    }

    messageModalClosed = () => this.router.navigate(['Home']);

    ngOnInit() {

        let authorizationKey = document.location.href.substring(document.location.href.indexOf('=') + 1);

        this.authorizationService.getLoginDetails(authorizationKey)
            .subscribe(
            (loginDetails: string) => {
                [this.firstName, this.emailAddress] = loginDetails.split('|');
            },
            this.handleError);
    }
}
