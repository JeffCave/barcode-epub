import { assert } from 'chai';
import * as helper from '../main.js';

import books from '../lib/books.js';
import App from '../lib/interface/app.js';

after(async function(){
	helper.cleanup();
	return helper.done(true);
});

describe('020 - Library Form',function(){
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



	/**
	 * Given a wide screen, it is desireable that the items not grow past a maximum width. This allows people to see the entire record in a fixed space. Items should tile to accomodate wider screen space.
	 *
	 * ## Pre-requisites
	 *
	 * - epub with long title (wonderland.epub)
	 * - many epubs
	 *
	 * ## Steps
	 *
	 * 1. Upload all books
	 * 2. Make browser a wide width (1366×768?)
	 *
	 * Expected:
	 * - items not wider than maximum width
	 * - row of items wraps to new line
	 */
	it('tiles its items in landscape',async function(){
		this.skip('defect#33');

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
		for(let book of Object.values(books)){
			await app.Library.upload(book.path);
		}

		let epublist = await driver.findElement(state.By.css('ps-mobtabpanel > ps-panel[name="library"] > ps-epublist'));
		epublist = await epublist.getShadowRoot();
		let items = await epublist.findElements(state.By.css('ps-epublistitem'));

		driver.manage().window().setRect({x: 0, y: 0, width: 1366, height: 768});
		let body = await driver.findElement(state.By.css('body'));
		let rectBody = await body.getRect();
		rectBody.right = rectBody.width + rectBody.x;
		rectBody.bottom = rectBody.height + rectBody.y;

		let rowCounts = new Map();
		for(let item of items){
			let rectItem = await item.getRect();
			if (!rectItem) continue;
			rectItem.right = rectItem.width + rectItem.x;
			rectItem.bottom = rectItem.height + rectItem.y;

			assert.isBelow(rectItem.width, rectBody.width/2, 'Item is not wider than maximum width');

			// count the number of items per row
			let count = rectItem.y;
			count = rowCounts.get(rectItem.y) || 0;
			count++;
			rowCounts.set(rectItem.y,count);
		}
		// there must be at least two in the first row
		let rowlen = rowCounts.values()[0];
		assert.isAbove(rowlen, 1, 'There are at least two items in the first row');
		assert.isAbove(rowCounts.size, 1, 'There are at least two rows');
	});


	/**
	 * Given a wide book title or subjects, the book record should be
	 * visiually constrained to the width of the screen. Items that spill
	 * over teh right should wrap to fit the page.
	 *
	 * ## Pre-requisites
	 *
	 * - epub with long title (wonderland.epub)
	 *
	 * ## Steps
	 *
	 * 1. Upload boook
	 * 2. Make browser a small width (800x600?)
	 *
	 * Expected:
	 * - right-hand most edge of item-box is not greater than right-hand
	 *   edge of browser
	 * - Bottom scroll-bar is not present
	 * - Long text wraps
	 */
	it('physically bounds its items',async function(){

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
		let li = await epublist.findElement(state.By.css('ps-epublistitem'));

		driver.manage().window().setRect({x: 0, y: 0, width: 600, height: 800});
		let body = await driver.findElement(state.By.css('body'));

		let rectBody = await body.getRect();
		let rectItem = await li.getRect();
		driver.sleep(100);
		for(let rect of [rectBody,rectItem]){
			rect.right = rect.width + rect.x;
			rect.bottom = rect.height + rect.y;
		}

		assert.isAbove(rectItem.x, rectBody.x, 'Item\'s left side is not past the left margin');
		this.skip('defect#32');
		assert.isBelow(rectItem.right, rectBody.right, 'Right side of item is not past the right side of page');
	});

});
