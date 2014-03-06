var	fs = require('fs'),
	path = require('path'),
	nconf = require('nconf'),
	meta = require('../../src/meta'),
	user = require('../../src/user'),
	websockets = require('../../src/socket.io/index.js'),
	templates = module.parent.require('../public/src/templates');
	
var constants = Object.freeze({
	'name': "Cash MOD",
	'admin': {
		'route': '/cash',
		'icon': 'icon-money'
	},
	'defaults': {
		'pay_per_character': 0.25,
		'currency_name': 'gp'
	}
});


var Cash = {};

function renderAdmin(req, res, next) {
	if (res.locals.isAPI) {
		res.json({});
	} else {
		res.render('admin/cash', {});
	}
}

Cash.init = function(app, middleware, controllers) {
	app.get('/admin/cash', middleware.admin.buildHeader, renderAdmin);
	app.get('/api/admin/cash', renderAdmin);
};

Cash.addAdminNavigation = function(custom_header, callback) {
	custom_header.plugins.push({
		"route": constants.admin.route,
		"icon": constants.admin.icon,
		"name": constants.name
	});

	return custom_header;
};

Cash.addProfileInfo = function(profileInfo, callback) {
	var currency_name = meta.config['cash:currency_name'] || constants.defaults.currency_name;

	user.getUserField(profileInfo.uid, 'currency', function(err, data) {
		profileInfo.profile.push({
			content: "<span class='cash-mod-currency'><img src='" + nconf.get('url') + "/plugins/nodebb-plugin-cash/coin1.png' /> " + (data || 0) + " " + currency_name + "</span>"
		});
		callback(err, profileInfo);
	});		
};

Cash.increaseCurrencyByPostData = function(postData) {
	var multiplier = meta.config['cash:pay_per_character'] || constants.defaults.pay_per_character,
		uid = postData.uid,
		postLength = postData.content.length,
		value = Math.floor(multiplier * postLength);

	user.incrementUserFieldBy(uid, 'currency', value);

	setTimeout(function() {
		websockets.in('uid_' + uid).emit('event:alert', {
			alert_id: 'currency_increased',
			message: 'You earned <strong>' + value + ' gold</strong> for posting',
			type: 'info',
			timeout: 2500
		});
	}, 750);
};

module.exports = Cash;
