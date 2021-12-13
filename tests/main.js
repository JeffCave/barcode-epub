//https://github.com/mdn/headless-examples/blob/master/selenium-test.js

/*
global
	v8debug
*/

const { assert } = require('chai');
const webdriver = require('selenium-webdriver');
//const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');

const util = require('util');
const fs = require('fs');
const exec = util.promisify(require('child_process').exec);

const exe = util.promisify(exec);
const ffPath = './build/firefox/firefox';
const state = {
	mocha: null,
	browser: null,
	server: null
};


async function getGeckoVersion(){
	let result = await exe('geckodriver -V');
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


async function startServer(){
	let path = `${__dirname}/../www/`;
	let port = 3030;

	var http = require('http');

	var finalhandler = require('finalhandler');
	var serveStatic = require('serve-static');

	var serve = serveStatic(path);

	var server = http.createServer(function(req, res) {
		var done = finalhandler(req, res);
		serve(req, res, done);
	});

	let code = 'EADDRINUSE';
	while(code === 'EADDRINUSE'){
		try{
			server.listen(port);
			code = '';
		}
		catch(e){
			code = e.code;
		}
	}

	return server;

}


function setupMocha(mocha){

	// if we are in debug mode, make some helper settings
	let debug = typeof v8debug === 'object' || /--debug|--inspect/.test(process.execArgv.join(' '));
	if(debug){
		mocha.timeout(1000 * 60 * 60);
	}
	else{
		mocha.timeout(10000);
	}
}

before(async function(){
	process.env['PATH'] = [
		`${process.cwd()}/node_modules/.bin`,
		process.env['PATH']
	].join(':');

	this.timeout(60000);
	state.server = await startServer();

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
		return done(e);
	}
	return done();
});

after(function(){
	try{
		state.browser.quit();
		state.server.close();
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
		//assert.isTrue(state.server.listening,'test server is listneing for connections');
	});

	it('can load a page into the browser', async function(){

		try{
			let version = await getGeckoVersion();
			assert.equal(version,'0.29.1','Gecko version');
			version = await getFirefoxVersion();
			assert.equal(version,'97.0a1','Firefox version');

			await state.browser.get('https://example.com/');
			let title = await state.browser.getTitle();
			assert.isNotEmpty(title,'Generic page found');

			let baseUrl = `http://localhost:${server.address().port}`;
			await state.browser.get(`${baseUrl}/index.html`);
			title = await state.browser.getTitle();
			assert.isNotEmpty(title,'A page was found');
			let h1 = state.browser.findElement(state.By.css('h1'));
			let text = await h1.getText();
			assert.isEmpty(text,'Content was found');
			console.log(text);
		}
		catch(e){
			return done(e);
		}
		return done();
	});

});
