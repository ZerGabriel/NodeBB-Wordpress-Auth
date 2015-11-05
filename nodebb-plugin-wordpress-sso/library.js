(function(module) 
{
	"use strict";

	var http = require('http');
    var config = require('./config');

	var User = module.parent.require('./user'),
		Groups = module.parent.require('./groups'),
		meta = module.parent.require('./meta'),
		db = module.parent.require('../src/database'),
		passport = module.parent.require('passport'),
		fs = module.parent.require('fs'),
		path = module.parent.require('path'),
		nconf = module.parent.require('nconf'),
		winston = module.parent.require('winston'),
		async = module.parent.require('async'),

		constants = Object.freeze(config),
		configOk = true,
		OAuth = {}, passportOAuth, opts;


	OAuth.getStrategy = function(strategies, callback) 
	{
		if (configOk) 
		{
			passportOAuth = require('passport-oauth')['OAuth2Strategy'];

			
				opts = constants.oauth2;
				opts.callbackURL = constants.nodebb_url + 'auth/' + constants.name + '/callback';

				passportOAuth.Strategy.prototype.userProfile = function(accessToken, done) 
				{
					this._oauth2.get(constants.userRoute, accessToken, function(err, body, res) 
					{
						var options = 
						{
						  host: constants.host,
						  port: constants.port,
						  path: constants.userRoute_path + accessToken
						};

						http.get(options, function(res) 
						{
							  var body = '';
							  res.on('data', function(chunk) 
							  {
									body += chunk;
							  });
							  res.on('end', function() 
							  {
									process.stdout.write('========= HTTP Response ========');
									process.stdout.write(body);
									
									
									var json = JSON.parse(body);
									
									OAuth.parseUserReturn(json, function(err, profile) 
									{
										if (err) return done(err);
										profile.provider = constants.name;
										done(null, profile);
									});
							  });
						}).on('error', function(e)
						{
							return;
						});


					});
				};
			

			passport.use(constants.name, new passportOAuth(opts, function(token, secret, profile, done) {
				OAuth.login({
					oAuthid: profile.id,
					handle: profile.displayName,
					email: profile.emails[0].value,
					isAdmin: profile.isAdmin
				}, function(err, user) {
					if (err) {
						return done(err);
					}
					done(null, user);
				});
			}));

			strategies.push({
				name: constants.name,
				url: '/auth/' + constants.name,
				callbackURL: '/auth/' + constants.name + '/callback',
				icon: 'fa-check-square',
				scope: (constants.scope || '').split(',')
			});

			callback(null, strategies);
		} else {
			callback(new Error('OAuth Configuration is invalid'));
		}
	};

	OAuth.parseUserReturn = function(data, callback) 
    {
		var profile = {};
		profile.id = data.ID;
		profile.displayName = data.user_login;
		profile.emails = [{ value: data.user_email }];

		callback(null, profile);
	}

	OAuth.login = function(payload, callback) {
		OAuth.getUidByOAuthid(payload.oAuthid, function(err, uid) {
			if(err) {
				return callback(err);
			}

			if (uid !== null) {
				// Existing User
				callback(null, {
					uid: uid
				});
			} else {
				// New User
				var success = function(uid) {
					// Save provider-specific information to the user
					User.setUserField(uid, constants.name + 'Id', payload.oAuthid);
					db.setObjectField(constants.name + 'Id:uid', payload.oAuthid, uid);

					if (payload.isAdmin) {
						Groups.join('administrators', uid, function(err) {
							callback(null, {
								uid: uid
							});
						});
					} else {
						callback(null, {
							uid: uid
						});
					}
				};

				User.getUidByEmail(payload.email, function(err, uid) {
					if(err) {
						return callback(err);
					}

					if (!uid) {
						User.create({
							username: payload.handle,
							email: payload.email
						}, function(err, uid) {
							if(err) {
								return callback(err);
							}

							success(uid);
						});
					} else {
						success(uid); // Existing account -- merge
					}
				});
			}
		});
	};

	OAuth.getUidByOAuthid = function(oAuthid, callback) {
		db.getObjectField(constants.name + 'Id:uid', oAuthid, function(err, uid) {
			if (err) {
				return callback(err);
			}
			callback(null, uid);
		});
	};

	OAuth.deleteUserData = function(uid, callback) {
		async.waterfall([
			async.apply(User.getUserField, uid, constants.name + 'Id'),
			function(oAuthIdToDelete, next) {
				db.deleteObjectField(constants.name + 'Id:uid', oAuthIdToDelete, next);
			}
		], function(err) {
			if (err) {
				winston.error('[sso-oauth] Could not remove OAuthId data for uid ' + uid + '. Error: ' + err);
				return callback(err);
			}
			callback(null, uid);
		});
	};

	module.exports = OAuth;
}(module));