'use strict';

/**
 * Initialise the IssueType model.
 * @param {Dashboard} dashboard - A dashboard instance.
 * @returns {Model} A Bookshelf model.
 */
function initIssueTypeModel(dashboard) {
	// Model prototypal methods
	const IssueType = dashboard.database.Model.extend({
		tableName: 'issue_types',

		// Override default serialization so we can control output
		serialize() {
			return {
				id: this.get('code'),
				code: this.get('description')
			};
		}

		// Model static methods
	}, {
		// Fetch all issue types
		fetchAll() {
			return IssueType.collection().query(qb => {
				qb.orderBy('code', 'asc');
			}).fetch();
		},

		// Fetch an issue type by code
		fetchOneByCode(code) {
			return IssueType.collection().query(qb => {
				qb.where('code', code);
			}).fetchOne();
		},

		// Fetch all issues by issue code
		fetchAllByIssueTypeId(code) {
			return IssueType.collection().query(qb => {
				qb.where('code', code);
			}).fetch();
		},

		// Fetch code by issue type description
		fetchIssueTypeCodeByDescription(description) {
			return IssueType.collection().query(qb => {
				qb.where('description', description);
			}).fetchOne({columns: ['code']});
		},

		// Check whether an issue type with a given description exists
		async existsByDescription(description) {
			const count = await IssueType.collection().query(qb => {
				qb.where('description', description);
			}).count();
			return (count > 0);
		}

	});

	return IssueType;
}

module.exports = initIssueTypeModel;
