var express = require("express");
var request = require("request");
var cheerio = require("cheerio");

var hypemJsonPath = "a.rss";
var hypemMaxPagePath = "div.paginator.infinite a";

var router = express.Router();

router.get('/page', function(req, res) {
	var url = req.query.url || "http://hypem.com/dazjuh";
	getPageInfo(url, res);
});

router.get('/tracks', function(req, res) {
	var url = req.query.url;
	getPageTracks(url, res);
});


function getPageInfo(url, res) {
	request({
	    url: url,
	    method: 'GET'
	}, function(error, response, body){
	    if(error) {
	        console.log(error);
	    } else if (response.statusCode !== 200) {
	        console.log(response.statusCode + " " + body);
		} else {
			var html = cheerio.load(body);
			
			var jsonLink = getJsonPath(html);
			var numberOfPages = getNumberOfPages(html);
			var totalAmountOfTracks = getNumberOfTracksOnPage(html) * numberOfPages;

			res.json({
				link: jsonLink,
				pages: numberOfPages,
				songs: totalAmountOfTracks
			});
		}
	});
}

function getJsonPath(html) {
	var out;
	html(hypemJsonPath).each(function() {
		var temp = html(this).attr("href");
		if (temp !== undefined && temp.indexOf("data.js") > -1) {
			out = "http://hypem.com" + temp;
		}
	});
	return out;
}

function getNumberOfPages(html) {
	var numberOfPages = 3;
	html(hypemMaxPagePath).each(function() {
		var temp = html(this).attr("href");
		if (temp !== undefined) {
			var sliced = temp.split("/");
			var page = parseInt(sliced[sliced.length - 2]);
			if (page > numberOfPages) {
				numberOfPages = page;
			}
		}
	});
	return numberOfPages;
}

function getNumberOfTracksOnPage(html) {
	return html(".section-track").length;
}

function getPageTracks(url, res) {
	var tracks = [];
	request({
	    url: url,
	    method: 'GET'
	}, function(error, response, body){
	    if(error) {
	        console.log(error);
	    } else if (response.statusCode !== 200) {
	        console.log(response.statusCode + " " + body);
			console.log("error getting tracks from " + url);
		} else {
			var jsonObject = JSON.parse(body);
			delete jsonObject.version;
			for (var index in jsonObject) {
				tracks.push({
					artist: jsonObject[index].artist,
					title: jsonObject[index].title
				});
			}
		}
		res.json(tracks);
	});
}

module.exports = router;