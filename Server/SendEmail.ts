/// <reference path="../typings/globals/node/index.d.ts" />

import * as _ from 'lodash';

// Some Type Aliases
type NextErr = (err: any) => void;
type Callback = () => void;

export namespace SendEmail {

	const Mailgun = require('mailgun-js');
	const mailgun = new Mailgun({ apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN });

	const fullUrl = request => process.env.PORT ? `${request.protocol}://${request.hostname}` : `${request.protocol}://${request.hostname}:${request.socket.localPort}`;

	export const sendResetPasswordEmail = (request: any, response: any, next: NextErr) => {

		const email = {
			from: process.env.DO_NOT_REPLY,
			to: request.body.emailaddress,
			subject: 'Reset TTC Password',
			html: `Hello ${_.capitalize(request.body.firstname)},
        <br><br>
        The Tsawwassen Tennis Club website has received a request to reset your password.  Our apologies if this message was sent in error.
        <br><br>
        <a href="${fullUrl(request)}/#/reset-password?authorization=${request.body.authorization}">Click here to reset your password</a>
        <br><br>
        <b>Tswassasen Tennis Club</b>
        <br>
        <a href="${fullUrl(request)}/#/contact-us">Contact Us</a>
        <br>`
		}

		mailgun.messages().send(email)
			.then((data) => response.end())
			.catch(next);
	}

	export const sendActivateAccountEmail = (request: any, response: any, next: NextErr) => {

		console.log(`
	Sending email to: ${request.body.firstname}, 
	emailaddress: ${request.body.emailaddress}, 
	authorization: ${request.body.authorization}`);

		const email = {
			from: process.env.DO_NOT_REPLY,
			to: request.body.emailaddress,
			subject: 'Activate Tsawwassen Tennis Club Membership',
			html: `Hello ${_.capitalize(request.body.firstname)},
        <br><br>
        The Tsawwassen Tennis Club website has received an application for you to join our club.  
		Our apologies if this message was sent in error.
        <br><br>
        <a href="${fullUrl(request)}/#/activate-account?authorization=${request.body.authorization}">Click here to activate your account</a>
        <br><br>
        <b>Tswassasen Tennis Club</b>
        <br>
        <a href="${fullUrl(request)}/#/contact-us">Contact Us</a>
        <br>`
		}

		mailgun.messages().send(email)
			.then((data) => response.end())
			.catch(next);
	}
}
