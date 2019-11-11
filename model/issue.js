'use strict';

const joi = require('@hapi/joi');
const shortid = require('shortid');

/**
 * Initialise the Issue model.
 * @param {Dashboard} dashboard - A dashboard instance.
 * @returns {Model} A Bookshelf model.
 */
function initIssueModel(dashboard) {

	// Model validation schema
	const schema = joi.object().keys({
		code: joi.string().required(),
		context: joi.string().required(),
		selector: joi.string().required(),
		message: joi.string().required(),
		issue_types_code: joi.string().required(),
		runner: joi.string().required(),
		runner_extras: joi.object()
	});

	// Model prototypal methods
	const Issue = dashboard.database.Model.extend({
		tableName: 'issues',

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

		// Update the issue with user-provided data
		async update(data) {
			if (data.code !== undefined) {
				this.set('code', data.code);
			}
			if (data.context !== undefined) {
				this.set('context', data.context);
			}
			if (data.selector !== undefined) {
				this.set('selector', data.selector);
			}
			if (data.message !== undefined) {
				this.set('message', data.message);
			}
			if (data.issue_types_code !== undefined) {
				this.set('issue_types_code', data.issue_types_code);
			}
			if (data.runner !== undefined) {
				this.set('runner', data.runner);
			}
			if (data.runner_extras !== undefined) {
				this.set('runner_extras', data.runner_extras);
			}

			await this.save();
			return this;
		},

		// Override default serialization so we can control output
		serialize() {
			return {
				id: this.get('id'),
				code: this.get('code'),
				context: this.get('context'),
				selector: this.get('selector'),
				message: this.get('message'),
				issueTypesCode: this.get('issue_types_code'),
				runner: this.get('runner'),
				runnerExtras: this.get('runner_extras'),
				meta: {
					dateCreated: this.get('created_at')
				}
			};
		},

		// Result relationship
		result() {
			return this.hasOne(dashboard.model.Result);
		},

		// IssueType relationship
		issueType() {
			return this.hasOne(dashboard.model.IssueType);
		}

		// Model static methods
	}, {

		// Create an issue with user-provided data
		async create(data) {
			const issue = new Issue({
				code: data.code,
				context: data.context,
				selector: data.selector,
				message: data.message,
				issue_types_code: data.issue_types_code,
				runner: data.runner,
				runner_extras: data.runner_extras
			});
			await issue.save();
			return issue;
		},

		// Fetch all issues
		fetchAll() {
			return Issue.collection().query(qb => {
				qb.orderBy('id', 'asc');
				qb.orderBy('created_at', 'asc');
			}).fetch();
		},

		// Fetch an issue by id
		fetchOneById(issueId) {
			return Issue.collection().query(qb => {
				qb.where('id', issueId);
			}).fetchOne();
		},

		// Fetch all issues by issue code
		fetchAllByIssueId(code) {
			return Issue.collection().query(qb => {
				qb.where('code', code);
			}).fetch();
		},

		// Fetch all issues by issue types code
		fetchAllByIssueTypesId(issueTypesCode) {
			return Issue.collection().query(qb => {
				qb.where('issue_types_code', issueTypesCode);
			}).fetch();
		},

		// Fetch all issues by runner
		fetchAllByRunner(runner) {
			return Issue.collection().query(qb => {
				qb.where('runner', runner);
			}).fetch();
		},

		// Check whether an issue with a given ID exists
		async existsById(issueId) {
			const count = await Issue.collection().query(qb => {
				qb.where('id', issueId);
			}).count();
			return (count > 0);
		}

	});

	return Issue;
}

module.exports = initIssueModel;
