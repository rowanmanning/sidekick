'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const path = require('path');
const sinon = require('sinon');

describe('lib/dashboard', () => {
	let adaro;
	let bindLogger;
	let bookshelf;
	let compression;
	let Dashboard;
	let defaults;
	let express;
	let getAppUrl;
	let initApiV1Controller;
	let initFrontEndController;
	let initIssueModel;
	let initIssueTypeModel;
	let initKeyModel;
	let initResultModel;
	let initSettingModel;
	let initSiteModel;
	let initUrlModel;
	let initUserModel;
	let knex;
	let log;
	let morgan;
	let nocache;
	let viewHelpers;

	beforeEach(() => {

		adaro = require('../mock/adaro.mock');
		mockery.registerMock('adaro', adaro);

		bindLogger = require('../mock/bind-logger.mock');
		mockery.registerMock('./util/bind-logger', bindLogger);

		bookshelf = require('../mock/bookshelf.mock');
		mockery.registerMock('bookshelf', bookshelf);

		compression = require('../mock/compression.mock');
		mockery.registerMock('compression', compression);

		defaults = sinon.spy(require('lodash/defaults'));
		mockery.registerMock('lodash/defaults', defaults);

		express = require('../mock/express.mock');
		mockery.registerMock('express', express);

		getAppUrl = require('../mock/get-app-url.mock');
		mockery.registerMock('./middleware/get-app-url', getAppUrl);

		initApiV1Controller = sinon.stub().returns(require('../mock/controller/api-v1.mock'));
		mockery.registerMock('../controller/api-v1', initApiV1Controller);

		initFrontEndController = sinon.stub().returns(require('../mock/controller/front-end.mock'));
		mockery.registerMock('../controller/front-end', initFrontEndController);

		initIssueModel = sinon.stub().returns(require('../mock/model/issue.mock'));
		mockery.registerMock('../model/issue', initIssueModel);

		initIssueTypeModel = sinon.stub().returns(require('../mock/model/issue-type.mock'));
		mockery.registerMock('../model/issue-type', initIssueTypeModel);

		initKeyModel = sinon.stub().returns(require('../mock/model/key.mock'));
		mockery.registerMock('../model/key', initKeyModel);

		initResultModel = sinon.stub().returns(require('../mock/model/result.mock'));
		mockery.registerMock('../model/result', initResultModel);

		initSettingModel = sinon.stub().returns(require('../mock/model/setting.mock'));
		mockery.registerMock('../model/setting', initSettingModel);

		initSiteModel = sinon.stub().returns(require('../mock/model/site.mock'));
		mockery.registerMock('../model/site', initSiteModel);

		initUrlModel = sinon.stub().returns(require('../mock/model/url.mock'));
		mockery.registerMock('../model/url', initUrlModel);

		initUserModel = sinon.stub().returns(require('../mock/model/user.mock'));
		mockery.registerMock('../model/user', initUserModel);

		knex = require('../mock/knex.mock');
		mockery.registerMock('knex', knex);

		log = require('../mock/log.mock');

		morgan = require('../mock/morgan.mock');
		mockery.registerMock('morgan', morgan);

		nocache = require('../mock/nocache.mock');
		mockery.registerMock('nocache', nocache);

		viewHelpers = ['is-mock-view-helper'];
		mockery.registerMock('../view/helper', viewHelpers);

		Dashboard = require('../../../lib/dashboard');
	});

	it('exports a class contructor', () => {
		assert.isFunction(Dashboard);
		assert.throws(() => Dashboard(), /constructor dashboard/i); // eslint-disable-line new-cap
	});

	describe('new Dashboard(options)', () => {
		let dashboard;
		let options;

		beforeEach(() => {
			Dashboard.createDatabaseConnection = sinon.stub().returns(bookshelf.mockInstance);
			Dashboard.createExpressApplication = sinon.stub().returns(express.mockApp);

			options = {
				dashboardUrl: 'mock-dashboard-url',
				databaseConnectionString: 'mock-database-connection-string',
				environment: 'mock-environment',
				log,
				port: 1234,
				requestLogFormat: 'mock-request-log-format',
				requestLogStream: 'mock-request-log-stream',
				sessionSecret: 'mock-session-secret'
			};

			dashboard = new Dashboard(options);
		});

		it('defaults the passed in options', () => {
			assert.isObject(defaults.firstCall.args[0]);
			assert.strictEqual(defaults.firstCall.args[1], options);
			assert.strictEqual(defaults.firstCall.args[2], Dashboard.defaults);
		});

		it('has an `options` property set to the defaulted options', () => {
			assert.strictEqual(dashboard.options, defaults.firstCall.returnValue);
		});

		it('has an `environment` property set to the environment option', () => {
			assert.strictEqual(dashboard.environment, options.environment);
		});

		it('creates a database connection', () => {
			assert.calledOnce(Dashboard.createDatabaseConnection);
			assert.calledWithExactly(Dashboard.createDatabaseConnection, options.databaseConnectionString);
		});

		it('has a `database` property set to the created database connection', () => {
			assert.strictEqual(dashboard.database, Dashboard.createDatabaseConnection.firstCall.returnValue);
		});

		it('initialises all of the models', () => {
			assert.calledOnce(initIssueModel);
			assert.calledWithExactly(initIssueModel, dashboard);
			assert.calledOnce(initIssueTypeModel);
			assert.calledWithExactly(initIssueTypeModel, dashboard);
			assert.calledOnce(initKeyModel);
			assert.calledWithExactly(initKeyModel, dashboard);
			assert.calledOnce(initResultModel);
			assert.calledWithExactly(initResultModel, dashboard);
			assert.calledOnce(initSettingModel);
			assert.calledWithExactly(initSettingModel, dashboard);
			assert.calledOnce(initSiteModel);
			assert.calledWithExactly(initSiteModel, dashboard);
			assert.calledOnce(initUrlModel);
			assert.calledWithExactly(initUrlModel, dashboard);
			assert.calledOnce(initUserModel);
			assert.calledWithExactly(initUserModel, dashboard);
		});

		it('has a `model` property set to a map of the initialised models', () => {
			assert.isObject(dashboard.model);
			assert.strictEqual(dashboard.model.Issue, initIssueModel.firstCall.returnValue);
			assert.strictEqual(dashboard.model.IssueType, initIssueTypeModel.firstCall.returnValue);
			assert.strictEqual(dashboard.model.Key, initKeyModel.firstCall.returnValue);
			assert.strictEqual(dashboard.model.Result, initResultModel.firstCall.returnValue);
			assert.strictEqual(dashboard.model.Setting, initSettingModel.firstCall.returnValue);
			assert.strictEqual(dashboard.model.Site, initSiteModel.firstCall.returnValue);
			assert.strictEqual(dashboard.model.Url, initUrlModel.firstCall.returnValue);
			assert.strictEqual(dashboard.model.User, initUserModel.firstCall.returnValue);
		});

		it('creates an Express application', () => {
			assert.calledOnce(Dashboard.createExpressApplication);
			assert.calledWithExactly(Dashboard.createExpressApplication, dashboard);
		});

		it('has an `app` property set to the created Express application', () => {
			assert.strictEqual(dashboard.app, Dashboard.createExpressApplication.firstCall.returnValue);
		});

		it('has an `address` property set to null', () => {
			assert.isNull(dashboard.address);
		});

		it('has a `server` property set to null', () => {
			assert.isNull(dashboard.server);
		});

		it('binds the logger with a "Sidekick" prefix', () => {
			assert.calledOnce(bindLogger);
			assert.calledWithExactly(bindLogger, options.log, 'Sidekick:');
		});

		it('has a `log` property set to the bound logger', () => {
			assert.strictEqual(dashboard.log, bindLogger.firstCall.returnValue);
		});

		describe('.start()', () => {
			let returnValue;

			beforeEach(async () => {
				express.mockAddress.port = 7777;
				returnValue = await dashboard.start();
			});

			it('starts the Express application on the configured port', () => {
				assert.calledOnce(dashboard.app.listen);
				assert.calledWith(dashboard.app.listen, options.port);
				assert.isFunction(dashboard.app.listen.firstCall.args[1]);
			});

			it('sets the dashboard `server` property to the created HTTP server', () => {
				assert.strictEqual(dashboard.server, express.mockServer);
			});

			it('sets the dashboard `address` property to localhost with the bound port', () => {
				assert.calledOnce(dashboard.server.address);
				assert.strictEqual(dashboard.address, 'http://localhost:7777');
			});

			it('resolves with the dashboard instance', () => {
				assert.strictEqual(returnValue, dashboard);
			});

			describe('when the Express application fails to start', () => {
				let caughtError;
				let expressError;

				beforeEach(async () => {
					expressError = new Error('mock express error');
					express.mockApp.listen.yieldsAsync(expressError);
					try {
						returnValue = await dashboard.start();
					} catch (error) {
						caughtError = error;
					}
				});

				it('rejects with the Express error', () => {
					assert.strictEqual(caughtError, expressError);
				});

			});

		});

	});

	describe('Dashboard.defaults', () => {

		it('is an object', () => {
			assert.isObject(Dashboard.defaults);
		});

		it('has a `dashboardUrl` property', () => {
			assert.isNull(Dashboard.defaults.dashboardUrl);
		});

		it('has a `databaseConnectionString` property', () => {
			assert.strictEqual(Dashboard.defaults.databaseConnectionString, 'postgres://localhost:5432/pa11y_sidekick');
		});

		it('has an `environment` property', () => {
			assert.strictEqual(Dashboard.defaults.environment, 'development');
		});

		it('has a `log` property', () => {
			assert.strictEqual(Dashboard.defaults.log, console);
		});

		it('has a `port` property', () => {
			assert.strictEqual(Dashboard.defaults.port, 8080);
		});

		it('has a `requestLogFormat` property', () => {
			assert.strictEqual(Dashboard.defaults.requestLogFormat, 'mock-morgan-combined-format authUser=":auth[user]" authKey=":auth[key]"');
		});

		it('has a `sessionSecret` property', () => {
			assert.isNull(Dashboard.defaults.sessionSecret);
		});

	});

	describe('Dashboard.createDatabaseConnection(connectionString)', () => {
		let returnValue;

		beforeEach(() => {
			returnValue = Dashboard.createDatabaseConnection('mock-database-connection-string');
		});

		it('creates a Knex instance', () => {
			assert.calledOnce(knex);
			assert.calledWith(knex, {
				client: 'pg',
				connection: 'mock-database-connection-string'
			});
		});

		it('creates a Bookshelf instance with the created Knex instance', () => {
			assert.calledOnce(bookshelf);
			assert.calledWith(bookshelf, knex.mockInstance);
		});

		it('returns the Bookshelf instance', () => {
			assert.strictEqual(returnValue, bookshelf.mockInstance);
		});

	});

	describe('Dashboard.createExpressApplication(dashboard)', () => {
		let dashboard;
		let returnValue;

		beforeEach(() => {
			dashboard = require('../mock/dashboard.mock').mockDashboard;
			dashboard.options.requestLogFormat = 'mock-request-log-format';
			dashboard.options.requestLogStream = 'mock-request-log-stream';
			returnValue = Dashboard.createExpressApplication(dashboard);
		});

		it('creates an Express application', () => {
			assert.calledOnce(express);
			assert.calledWithExactly(express);
		});

		it('sets the Express application `dashboard` property to `dashboard`', () => {
			assert.strictEqual(express.mockApp.dashboard, dashboard);
		});

		it('sets the Express application `env` to the dashboard `environment` property', () => {
			assert.calledWithExactly(express.mockApp.set, 'env', dashboard.environment);
		});

		it('sets the Express application `json spaces` configuration', () => {
			assert.calledWithExactly(express.mockApp.set, 'json spaces', 4);
		});

		it('disables the `X-Powered-By` header', () => {
			assert.calledWithExactly(express.mockApp.disable, 'x-powered-by');
		});

		it('enables strict routing', () => {
			assert.calledWithExactly(express.mockApp.enable, 'strict routing');
		});

		it('enables case sensitive routing', () => {
			assert.calledWithExactly(express.mockApp.enable, 'case sensitive routing');
		});

		it('sets the `views` path', () => {
			assert.calledWithExactly(express.mockApp.set, 'views', path.resolve(__dirname, '../../../view'));
		});

		it('creates an Adaro dust renderer with the loaded view helpers', () => {
			assert.calledOnce(adaro.dust);
			assert.isObject(adaro.dust.firstCall.args[0]);
			assert.strictEqual(adaro.dust.firstCall.args[0].helpers, viewHelpers);
			assert.isTrue(adaro.dust.firstCall.args[0].whitespace);
		});

		it('sets the "dust" view renderer to the created Adaro renderer', () => {
			assert.calledWithExactly(express.mockApp.engine, 'dust', adaro.mockRenderer);
		});

		it('sets the default view engine to "dust"', () => {
			assert.calledWithExactly(express.mockApp.set, 'view engine', 'dust');
		});

		it('disables etags', () => {
			assert.calledWithExactly(express.mockApp.disable, 'etag');
		});

		it('creates and mounts a nocache middleware', () => {
			assert.calledOnce(nocache);
			assert.calledWithExactly(nocache);
			assert.calledWithExactly(express.mockApp.use, nocache.mockMiddleware);
		});

		it('creates and mounts a compression middleware', () => {
			assert.calledOnce(compression);
			assert.calledWithExactly(compression);
			assert.calledWithExactly(express.mockApp.use, compression.mockMiddleware);
		});

		it('creates a new morgan token named "auth"', () => {
			assert.calledOnce(morgan.token);
			assert.calledWith(morgan.token, 'auth');
			assert.isFunction(morgan.token.firstCall.args[1]);
		});

		describe('morgan "auth" token', () => {
			let authToken;
			let mockRequest;
			let returnValue;

			beforeEach(() => {
				mockRequest = {
					authUser: {
						id: 'mock-auth-user'
					},
					authKey: {
						id: 'mock-auth-key'
					}
				};
				authToken = morgan.token.firstCall.args[1];
				returnValue = authToken(mockRequest, {});
			});

			it('returns the string "-"', () => {
				assert.strictEqual(returnValue, '-');
			});

			describe('when a third argument (field) is set to "user"', () => {

				beforeEach(() => {
					returnValue = authToken(mockRequest, {}, 'user');
				});

				it('returns the authenticated user\'s ID', () => {
					assert.strictEqual(returnValue, 'mock-auth-user');
				});

				describe('when no user is authenticated', () => {

					beforeEach(() => {
						delete mockRequest.authUser;
						returnValue = authToken(mockRequest, {}, 'user');
					});

					it('returns the string "-"', () => {
						assert.strictEqual(returnValue, '-');
					});

				});

			});

			describe('when a third argument (field) is set to "key"', () => {

				beforeEach(() => {
					returnValue = authToken(mockRequest, {}, 'key');
				});

				it('returns the authenticated key\'s ID', () => {
					assert.strictEqual(returnValue, 'mock-auth-key');
				});

				describe('when no key is in use', () => {

					beforeEach(() => {
						delete mockRequest.authKey;
						returnValue = authToken(mockRequest, {}, 'key');
					});

					it('returns the string "-"', () => {
						assert.strictEqual(returnValue, '-');
					});

				});

			});

		});

		it('creates and mounts a morgan request logger', () => {
			assert.calledOnce(morgan);
			assert.calledWithExactly(morgan, dashboard.options.requestLogFormat, {
				stream: dashboard.options.requestLogStream
			});
			assert.calledWithExactly(express.mockApp.use, morgan.mockMiddleware);
		});

		it('creates and mounts a getAppUrl middleware', () => {
			assert.calledOnce(getAppUrl);
			assert.calledWithExactly(getAppUrl, dashboard.options.dashboardUrl);
			assert.calledWithExactly(express.mockApp.use, getAppUrl.mockMiddleware);
		});

		it('initialises and mounts all of the top-level controllers', () => {
			assert.calledOnce(initApiV1Controller);
			assert.calledWithExactly(initApiV1Controller, dashboard);
			assert.calledWithExactly(express.mockApp.use, '/api/v1', initApiV1Controller.firstCall.returnValue);
			assert.calledOnce(initFrontEndController);
			assert.calledWithExactly(initFrontEndController, dashboard);
			assert.calledWithExactly(express.mockApp.use, initFrontEndController.firstCall.returnValue);
		});

		it('returns the Express application', () => {
			assert.strictEqual(returnValue, express.mockApp);
		});

	});

});
