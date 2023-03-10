//https://github.com/mdn/headless-examples/blob/master/selenium-test.js

import { assert } from 'chai';
import * as helper from '../main.js';


after(async function(){
	helper.cleanup();
	return helper.done(true);
});

describe('000 - Testing Framework', function(){
	let state = null;

	before(async function(){
		await helper.init();
		state = await helper.state;
		helper.setupMocha(this);
		this.timeout(state.timeout);
	});

	it('has an assertion framework', function(){
		assert.isTrue(true,'Test framework is loaded');
	});

	it('has a running HTTP server', function(){
		//assert.isTrue(state.server.listening,'test server is listneing for connections');
		this.skip();
	});

	it('has the correct browser and driver versions available',async function(){
		this.timeout(state.timeout);
		try{
			await helper.getDriver();
		}
		catch(e){
			assert.fail('Failed to instantiate driver (probably missing shared object)');
		}
		let driver = await helper.getDriverGenerator();

		let version = await driver.getDriverVersion();
		assert.equal(version,'97.0.4692.71','Webdriver version is as expected');
		version = await driver.getBrowserVersion();
		assert.equal(version,'97.0.4691.0','Browser version is as expected');
	});

	it('can load a page into the browser', async function(){
		this.timeout(state.timeout);
		let driver = await helper.getDriver();
		await driver.get('https://example.com/');
		let title = await driver.getTitle();
		assert.isNotEmpty(title,'Generic page found');
		return helper.done(true);
	});


	it('can load our hosted page into browser', async function(){
		this.timeout(state.timeout);
		let driver = await helper.getDriver();
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
