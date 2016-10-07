/// <reference path="../../typings/globals/es6-shim/index.d.ts" />

import { bind, Injectable }         from '@angular/core';
import { Http, Response }           from '@angular/http';
import { Headers, RequestOptions }  from '@angular/http';
import { Observable }               from 'rxjs/Observable';

import { ObservableService }        from './observable.service';
import { UserService }              from './user.service';
import { Member }                   from '../models/member';
import { Renewal }                  from '../models/renewal';

@Injectable()
export class MemberService extends ObservableService {

  constructor(userService: UserService) {
    super(userService);
    console.log('MemberService Constructor');
  }

  private cleanMemberData = (member: Member): Member => {
    member.firstname = _.capitalize(member.firstname);
    member.familyname = _.capitalize(member.familyname);
    member.dob = _.isUndefined(member.dob) || member.dob.length < 10 ? null : member.dob.slice(0, 10);
    return member;
  }
  getMember = (): Observable<Member> =>
    this.http.get('/api/members/' + this.userService.getToken(), this.headerOptions())
      .map(this.extractData)
      .map(this.cleanMemberData);

  getMembers = (): Observable<Member[]> =>
    this.http.get('/api/members', this.headerOptions())
      .map(this.extractData)
      .map(members => _.orderBy(members, (member: any) => member.familyname.toLowerCase(), 'asc'))
      .map(members => members.map(this.cleanMemberData))
      .cache();

  getFamily = (): Observable<Member[]> =>
    this.http.get('/api/members/' + this.userService.getToken() + '/family', this.headerOptions())
      .map(this.extractData);

  getMembersAndRenewals = () =>
    // Wait for both sets of data to arrive
    Observable.forkJoin(this.getMembers(), this.getRenewals());

  getRenewals = (): Observable<Renewal[]> =>
    this.http.get('/api/renewals', this.headerOptions())
      .map(this.extractData);

  updateRenewal = (renewal: any) =>
    this.http.put('/api/renewals', renewal, this.headerOptions());

  deleteMember = (id: string) =>
    this.http.delete('/api/members/' + id, this.headerOptions());

  getMemberCount = (): Observable<number> =>
    this.http.get('/api/members/count').timeout(600000, 'timeout has occurred')
      .map(this.extractData);

  saveMember = (member: Member) =>
    this.http.put('/api/members/' + this.userService.getToken(), member, this.headerOptions());

  renewMembership = (member: Member) =>
    this.http.put('/api/members/' + this.userService.getToken() + '/renew', member, this.headerOptions());

  saveNewMember = (member: Member) =>
    this.http.post('/api/members', member, this.headerOptions());

  changePassword = (currentAndNewPassword: any) =>
    this.http.post('/api/members/' + this.userService.getToken() + '/change-password', currentAndNewPassword, this.headerOptions());

  resetPassword = (member: Member) => this.http.post('/api/members/reset-password', member)
    .map(this.extractData);

  login = (existingPassword: boolean, member: Member) =>
    this.http.post(existingPassword ? '/api/members/login' : '/api/members/signup', member, this.headerOptions())
      .map(this.extractData);

  logout = () =>
    this.http.post('/api/members/logout', null);

  sendResetPasswordEmail = (firstname: string, emailaddress: string, authorization: string) =>
    this.http.put('/api/send-password-reset-email', { firstname: firstname, emailaddress: emailaddress, authorization: authorization });

  sendActivateAccountEmail = (firstname: string, emailaddress: string, authorization: string) =>
    this.http.put('/api/send-activate-account-email', { firstname: firstname, emailaddress: emailaddress, authorization: authorization });

  activateAccount = (member: Member) => this.http.post('/api/members/activate-account', member);

  isMemberKnown = (firstname: string, emailaddress: string) =>
    this.http.put('/api/memberknown', { firstname: firstname, emailaddress: emailaddress })
      .map(this.extractData);
}

export const memberServiceInjectables: Array<any> = [bind(MemberService).toClass(MemberService)];
