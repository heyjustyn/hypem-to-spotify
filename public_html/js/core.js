/*global $*/

var HypToSpty = HypToSpty || {};

HypToSpty.core = (function() {
	"use strict";
	var methodType = {
		POST: "POST",
		GET: "GET"
	};
	var badResponse = "BadResponse";

	function callService(options) {
		return $.Deferred(function(defer) {
			var type = "POST";
			if (options.type) {
				type = options.type;
			}
			var data = "";
			if (options.data) {
				if (type == methodType.GET) {
					data = options.data;
				}
				if (type == methodType.POST) {
					data = JSON.stringify(options.data);
				}
			}
			$.ajax({
				url: "/" + options.apiName,
				type: type,
				dataType: "json",
				data: data,
				contentType: "application/json",
			}).done(function(data) {
				if (data) {
					defer.resolve(data);
				} else {
					defer.reject(badResponse);
				}
			}).fail(function(jqXHR, textStatus, errorThrown) {
				var response = {
					serviceError: true,
					jqXHR: jqXHR,
					textStatus: textStatus,
					errorThrown: errorThrown
				};
				defer.reject(response);
			});
		}).promise();
	}

	function getCookie(key) {
		var keyValue = document.cookie.match("(^|;) ?" + key + "=([^;]*)(;|$)");
		return keyValue ? keyValue[2] : null;
	}

	return {
		callService: callService,
		getCookie: getCookie
	};
})();