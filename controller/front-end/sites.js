'use strict';

const express = require('express');
const pa11y = require('pa11y');
const requirePermission = require('../../lib/middleware/require-permission');

/**
 * Initialise the sites controller.
 * @param {Dashboard} dashboard - A dashboard instance.
 * @param {Object} router - The front end Express router.
 * @returns {undefined} Nothing
 */
function initSitesController(dashboard, router) {
	const Issue = dashboard.model.Issue;
	const Site = dashboard.model.Site;
	const Url = dashboard.model.Url;

	// TODO write integration tests for these routes

	// List of all sites
	router.get('/sites', requirePermission('read'), async (request, response) => {
		response.render('template/sites/sites', {
			sites: (await Site.fetchAll()).serialize()
		});
	});

	// Get a single site
	router.get('/sites/:siteId', requirePermission('read'), async (request, response, next) => {
		try {
			const site = await Site.fetchOneById(request.params.siteId);
			if (!site) {
				return next();
			}
			response.render('template/sites/site', {
				site: site.serialize(),
				urls: (await Url.fetchBySiteId(site.id)).serialize(),
				form: {
					site: {
						created: request.flash.get('form.site.created')
					}
				}
			});
		} catch (error) {
			return next(error);
		}
	});

	// Display the new site page
	router.get('/sites/new', requirePermission('write'), (request, response) => {
		response.render('template/sites/new-site', {
			form: {
				site: {}
			}
		});
	});

	// Create a new site
	router.post('/sites/new', requirePermission('write'), express.urlencoded({extended: false}), async (request, response, next) => {
		try {

			// TODO check Pa11y config for JSON errors
			// and pass into the create method

			// Attempt to create a site
			const site = await Site.create({
				name: request.body.name,
				base_url: request.body.baseUrl,
				is_runnable: request.body.isRunnable,
				is_scheduled: request.body.isScheduled,
				schedule: request.body.schedule
			});

			// Redirect to the site page
			request.flash.set('form.site.created', {
				name: request.body.name
			});
			response.redirect(`/sites/${site.get('id')}`);

		} catch (error) {
			if (error.name === 'ValidationError') {
				return response.status(400).render('template/sites/new-site', {
					form: {
						site: {
							name: request.body.name,
							baseUrl: request.body.baseUrl,
							isRunnable: request.body.isRunnable,
							isScheduled: request.body.isScheduled,
							schedule: request.body.schedule,
							errors: error.details.map(detail => detail.message)
						}
					}
				});
			}
			return next(error);
		}
	});
	// List of all URLs associated with site
	router.get('/sites/:siteId/urls', requirePermission('read'), async (request, response) => {
		response.render('template/sites/urls', {
			site: await Site.fetchOneById(request.params.siteId)
		});
	});

	// Display the new URLs page
	router.get('/sites/:siteId/urls/new', requirePermission('write'), async (request, response) => {
		try {
			const site = await Site.fetchOneById(request.params.siteId);
			response.render('template/sites/new-url', {
				site: site.serialize(),
				urls: (await Url.fetchBySiteId(site.id)).serialize(),
				form: {
					url: {
						created: request.flash.get('form.url.created')
					}
				}
			});
		} catch (error) {
			return error;
		}
	});

	// Add a new URL for site
	router.post('/sites/:siteId/urls/new', requirePermission('write'), express.urlencoded({extended: false}), async (request, response, next) => {
		try {

			// TODO check Pa11y config for JSON errors
			// and pass into the create method

			const site = await Site.fetchOneById(request.params.siteId);
			// Attempt to create a URL
			await Url.create({
				site_id: request.params.siteId,
				name: request.body.name,
				address: request.body.address,
				pa11y_config: {}
			});

			// Redirect to the site page
			request.flash.set('form.url.created', {});
			response.redirect(`/sites/${site.get('id')}`);

		} catch (error) {
			if (error.name === 'ValidationError') {
				return response.status(400).render('template/sites/new-url', {
					form: {
						url: {
							site_id: request.body.site_id,
							name: request.body.name,
							address: request.body.address,
							pa11y_config: request.body.pa11yConfig,
							errors: error.details.map(detail => detail.message)
						}
					}
				});
			}
			return next(error);
		}
	});

	// Display the URL edit page
	router.get('/sites/:siteId/urls/:urlId/edit', requirePermission('write'), async (request, response, next) => {
		try {
			const url = await Url.fetchOneById(request.params.urlId);
			if (!url) {
				return next();
			}
			response.render('template/sites/edit-url', {
				form: {
					url: {
						site_id: url.get('site_id'),
						name: url.get('name'),
						address: url.get('address'),
						pa11y_config: url.get('pa11yConfig'),
						success: request.flash.get('form.user.success')
					}
				}
			});
		} catch (error) {
			return next(error);
		}
	});

	// Edit a URL
	router.post('/sites/:siteId/urls/:urlId/edit', requirePermission('write'), express.urlencoded({extended: false}), async (request, response, next) => {
		try {
			const site = await Site.fetchOneById(request.params.siteId);
			const url = await Url.fetchOneById(request.params.urlId);
			if (!url) {
				return next();
			}

			// Attempt to update the URL
			await url.update({
				site_id: request.body.site_id,
				name: request.body.name,
				address: request.body.address,
				pa11y_config: request.body.pa11yConfig
			});

			// Redirect back to the non-POST version of the page
			request.flash.set('form.url.success', 'Your changes have been saved');
			response.redirect(`/sites/${site.get('id')}`);

		} catch (error) {
			if (error.name === 'ValidationError') {
				return response.status(400).render('template/sites/edit-url', {
					form: {
						url: {
							site_id: request.body.site_id,
							name: request.body.name,
							address: request.body.address,
							pa11y_config: request.body.pa11yConfig,
							errors: error.details.map(detail => detail.message)
						}
					}
				});
			}
			return next(error);
		}
	});

	// Display the URL delete page
	router.get('/sites/:siteId/urls/:urlId/delete', requirePermission('write'), async (request, response, next) => {
		try {
			const url = await Url.fetchOneById(request.params.urlId);
			if (!url) {
				return next();
			}
			response.render('template/sites/delete-url', {
				form: {
					url: url.serialize()
				}
			});
		} catch (error) {
			return next(error);
		}
	});

	// Delete a user
	router.post('/sites/:siteId/urls/:urlId/delete', requirePermission('write'), express.urlencoded({extended: false}), async (request, response, next) => {
		try {
			const site = await Site.fetchOneById(request.params.siteId);
			const url = await Url.fetchOneById(request.params.urlId);
			if (!url) {
				return next();
			}

			// Attempt to delete the URL
			const urlName = url.get('name');
			await url.destroy();

			// Redirect back to the main user management page
			request.flash.set('form.url.deleted', {
				name: urlName
			});
			response.redirect(`/sites/${site.get('id')}`);

		} catch (error) {
			return next(error);
		}
	});


	// Run pa11y against a site
	router.get('/sites/:siteId/run', requirePermission('read'), async (request, response, next) => {
		try {
			// TODO check Pa11y config for JSON errors
			// and pass into the create method
			const siteId = request.params.siteId;

			const pa11yUrl = await getTestUrl(dashboard, siteId);
			console.log(pa11yUrl);
			// Attempt to create a site
			const pa11yResults = await pa11y(
				pa11yUrl,
				{runners: ['htmlcs', 'axe']});

			const pa11yIssues = pa11yResults.issues;

			const result = await createResultRecord(dashboard, siteId);
			const issues = [];
			pa11yIssues.forEach(issue => issues.push(issue));
			for (const issue of issues) {
				// Console.log(issue);
				await Issue.create({
					result_id: result.id,
					code: issue.code,
					context: issue.context,
					selector: issue.selector,
					message: issue.message,
					issue_types_code: issue.typeCode,
					runner: issue.runner,
					runner_extras: issue.runnerExtras || {}
				});
			}

			response.status(201).send(pa11yResults);
		} catch (error) {
			return next(error);
		}
	});

}

async function getTestUrl(dashboard, siteId) {
	const Site = dashboard.model.Site;
	const Url = dashboard.model.Url;

	const possibleSite = await Site.fetchOneById(siteId);
	const possibleUrl = await Url.fetchBySiteId(siteId);

	if (possibleUrl.length === 0) {
		return possibleSite.get('base_url');
	}

	const testUrl = await Url.fetchOneBySiteId(siteId);
	return testUrl.fullAddress();

}

async function createResultRecord(dashboard, siteId) {
	const Site = dashboard.model.Site;
	const Url = dashboard.model.Url;
	const Result = dashboard.model.Result;

	const possibleSite = await Site.fetchOneById(siteId);
	const possibleUrl = await Url.fetchBySiteId(siteId);

	let result;
	if (possibleUrl.length === 0) {
		result = await Result.create({
			site_id: possibleSite.get('id')
		});
	} else {
		const testUrl = await Url.fetchOneBySiteId(siteId);
		result = await Result.create({
			site_id: possibleSite.get('id'),
			url_id: testUrl.get('id')
		});
	}
	return result;
}


module.exports = initSitesController;
