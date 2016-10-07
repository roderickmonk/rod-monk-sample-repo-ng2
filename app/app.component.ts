/// <reference path="../typings/globals/require/index.d.ts" />
/// <reference path="../typings/globals/jquery/index.d.ts" />
/// <reference path="../typings/globals/jquery.simplemodal/index.d.ts" />

import { Component, OnInit, ReflectiveInjector, ViewChild }
from '@angular/core';
import { RouteConfig, Router, ROUTER_DIRECTIVES }
from '@angular/router-deprecated';
import { CORE_DIRECTIVES } from '@angular/common';

import { Member }                       from './models/member';
import { MemberService }                from './services/member.service';
import { UserService }                  from './services/user.service';
import { LogService }                   from './services/log.service';
import { NewsItemService }              from './services/newsitem.service';
import { DocumentService }              from './services/document.service';
import { FeesService }                  from './services/fees.service';
import { SearchMembershipComponent }    from './search-membership/search-membership.component';
import { HomeComponent }                from './home/home.component';
import { CalendarComponent }            from './calendar/calendar.component';
import { NewsItemComponent }            from './newsitem/newsitem.component';
import { AboutUsComponent }             from './about-us/about-us.component';
import { LoginComponent }               from './login/login.modal';
//import { LogoutComponent }              from './logout/logout.modal';
import { FeeManagerComponent }          from './fee-manager/fee-manager.component';
import { FeeConfigurationComponent }    from './fee-configuration/fee-configuration.component';
import { ChangePasswordComponent }      from './change-password/change-password.modal';
import { JoinComponent }                from './join/join.modal';
import { PersonalProfileComponent }     from './personal-profile/personal-profile.modal';
import { RenewMembershipComponent }     from './renew-membership/renew-membership.modal';
import { MessageComponent }             from './message/message.component';
import { DocumentManagerComponent }     from './document-manager/document-manager.component';
import { NewsItemManagerComponent }     from './newsitem-manager/newsitem-manager.modal';
import { ContactUsComponent }           from './contact-us/contact-us.component';
import { OnlineHelpComponent }          from './online-help/online-help.component';
import { TriviaService }                from './services/trivia.service';
import { EtiquetteService }             from './services/etiquette.service';
import { ResetPasswordComponent }       from './reset-password/reset-password.component';
import { ActivateAccountComponent }     from './activate-account/activate-account.component';
import { Observable }                   from 'rxjs/Observable';
import * as _                           from 'lodash';
import './app.component.css';

type Family = Member[];

@Component({
  selector: 'app',
  template: require('./app.component.html'),
  directives: [
    CORE_DIRECTIVES,
    ROUTER_DIRECTIVES,
    JoinComponent,
    PersonalProfileComponent,
    RenewMembershipComponent,
    ChangePasswordComponent,
    LoginComponent,
    //LogoutComponent,
    NewsItemManagerComponent,
  ],
  providers: [
    NewsItemService,
    DocumentService,
    TriviaService,
    EtiquetteService,
  ]
})

@RouteConfig([
  {
    path: '/home',
    name: 'Home',
    component: HomeComponent,
    useAsDefault: true
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: CalendarComponent,
  },
  {
    path: '/news-items',
    name: 'NewsItems',
    component: NewsItemComponent,
  },
  {
    path: '/search-membership',
    name: 'SearchMembership',
    component: SearchMembershipComponent
  },
  {
    path: '/about-us',
    name: 'AboutUs',
    component: AboutUsComponent
  },
  {
    path: '/fee-manager',
    name: 'FeeManager',
    component: FeeManagerComponent
  },
  {
    path: '/fee-configuration',
    name: 'FeeConfiguration',
    component: FeeConfigurationComponent
  },
  {
    path: '/contact-us',
    name: 'ContactUs',
    component: ContactUsComponent
  },
  {
    path: '/onlinehelp',
    name: 'OnlineHelp',
    component: OnlineHelpComponent
  },
  {
    path: '/document-manager',
    name: 'DocumentManager',
    component: DocumentManagerComponent
  },
  {
    path: '/reset-password',
    name: 'ResetPasswordComponent',
    component: ResetPasswordComponent
  },
  {
    path: '/activate-account',
    name: 'ActivateAccountComponent',
    component: ActivateAccountComponent
  },
])

export class AppComponent implements OnInit {

  @ViewChild(MessageComponent) errorMsg: MessageComponent;
  @ViewChild(JoinComponent) joinForm: JoinComponent;
  @ViewChild(PersonalProfileComponent) personalProfile: PersonalProfileComponent;
  @ViewChild(ChangePasswordComponent) changePassword: ChangePasswordComponent;
  @ViewChild(RenewMembershipComponent) renewMembership: RenewMembershipComponent;
  @ViewChild(LoginComponent) login: LoginComponent;
  //@ViewChild(LogoutComponent) logout: LogoutComponent;
  @ViewChild(NewsItemManagerComponent) newsitemManagement: NewsItemManagerComponent;

  platformDesciptor: string;
  member: Member = new Member;
  family: Family = [];
  fees: string;
  isLoggedIn: boolean;


  constructor(
    public userService: UserService,
    private memberService: MemberService,
    private feesService: FeesService,
    public router: Router) { }

  DisplayJoin = (): void => {
    this.joinForm.showForm();
  }

  DisplayPersonalProfile = (): void => {
    this.personalProfile.showForm();
  }

  DisplayChangePassword = (): void => {
    this.changePassword.showForm();
  }

  DisplayRenewMembership = (): void => {
    this.renewMembership.showForm();
  }

  DisplayLogin = (): void => {
    this.login.showForm();
  }

  DisplayNewsItemManagement = (): void => {
    this.newsitemManagement.showNewsItemManagement();
  }

  logout = (): void => {
    this.userService.loggedOut();
    this.memberService.logout();
    this.router.navigate(['Home']);
    console.log('Logging Out');
  }

  private calculateFamilyFees = (family: Family): void => {
    this.family = family.slice(0);
    this.fees = this.member.paid ? '0.00' : this.feesService.calculate(2016, this.family).toFixed(2);
  }

  ngOnInit() {
    // If starting up and we are logged in, then get member details
    if (this.userService.getToken()) {
      this.memberService.getMember()
        .do(member => this.member = member)
        .mergeMap(this.memberService.getFamily)
        .do(this.calculateFamilyFees)
        // If there is any sort of problem at startup, fallback to the logged out state
        .subscribe(_.noop, this.logout);
    }

    const logoutCleanup$ = new Observable(observer => {
      this.member = new Member;
      this.family = [];
      observer.next(null);
    });

    this.userService.loginStatus$()
      .mergeMap(loggedIn => {
        switch (loggedIn) {
          // If logging in, we need member details and family
          case true:
            return this.memberService.getMember()
              .do(member => this.member = member)
              .mergeMap(() => this.memberService.getFamily())
              .do(this.calculateFamilyFees);
          case false:
            return logoutCleanup$;
        }
      })
      .subscribe(_.noop, console.log);
  }
}
