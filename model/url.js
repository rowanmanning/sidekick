'use strict';

const defaults = require('lodash/defaults');
const joi = require('@hapi/joi');
const shortid = require('shortid');

/**
 * Initialise the Url model.
 * @param {Dashboard} dashboard - A dashboard instance.
 * @returns {Model} A Bookshelf model.
 */
function initUrlModel(dashboard) {

	// Model validation schema
	const schema = joi.object().keys({
		site_id: joi.string().required(),
		name: joi.string().min(1).required(),
		address: joi.string().min(1).required(),
		pa11y_config: joi.object()
	});

	// Model prototypal methods
	const Url = dashboard.database.Model.extend({
		tableName: 'urls',

		// Model initialization
		initialize() {

			// When a model is created...
			this.on('creating', () => {

				// Fill out automatic fields
				this.attributes.id = shortid.generate();
				this.attributes.created_at = new Date();

			});

			// When a model is saved...
			this.on('saving', async () => {

				// Fill out automatic fields
				this.attributes.updated_at = new Date();

				// Validate the model
				await this.validateSave();

				// Encode the Pa11y config if it's changed
				if (this.hasChanged('pa11y_config')) {
					this.attributes.pa11y_config = JSON.stringify(this.attributes.pa11y_config);
				}

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

		// Update the URL with user-provided data
		async update(data) {
			if (data.name !== undefined) {
				this.set('name', data.name);
			}
			if (data.address !== undefined) {
				this.set('address', data.address);
			}
			if (data.pa11y_config !== undefined) {
				this.set('pa11y_config', data.pa11y_config);
			}
			await this.save();
			return this;
		},

		// Override default serialization so we can control output
		serialize() {
			return {
				id: this.get('id'),
				site: this.get('site_id'),
				name: this.get('name'),
				address: this.get('address'),
				fullAddress: this.fullAddress(),
				pa11yConfig: this.pa11yConfig(),
				meta: {
					dateCreated: this.get('created_at'),
					dateUpdated: this.get('updated_at')
				}
			};
		},

		// Site relationship
		site() {
			return this.belongsTo(dashboard.model.Site);
		},

		// Get the full address of the URL (including base URL of site)
		fullAddress() {
			let baseUrl = this.related('site').get('base_url');
			let address = this.get('address');
			if (baseUrl === undefined || /^https?:\/\//i.test(address)) {
				return address;
			}
			if (baseUrl.endsWith('/')) {
				baseUrl = baseUrl.substr(0, baseUrl.length - 1);
			}
			if (!address.startsWith('/')) {
				address = `/${address}`;
			}
			return `${baseUrl}${address}`;
		},

		// Get the full Pa11y config, merging with the parent site
		pa11yConfig() {
			return defaults({}, this.get('pa11y_config'), this.related('site').get('pa11y_config'));
		}

	// Model static methods
	}, {

		// Create a URL with user-provided data
		async create(data) {
			const site = new Url({
				site_id: data.site_id,
				name: data.name,
				address: data.address,
				pa11y_config: data.pa11y_config
			});
			await site.save();
			return site;
		},

		// Fetch all URLs
		fetchAll() {
			return Url.collection().query(qb => {
				qb.orderBy('name', 'asc');
				qb.orderBy('address', 'asc');
				qb.orderBy('created_at', 'asc');
			}).fetch();
		},

		// Fetch a URL by id
		fetchOneById(urlId) {
			return Url.collection().query(qb => {
				qb.where('id', urlId);
			}).fetchOne();
		},

		// Fetch a URL by ID and site ID
		fetchOneByIdAndSiteId(urlId, siteId) {
			return Url.collection().query(qb => {
				qb.where('id', urlId);
				qb.where('site_id', siteId);
			}).fetchOne({
				withRelated: ['site']
			});
		},

		// Fetch URLs by site ID
		fetchBySiteId(siteId) {
			return Url.collection().query(qb => {
				qb.where('site_id', siteId);
				qb.orderBy('name', 'asc');
				qb.orderBy('address', 'asc');
				qb.orderBy('created_at', 'desc');
			}).fetch({
				withRelated: ['site']
			});
		},

		// Fetch one URL by site ID
		fetchOneBySiteId(siteId) {
			return Url.collection().query(qb => {
				qb.where('site_id', siteId);
				qb.orderBy('name', 'asc');
				qb.orderBy('address', 'asc');
				qb.orderBy('created_at', 'desc');
			}).fetchOne({
				withRelated: ['site']
			});
		}

	});

	return Url;
}

module.exports = initUrlModel;
