/// <reference path="../typings/globals/node/index.d.ts" />
/// <reference path="../typings/globals/moment-node/index.d.ts" />

import * as _ from 'lodash';
import { NewsItem } from './newsitem';
import { Err } from './Err';
import { MemberInterface } from './MemberInterface';

export namespace DB {

	const moment = require('moment-timezone');
	const mongoose = require('mongoose');

	require('mongoose').Promise = global.Promise;
	require('dotenv').config();
	const bcrypt = require('bcrypt-nodejs');

	mongoose.connect(process.env.MONGO_DB);

	// Setup the Mongoose models
	const MemberSchema = new mongoose.Schema({
		emailaddress: { type: String, lowercase: true },
		password: { type: String },
		firstname: { type: String },
		familyname: { type: String },
		student: { type: Boolean, default: false },
		familyemailaddress: { type: String, lowercase: true, default: null },
		dob: Date,
		address: { type: String },
		place: { type: String },
		postcode: { type: String },
		primaryphone: { type: String },
		alternativephone: { type: String },
		liabilityagreed: { type: Boolean, default: false },
		communicationsagreed: { type: Boolean, default: false },
		photoagreed: { type: Boolean, default: false },
		joiningyear: { type: Number, default: null },
		exec: { type: String, lowercase: true, default: null },
		role: { type: String, lowercase: true, default: 'member' }
	});

	const MemberModel = mongoose.model('members', MemberSchema);

	const NewsItemSchema = new mongoose.Schema({
		headline: String,
		body: String,
		uploadTimestamp: { type: Date, default: moment() }
	});

	const NewsItemModel = mongoose.model('newsitems', NewsItemSchema, 'newsitems');

	const DeviceTrackingSchema = new mongoose.Schema({
		memberid: String,
		device: String,
		lastUsed: Date
	});
	const DeviceTrackingModel = mongoose.model('devicetracking', DeviceTrackingSchema, 'devicetracking');

	const executiveSchema = new mongoose.Schema({
		rank: { type: Number },
		position: { type: String },
		title: { type: String },
		emailaddress: { type: String },
		exec_members: []
	});
	const executiveModel = mongoose.model('executive', executiveSchema, 'executive');

	const RenewalSchema = new mongoose.Schema({
		memberId: { type: String },
		year: { type: Number },
		renewed: { type: Boolean, default: false },
		paid: { type: Boolean, default: false },
	});
	const RenewalModel = mongoose.model('renewals', RenewalSchema, 'renewals');

	const logSchema = new mongoose.Schema({
		timestamp: { type: Date, default: moment() },
		message: { type: String },
		memberId: { type: String },
		firstname: { type: String },
		familyname: { type: String },
		device: { type: String }
	});
	const logModel = mongoose.model('log', logSchema, 'log');

	const triviaSchema = new mongoose.Schema({
		trivia: { type: String }
	});
	const triviaModel = mongoose.model('trivia', triviaSchema, 'trivia');

	const etiquetteSchema = new mongoose.Schema({
		trivia: { type: String }
	});
	const etiquetteModel = mongoose.model('etiquette', etiquetteSchema, 'etiquette');

	const rankingSchema = new mongoose.Schema({
		name: { type: String },
		gender: { type: String },
		rank: { type: Number },
		movement: { type: String },
		country: { type: String },
		countryCode: { type: String, default: null },
		countryEmoji: { type: String, default: null },
		points: { type: String },
		id: { type: String }  // playerId
	});
	const rankingModel = mongoose.model('rankings', rankingSchema, 'rankings');

	// Constants
	const UPDATE_OPTIONS = {
		multi: false,
		upsert: false,
		new: true
	};
	const UPSERT_OPTIONS = {
		multi: false,
		upsert: true,
		new: true
	};

/*
	export interface MemberInterface {
		_id?: string,
		firstname?: string,
		familyname?: string,
		dob?: string,
		emailaddress?: string,
		student?: boolean,
		familyemailaddress?: string,
		primaryphone?: string,
		alternativephone?: string,
		address?: string,
		place?: string,
		postcode?: string,
		liabilityagreed?: boolean,
		communicationsagreed?: boolean,
		photoagreed?: boolean,
		joiningyear?: number,
		exec?: string,
		role?: string,
		password?: string
	}
*/

