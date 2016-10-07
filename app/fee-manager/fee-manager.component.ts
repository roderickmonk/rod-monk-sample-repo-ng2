/// <reference path="../../typings/globals/lodash/index.d.ts" />
/// <reference path="../../typings/globals/moment/index.d.ts" />
/// <reference path="../../typings/globals/es6-shim/index.d.ts" />
/// <reference path="../../typings/globals/require/index.d.ts" />
/// <reference path="../../typings/globals/assert/index.d.ts" />

import { Component, ViewChild, OnInit }
from '@angular/core';
import { NgForm }                       from '@angular/common';
import { Response }                     from '@angular/http';
import { Router }                       from '@angular/router-deprecated';
import { MD_PROGRESS_BAR_DIRECTIVES }   from '@angular2-material/progress-bar';
import { Observable }                   from 'rxjs/Observable';

import { Member }                   from '../models/member';
import { Account }                  from '../models/account';
import { Renewal }                  from '../models/renewal';
import { MemberService }            from '../services/member.service';
import { UserService }              from '../services/user.service';
import { LogService }               from '../services/log.service';
import { FeesService }               from '../services/fees.service';
import { AccountManagerComponent }  from './account-manager.component';
import { MessageComponent }         from '../message/message.component';
import * as constant                from '../constants';

import * as moment from 'moment';
import * as _ from 'lodash';

@Component({
    selector: 'fee-manager',
    template: require('./fee-manager.component.html'),
    directives: [MessageComponent, MD_PROGRESS_BAR_DIRECTIVES]
})

export class FeeManagerComponent extends AccountManagerComponent implements OnInit {

    @ViewChild(MessageComponent) message: MessageComponent;

    private isLoading: boolean = false;
    private accountingYear: number = moment().year();
    private filteredAccounts: Account[] = [];

    // The master observable: a concatenation of multiple filters
    private master$: Observable<any>;
    private accountingYear$: Observable<any>;

    constructor(
        private memberService: MemberService,
        public userService: UserService,
        public logService: LogService,
        public feesService:FeesService,
        private router: Router) {
        super(logService, feesService);
    }

    startLoading = () =>
        this.isLoading = true;

    stopLoading = () =>
        this.isLoading = false;

    private handleError = err => {
        switch (err.status) {
            case 440:
                this.router.navigate(['Home']);
                this.userService.loggedOut();
                this.message.showMessage(constant.SESSION_TIMEOUT);
                break;
            default:
                this.logService.logMessage('Server Failure: ' + JSON.stringify(err, null, 4));
                this.message.showMessage(constant.SOFTWARE_FAILURE);
        }
    }

    private accountFilter = (unpaidOnly: boolean, accountingYear: number, searchKey: string, members: Array<Member>, renewals: Array<Renewal>) => {

        //console.log(`${unpaidOnly}, ${accountingYear}, ${searchKey}, members.length: ${members.length}, renewals.length: ${renewals.length}`);

        // Join up the paid statuses / members for the given year
        members.forEach(member =>
            member.paid = renewals.some(renewal =>
                member._id === renewal.memberId && renewal.year === Number(accountingYear) && renewal.paid === true));

        this.filteredAccounts = this.generateAccounts(accountingYear, members)
            .filter(account =>
                (!unpaidOnly || (unpaidOnly && !account.paid)) &&
                (account.accountname.toLowerCase().includes(searchKey)));

        // ToDo: the placement of the following line is awkward - reconsider
        this.stopLoading();
    }

    ngOnInit() {

        // Create all the streams
        const unpaidOnly$ = Observable.fromEvent($('#unpaidOnlyId'), 'click')
            .startWith(false)
            .map(() => $('#unpaidOnlyId').is(":checked"));

        this.accountingYear$ = Observable.fromEvent($('#accountingYearId'), 'input')
            .startWith(moment().year())
            .map(() => $('#accountingYearId').val());

        const searchKey$ = Observable.fromEvent($('#searchKeyId'), 'keyup')
            .startWith(null)
            .debounceTime(400)
            .map(() => $('#searchKeyId').val().toLowerCase());

        const members$ = this.memberService.getMembers().cache();

        const renewals$ = this.memberService.getRenewals();

        this.startLoading();
        this.master$ = Observable
            .combineLatest(unpaidOnly$, this.accountingYear$, searchKey$, members$, renewals$, this.accountFilter);

        // Get the membership right away
        this.master$
            .subscribe(_.noop, this.handleError);
    }

    // Flag all members belonging to the account as paid (or not)
    private togglePaid = (account: Account) => {

        this.startLoading();

        // Merge all the 'updateRenewal' Observables
        let memberPaidStream$ = Observable.empty();
        account.family.forEach(member =>
            memberPaidStream$ = memberPaidStream$
                .merge(this.memberService.updateRenewal({ memberId: member._id, year: this.accountingYear, paid: !account.paid })));

        // Bring the UI up-to-date
        memberPaidStream$
            .first() // Trigger on the first one (or last one, it does not matter)
            .mergeMap(() => this.master$)
            .subscribe(_.noop, this.handleError);
    }

    messageClosed = () => _.noop;
}
