//https://github.com/mdn/headless-examples/blob/master/selenium-test.js

import { assert } from 'chai';
import * as helper from '../main.js';

describe('Testing Framework', function(){
	let state = null;

	before(async function(){
		await helper.init();
		state = await helper.state;
		helper.setupMocha(this);
	});

	after(function(){
		let driver = helper.getDriver();
		driver.quit();
	});

	it('has an assertion framework', function(){
		assert.isTrue(true,'Test framework is loaded');
	});

	it('has a running HTTP server', function(){
		//assert.isTrue(state.server.listening,'test server is listneing for connections');
		this.skip();
	});

	it('can load a page into the browser', async function(){
		let driver = helper.getDriver();
		await driver.get('https://example.com/');
		let title = await driver.getTitle();
		assert.isNotEmpty(title,'Generic page found');
		return helper.done(true);
	});


	it('can load our hosted page into browser', async function(){
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