	// Record user's device details.  If device is already known,
	// then just update the lastUsed timestamp
	export const upsertDevice = (memberid: string, device: string): Promise<any> =>

		DeviceTrackingModel.findOneAndUpdate(
			{
				memberid: memberid,
				device: device
			},
			{
				$set: {
					memberid: memberid,
					device: device,
					lastUsed: moment()
				}
			},
			UPSERT_OPTIONS);

	export const publishNewsItem = (newsItem: NewsItem): Promise<any> =>
		NewsItemModel(newsItem).save();

	export const getNewsItems = (): Promise<any> =>
		NewsItemModel.find();

	export const getNewsItemsCount = (): Promise<any> =>
		NewsItemModel.count();

	export const deleteNewsItem = (newsItemId: string): Promise<any> =>
		NewsItemModel.findByIdAndRemove(newsItemId);

	export const countMembers = (): Promise<any> =>
		MemberModel.count();

	export const getMembers = (): Promise<any> =>
		MemberModel.find({}, '-password');

	let getFamilyMembers = (emailaddress, familyemailaddress): Promise<any> => {

		if (familyemailaddress) {
			return MemberModel.find(
				{
					$or: [
						{ emailaddress: { $in: new RegExp(`^${emailaddress}$`, 'i') } },
						{ familyemailaddress: { $in: new RegExp(`^${emailaddress}$`, 'i') } },
						{ emailaddress: { $in: new RegExp(`^${familyemailaddress}$`, 'i') } },
						{ familyemailaddress: { $in: new RegExp(`^${familyemailaddress}$`, 'i') } }
					]
				});

		} else {
			return MemberModel.find(
				{
					$or: [
						{ emailaddress: { $in: new RegExp(`^${emailaddress}$`, 'i') } },
						{ familyemailaddress: { $in: new RegExp(`^${emailaddress}$`, 'i') } },
					]
				});
		}
	}

	export const getFamily = (_id): Promise<any> =>
		MemberModel.findById(_id)
			.then(member => getFamilyMembers(member.emailaddress, member.familyemailaddress));

	export const getTrivia = (): Promise<any> =>
		triviaModel.find({});

	export const getEtiquette = (): Promise<any> => {

		console.log('getEtiquette');
		return etiquetteModel.find({});

	}

	export const getRankings = (): Promise<any> =>
		rankingModel.find({}, '-_id name rank movement gender countryEmoji');

	export const getRenewals = (): Promise<any> =>
		RenewalModel.find({});

	export const upsertRenewal = (renewal): Promise<any> =>
		RenewalModel.findOneAndUpdate({ memberId: renewal.memberId, year: renewal.year }, renewal, UPSERT_OPTIONS);

	export const findMember = (_id): Promise<any> =>
		MemberModel.findById(_id, '-password');

	export const deleteMember = (_id): Promise<any> =>
		MemberModel.findByIdAndRemove(_id);

	export const persistMemberChange = (_id: string, member: MemberInterface): Promise<any> =>
		MemberModel.findByIdAndUpdate(_id, member, UPDATE_OPTIONS);

	export const resetPassword = (member: MemberInterface): Promise<any> =>

		MemberModel.findOneAndUpdate(
			{
				firstname: { $in: new RegExp(`^${member.firstname}$`, 'i') },
				emailaddress: { $in: new RegExp(`^${member.emailaddress}$`, 'i') },
			},
			{
				password: bcrypt.hashSync(member.password)
			});

	export const activateAccount = (member: MemberInterface): Promise<any> =>
		MemberModel.findOneAndUpdate(
			{
				firstname: { $in: new RegExp(`^${member.firstname}$`, 'i') },
				emailaddress: { $in: new RegExp(`^${member.emailaddress}$`, 'i') },
			},
			{
				password: bcrypt.hashSync(member.password),
				activated: true
			});

	export const loginMember = (login: MemberInterface): Promise<any> =>

		new Promise((resolve, reject) => {
			MemberModel.findOne({
				firstname: { $in: new RegExp(`^${login.firstname}$`, 'i') },
				emailaddress: { $in: new RegExp(`^${login.emailaddress}$`, 'i') },
			})
				.then(member => {
					// Comparison must be done against a proper encrypted password
					if (member.password &&
						member.password.length === 60 &&
						bcrypt.compareSync(login.password, member.password)) {
						resolve(member);
					} else {
						reject(new Err.AuthenticationError(''));
					}
				})
				.catch(reject);
		});

