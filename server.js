var config = require("./config/config");
var express = require("express");

var hypemRouter = require("./app/routes/hypemRouter");
var spotifyRouter = require("./app/routes/spotifyRouter");

var app = express();
var conf = new config();

app.use(express.static(__dirname + "/public"))
	.use("/hypem", hypemRouter)
	.use("/spotify", spotifyRouter);

console.log('Project running on port ' + conf.web.port);
app.listen(conf.web.port);