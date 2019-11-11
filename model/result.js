'use strict';

const joi = require('@hapi/joi');
const shortid = require('shortid');

/**
 * Initialise the Result model.
 * @param {Dashboard} dashboard - A dashboard instance.
 * @returns {Model} A Bookshelf model.
 */
function initResultModel(dashboard) {

	// Model validation schema
	const schema = joi.object().keys({
		site_id: joi.string().required(),
		url_id: joi.string(),
		issue_id: joi.string().required()
	});

	// Model prototypal methods
	const Result = dashboard.database.Model.extend({
		tableName: 'results',

		// Model initialization
		initialize() {

			// When a model is created...
			this.on('creating', () => {

				// Fill out automatic fields
				this.attributes.id = shortid.generate();
				this.attributes.created_at = new Date();

			});
		},

		// Validate the model before saving
		validateSave() {
			return new Promise((resolve, reject) => {
				// Validate against the schema
				schema.validate(this.attributes, {
					abortEarly: false,
					allowUnknown: true
				}, error => {
					if (error) {
						return reject(error);
					}
					resolve();
				});
			});
		},

		// Update the result with user-provided data
		async update(data) {
			if (data.site_id !== undefined) {
				this.set('site_id', data.site_id);
			}
			if (data.url_id !== undefined) {
				this.set('url_id', data.url_id);
			}
			await this.save();
			return this;
		},

		// Override default serialization so we can control output
		serialize() {
			return {
				id: this.get('id'),
				siteId: this.get('site_id'),
				urlId: this.get('url_id'),
				meta: {
					dateCreated: this.get('created_at')
				}
			};
		},

		// URL relationship
		url() {
			return this.hasOne(dashboard.model.Url);
		},

		// URL relationship
		site() {
			return this.hasOne(dashboard.model.Site);
		},

		// Issue relationship
		issues() {
			return this.hasMany(dashboard.model.Issue);
		}


		// Model static methods
	}, {

		// Create a result with user-provided data
		async create(data) {
			const result = new Result({
				site_id: data.site_id,
				url_id: data.url_id
			});
			await result.save();
			return result;
		},

		// Fetch all results
		fetchAll() {
			return Result.collection().query(qb => {
				qb.orderBy('url_id', 'asc');
				qb.orderBy('created_at', 'asc');
			}).fetch();
		},

		// Fetch a result by id
		fetchOneById(resultId) {
			return Result.collection().query(qb => {
				qb.where('id', resultId);
			}).fetchOne();
		},

		// Fetch all results by url id
		fetchAllByUrlId(urlId) {
			return Result.collection().query(qb => {
				qb.where('url_id', urlId);
			}).fetch();
		},

		// Fetch all results by url id
		fetchAllBySiteId(siteId) {
			return Result.collection().query(qb => {
				qb.where('site_id', siteId);
			}).fetch();
		},

		// Check whether a result with a given ID exists
		async existsById(resultId) {
			const count = await Result.collection().query(qb => {
				qb.where('id', resultId);
			}).count();
			return (count > 0);
		},

		// Check whether a result with a given URL ID exists
		async existsByUrlId(urlId) {
			const count = await Result.collection().query(qb => {
				qb.where('url_id', urlId);
			}).count();
			return (count > 0);
		},

		// Check whether a result with a given Site ID exists
		async existsBySiteId(siteId) {
			const count = await Result.collection().query(qb => {
				qb.where('site_id', siteId);
			}).count();
			return (count > 0);
		}

	});

	return Result;
}

module.exports = initResultModel;
