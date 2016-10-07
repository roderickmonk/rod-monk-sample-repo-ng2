// imports 
import { Injectable }           from '@angular/core';
import { Member }               from '../models/member';
import { Account }              from '../models/account';
import { LogService }           from '../services/log.service';
import * as moment 				from 'moment';
import * as _ 					from 'lodash';

// aliases
type Family = Member[];

@Injectable()
export class FeesService {

	constructor(private logService: LogService) { }

	public calculate = (accountingYear: number, family: Family) => {

		let fees = 0;
		let adults = 0;
		let juniors = 0;
		let execs = 0;      // Execs get a discount
		let lifetimes = 0;  // Lifers pay no fees

		// Start of season begins on April 1
		let startOfSeason = moment(accountingYear + '-04-01');

		family.forEach(member => {

			// Students get special handling
			if (member.student) {
				fees = 105.00;
			}
			else {

				// Younger than 18 is a junior
				let dob = moment(member.dob, 'YYYY-MM-DD');
				let diff = startOfSeason.diff(dob, 'years');
				if (diff < 18) {
					++juniors;
				} else {
					++adults;
				}

				if (Boolean(member.exec) && member.exec !== 'lifetime') {
					++execs;
				}

				if (Boolean(member.exec) && member.exec === 'lifetime') {
					++lifetimes;
				}

				const SinglesFee = 246.75;
				const CouplesFee = 388.50;

				if (adults === 1) {
					if (juniors === 0) {
						fees = SinglesFee;
					} else if (juniors === 1) {
						fees = 300.00;
					} else if (juniors >= 2) {
						fees = 350.00;
					}
				} else if (adults === 2) {
					if (juniors === 0) {
						fees = CouplesFee;
					} else {
						fees = 450.00;
					}
				} else if (adults === 3) { // A junior will be 18 on April 1st
					fees = 450.00;
				} else {
					let errorMessage = `Fees Calcuation Failure, 
										Adults: ${adults}, 
										Juniors: ${juniors}, 
										Execs: ${execs}`;
					this.logService.logMessage(errorMessage);
					return -1; // The log message will force follow-up later
				}

				if (adults === 1 && lifetimes === 1) {
					fees = 0;
				} else if (adults === 2 && lifetimes === 1) {
					fees = SinglesFee;
				}

				for (let exec_i = 0; exec_i < execs; ++exec_i) {
					fees -= SinglesFee / 2.0;
				}
			}
		});
		// Only deal with even dollars
		return Math.round(fees);
	}
}
