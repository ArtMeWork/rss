(function() {
	angular
		.module('app')
		.factory('feedService', feedService)
		.service('dataService', dataService)
		.provider('remoteFeed', remoteFeed)
		.filter('sanitize', sanitizeFilter)
		.factory('modalService', modalService)
		.directive('checkUrl', checkUrlDirective);

	feedService.$inject = [];

	function feedService() {
		return {
			parse: parser,
			info: getChannelInfo
		};

		function parser(xmlStr) {
			var _parser = null
			if (window.DOMParser)
				_parser = ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml"); else
				if (typeof window.ActiveXObject != "undefined" && new window.ActiveXObject("Microsoft.XMLDOM")) {
					var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
					xmlDoc.async = "false";
					xmlDoc.loadXML(xmlStr);
					_parser = xmlDoc;
				} else
				_parser = null;

			return _parser ? vFeed(XMLtoJSON(_parser)) : {err: "parser_not_found"};
		}

		function getChannelInfo(json) {
			/* Function "o" - it's try ... catch wrapper, for when rss.value1.value2 does not exist, return null */
			var versions = {
				rss2: function() {
					var ctx = this.rss.channel;
					return {
						title: ctx.title["#text"],
						description: ctx.description['#text'],
						updated: o(ctx, ['pubDate','#text']) || o(ctx, ['lastBuildDate','#text']),
						logo: o(ctx, ["media:thumbnail","@attributes","url"]) || o(ctx, ["image","url","#text"]),
						link: o(ctx, ['link','#text']),
						items: function() {
							if (!this.rss.channel.item)
								return []; else
							if (o(ctx, ['item']).length)
								return ctx.item.map(getItem); else
								return getItem(ctx.item);

							function getItem(item) {
								return {
									title: o(item,['title','#text']),
									description: o(item, ['description','#text']),
									date: +new Date(o(item, ['pubDate','#text'])),
									link: o(item, ['link','#text'])
								}
							}
						}.call(this)
					}
				}
			};
			
			return versions[json.type].call(json);
		}

		function XMLtoJSON(xml) {
			var obj = {};
			
			if (xml) {
				if (xml.nodeType == 1) {
					if (xml.attributes.length > 0) {
					obj["@attributes"] = {};
						for (var j = 0; j < xml.attributes.length; j++) {
							var attribute = xml.attributes.item(j);
							obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
						}
					}
				} else if (xml.nodeType == 3) {
					obj = xml.nodeValue;
				}

				if (xml.hasChildNodes()) {
					for(var i = 0; i < xml.childNodes.length; i++) {
						var item = xml.childNodes.item(i);
						var nodeName = item.nodeName;
						if (typeof(obj[nodeName]) == "undefined") {
							obj[nodeName] = XMLtoJSON(item);
						} else {
							if (typeof(obj[nodeName].push) == "undefined") {
								var old = obj[nodeName];
								obj[nodeName] = [];
								obj[nodeName].push(old);
							}
							obj[nodeName].push(XMLtoJSON(item));
						}
					}
				}
				return obj;
			}
		}

		function vFeed(json) {
			var versions = {
				rss2: "rss"
			};

			for (var key in versions)
				if(json[versions[key]]) {
					json.type = key;
					return json;
				}

			return {
				err: "unknown_feed"
			};
		}

		function o(ctx, m) {
			try {
				for (var i = 0; i < m.length; i++) {
					ctx = ctx[m[i]];
				}
			} catch(e) {
				ctx = null;
			}
			return ctx;
		}
	}


	function dataService() {
		this.get = get;
		this.add = add;
		this.remove = remove;

		function get(name) {
			return window.localStorage.getItem(name);
		}

		function add(name, data) {
			if (typeof data !== "string")
				data = JSON.stringify(data);
			window.localStorage.setItem(name, data);
		}

		function remove(name) {
			window.localStorage.removeItem(name);
		}
	}


	function remoteFeed() {
		var baseUrl = 'https://ngs-rss.herokuapp.com/';

		this.setBaseUrl = function(newUrl) {
			baseUrl = newUrl;
		}

		this.$get = ['$http', function($http) {
			return {
				feed: function getFeed(params) {
					return $http({
						url: baseUrl + 'feed',
						params: params || {},
						method: 'get',
						responseType: 'text'
					});
				}
			}
		}]
	}

	sanitizeFilter.$inject = ['$sce'];

	function sanitizeFilter($sce) {
		return function(htmlCode){
			return $sce.trustAsHtml(htmlCode);
		}
	}

	function modalService() {
		var dialog = {
			show: false,
			title: "",
			text: "",
			buttons: {close: 'Закрыть'},
			save: false
		};

		return {
			params: dialog,
			setParams: setParams
		}

		function setParams(params) {
			dialog.save = false;
			for(var key in params) {
				dialog[key] = params[key];
			}
		}
	}


	function checkUrlDirective() {
		return {
			require:'ngModel',
			link: link
		}

		function link(scope, elm, attrs, ngModelCtrl) {
			ngModelCtrl.$parsers.unshift(
				function(viewValue) {
					ngModelCtrl.$setValidity('strongPass', isValid(viewValue));
					return viewValue;
				}
			);
		}

		function isValid(val) {
			return !!(
				!val || 
				val.match(/^(https?:\/\/)([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?\/([\da-z\.-]+)\.rss$/)
			);
		}
	}

})();