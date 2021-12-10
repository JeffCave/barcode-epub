//https://github.com/mdn/headless-examples/blob/master/selenium-test.js

const { assert } = require('chai');


const state = {
	mocha: null,
	browser: null,
	server: null
};


before(async function(){
	var http = require('http');
	var finalhandler = require('finalhandler');
	var serveStatic = require('serve-static');
	var serve = serveStatic('../www');
	state.server = http.createServer(function(req, res) {
		var done = finalhandler(req, res);
		serve(req, res, done);
	});
	state.server.listen(3030);


	var webdriver = require('selenium-webdriver');
	state.By = webdriver.By;
	state.until = webdriver.until;
	//var chrome = require('selenium-webdriver/chrome');
	var firefox = require('selenium-webdriver/firefox');
	var options = new firefox.Options();
	options.addArguments('-headless');

	state.browser = new webdriver.Builder()
		.forBrowser('firefox')
		.setFirefoxOptions(options)
		.setChromeOptions( )
		.build();
});

after(async function(){
	state.browser.quit();
	await state.server.close();
});


describe('Testing Framework', function(){


	before(function(){
	});

	after(function(){
	});

	beforeEach(function(){
		// do something before test case execution
		// no matter if there are failed cases
	});

	afterEach(function(){
		// do something after test case execution is finished
		// no matter if there are failed cases
	});

	it('is loaded and present', function(){
		assert.isTrue(true,'Test framework is loaded');
	});

	it('has a running HTTP server', async function(){
		assert.isTrue(state.server.listening,'test server is listneing for connections');
	});

	it('can load a page into the browser', async function(){
		try{
			await state.browser.get('https://example.com/');
			let title = await state.browser.getTitle();
			assert.isNotEmpty(title,'Page was found');
			/*
			let baseUrl = `http://localhost:${state.server.address().port}/index.html`;
			await state.browser.get(baseUrl + './index.html');
			let h1 = state.browser.findElement(state.By.css('h1'));
			let text = await h1.getText();
			assert.isNotEmpty(text,'Content was found');
			title = await state.browser.getTitle();
			assert.isNotEmpty(title,'Page was found');
			*/
		}
		catch(e){

		}
		return new Promise();
	});

});
