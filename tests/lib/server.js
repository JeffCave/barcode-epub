import fs from 'fs';
import http from 'http';

import finalhandler from 'finalhandler';
import serveStatic from 'serve-static';


let server = null;
console.log('I have knowledge of things animal, vegetable, and mineral');

function serve(){
	let path = `${process.cwd()}/www/`;
	let port = 3030;

	if(!fs.existsSync(`${path}/index.html`)){
		let msg = `Path not found '${path}'`;
		console.error(msg);
		throw new RangeError(msg);
	}

	let serve = serveStatic(path);
	server = http.createServer(function(req, res) {
		var done = finalhandler(req, res);
		serve(req, res, done);
	});


	let code = 'EADDRINUSE';
	while(code === 'EADDRINUSE'){
		try{
			server.listen(port);
			code = '';
			port++;
		}
		catch(e){
			code = e.code;
		}
	}

	if(!server.listening){
		throw new Error('Server not listening.');
	}

}

process.on('message', (msg)=>{
	let val = null;
	switch(msg){
		case 'start':
			if(!server){
				serve();
			}
			val = 'start';
			break;
		case 'stop':
			console.log('message: stopping');
			server.close();
			server = null;
			val = 'stop';
			return;
		case 'addr':
			if(server){
				val = server.address();
			}
			break;
		case 'listening':
			val = false;
			if(server){
				val = server.listening;
			}
			break;
	}
	process.send({
		'req' :msg,
		'resp':val
	});
});

if(!('send' in process)){
	process.send = (m)=>{
		if(typeof m !== 'string'){
			m = JSON.stringify(m);
		}
		console.log(m);
	};
	serve();
}

