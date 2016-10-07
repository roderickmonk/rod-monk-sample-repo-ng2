// imports 
import { Member }               from '../models/member';
import { Renewal }              from '../models/renewal';
import { Account }              from '../models/account';
import { LogService }           from '../services/log.service';
import { FeesService }          from '../services/fees.service';

import * as moment from 'moment';
import * as _ from 'lodash';

// aliases
type Family = Member[];

export class AccountManagerComponent {

    private listOfFamilies: Array<Family> = [];

    constructor(
        protected logService: LogService,
        protected feesService: FeesService) { }

    protected findMemberInFamilies = (emailaddress: string): number =>
        // Search to see if an emailaddress already is referenced in one of the families
        this.listOfFamilies.findIndex(family => family.some(member => member.emailaddress === emailaddress));

    protected addMemberToFamily = (family: Family, member: Member) => {
        // Ensure that the member is not already in the family

        if (_.isUndefined(family)) {
            console.log('why are we here');
            return;
        }

        if (family.every(m => m._id != member._id)) {
            family.push(member);
        }
    }

    private countTotalMembersInAllFamilies = () =>
        this.listOfFamilies.reduce((previous, current) => previous += current.length, 0);

    private createFamilies = (accountYear: number, members: Member[]) => {
        // Start with a clean sheet
        this.listOfFamilies.length = 0;

        // Place members into their family
        members.forEach((member, outer_index) => {

            // Ensure that every member document has a 'paid' field
            member.paid = _.isUndefined(member.paid) ? false : member.paid;

            // Students get special treatment - give them their own family
            if (member.student) {
                this.listOfFamilies.push(new Array<Member>(member));
            } else {

                // Search to see if the member's familyemailaddress has already been allocated to a list
                let familyIndex = this.findMemberInFamilies(member.familyemailaddress);

                // If so, the member should be added to that family if not already there
                if (familyIndex >= 0) {
                    this.addMemberToFamily(this.listOfFamilies[familyIndex], member);
                } else {

                    // Next check by emailaddress
                    if (this.findMemberInFamilies(member.emailaddress) < 0) {
                        // Need a new family
                        familyIndex = this.listOfFamilies.push(new Array<Member>(member)) - 1;
                    }

                    // Include all those members using the same emailaddress or familyemailaddress
                    for (let j = outer_index + 1; j < members.length; ++j) {
                        if (members[outer_index].emailaddress === members[j].emailaddress ||
                            (members[outer_index].familyemailaddress && member.familyemailaddress ===
                                members[j].emailaddress) ||
                            (members[j].familyemailaddress && (members[outer_index].emailaddress ===
                                members[j].familyemailaddress))) {
                            this.addMemberToFamily(this.listOfFamilies[familyIndex], members[j]);
                        }
                    }
                }
            }
        });
    }

    private createAccounts = accountingYear =>

        _.orderBy(this.listOfFamilies.map(family => {

            let account = new Account();

            // The name of the oldest person becomes the name of the account
            let oldest = family.reduce((previous, current) => current.dob < previous.dob ? current : previous);
            account.accountname = _.capitalize(oldest.familyname) + ', ' + _.capitalize(oldest.firstname);
            account.emailaddress = oldest.emailaddress;

            // If everyone in the account is paid, then the account is paid
            account.paid = family.every(member => member.paid);

            account.fees = this.feesService.calculate(accountingYear, family);

            // Capture all details about the family in the account
            account.family = family;
            return account;
        }), 'accountname', 'asc');

    protected generateAccounts = (accountingYear: number, members: Array<Member>) => {

        try {
            // Each family forms a fee paying account
            this.createFamilies(accountingYear, members);
            return this.createAccounts(accountingYear);

            /*
            console.log('Total members: ', members.length);
            console.log('Total familes: ', this.listOfLists.length);
            console.log('Total member count in all families: ', this.countTotalMembersInAllFamilies());
            console.log('Total accounts: ', this.accounts.length);
            */

        } catch (err) {
            console.log(err);
            throw err;
        }
    }
}
