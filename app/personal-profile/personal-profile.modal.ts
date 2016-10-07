/// <reference path="../../typings/globals/require/index.d.ts" />
/// <reference path="../../typings/globals/jquery/index.d.ts" />
/// <reference path="../../typings/globals/jquery.simplemodal/index.d.ts" />

import { Component, ViewChild, OnInit } from '@angular/core';
import { Router} from '@angular/router-deprecated';
import { Response } from '@angular/http';
import {
    FORM_DIRECTIVES,
    REACTIVE_FORM_DIRECTIVES,
    FormBuilder,
    FormGroup,
    FormControl,
    Validators
} from '@angular/forms';

import { Member }               from '../models/member';
import { BaseEditor }           from '../base-editor/base-editor.component';
import { MemberService }        from '../services/member.service';
import { UserService }          from '../services/user.service';
import { LogService }           from '../services/log.service';
import { ValidationService }    from '../services/validation.service';
import { MessageComponent }     from '../message/message.component';
import * as constant            from '../constants';

@Component({
    selector: 'personal-profile-modal',
    template: require('./personal-profile.modal.html'),
    directives: [FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES, MessageComponent]
})

export class PersonalProfileComponent extends BaseEditor implements OnInit {

    @ViewChild(MessageComponent) message: MessageComponent;
    public IsVisible: boolean = false;
    PersonalProfileForm: FormGroup;

    constructor(
        private memberService: MemberService,
        private logService: LogService,
        public userService: UserService,
        private router: Router,
        fb: FormBuilder) {
        super();
        this.PersonalProfileForm = fb.group({
            'firstname': ['', Validators.compose([Validators.required])],
            'familyname': ['', Validators.compose([Validators.required])],
            'dob': ['', Validators.compose([Validators.required, ValidationService.date])],
            'address': ['', Validators.compose([Validators.required])],
            'place': ['', Validators.compose([Validators.required])],
            'postcode': ['', Validators.compose([Validators.required, ValidationService.postcode])],
            'emailaddress': ['', Validators.compose([Validators.required, ValidationService.emailaddress])],
            'primaryphone': ['', Validators.compose([Validators.required])],
            'alternativephone': [''],
            'student': [''],
            'familyemailaddress': [''],
            'joiningyear': ['', Validators.compose([Validators.required, ValidationService.joiningYear])],
        });
    }

    ngOnInit() {
        const options = {
            "backdrop": false,
            "keyboard": true
        }
        $("#personalprofilemodal").modal(options);
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

    showForm = () =>
        this.memberService.getMember()
            .subscribe(
            member => {
                this.member = member;
                this.member.dob = this.member.dob.slice(0, 10);
                this.member.firstname = _.capitalize(this.member.firstname);
                this.IsVisible = true;
            },
            error => this.handleError(error));

    hideForm = () =>
        this.IsVisible = false;

    SaveChanges = () => {
        this.hideForm();
        this.memberService.saveMember(this.member)
            .subscribe(
            () => this.message.showMessage('Changes to your Personal Profle have been saved.'),
            error => this.handleError(error));
    }

    messageModalClosed = (unusedBoolean: boolean) =>
        _.noop;
}
