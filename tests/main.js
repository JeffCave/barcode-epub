const { assert } = require('chai');


const status = {
	mocha: null,
	browser: null,
	server: null
};


before(async function(){
	var http = require('http');
	var finalhandler = require('finalhandler');
	var serveStatic = require('serve-static');
	var serve = serveStatic('../www');
	var server = http.createServer(function(req, res) {
		var done = finalhandler(req, res);
		serve(req, res, done);
	});
	server.listen(3030);

	status.server = server;

/*

var webdriver = require('selenium-webdriver');
//var chrome = require('selenium-webdriver/chrome');
var firefox = require('selenium-webdriver/firefox');
var profile = new firefox.Profile('./build');
var firefoxOptions = new firefox.Options().setProfile(profile);

var driver = new webdriver.Builder()
	.forBrowser('firefox')
	.setFirefoxOptions(firefoxOptions)
	.setChromeOptions( )
	.build()
	;
*/

});

after(async function(){
	await status.server.close();
});


describe('Self-Test', function(){


	let baseUrl = 'http://localhost:${state.server.address().port}/';

	before(function(){
		//driver.get(baseUrl + './index.html');
	});

	after(function(){
		//return driver.quit();
	});

	beforeEach(function(){
		// do something before test case execution
		// no matter if there are failed cases
	});

	afterEach(function(){
		// do something after test case execution is finished
		// no matter if there are failed cases
	});

	it('Test framework is loaded and present', function(){
		assert.isTrue(true,'Test framework is loaded');
	});

	it('The server is running', async function(){
		assert.isTrue(status.server.listening,'test server is listneing for connections');
	});

});
