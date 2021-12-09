/*
var webdriver = require('selenium-webdriver');
//var chrome = require('selenium-webdriver/chrome');
var firefox = require('selenium-webdriver/firefox');


var http = require('http');
var finalhandler = require('finalhandler');
var serveStatic = require('serve-static');
const { assert } = require('chai');
var serve = serveStatic('../www');
var server = http.createServer(function(req, res) {
	var done = finalhandler(req, res);
	serve(req, res, done);
});
server.listen(3030);



var profile = new firefox.Profile('./build');
var firefoxOptions = new firefox.Options().setProfile(profile);

var driver = new webdriver.Builder()
	.forBrowser('firefox')
	.setFirefoxOptions(firefoxOptions)
	.setChromeOptions( )
	.build()
	;
*/

describe('Self-Test', function(){


	let baseUrl = 'http://localhost:3030/';

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

	/**
	 * [1] tests that the page is discoverable
	 */
	it('Test-1: page found', async function(){
		this.skip();
		/*
		driver.findElement(webdriver.By.css('body')); //.sendKeys(my_username);
		let title = await driver.getTitle();
		assert.equal(title,'MISS','Title is correct');
		*/
	});

	it('Test-2', function(){
		this.skip();
	});

	it('Test-3', function(){
		this.skip();
	});

});
