//https://github.com/mdn/headless-examples/blob/master/selenium-test.js

import { assert } from 'chai';
import * as helper from '../main.js';

describe('Testing Framework', function(){
	helper.setupMocha(this);
	let state = null;

	before(async function(){
		await helper.init();
		state = helper.state;
	});

	after(function(){
		let driver = helper.getDriver();
		driver.quit();
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

	it('has the correct versions of drivers', async function(){
		this.skip();
		let version = await helper.getGeckoVersion();
		assert.equal(version,'0.29.1','Gecko version');
		version = await helper.getFirefoxVersion();
		assert.equal(version,'97.0a1','Firefox version');
	});


	it('can load a page into the browser', async function(){
		this.timeout(10000);
		let driver = helper.getDriver();
		await driver.get('https://example.com/');
		let title = await driver.getTitle();
		assert.isNotEmpty(title,'Generic page found');
		return helper.done(true);
	});


	it('can load our hosted page into browser', async function(){
		this.timeout(10000);
		let driver = helper.getDriver();
		let url = await state.server.addr;
		url = url.port;
		url = `http://127.0.0.1:${url}/index.html`;
		await driver.get(url);
		let title = await driver.getTitle();
		assert.isNotEmpty(title,'A page was found');
		let h1 = await driver.findElement(state.By.css('h1'));
		let text = await h1.getText();
		assert.isNotEmpty(text,'Content was found');
		return helper.done(true);
	});

});
