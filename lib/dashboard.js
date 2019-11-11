'use strict';

const adaro = require('adaro');
const getAppUrl = require('./middleware/get-app-url');
const bookshelf = require('bookshelf');
const bindLogger = require('./util/bind-logger');
const compression = require('compression');
const defaults = require('lodash/defaults');
const express = require('express');
const initApiV1Controller = require('../controller/api-v1');
const initFrontEndController = require('../controller/front-end');
const initIssueModel = require('../model/issue');
const initIssueTypeModel = require('../model/issue-type');
const initKeyModel = require('../model/key');
const initResultModel = require('../model/result');
const initSettingModel = require('../model/setting');
const initSiteModel = require('../model/site');
const initUrlModel = require('../model/url');
const initUserModel = require('../model/user');
const knex = require('knex');
const morgan = require('morgan');
const nocache = require('nocache');
const path = require('path');
const viewHelpers = require('../view/helper');

/**
 * Class representing a Sidekick dashboard.
 */
class Dashboard {

	/**
	 * Create a Sidekick dashboard.
	 * @param {Object} options - The dashboard options.
	 * @param {String} [options.databaseConnectionString] - A PostgreSQL connection string.
	 * @param {String} [options.environment] - The environment to run the dashboard in. One of "development", "production", or "test".
	 * @param {Object} [options.log] - A logger which has `error` and `info` methods.
	 * @param {(String|Number)} [options.port] - The HTTP port to run the dashboard on.
	 * @param {String} [options.requestLogFormat] - The Morgan request log format to use in request logging.
	 * @param {Stream} [options.requestLogStream] - The stream to pipe request logs to.
	 * @param {String} [options.sessionSecret] - The secret key with which to encrypt session data.
	 */
	constructor(options) {

		// Default the passed in options so we know we've got
		// everything that we need to start up
		this.options = defaults({}, options, Dashboard.defaults);
		this.environment = options.environment;

		// Set up the database
		this.database = Dashboard.createDatabaseConnection(this.options.databaseConnectionString);
		this.model = {
			Issue: initIssueModel(this),
			IssueType: initIssueTypeModel(this),
			Key: initKeyModel(this),
			Result: initResultModel(this),
			Setting: initSettingModel(this),
			Site: initSiteModel(this),
			Url: initUrlModel(this),
			User: initUserModel(this)
		};

		// Set up the Express application
		this.app = Dashboard.createExpressApplication(this);

		// Set some defaults for properties which are not present
		// until the dashboard is started
		this.address = null;
		this.server = null;

		// Bind the log methods so that we prefix all non request
		// logs with the application name
		this.log = bindLogger(this.options.log, 'Sidekick:');
		this.log.info('✔︎ initialization complete');

	}

	/**
	 * Start the dashboard, binding on the port configured during initialisation.
	 * @returns {Promise} A promise which resolves when the dashboard starts.
	 */
	start() {
		return new Promise((resolve, reject) => {

			// Start the Express application and capture the
			// server object that it returns
			this.server = this.app.listen(this.options.port, error => {

				if (error) {
					this.log.error(error.stack);
					return reject(error);
				}

				// We have to get the port here because sometimes
				// the port in the options is undefined or 0. If
				// that's the case then a random port is assigned
				// and we want to tell the user what it is
				const port = this.server.address().port;
				this.address = `http://localhost:${port}`;

				// All done
				this.log.info(`✔︎ started (${this.address}/ in ${this.environment} mode)`);
				resolve(this);

			});

		});
	}

	/**
	 * Create a Bookshelf database connection.
	 * @param {String} connectionString - A PostgreSQL connection string.
	 * @returns {Bookshelf} A Bookshelf instance.
	 */
	static createDatabaseConnection(connectionString) {
		return bookshelf(knex({
			client: 'pg',
			connection: connectionString
		}));
	}

	/**
	 * Create an Express application.
	 * @param {Dashboard} dashboard - The Dashboard instance to use in the application.
	 * @returns {Object} A configured Express application.
	 */
	static createExpressApplication(dashboard) {
		const app = express();
		app.dashboard = dashboard;

		// Set some Express configurations
		app.set('env', dashboard.environment);
		app.set('json spaces', 4);
		app.disable('x-powered-by');
		app.enable('strict routing');
		app.enable('case sensitive routing');

		// Configure the view engine. We use Adaro for
		// rendering Dust templates as it allows us to
		// load custom helpers easily
		app.set('views', path.resolve(__dirname, '../view'));
		app.engine('dust', adaro.dust({
			helpers: viewHelpers,
			whitespace: true
		}));
		app.set('view engine', 'dust');

		// Disable browser caching
		// (for alpha/beta, we'll do this properly later)
		app.disable('etag');
		app.use(nocache());

		// Compress responses with deflate
		app.use(compression());

		// Set up a morgan request logger. This outputs request
		// information, useful for debugging
		morgan.token('auth', (request, response, field) => {
			if (field === 'user' && request.authUser) {
				return request.authUser.id;
			}
			if (field === 'key' && request.authKey) {
				return request.authKey.id;
			}
			return '-';
		});
		app.use(morgan(dashboard.options.requestLogFormat, {
			stream: dashboard.options.requestLogStream
		}));

		app.use(getAppUrl(dashboard.options.dashboardUrl));

		// Mount top-level controllers
		app.use('/api/v1', initApiV1Controller(dashboard));
		app.use(initFrontEndController(dashboard));

		return app;
	}

}

/**
 * The default options used when constructing a dashboard.
 * @static
 */
Dashboard.defaults = {
	dashboardUrl: null,
	databaseConnectionString: 'postgres://localhost:5432/pa11y_sidekick',
	environment: 'development',
	log: console,
	port: 8080,
	requestLogFormat: `${morgan.combined} authUser=":auth[user]" authKey=":auth[key]"`,
	sessionSecret: null
};

module.exports = Dashboard;
