import { assert } from 'chai';
import * as helper from '../main.js';

import books from '../lib/books.js';
import App from '../lib/interface/app.js';

after(async function(){
	helper.cleanup();
	return helper.done(true);
});

describe('010 - Basic usage',function(){
	let state = null;

	before(async function(){
		state = await helper.state;
		await helper.init();
		helper.setupMocha(this);
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

		this.timeout(state.timeout);
		let driver = await helper.getDriver();
		let url = await state.server.addr;
		url = url.port;
		url = `http://127.0.0.1:${url}`;

		let app = new App(driver,url);

		await app.navigate();
		await app.WipeDB();

		await app.Library.navigate();
		this.timeout(120000);
		await app.Library.upload(books.wonderland.path);

		let epublist = await driver.findElement(state.By.css('ps-mobtabpanel > ps-panel[name="library"] > ps-epublist'));
		epublist = await epublist.getShadowRoot();

		let li = await helper.tryUntil( 10000, ()=>{ return epublist.findElement(state.By.css('ps-epublistitem')); });
		li = await li.getShadowRoot();

		let script = await li.findElement(state.By.css('script[type="application/ld+json"]'));
		await driver.executeScript("arguments[0].style.display = 'block';",script);
		let meta = await script.getText();
		await driver.executeScript("arguments[0].removeAttribute('style');",script);
		meta = JSON.parse(meta);

		let expected = books.wonderland.record;
		for(let e in expected){
			let val = meta[e];
			if(Array.isArray(val)){
				assert.equal(val.length,expected[e].length,`${e} same size`);
				val.sort();
				expected[e].sort();
				val = JSON.stringify(val);
				expected[e] = JSON.stringify(expected[e]);
				assert.equal(val,expected[e],`${e} same value`);
			}
			else{
				assert.equal(meta[e],expected[e],`${e} loaded`);
			}
		}
		return helper.done(true);
	});
});
