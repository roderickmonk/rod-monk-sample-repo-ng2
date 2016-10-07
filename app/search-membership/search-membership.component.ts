/// <reference path="../../typings/globals/require/index.d.ts" />
/// <reference path="../../typings/globals/lodash/index.d.ts" />

import { Component, OnInit, OnDestroy, ViewChild }
from '@angular/core';
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

import { MD_PROGRESS_BAR_DIRECTIVES } from '@angular2-material/progress-bar';
import { Observable }               from 'rxjs/Observable';
import { Subscription }             from 'rxjs/Subscription';
import { Member }                   from '../models/member';
import { MemberService }            from '../services/member.service';
import { UserService }              from '../services/user.service';
import { LogService }               from '../services/log.service';
import { RankingService }           from '../services/ranking.service';
import { MessageComponent }         from '../message/message.component';
import * as constant                from '../constants';

const template = require('./search-membership.component.html');

@Component({
  selector: 'sg-search-membership',
  template: template,
  directives: [MessageComponent, MD_PROGRESS_BAR_DIRECTIVES]
})

export class SearchMembershipComponent implements OnInit /*, ToDo: OnDestroy */ {

  @ViewChild(MessageComponent) message: MessageComponent;

  filteredMembers: Member[] = [];
  isLoading: boolean = false;

  rankings: any[] = [];
  filteredRankings: any[] = [];
  rankingGenderLabel: string;
  displayWomensRankings: boolean;


  constructor(
    private memberService: MemberService,
    private logService: LogService,
    public userService: UserService,
    private rankingService: RankingService,
    // ToDo: private searchSubscription: Subscription,
    private router: Router) { }

  private handleError = (err): void => {
    this.stopLoading();
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
      console.log('error: ', JSON.stringify(err, null, 4));
      this.logService.logMessage('Software Failure: ' + JSON.stringify(err, null, 4));
      this.message.showMessage(constant.SOFTWARE_FAILURE);
    }
  }

  startLoading = () =>
    this.isLoading = true;

  stopLoading = () =>
    this.isLoading = false;

  private memberFilter = (searchKey, members) => {

    this.filteredMembers = members.filter(member =>
      member.firstname.toLowerCase().includes(searchKey) ||
      member.familyname.toLowerCase().includes(searchKey) ||
      member.primaryphone.includes(searchKey) ||
      (member.alternativephone && member.alternativephone.includes(searchKey)) ||
      member.emailaddress.includes(searchKey));

    this.stopLoading();
  }

  initRanking = () => {

    // Randomly select which gender's rankings to start with
    this.displayWomensRankings = Math.floor((Math.random() * 10)) % 2 === 0;

    let changeGenderRankings = () => {

      // Filter in the selected gender rankings
      this.filteredRankings = this.rankings.filter(ranking =>
        this.displayWomensRankings === true && ranking.gender === 'female' ||
        this.displayWomensRankings === false && ranking.gender === 'male');

      this.rankingGenderLabel = this.displayWomensRankings ? `Women's Pro Rankings` : `Men's Pro Rankings`;

      this.displayWomensRankings = !this.displayWomensRankings;
    }

    // Get the Rankings
    this.rankingService.getRankings()
      .subscribe(rankings => {
        this.rankings = _.orderBy(rankings.slice(0), 'rank', 'asc');
        changeGenderRankings();
      }, this.handleError);

    // Monitor for clicks on the rankings panel header
    Observable.fromEvent(document.getElementById('rankings-panel'), 'click')
      .subscribe(changeGenderRankings, this.handleError);
  }

  ngOnInit() {

    // Monitor for changes to the search string
    const searchKey$ = Observable.fromEvent($('#searchKeyId'), 'keyup')
      .startWith(null)
      .debounceTime(400) // Wait for user to stop typing
      .map(() => $('#searchKeyId').val().toLowerCase());

    // Get the membership right away
    this.startLoading();
    Observable.combineLatest(searchKey$, this.memberService.getMembers().cache(), this.memberFilter)
      .subscribe(_.noop, err => this.handleError(err));

    // Initialize rankings display
    this.initRanking();
  }

  messageClosed = () => _.noop;

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    // ToDo: this.searchSubscription.unsubscribe();
  }
}
