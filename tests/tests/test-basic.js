import { assert } from 'chai';
import * as helper from '../main.js';

//before(helper.init);
//after(helper.cleanup);

describe('Basic usage',async function(){
	const state = await helper.state;
	helper.setupMocha(this);
	this.timeout(10000);

	before(async function(){
		await helper.init();
		let url = await state.server.addr;
		url = url.port;
		url = `https://127.0.0.1:${url}/index.html`;
		this.url = url;
		return helper.done(true);
	});

	it('has basic interface componentents');
	it('uploaded document appears in list');
	it('uploaded document can be downloaded');


	/**
	 * From an empty database, it is necessary to start the process from
	 * an uploaded ePub.
	 *
	 * ## Pre-requisites
	 *
	 * - epub
	 *
	 * ## Steps
	 *
	 * 1. Open page
	 * 2. Click: Library tab
	 * 3. Click: File Upload
	 *    - epub
	 * 4. Wait for change
	 *
	 * Expected:
	 *  - `li` loaded
	 *  - schema filled in
	 */
	it('can upload an epub',async function(){

		this.timeout(10000);
		let driver = helper.getDriver();
		let url = await state.server.addr;
		url = url.port;
		url = `http://127.0.0.1:${url}/index.html`;



		await driver.get(url);
		let tab = await driver.findElement(state.By.css('ps-tabpanel'));
		this.skip();
		tab = await tab.getShadowRoot();
		tab = await tab.findElement(state.By.css('ul[part="menu"] > li::nth(2)'));
		tab.click();
		let uploader = driver.findElement(state.By.css('ps-panel#Catalogue > nav > button[name="fromEpub"]'));
		uploader = uploader.findElement(state.By.css('input[type="file"]'));

		let filename = [process.cwd(),'tests','lib','wonderland.epub'].join('/');
		uploader.sendKeys(filename);

		let li = driver.wait(function () {
			return driver.isElementPresent(state.By.css('ps-panel#Catalogue > ul > li'));
		}, 5000);

		let meta = li.data-meta;
		meta = JSON.parse(meta);

		let expected = {
			'name': "Alice's Adventures in Wonderland",
			'author': 'Lewis Carroll',
			'inLanguage': 'en',
			'keywords':['Fantasy fiction','Children\'s stories','Imaginary places -- Juvenile fiction','Alice (Fictitious character from Carroll) -- Juvenile fiction']
		};
		for(let e in expected){
			let val = expected[e];
			if(Array.isArray(val)){
				assert.equal(val.length,expected.length,`${e} same size`);
				val.sort();
				expected.keywords.sort();
				val = JSON.stringify(val);
				expected.keywords = JSON.stringify(expected.keywords);
				assert.equal(val,expected.keywords,`${e} same value`);
			}
			else{
				assert.equal(meta[e],expected[e],`${e} loaded`);
			}
		}
		return helper.done(true);
	});
});
