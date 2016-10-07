/// <reference path="../../typings/globals/require/index.d.ts" />

import { Component, ViewChild, OnInit } from '@angular/core';
import {
    FORM_DIRECTIVES,
    REACTIVE_FORM_DIRECTIVES,
    FormBuilder,
    FormGroup,
    FormControl,
    Validators
} from '@angular/forms';

import { Member }                           from '../models/member';
import { MemberService }                    from '../services/member.service';
import { ValidationService }                from '../services/validation.service';
import { AuthorizationService }             from '../services/authorization.service';
import { LogService }                       from '../services/log.service';
import { BaseEditor }                       from '../base-editor/base-editor.component';
import { MessageComponent }                 from '../message/message.component';
import { LiabilityAgreementComponent }      from '../liability-agreement/liability-agreement.modal';
import { CommunicationsConsentComponent }   from '../communications-consent/communications-consent.modal';
import * as constant                        from '../constants';

@Component({
    selector: 'join-modal',
    directives: [
        FORM_DIRECTIVES,
        REACTIVE_FORM_DIRECTIVES,
        MessageComponent,
        LiabilityAgreementComponent,
        CommunicationsConsentComponent],
    template: require('./join.modal.html')
})

export class JoinComponent extends BaseEditor implements OnInit {

    @ViewChild(MessageComponent) messageModal: MessageComponent;
    @ViewChild(LiabilityAgreementComponent) liabilityAgreement: LiabilityAgreementComponent;
    @ViewChild(CommunicationsConsentComponent) communicationsConsent: CommunicationsConsentComponent;
    private successfulSave = true;
    private IsVisible = false;

    ttcFormGroup: FormGroup;

    constructor(
        public memberService: MemberService,
        private logService: LogService,
        private authorizationService: AuthorizationService,
        fb: FormBuilder) {
        super();
        this.ttcFormGroup = fb.group({
            'firstname': ['', Validators.compose([Validators.required])],
            'familyname': ['', Validators.compose([Validators.required])],
            'dob': ['', Validators.compose([Validators.required, ValidationService.date])],
            'address': ['', Validators.compose([Validators.required])],
            'place': ['', Validators.compose([Validators.required])],
            'postcode': ['', Validators.compose([Validators.required, ValidationService.postcode])],
            'emailaddress': ['', Validators.compose([Validators.required, ValidationService.emailaddress])],
            'primaryphone': ['', Validators.compose([Validators.required])],
            'alternativephone': [''],
            'liabilityagreed': [''],
            'communicationsagreed': [''],
            'photoagreed': [''],
            'student': [''],
            'familyemailaddress': [''],
        });
    }

    showForm = () =>
        this.IsVisible = true;

    hideForm = () =>
        this.IsVisible = false;

    hideLiabilityAgreement = () =>
        this.showForm();

    handleError = error => {
        this.successfulSave = false;
        if (error.status === 412) {
            this.messageModal.showMessage(constant.ALREADY_A_MEMBER);
        } else {
            this.logService.logMessage('Software Failure: ' + JSON.stringify(error, null, 4));
            this.messageModal.showMessage(constant.SOFTWARE_FAILURE);
        }
    }

    join = () => {

        this.hideForm();
        this.successfulSave = true;

        // get the authorization key (required for the email) and then send the email
        const authorization$ = this.authorizationService.getAuthorizationKey(this.member.firstname, this.member.emailaddress)
            .first()
            .mergeMap((authorization: string) =>
                this.memberService.sendActivateAccountEmail(this.member.firstname, this.member.emailaddress, authorization))
            .do(() => this.messageModal.showMessage(constant.ACTIVATE_ACCOUNT_EMAIL_SENT));

        this.memberService.saveNewMember(this.member)
            .mergeMap(() => authorization$)
            .subscribe(_.noop, this.handleError);
    }

    ngOnInit() {
    }

    messageModalClosed = (unusedBoolean: boolean) => {
        if (!this.successfulSave) {
            this.showForm();
        }
    }

    showLiabilityAgreement() {
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