	export const isMemberKnown = (firstname: string, emailaddress: string): Promise<any> =>

		MemberModel.findOne(
			{
				firstname: { $in: new RegExp(`^${firstname}$`, 'i') },
				emailaddress: { $in: new RegExp(`^${emailaddress}$`, 'i') }
			});

	export const signupMember = (member: MemberInterface): Promise<any> =>

		MemberModel.findOneAndUpdate(
			{
				firstname: { $in: new RegExp(`^${member.firstname}$`, 'i') },
				familyname: { $in: new RegExp(`^${member.familyname}$`, 'i') },
				emailaddress: { $in: new RegExp(`^${member.emailaddress}$`, 'i') },
				postcode: { $in: new RegExp(`^${member.postcode}$`, 'i') },
				dob: { $eq: moment.utc(member.dob) }
			},
			{
				password: bcrypt.hashSync(member.password)
			});

	// Assure a member's credentials
	export const authorizeMember = (_id: string): Promise<any> =>
		MemberModel.findById(_id, '-password');

	export const validatePassword = (_id: string, currentPassword: string): Promise<any> =>

		new Promise((resolve, reject) =>
			MemberModel.findById(_id)
				// Ensure that the passwords match
				.then(member => resolve(bcrypt.compareSync(currentPassword, member.password)))
				.catch(error => reject(error)));

	export const saveNewApplicant = (member: MemberInterface): Promise<any> =>

		new Promise((resolve, reject) =>
			MemberModel(member).save()
				.then((saved_member: any) => {
					// Need a renewal record as well
					upsertRenewal({ memberId: saved_member._id, renewed: true });
					resolve(saved_member);
				})
				.catch(error => {
					if (error.code == 11000) {
						// Special case
						reject(new Err.DuplicateMemberError(''));
					}
					else {
						reject(error);
					}
				}));

	export const getExecutive = (): Promise<any> => {

		console.log('inner');

		try {
			return executiveModel.find();
		}
		catch (e) {
			console.log('problems: ', e);
			process.exit();
		}
	}

	export const logMessage = (message: any): Promise<any> =>
		logModel(message).save();

	// The following function associates each of the executive positions with the
	// names of the actual office holders.
	const setupExec = (): Promise<any> =>
		getMembers()
			.then((members: any) => executiveModel.find()
				.then((execs: any) => {
					execs.forEach((exec: any) => {

						// Filter in details of board members holding exec positions
						exec.exec_members = members.filter((x: any) => x.exec === exec.position);

						// ...then record these associations back to executive
						executiveModel.findByIdAndUpdate(
							exec._id,
							exec,
							UPDATE_OPTIONS)
							.catch((err: any) => console.log('Aborting updating `executive`: ', err))
							.then();
					});
				})
				.catch(err => console.log('Cant get the members: ', err)));

	const setupRenewals = () =>
		getMembers()
			.then((members: any) => {
				members.forEach((member: any) => {
					RenewalModel({ memberId: member._id, year: 2016, renewed: true, paid: true }).save()
						.then(() => { })
						.catch((err: any) => console.log('`renewals` collection not created: ', JSON.stringify(err)));
				});
			})
			.catch((err: any) => console.log('Error creating paid collection: ', err));

	export const deleteMembers = () =>
		MemberModel.remove()
			.then(() => console.log('All Member records deleted'))
			.catch(err => console.log('Problem removing all member documents: ', err));

	export const deleteNewsItems = () =>
		NewsItemModel.remove()
			.then(() => console.log('All News Items deleted'))
			.catch(err => console.log('Problem removing all News Items: ', err));

	export const deleteRenewals = () =>
		RenewalModel.remove()
			.then(() => console.log('All Renewals deleted'))
			.catch(err => console.log('Problem removing all Renewals: ', err));

	export const deleteRankings = () =>
		rankingModel.remove()
			.then(() => _.noop)
			.catch(err => console.log('Problem removing all Rankings: ', err));

	export const saveRanking = ranking =>
		rankingModel(ranking).save();

	// Setup the exec at startup and then occassionally thereafter
	setupExec();
	setInterval(setupExec, Math.floor((86400 * 1000) / 4));
}
