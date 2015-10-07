var dev = {
	'spotify': {
		'client_id': 'aaaaaaaaaaaaaaaa', 
		'client_secret': 'aaaaaaaaaaaaaaaa',
		'redirect_uri': 'http://localhost:3000/spotify/callback'
	},
	'web' : {
		'port': 3000
	}
};

var prod = {
	'spotify': {
		'client_id': 'aaaaaaaaaaaaaaaa', 
		'client_secret': 'aaaaaaaaaaaaaaaa',
		'redirect_uri': 'http://hts.justynh.com/callback'
	},
	'web' : {
		'port': 3000
	}
};

module.exports = function() {
	switch(process.env.NODE_ENV){
		case 'dev':
			return dev;

		case 'prod':
			return prod;

		default:
			return dev;
	}
};

// load the app using

// NODE_ENV=production node app.js

// fill in client_id and client_server from the spotify API