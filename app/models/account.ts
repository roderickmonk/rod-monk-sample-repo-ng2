import { Member } from './member';

type Family = Member[];

export class Account {
    family: Family;
    accountname: string;
    emailaddress: string;
    paid: boolean;
    fees: number = 0;
};
