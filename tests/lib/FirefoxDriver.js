
import {exec} from 'child_process';
import util from 'util';

import webdriver  from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

import Driver from './Driver.js';

const exe = util.promisify(exec);

let driver = null;

export default class Firefox extends Driver{

	static get BrowserPath(){
		return './build/firefox/firefox';
	}

	static get DriverUrl(){
		return 'https://chromedriver.storage.googleapis.com/index.html?path=96.0.4664.45/';
	}

	static getDriver(force=false){
		if(driver){
			if(!force) return driver;
			driver.quit();
		}

		const ffOptions = new firefox.Options();
		//ffOptions.setBinary(binary);
		ffOptions.headless();

		let capabilities = webdriver
			.Capabilities
			.firefox()
			.setAcceptInsecureCerts(true);

		driver = new webdriver.Builder()
			//.forBrowser('firefox')
			.forBrowser('chrome')
			.setFirefoxOptions(ffOptions)
			.withCapabilities(capabilities)
			.build();

		return driver;
	}


	static InstallDriver(){

	}

	static async getDriverVersion(){
		let result = await exe('geckodriver -V');
		let text = result.stdout;
		text = text.split(' ');
		text = text[1];
		return text;
	}

	static async getBrowserVersion(){
		let text = null;
		try{
			text = await exec(`${Firefox.BrowserPath} --version`);
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


}