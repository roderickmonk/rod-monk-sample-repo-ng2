/// <reference path="../../typings/globals/lodash/index.d.ts" />
/// <reference path="../../typings/globals/es6-shim/index.d.ts" />
/// <reference path="../../typings/globals/require/index.d.ts" />

import { Component, ViewChild, OnInit }     from '@angular/core';
import { Response }                         from '@angular/http';
import { MD_PROGRESS_BAR_DIRECTIVES }       from '@angular2-material/progress-bar';
import { Observable, Observer }             from 'rxjs/Rx';
//import { Observer }                         from 'rxjs/Observer';
import * as Rx from 'rxjs/Rx';
import { Member }                           from '../models/member';
import { Renewal }                          from '../models/renewal';
import { MemberService }                    from '../services/member.service';
import { UserService }                      from '../services/user.service';
import { LogService }                       from '../services/log.service';
import { ConfirmDeleteComponent }           from '../confirm-delete/confirm-delete.component';
import { MessageComponent }                 from '../message/message.component';
import { Router }                           from '@angular/router-deprecated';
import * as _                               from 'lodash';
import * as moment                          from 'moment';
import * as constant                        from '../constants';

@Component({
    selector: 'fee-configuration',
    template: require('./fee-configuration.component.html'),
    directives: [ConfirmDeleteComponent, MessageComponent, MD_PROGRESS_BAR_DIRECTIVES]
})

export class FeeConfigurationComponent implements OnInit {

    @ViewChild(ConfirmDeleteComponent) confirmDelete: ConfirmDeleteComponent;
    @ViewChild(MessageComponent) message: MessageComponent;

    accountingYear: number = moment().year();
    private isLoading: boolean = false;

    filteredMembers: Member[] = [];
    removeMemberIdCandidate: string;

    private searchKey: string = '';
    private unpaidonly = false;
    private notRenewedOnly = false;

    private members$: Observable<any>;
    private master$: Observable<any>;

    constructor(
        private memberService: MemberService,
        private logService: LogService,
        public userService: UserService,
        private router: Router) {
    }

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

    startLoading = () => {
        this.isLoading = true;
    }

    stopLoading = () =>
        this.isLoading = false;

    toggleStudent = (member: Member) => {
        this.startLoading();
        member.student = !member.student;
        this.memberService.saveMember(member)
            .subscribe(_.noop, this.handleError, this.stopLoading);
    }

    selectExec = (member: Member) => {
        this.startLoading();
        this.memberService.saveMember(member)
            .subscribe(_.noop, this.handleError, this.stopLoading);
    }

    selectRole = (member: Member) => {
        this.startLoading();
        this.memberService.saveMember(member)
            .subscribe(_.noop, this.handleError, this.stopLoading);
    }

    private saveMemberConditionally = (condition, member) => {
        if (condition) {
            return this.memberService.saveMember(member);
        } else {
            member.familyemailaddress = '';
            this.message.showMessage('Family Email Address is Unknown - Not Saved');
            return Observable.empty();
        }
    }

    updateFamilyEmailAddress = (member: Member) => {

        // If clearing the family address, then go ahead
        if (member.familyemailaddress.length === 0) {
            member.familyemailaddress = '';
            this.memberService.saveMember(member).subscribe(_.noop, this.handleError);
        }
        else {
            // Ensure that the proffered family email address is known before saving it
            const obs$ = this.members$
                .mergeMap(x => x)
                .every((m: Member) => m.emailaddress !== member.familyemailaddress)
                .mergeMap(unknown => this.saveMemberConditionally(!unknown, member));

            obs$.subscribe(_.noop, this.handleError);
        }
    }

    private memberFilter = (
        unpaidOnly: boolean,
        notRenewedOnly: boolean,
        accountingYear: number,
        searchKey: string,
        members: Array<Member>,
        renewals: Array<Renewal>) => {

        // Isolate only renewals for 'accountingYear' and then merge with member records
        members.forEach(member => {
            member.paid = renewals.some(renewal =>
                member._id === renewal.memberId && renewal.year === Number(accountingYear) && renewal.paid === true);
            member.renewed = renewals.some(renewal =>
                member._id === renewal.memberId && renewal.year === Number(accountingYear) && renewal.renewed === true);
        });

        this.filteredMembers = members.filter(member =>
            (!unpaidOnly || (unpaidOnly && !member.paid)) &&
            (!notRenewedOnly || (notRenewedOnly && !member.renewed)) &&
            (member.firstname.toLowerCase().includes(searchKey) ||
                member.familyname.toLowerCase().includes(searchKey) ||
                member.primaryphone.includes(searchKey) ||
                (member.alternativephone && member.alternativephone.includes(searchKey)) ||
                member.emailaddress.includes(searchKey)));

        this.stopLoading();
    }

    ngOnInit() {

        // Several streams to be setup
        const unpaidOnly$ = Observable.fromEvent($('#unpaidOnlyId'), 'click')
            .startWith(false)
            .map(() => $('#unpaidOnlyId').is(":checked"));

        const notRenewedOnly$ = Observable.fromEvent($('#notRenewedOnlyId'), 'click')
            .startWith(false)
            .map(() => this.notRenewedOnly = $('#notRenewedOnlyId').is(":checked"));

        const accountingYear$ = Observable.fromEvent($('#accountingYearId'), 'input')
            .startWith(moment().year())
            .map(() => $('#accountingYearId').val());

        const searchKey$ = Observable.fromEvent($('#searchKeyId'), 'keyup')
            .startWith(null)
            .debounceTime(400)
            .map(() => $('#searchKeyId').val().toLowerCase());

        // Only get the membership once, hence the cache
        this.members$ = this.memberService.getMembers();

        const renewals$ = this.memberService.getRenewals();

        this.master$ = Observable
            .combineLatest(unpaidOnly$, notRenewedOnly$, accountingYear$, searchKey$, this.members$, renewals$, this.memberFilter);

        // Immediately get the membership
        this.startLoading();
        this.master$.subscribe(_.noop, this.handleError);
    }

    removeMember = member => {
        // Take note of the _id so that we know which document to delete after user confirmation
        this.removeMemberIdCandidate = member._id;
        this.confirmDelete.showMessage(`Please confirm that you wish to delete member ${member.firstname} ${member.familyname}`);
    }

    removeMemberIdCandidateLocally = () =>
        // Remove the member from both the master and the filtered list
        this.filteredMembers = this.filteredMembers.filter((x: any) => x._id !== this.removeMemberIdCandidate);

    confirmDeleteClosed = (isConfirmed: boolean) => {
        if (isConfirmed) {
            this.startLoading();
            this.memberService.deleteMember(this.removeMemberIdCandidate)
                .subscribe(this.removeMemberIdCandidateLocally, this.handleError, this.stopLoading);
        }
    }

    messageClosed = () => _.noop;

    togglePaid = (member: Member) => {
        this.startLoading();
        this.memberService.updateRenewal({ memberId: member._id, year: Number(this.accountingYear), paid: !member.paid })
            .mergeMap(() => this.master$)
            .subscribe(_.noop, this.handleError, this.stopLoading);
    }
}
