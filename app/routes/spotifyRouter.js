var express = require("express");
var request = require("request");
var querystring = require("querystring");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var config = require("../../config/config");

var conf = new config();
var stateKey = "spotify_auth_state";

var router = express.Router();

router.use(cookieParser())
	.use(bodyParser.json());

router.get("/login", function(req, res) {
	var access_token = req.cookies ? req.cookies.access_token : null;
	var refresh_token = req.cookies ? req.cookies.refresh_token : null;
	var scope = "user-read-private playlist-read-private playlist-modify-public playlist-modify-private";
	
	var state = generateRandomString(16);
	res.cookie(stateKey, state);

	res.redirect("https://accounts.spotify.com/authorize?" +
		querystring.stringify({
			response_type: "code",
			client_id: conf.spotify.client_id,
			scope: scope,
			redirect_uri: conf.spotify.redirect_uri,
			state: state
		})
	);
});

router.get("/callback", function(req, res) {
	var code = req.query.code || null,
		state = req.query.state || null,
		storedState = req.cookies ? req.cookies[stateKey] : null;

	if (state === null || state !== storedState) {
		res.redirect("/#" +
			querystring.stringify({
				error: "state_mismatch"
			})
		);
	} else {
		res.clearCookie(stateKey);
		var authOptions = {
			url: "https://accounts.spotify.com/api/token",
			form: {
				code: code,
				redirect_uri: conf.spotify.redirect_uri,
				grant_type: "authorization_code"
			},
			headers: {
				"Authorization": "Basic " + (new Buffer(conf.spotify.client_id + ":" + conf.spotify.client_secret).toString("base64"))
			},
			json: true
		};

		request.post(authOptions, function(error, response, body) {
			if (!error && response.statusCode === 200) {
				var access_token = body.access_token,
					refresh_token = body.refresh_token;

				res.cookie("access_token", access_token, {
					maxAge: 3600 * 1000
				});
				res.cookie("refresh_token", refresh_token);
				res.redirect("/");
			}
		});
	}
});

router.get("/token", function(req, res) {
	var refresh_token = req.body.refresh_token || null;
	var options = {
		url: "https://accounts.spotify.com/api/token",
		headers: {
			"Authorization": "Basic " + (new Buffer(conf.spotify.client_id + ":" + conf.spotify.client_secret).toString("base64"))
		},
		json: true,
		body: {
			"grant_type": "refresh_token",
			"refresh_token": refresh_token
		}
	};
	// use the access token to access the Spotify Web API
	request.post(options, function(error, response, body) {
		if (response.statusCode !== 201) {
			console.log(body);
			console.log(options);
		}
		res.json(body);
	});
});

router.post("/search", function(req, res) {
	var accessToken = req.body.token || null;
	var artist = req.body.artist || null;
	var title = req.body.title || null;
	var url = "https://api.spotify.com/v1/search?q=";
	if (artist !== null) {
		url += "artist:" + encodeURIComponent(artist);
	}
	if (artist !== null && title !== null) {
		url += " ";
	}
	if (title !== null) {
		url += "title:" + encodeURIComponent(title);
	}
	url += "&type=track";
	var options = {
		url: url,
		headers: {
			"Authorization": "Bearer " + accessToken
		},
		json: true
	};
	request.get(options, function(error, response, body) {
		var data = body;
		if (!error && response.statusCode == 200) {
			data = [];
			for (var i = 0; i < body.tracks.items.length; i++) {
				data.push({
					artist: body.tracks.items[i].artists[0].name,
					title: body.tracks.items[i].name,
					uri: body.tracks.items[i].uri,
					duration_ms: body.tracks.items[i].duration_ms,
					available_markets: body.tracks.items[i].available_markets
				});
			}
		} else {
			console.log(error);
		}
		res.json(data);
	});
});

router.get("/me", function(req, res) {
	var token = req.query.token || null;
	var options = {
		url: "https://api.spotify.com/v1/me",
		headers: {
			"Authorization": "Bearer " + token
		},
		json: true
	};
	// use the access token to access the Spotify Web API
	request.get(options, function(error, response, body) {
		var userInfo = {
			display_name: body.display_name,
			id: body.id,
			image: body.images[0].url,
			uri: body.uri,
			country: body.country
		};
		res.json(userInfo);
	});
});

router.get("/me/playlists", function(req, res) {
	var token = req.query.token || null;
	var user_id = req.query.user_id || null;
	var options = {
		url: "https://api.spotify.com/v1/users/" + user_id + "/playlists?limit=50",
		headers: {
			"Authorization": "Bearer " + token
		},
		json: true
	};
	// use the access token to access the Spotify Web API
	request.get(options, function(error, response, body) {
		res.json(body);
	});
});

router.post("/me/playlists", function(req, res) {
	var token = req.body.token || null;
	var userId = req.body.userId || null;
	var playlistId = req.body.playlistId || null;
	var tracks = req.body.tracks || null;
	console.log(tracks.length);
	var options = {
		url: "https://api.spotify.com/v1/users/" + userId + "/playlists/" + playlistId + "/tracks",
		headers: {
			"Authorization": "Bearer " + token
		},
		json: true,
		body: {
			"uris": tracks
		}
	};
	// use the access token to access the Spotify Web API
	request.post(options, function(error, response, body) {
		if (response.statusCode !== 201) {
			console.log(body);
			console.log(options);
		}
		res.json(body);
	});
});

var generateRandomString = function(length) {
	var output = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (var i = 0; i < length; i++) {
		output += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return output;
};

function login() {

}

module.exports = router;