//https://github.com/mdn/headless-examples/blob/master/selenium-test.js

/*
global
	v8debug
*/

const { assert } = require('chai');
let webdriver = require('selenium-webdriver');
//let chrome = require('selenium-webdriver/chrome');
let firefox = require('selenium-webdriver/firefox');
let finalhandler = require('finalhandler');
let serveStatic = require('serve-static');
let http = require('http');
const util = require('util');
const fs = require('fs');
const exec = util.promisify(require('child_process').exec);
const ffPath = './build/firefox/firefox';

process.env['PATH'] = [
	`${process.cwd()}/node_modules/.bin`,
	process.env['PATH']
].join(':');

const state = {
	mocha: null,
	browser: null,
	server: null
};


async function getGeckoVersion(){
	let result = await exec('geckodriver -V');
	let text = result.stdout;
	text = text.split(' ');
	text = text[1];
	return text;
}

async function getFirefoxVersion(){
	let text = null;
	try{
		text = await exec(`${ffPath} --version`);
		text = text.stdout;
		text = text.split(' ');
		text = text.pop();
		text = text.replace('\n','');
	}
	catch(e){
		text = null;
	}
	return text;
}

async function done(rtn = true){
	return rtn;
}


function setupMocha(mocha){

	// if we are in debug mode, make some helper settings
	let debug = typeof v8debug === 'object' || /--debug|--inspect/.test(process.execArgv.join(' '));
	if(debug){
		mocha.timeout(60000);
	}
}

before(async function(){

	let serve = serveStatic('../www');
	state.server = http.createServer(function(req, res) {
		let done = finalhandler(req, res);
		serve(req, res, done);
	});
	state.server.listen(3030);

	if(!fs.existsSync(ffPath)){
		await exec('get-firefox --target "./build/" --extract ');
	}


	state.By = webdriver.By;
	state.until = webdriver.until;
	let options = new firefox.Options();
	options.setBinary(ffPath);
	options.addArguments('-headless');

	let builder = new webdriver.Builder();
	builder = builder.forBrowser('firefox');
	builder = builder.setFirefoxOptions(options);
	//builder = builder.setChromeOptions( );
	try{
		state.browser = builder.build();
	}
	catch(e){
		console.error(e);
	}
	console.log('initialized');
	return done();
});

after(function(){
	try{
		state.server.close();
		state.browser.quit();
	}
	catch(e){
		console.error('Failed to terminate tests');
		console.error(e);
	}
});


describe('Testing Framework', function(){
	setupMocha(this);

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

	it('has an assertion framework', function(){
		assert.isTrue(true,'Test framework is loaded');
	});

	it('has a running HTTP server', function(){
		assert.isTrue(state.server.listening,'test server is listneing for connections');
	});

	it('can load a page into the browser', async function(){

		try{
			let version = await getGeckoVersion();
			assert.equal(version,'0.29.1','Gecko version');
			version = await getFirefoxVersion();
			assert.equal(version,'97.0a1','Firefox version');

			await state.browser.get('https://example.com/');
			let title; // =	await state.browser.wait(state.until.titleIs('webdriver - Google Search'), 1000);

			title = await state.browser.getTitle();
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
			return done(e);
		}
		return done();
	});

});
