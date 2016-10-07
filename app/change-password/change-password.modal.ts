/// <reference path="../../typings/globals/require/index.d.ts" />

import { Component, ViewChild } from '@angular/core';
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

import { MemberService }        from '../services/member.service';
import { UserService }          from '../services/user.service';
import { ValidationService }    from '../services/validation.service';
import { LogService } 			from '../services/log.service';
import { MessageComponent }     from '../message/message.component';
import * as constant            from '../constants';

@Component({
    selector: 'change-password-modal',
    directives: [
        FORM_DIRECTIVES,
        REACTIVE_FORM_DIRECTIVES,
        MessageComponent],
    templateUrl: 'app/change-password/change-password.modal.html'
})

export class ChangePasswordComponent {

    @ViewChild(MessageComponent) message: MessageComponent;
    private IsVisible: boolean;

    ChangePasswordForm: FormGroup;

    private changepassword = { currentPassword: '', first: '', second: '' };

    constructor(private memberService: MemberService,
        private logService: LogService,
        private router: Router,
        public userService: UserService,
        fb: FormBuilder) {
        this.ChangePasswordForm = fb.group({
            'currentPassword': ['', Validators.compose([Validators.required, ValidationService.password])],
            'newpassword': ['', Validators.compose([Validators.required, ValidationService.password])],
            'confirmpassword': ['', Validators.compose([Validators.required, ValidationService.password])],
        });
    }

    private handleError = err => {
        switch (err.status) {
            case 440:
                this.router.navigate(['Home']);
                this.userService.loggedOut();
                this.message.showMessage(constant.SESSION_TIMEOUT);
                break;
            case 401:
                this.message.showMessage(constant.NOT_AUTHORIZED);
                break;
            default:
                this.logService.logMessage('Software Failure: ' + JSON.stringify(err, null, 4));
                this.message.showMessage(constant.SOFTWARE_FAILURE);
        }
    }

    ChangePassword = () => {
        this.hideForm();
        this.memberService.changePassword(this.changepassword)
            .subscribe(
            () => this.message.showMessage('Your TTC password has been modified'),
            this.handleError);
    }

    showForm = () =>
        this.IsVisible = true;

    hideForm = () =>
        this.IsVisible = false;

    messageModalClosed = () => _.noop;
}
