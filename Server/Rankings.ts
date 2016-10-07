import * as fs from 'fs';
import * as http from 'http'
import * as util from 'util';
import * as _ from 'lodash';
import { DB } from './DB';

export namespace Rankings {

	const parseString = require('xml2js').parseString;
	const countryEmoji = require('country-code-emoji').flag;
	const countries = require("i18n-iso-countries");
	const env = require('dotenv').config();

	// Both men's and women's rankings are delivered as XML
	const loadRankings = (url: string, gender: string) =>
		http.get(url, res => {
			let XML = '';
			res.on('data', chunk => XML += chunk);
			res.on('end', () =>
				parseString(XML, (err, result) =>
					result.standings.player.forEach(ranking => {

						ranking['$'].gender = gender;

						// Get the country emoji from the player's country
						ranking['$'].countryEmoji = countryEmoji(getCountryCode(ranking['$'].country));

						// Do the save to the database
						DB.saveRanking(ranking['$']);
					})
				)
			);
		}).on('error', err => console.log("Got error: " + err.message));

	const getCountryCode = (country: string) => {

		let countryCode: string;
		if (countryCode = countries.getAlpha2Code(country, 'en')) {
			return countryCode;
		}

		if (countryCode = countries.alpha3ToAlpha2(country)) {
			return countryCode;
		}

		// Source data seems to be non-ISO conformant in some cases, hence the following
		if (_.isUndefined(countryCode)) {
			switch (country.toLowerCase()) {
				case 'moldova': return 'MD';
				case 'great britain': return 'GB';
				case 'serbia & montenegro': return 'RS';
				case 'russia': return 'RU';
				case 'taipei': return 'TW';
			}
		}
		return null;
	}

	const refreshRankingData = () =>
		DB.deleteRankings()
			.then(() => loadRankings(`http://www.goalserve.com/getfeed/${process.env.GOALSERVE_KEY}/tennis_scores/atp`, 'male'))
			.then(() => loadRankings(`http://www.goalserve.com/getfeed/${process.env.GOALSERVE_KEY}/tennis_scores/wta`, 'female'))
			.catch(console.log);

	// Refresh at startup and then occassionally thereafter
	refreshRankingData();
	setInterval(refreshRankingData, 86400 * 1000);

}
