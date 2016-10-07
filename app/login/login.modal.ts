/// <reference path="../../typings/globals/require/index.d.ts" />

import { Component, OnInit, ViewChild } from '@angular/core';
import { Response } from '@angular/http';
import { Router } from '@angular/router-deprecated';
import {
    FORM_DIRECTIVES,
    REACTIVE_FORM_DIRECTIVES,
    FormBuilder,
    FormGroup,
    FormControl,
    Validators
} from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { ButtonRadioDirective, ButtonCheckboxDirective } from 'ng2-bootstrap/components/buttons';

import { Member }               from '../models/member';
import { MemberService }        from '../services/member.service';
import { UserService }          from '../services/user.service';
import { ValidationService }    from '../services/validation.service';
import { LogService }           from '../services/log.service';
import { NormalizationService } from '../services/normalization.service';
import { AuthorizationService } from '../services/authorization.service';
import { MessageComponent }     from '../message/message.component';
import * as constant            from '../constants';

@Component({
    selector: 'login-modal',
    directives: [ButtonCheckboxDirective, REACTIVE_FORM_DIRECTIVES, FORM_DIRECTIVES, MessageComponent],
    template: require('./login.modal.html'),
})

export class LoginComponent implements OnInit {

    @ViewChild(MessageComponent) messageModal: MessageComponent;
    public IsVisible: boolean = false;
    public forgotPassword: boolean = false;
    public already_have_a_password: boolean = true;
    public LoginForm: FormGroup;

    private member: Member;
    private redisplayLogin: boolean;

    constructor(
        private memberService: MemberService,
        private logService: LogService,
        public userService: UserService,
        public authorizationService: AuthorizationService,
        private _router: Router,
        fb: FormBuilder) {
        this.LoginForm = fb.group({
            'firstname': ['', Validators.compose([Validators.required])],
            'familyname': ['', Validators.compose([Validators.required])],
            'dob': ['', Validators.compose([Validators.required, ValidationService.date])],
            'postcode': ['', Validators.compose([Validators.required, ValidationService.postcode])],
            'emailaddress': ['', Validators.compose([Validators.required, ValidationService.emailaddress])],
            'password': ['', Validators.compose([Validators.required, ValidationService.password])],
            'confirmpassword': ['', Validators.compose([Validators.required, ValidationService.password])],
        });
    }

    private handleError = (err): void => {
        if (err.status) {
            switch (err.status) {
                case 401:
                    this.messageModal.showMessage('Login Unsuccessful');
                    return;
                case 402:
                    this.messageModal.showMessage('Account is in arrears - Login Aborted');
                    return;
            }
        }
        this.logService.logMessage('Server Failure: ' + JSON.stringify(err, null, 4));
        this.messageModal.showMessage(constant.SOFTWARE_FAILURE);
    }

    onLogin = (): void => {
        this.hideForm();

        this.memberService.login(this.already_have_a_password, this.member)
            .do(privileges => this.userService.loggedIn(privileges))
            .subscribe(
            () => this.messageModal.showMessage('Login Successful!'),
            this.handleError);
    }

    cancel = (): void => {
        this.hideForm();
        this.forgotPassword = false;
    }

    onBlurPostCode = (): string =>
        this.member.postcode = NormalizationService.postcode(this.member.postcode);

    onBlurDoB = (): string =>
        this.member.dob = NormalizationService.date(this.member.dob);

    showForm = (): void => {
        this.IsVisible = true;
    }

    hideForm = () =>
        this.IsVisible = false;

    messageModalClosed = (): void => {
        this.redisplayLogin ? this.showForm() : _.noop;
    }

    showForgotPassword = () => {
        this.forgotPassword = true;
    }

    sendResetPasswordEmail = (): void => {

        this.hideForm();
        const unknownMsg$ = new Observable(observer => {
            this.messageModal.showMessage('First Name / Email Address is unknown');
            observer.next(null);
        });

        // get the authorization key (required for the email) and then send the email
        const authorization$ = this.authorizationService.getAuthorizationKey(this.member.firstname, this.member.emailaddress)
            .first()
            .mergeMap((authorization: string) =>
                this.memberService.sendResetPasswordEmail(this.member.firstname, this.member.emailaddress, authorization))
            .do(() => {
                this.messageModal.showMessage(constant.RESET_PASSWORD_EMAIL_SENT);
                this.redisplayLogin = false;
                this.forgotPassword = false;
            });

        // Ensure that the firstname / emailaddress actually exists in the database
        this.memberService.isMemberKnown(this.member.firstname, this.member.emailaddress)
            .mergeMap(valid => valid.isKnown ? authorization$ : unknownMsg$)
            .subscribe(_.noop, this.handleError);
    }

    ngOnInit(): void {
        this.redisplayLogin = false;
        this.forgotPassword = false;
        this.already_have_a_password = true;
        this.member = new Member();
    }
}
