import path from 'path';

const rootpath = [process.cwd(),'tests','lib','books'].join(path.sep);


export default {
	'wonderland':{
		path:  [rootpath,'wonderland.epub'].join(path.sep),
		record: {
			'name': "Alice's Adventures in Wonderland",
			'author': 'Lewis Carroll',
			'inLanguage': 'en',
			'keywords':[
				'Fantasy fiction',
				'Children\'s stories',
				'Imaginary places -- Juvenile fiction',
				'Alice (Fictitious character from Carroll) -- Juvenile fiction'
			]
		}
	},
	'keepcalm':{
		path:  [rootpath,'keepcalm.epub'].join(path.sep),
		record: {
			'name': 'Keep Calm',
			'author': 'British Ministry of War',
			'inLanguage': 'en',
			'keywords':[
				'World War Two',
				'Propaganda'
			]
		}
	}
};
