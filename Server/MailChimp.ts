/// <reference path="../typings/globals/node/index.d.ts" />

const https = require('https');
const md5 = require('md5');
import { BugTracker } from './BugTracker';
require('dotenv').config();
const MailChimpHostName = 'us12.api.mailchimp.com';
const MailChimpMembersPath = process.env.MAIL_CHIMP_MEMBERS_PATH;
const MailChimpAuthorization = process.env.MAIL_CHIMP_AUTHORIZATION;

export namespace MailChimp {
	
	const readResponseBody = (response: any) =>

		new Promise((resolve, reject) => {

			response.setEncoding('utf8');

			let body = '';
			response.on('readable', () => {
				let chunk = response.read();
				if (chunk) {
					body += chunk;
				}
			});
			response.on('end', () => resolve(body));
		});

	export const deleteMember = (emailaddress: string) =>

		new Promise((resolve, reject) => {
			// No 'reject' thus far

			const https_options = {
				hostname: MailChimpHostName,
				path: MailChimpMembersPath + md5(emailaddress),
				method: 'DELETE',
				headers: {
					'Authorization': MailChimpAuthorization
				}
			}

			var req = https.request(https_options, (res: any) =>
				readResponseBody(res)
					.then((body: any) => {
						if (res.Status < 200 || res.Status >= 300) {
							BugTracker.InfoOnly('MailChimp API deleteMember', 'response.Status: ' + res.statusCode + ', response.Body: ' + body);
						}
					}));

			req.on('error', (err: Error) => BugTracker.Warning('MailChimp API deleteMember Warning', err.message));

			req.end();
			resolve(null);
		});

	export const addMember = (member: any): Promise<any> =>

		new Promise((resolve, reject) => {
			// No yet a 'reject'

			const subscriber = JSON.stringify({
				'email_address': member.emailaddress,
				'status': 'subscribed',
				'merge_fields': {
					'FNAME': member.firstname,
					'LNAME': member.familyname
				}
			});

			const https_options = {
				hostname: MailChimpHostName,
				path: MailChimpMembersPath,
				method: 'POST',
				headers: {
					'Authorization': MailChimpAuthorization,
					'Content-Type': 'application/json',
					'Content-Length': subscriber.length
				}
			}

			const req = https.request(https_options, (res: any) => {
				readResponseBody(res)
					.then((body) => {
						if (res.Status < 200 || res.Status >= 300)
							BugTracker.InfoOnly('MailChimp API addMember', 'response.Status: ' + res.statusCode + ', response.Body: ' + body);
					});
			});

			req.on('error', (err: Error) => BugTracker.Warning('MailChimp API addMember Warning', err.message));

			req.write(subscriber);
			req.end();
			resolve(member);
		});
}
