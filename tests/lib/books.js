import path from 'path';

export{
	books as default
};

const rootpath = [process.cwd(),'tests','lib','books'].join(path.sep);

const books = {
	'multi-author':{
		path:  [rootpath,'multi-author.epub'].join(path.sep),
	},
	'wonderland':{
		path:  [rootpath,'wonderland.epub'].join(path.sep),
		tags: ['many subjects'],
		record: {
			'name': "Alice's Adventures in Wonderland",
			'author': ['Lewis Carroll'],
			'inLanguage': 'en',
			'bookFormat':'EBook',
			'identifier':'e6W3YeC1KqVuk7qi0QgjBwlKlshk5owfTkfDlXc9ePTxzU32u23Q_5JKM4YwuHeJbhUEKDDitNyacs44QYxyNg',
			'size':186850,
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
		tags: ['small'],
		record: {
			'name': 'Keep Calm',
			'author': ['British Ministry of War'],
			'inLanguage': 'en',
			'keywords':[
				'World War Two',
				'Propaganda'
			]
		}
	}
};


for(let [key,book] of Object.entries(books)){
	book.path = [rootpath,`${key}.epub`].join(path.sep);
}
