
import webdriver from 'selenium-webdriver';

const By = webdriver.By;

class AppInterface{
	constructor(driver,url='http://lvh.me'){
		this.driver = driver;
		this.url = url;
	}

	async navigate(){
		let url = this.url + '/index.html';
		await this.driver.get(url);
	}


	async tryUntil(timeout,fun){
		if(typeof timeout === 'function'){
			fun = timeout;
			timeout = 60000;
		}

		let midpoint = timeout / 2;
		let grow = 1.62;
		let rtn = null;
		for(let delay = 23; !rtn && delay > 22;){
			try{
				rtn = await fun();
			}
			catch(e){
				rtn = null;
				delay = Math.floor(delay * grow);
				if(delay > midpoint){
					delay = midpoint;
					grow = 1/grow;
				}
				//console.log(delay);
				await new Promise((r)=>{setTimeout(r,delay);});
			}
		}
		return rtn;
	}

}


class LibraryPage extends AppInterface{
	constructor(driver){
		super(driver);
	}

	async navigate(){
		let tabs = await this.driver.findElement(By.css('ps-mobtabpanel'));
		tabs = await tabs.getShadowRoot();
		let tab = await tabs.findElement(By.css('ul[part="menu"] > li:nth-of-type(2)'));
		await tab.click();
		await this.tryUntil( ()=>{
			return this.driver.findElement(By.css('ps-mobtabpanel > ps-panel[name="library"]'));
		});
		return this;
	}

	async upload(file){
		let uploader = await this.driver.findElement(By.css('ps-mobtabpanel > ps-panel[name="library"]'));
		uploader = await uploader.findElement(By.css('ps-epublist'));
		uploader = await uploader.getShadowRoot();
		uploader = await uploader.findElement(By.css('ps-filedrop'));
		uploader = await uploader.getShadowRoot();
		uploader = await uploader.findElement(By.css('input[type=file]'));

		uploader.sendKeys(file);

		let epublist = await this.driver.findElement(By.css('ps-mobtabpanel > ps-panel[name="library"] > ps-epublist'));
		epublist = await epublist.getShadowRoot();

		let li = await this.tryUntil(10000, ()=>{ return epublist.findElement(By.css('ps-epublistitem')); });
		if(!li){
			throw new ReferenceError('Could not find uploaded results');
		}
		return li;
	}

}

export default class Barcoder extends AppInterface{
	constructor(driver,url){
		super(driver,url);
	}

	get Library(){
		this.lib = this.lib || new LibraryPage(this.driver,this.url);
		return this.lib;
	}

	async WipeDB(){
		await this.driver.executeScript(`async ()=>{
			let dbs = await indexedDB.databases();
			for(let db of dbs){
				indexedDB.deleteDatabase(db.name);
			}
		}`);
	}

	async BaseDB(){
		await this.WipeDB();
		await this.driver.executeScript(`async ()=>{
			let dbs = await indexedDB.databases();
			for(let db of dbs){
				indexedDB.deleteDatabase(db.name);
			}
		}`);
	}
}
