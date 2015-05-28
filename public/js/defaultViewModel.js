/*global ko, $*/

(function(HypToSpty) {
	"use strict";
	HypToSpty.defaultService = (function() {
		var getHypemUrlDetails = function(url) {
			return $.Deferred(function(defer) {
				HypToSpty.core.callService({
					type: "GET",
					apiName: "hypem/page",
					data: {
						"url": url
					}
				}).then(function(data) {
					defer.resolve(data);
				}).fail(function(message) {
					defer.reject(message);
				});
			}).promise();
		};

		var getHypemPageTracks = function(url) {
			return $.Deferred(function(defer) {
				HypToSpty.core.callService({
					type: "GET",
					apiName: "hypem/tracks",
					data: {
						"url": url
					}
				}).then(function(data) {
					defer.resolve(data);
				}).fail(function(message) {
					defer.reject(message);
				});
			}).promise();
		};

		var refreshSpotifyToken = function(refresh_token) {
			return $.Deferred(function(defer) {
				HypToSpty.core.callService({
					apiName: "spotify/refreshToken",
					data: {
						"refresh_token": refresh_token
					}
				}).then(function(data) {
					defer.resolve(data);
				}).fail(function(message) {
					defer.reject(message);
				});
			}).promise();
		};

		var getSpotifySong = function(artist, title, token) {
			return $.Deferred(function(defer) {
				HypToSpty.core.callService({
					apiName: "spotify/search",
					data: {
						"artist": artist,
						"title": title,
						"token": token
					}
				}).then(function(data) {
					defer.resolve(data);
				}).fail(function(message) {
					defer.reject(message);
				});
			}).promise();
		};

		var getSpotifyUserInfo = function(token) {
			return $.Deferred(function(defer) {
				HypToSpty.core.callService({
					apiName: "spotify/me",
					type: "GET",
					data: {
						"token": token
					}
				}).then(function(data) {
					defer.resolve(data);
				}).fail(function(message) {
					defer.reject(message);
				});
			}).promise();
		};

		var getSpotifyUserPlaylists = function(token, user_id) {
			return $.Deferred(function(defer) {
				HypToSpty.core.callService({
					apiName: "spotify/me/playlists",
					type: "GET",
					data: {
						"token": token,
						"user_id": user_id
					}
				}).then(function(data) {
					defer.resolve(data);
				}).fail(function(message) {
					defer.reject(message);
				});
			}).promise();
		};

		var addSongsToPlaylist = function(token, userId, playlistId, tracks) {
			return $.Deferred(function(defer) {
				HypToSpty.core.callService({
					apiName: "spotify/me/playlists",
					type: "POST",
					data: {
						"token": token,
						"userId": userId,
						"playlistId": playlistId,
						"tracks": tracks
					}
				}).then(function(data) {
					defer.resolve(data);
				}).fail(function(message) {
					defer.reject(message);
				});
			}).promise();
		};

		return {
			getHypemUrlDetails: getHypemUrlDetails,
			getHypemPageTracks: getHypemPageTracks,
			getSpotifySong: getSpotifySong,
			refreshSpotifyToken: refreshSpotifyToken,
			getSpotifyUserInfo: getSpotifyUserInfo,
			getSpotifyUserPlaylists: getSpotifyUserPlaylists,
			addSongsToPlaylist: addSongsToPlaylist
		};
	})();

	HypToSpty.defaultViewModel = (function() {
		var service = HypToSpty.defaultService;
		var core = HypToSpty.core;
		var spotify = {
			access_token: null,
			refresh_token: null,
			display_name: null,
			image: null,
			country: null,
			id: null,
			uri: null,
			playlists: ko.observableArray()
		};
		var hypemURL = ko.observable();
		var selectedPlaylist = ko.observable();
		var headers = [{
			title: "Page",
			sortPropertyName: "page",
			asc: true
		}, {
			title: "Artist",
			sortPropertyName: "artist",
			asc: false
		}, {
			title: "Title",
			sortPropertyName: "title",
			asc: false
		}, {
			title: "Found Artist",
			sortPropertyName: "foundArtist",
			asc: false
		}, {
			title: "Found Title",
			sortPropertyName: "foundTitle",
			asc: false
		}];
		var activeSort = headers[0];
		var songs = ko.observableArray();
		var found = ko.computed(function() {
			var count = 0;
			ko.utils.arrayForEach(songs(), function(song) {
				if (song.foundArtist() !== null) {
					count++;
				}
			});
			return count;
		});

		var pageInfo = {
			jsonUrl: ko.observable(),
			pages: ko.observable(),
			songs: ko.observable(),
			pageFetchStatus: ko.observableArray()
		};

		function initialize() {
			hypemURL("http://hypem.com/dazjuh/history");
			spotify.access_token = core.getCookie("access_token");
			spotify.refresh_token = core.getCookie("refresh_token");

			if (spotify.access_token !== null) {
				getSpotifyUserInfo();
			} else if (spotify.access_token === null && spotify.refresh_token !== null) {
				refreshSpotifyToken();
			}
			var data = JSON.parse(sessionStorage.getItem("data"));
			if (data !== null) {
				var cachedSongs = [];
				ko.utils.arrayForEach(data, function(song) {
					cachedSongs.push({
						artist: ko.observable(song.artist),
						title: ko.observable(song.title),
						foundArtist: ko.observable(null),
						foundTitle: ko.observable(null),
						uri: null,
						page: song.page
					});
				});
				songs(cachedSongs);
			}
		}

		function getAccessToken() {
			// if(spotify.access_token=== null && spotify.access_token === null) {
			window.location.href = "/spotify/login";
			// }
		}

		function refreshSpotifyToken() {
			service.refreshSpotifyToken(spotify.refresh_token)
				.then(function(response) {
					console.log(response);
				});
		}

		function getHypemUrlDetails() {
			pageInfo.jsonUrl("Fetching...");
			pageInfo.pages("Fetching...");
			pageInfo.songs("Fetching...");
			pageInfo.pageFetchStatus([]);
			songs([]);
			service.getHypemUrlDetails(hypemURL())
				.then(function(response) {
					pageInfo.jsonUrl(response.link);
					pageInfo.pages(parseInt(response.pages));
					pageInfo.songs(response.songs);
					var pageSplit = pageInfo.jsonUrl().split("/");
					var pageIndex = pageSplit.length - 2;
					for (var i = 1; i <= pageInfo.pages(); i++) {
						pageSplit[pageIndex] = i;
						pageInfo.pageFetchStatus.push({
							url: pageSplit.join("/"),
							page: i,
							hasFetchedTracks: ko.observable(false),
							erorrOnFetch: ko.observable(false)
						});
					}
				}).fail(function(message) {

				});
		}

		function getTracksFromAllHypemPages() {
			var pageObject = ko.utils.arrayFirst(pageInfo.pageFetchStatus(), function(item) {
				return item.page === 1;
			});
			var maxPage = pageInfo.pageFetchStatus().length;
			getTracksFromAllHypemPagesRecursive(pageObject.page, maxPage);
		}

		function getTracksFromAllHypemPagesRecursive(currentPage, maxPage) {
			if (currentPage > maxPage) {
				return;
			}
			var pageObject = ko.utils.arrayFirst(pageInfo.pageFetchStatus(), function(item) {
				return item.page === currentPage;
			});
			if ((!pageObject.hasFetchedTracks() && !pageObject.erorrOnFetch()) ||
				(pageObject.hasFetchedTracks() && pageObject.erorrOnFetch())) {
				service.getHypemPageTracks(pageObject.url)
					.then(function(response) {
						if (response.length > 0) {
							pageObject.erorrOnFetch(false);
							var newSongs = [];
							ko.utils.arrayForEach(response, function(song) {
								newSongs.push({
									artist: ko.observable(song.artist),
									title: ko.observable(song.title),
									selected: ko.observable(false),
									foundArtist: ko.observable(null),
									foundTitle: ko.observable(null),
									uri: null,
									page: pageObject.page
								});
							});
							var currentSongs = songs();
							songs(currentSongs.concat(newSongs));
							sessionStorage.setItem("data", ko.toJSON(songs));
						} else {
							pageObject.erorrOnFetch(true);
						}
					}).fail(function(message) {
						pageObject.erorrOnFetch(true);
					}).always(function() {
						pageObject.hasFetchedTracks(true);
						getTracksFromAllHypemPagesRecursive(currentPage + 1, maxPage);
					});
			} else {
				getTracksFromAllHypemPagesRecursive(currentPage + 1, maxPage);
			}
		}

		function getSpotifyUserInfo() {
			service.getSpotifyUserInfo(spotify.access_token)
				.then(function(response) {
					if (response.error !== null) {
						spotify.display_name = response.display_name;
						spotify.id = response.id;
						spotify.image = response.image;
						spotify.uri = response.uri;
						spotify.country = response.country;
					}
					getSpotifyUserPlaylists();
				}).fail(function(message) {

				});
		}

		function getSpotifyUserPlaylists() {
			service.getSpotifyUserPlaylists(spotify.access_token, spotify.id)
				.then(function(response) {
					var tempPlaylists = [];
					ko.utils.arrayForEach(response.items, function(playlist) {
						var temp = {
							name: playlist.name,
							display: playlist.name.substring(0,50),
							id: playlist.id,
							ownerId: playlist.owner.id,
							ownerUri: playlist.owner.uri,
							trackCount: playlist.tracks.total
						};
						if (temp.name.length > 50) {
							temp.display = temp.display + '...';
						}
						temp.display = temp.display + ' (' + temp.trackCount + ' tracks)' 
						tempPlaylists.push(temp);
					});
					spotify.playlists(tempPlaylists);
				}).fail(function(message) {

				});
		}

		function addSongsToPlaylist() {
			var tracks = {};
			ko.utils.arrayForEach(songs(), function(track) {
				if (track.uri !== null) {
					tracks[track.uri] = true;
				}
			});
			tracks = Object.keys(tracks);
			var list = [];
			for (var i = 0; i < tracks.length; i++) {
				list.push(tracks[i]);
				if (list.length % 100 === 0 || i == tracks.length - 1) {
					service.addSongsToPlaylist(spotify.access_token, spotify.id, selectedPlaylist(), list)
						.then(function(response) {
							//console.log(response);
						}).fail(function(message) {

						});
					list = [];
				}
			}

		}

		function sort(header, event) {
			//if this header was just clicked a second time
			if (activeSort === header) {
				header.asc = !header.asc; //toggle the direction of the sort
			} else {
				activeSort = header; //first click, remember it
			}
			var prop = activeSort.sortPropertyName;
			var ascSort = function(objectOne, objectTwo) {
				var a = typeof ko.toJS(objectOne[prop]) === "number" ? ko.toJS(objectOne[prop]) : ko.toJS(objectOne[prop]).toLowerCase();
				var b = typeof ko.toJS(objectTwo[prop]) === "number" ? ko.toJS(objectTwo[prop]) : ko.toJS(objectTwo[prop]).toLowerCase();
				return a < b ? -1 : a > b ? 1 : a == b ? 0 : 0;
			};
			var descSort = function(objectOne, objectTwo) {
				var a = typeof ko.toJS(objectOne[prop]) === "number" ? ko.toJS(objectOne[prop]) : ko.toJS(objectOne[prop]).toLowerCase();
				var b = typeof ko.toJS(objectTwo[prop]) === "number" ? ko.toJS(objectTwo[prop]) : ko.toJS(objectTwo[prop]).toLowerCase();
				return a > b ? -1 : a < b ? 1 : a == b ? 0 : 0;
			};
			var sortFunc = activeSort.asc ? ascSort : descSort;
			songs.sort(sortFunc);
		}

		function toggleSelect(currentSong) {
			currentSong.selected(!currentSong.selected());
		}

		function getSpotifySong(currentSong) {
			service.getSpotifySong(currentSong.artist(), currentSong.title(), spotify.access_token)
				.then(function(response) {
					if (response.error !== undefined) {
						//console.log(response.error);
					} else {
						for (var i = 0; i < response.length; i++) {
							if (response[i].available_markets.indexOf(spotify.country) != -1) {
								currentSong.foundArtist(response[0].artist);
								currentSong.foundTitle(response[0].title);
								currentSong.uri = response[0].uri;
								break;
							}
						}
					}
				}).fail(function(message) {
					console.log(currentSong.artist() + " - " + currentSong.title());
					console.log(message);
				});
		}

		function selectAll() {
			ko.utils.arrayForEach(songs(), function(song) {
				song.selected(true);
			});
		}

		function getSelectedSongs() {
			ko.utils.arrayForEach(songs(), function(song) {
				getSpotifySong(song);
			});
		}

		function removeAllFeaturing() {
			var tempSongs = songs();
			ko.utils.arrayForEach(tempSongs, function(song) {
				song.artist(removeFeaturingArtist(song.artist()));
				song.title(removeFeaturingArtist(song.title()));
			});
			songs(tempSongs);
		}

		function removeFeaturingArtist(input) {
			var out = input;
			if (input.toLowerCase().indexOf("ft.") > -1) {
				if (input[input.toLowerCase().indexOf("ft.") - 1].match(/[a-zA-Z]/) === null) {
					out = removeFeaturingArtistHelper(input, "ft.");
				}
			} else if (input.toLowerCase().indexOf("ft ") > -1) {
				if (input[input.toLowerCase().indexOf("ft ") - 1].match(/[a-zA-Z]/) === null) {
					out = removeFeaturingArtistHelper(input, "ft ");
				}
			} else if (input.toLowerCase().indexOf("feat.") > -1) {
				if (input[input.toLowerCase().indexOf("feat.") - 1].match(/[a-zA-Z]/) === null) {
					out = removeFeaturingArtistHelper(input, "feat.");
				}
			} else if (input.toLowerCase().indexOf("feat ") > -1) {
				if (input[input.toLowerCase().indexOf("feat ") - 1].match(/[a-zA-Z]/) === null) {
					out = removeFeaturingArtistHelper(input, "feat ");
				}
			}
			return out;
		}

		function removeFeaturingArtistHelper(input, format) {
			var startLocation = input.toLowerCase().indexOf(format) - 1;
			var stopChars;
			if (input[startLocation] === " ") {
				stopChars = ["(", "["];
			} else if (input[startLocation] === "(") {
				stopChars = [")"];
			} else if (input[startLocation] === "[") {
				stopChars = ["]"];
			}
			var end = [(input.length)];
			var partsToCheck = input.slice(startLocation);
			for (var y = 0; y < stopChars.length; y++) {
				var stopLocation = partsToCheck.indexOf(stopChars[y]);
				if (stopLocation > -1) {
					if (stopChars.length == 1) {
						stopLocation++;
					}
					end.push(startLocation + stopLocation);
				}
			}
			end.sort();
			var out = input.slice(0, startLocation) + " " + input.slice(end[0]);
			out = out.replace(/\s{2,}/g, " ").trim();
			return out;
		}

		return {
			initialize: initialize,
			hypemURL: hypemURL,
			selectedPlaylist: selectedPlaylist,
			headers: headers,
			spotify: spotify,
			songs: songs,
			found: found,
			pageInfo: pageInfo,
			getHypemUrlDetails: getHypemUrlDetails,
			getTracksFromAllHypemPages: getTracksFromAllHypemPages,
			getAccessToken: getAccessToken,
			sort: sort,
			toggleSelect: toggleSelect,
			getSpotifySong: getSpotifySong,
			addSongsToPlaylist: addSongsToPlaylist,
			selectAll: selectAll,
			getSelectedSongs: getSelectedSongs,
			removeAllFeaturing: removeAllFeaturing
		};
	})();

	HypToSpty.defaultViewModel.initialize();
	ko.applyBindings(HypToSpty.defaultViewModel);
})(HypToSpty);