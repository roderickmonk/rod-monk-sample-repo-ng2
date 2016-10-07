/// <reference path="../../typings/globals/require/index.d.ts" />

import { Component, ViewChild } from '@angular/core';
import { Response }             from '@angular/http';
import { Router }               from '@angular/router-deprecated';
import { Member }               from '../models/member';
import { MemberService }        from '../services/member.service';
import { UserService }          from '../services/user.service';
import { LogService }           from '../services/log.service';
import { ValidationService }    from '../services/validation.service';
import { MessageComponent }     from '../message/message.component';
import {
    FORM_DIRECTIVES,
    REACTIVE_FORM_DIRECTIVES,
    FormBuilder,
    FormGroup,
    FormControl,
    Validators
} from '@angular/forms';
import { LiabilityAgreementComponent }      from '../liability-agreement/liability-agreement.modal';
import { CommunicationsConsentComponent }   from '../communications-consent/communications-consent.modal';
import * as constant                        from '../constants';

@Component({
    selector: 'renew-membership-modal',
    template: require('./renew-membership.modal.html'),
    styles: ['.panel-heading {background-image: url("/assets/images/panel_header.png"); color: white; }'],
    directives: [
        FORM_DIRECTIVES,
        REACTIVE_FORM_DIRECTIVES,
        MessageComponent,
        LiabilityAgreementComponent,
        CommunicationsConsentComponent]
})

export class RenewMembershipComponent {

    @ViewChild(MessageComponent) message: MessageComponent;
    @ViewChild(LiabilityAgreementComponent) liabilityAgreement: LiabilityAgreementComponent;
    @ViewChild(CommunicationsConsentComponent) communicationsConsent: CommunicationsConsentComponent;

    public IsVisible: boolean = false;
    RenewMembershipForm: FormGroup;
    private member = new Member();

    constructor(
        private memberService: MemberService,
        private router: Router,
        private logService: LogService,
        public userService: UserService,
        fb: FormBuilder) {
        this.RenewMembershipForm = fb.group({
            'liabilityagreed': [''],
            'communicationsagreed': [''],
            'photoagreed': [''],
            'student': [''],
            'familyemailaddress': [''],
            'joiningyear': ['', Validators.compose([Validators.required, ValidationService.joiningYear])],
        });
    }

    ngOnInit() { }

    private handleError = (err): void => {
        if (err.status) {
            switch (err.status) {
                case 440:
                    this.router.navigate(['Home']);
                    this.userService.loggedOut();
                    this.message.showMessage(constant.SESSION_TIMEOUT);
                    return;
                case 401:
                    this.router.navigate(['Home']);
                    this.userService.loggedOut();
                    this.message.showMessage(constant.NOT_AUTHORIZED);
                    return;
            }
        }
        console.log('error: ', JSON.stringify(err, null, 4));
        this.logService.logMessage('Software Failure: ' + JSON.stringify(err, null, 4));
        this.message.showMessage(constant.SOFTWARE_FAILURE);
    }

    showForm = () =>
        this.memberService.getMember()
            .subscribe(member => {
                this.member = member;
                // Member must reaffirm liability and comms agreements every year
                this.member.liabilityagreed = false;
                this.member.communicationsagreed = false;
                this.IsVisible = true;
            },
            error => this.handleError(error));

    hideForm = () =>
        this.IsVisible = false;

    Renew = () => {
        this.hideForm();
        this.memberService.renewMembership(this.member)
            .subscribe(
            () => {
                this.message.showMessage('Your application to renew your membership has been saved.');
                this.hideForm();
            },
            this.handleError);
    }

    messageModalClosed = (unusedBoolean: boolean) =>
        _.noop;

    showLiabilityAgreement = () => {
        this.liabilityAgreement.showModal();
        this.hideForm();
    }

    liabilityAgreementClosed = (unusedBoolean: boolean) =>
        this.showForm();

    showCommunicationsConsent = () => {
        this.communicationsConsent.showModal();
        this.hideForm();
    }

    communicationsConsentClosed = () =>
        this.showForm();
}
