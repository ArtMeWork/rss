(function() {
	angular
		.module('app', [
			'ngRoute'
		])
		.config(appConfig)
		.run(run);

		appConfig.$inject = ['$routeProvider', 'remoteFeedProvider'];

		function appConfig($routeProvider, remoteFeedProvider) {
			$routeProvider
				.otherwise('/')
				.when('/', {
					templateUrl: "views/main.html",
					controller: "MainController",
					controllerAs: "vm"
				})
				.when('/add', {
					templateUrl: "views/add.html",
					controller: "AddController",
					controllerAs: "vm"
				})
				.when('/feed/:id', {
					templateUrl: "views/feed.html",
					controller: "FeedController",
					controllerAs: "vm"
				})
				.when('/feed/:id/:page', {
					templateUrl: "views/feed.html",
					controller: "FeedController",
					controllerAs: "vm"
				})
				.when('/edit/:id/', {
					templateUrl: "views/edit.html",
					controller: "EditController",
					controllerAs: "vm"
				});

			remoteFeedProvider
				.setBaseUrl('http://192.168.137.1:8000/');
		}

		run.$inject = ['remoteFeed', 'feedService', 'dataService'];

		function run(remoteFeed, feedService, dataService) {
			var
				feeds 	= JSON.parse(dataService.get('feeds')),
				now     = new Date,
				id  		= Date.UTC(now.getFullYear(),now.getMonth(), now.getDate() , now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

			for (var i = 0; i < feeds.length; i++) {
				(function(i) {
					remoteFeed.feed({ url: feeds[i].url_feed }).then(function(res) {
						var 
							uFeed 	= feedService.info(feedService.parse(res.data)),
							feed 		= JSON.parse(dataService.get('feed-'+feeds[i].id));
						if(uFeed.err) {
							var msg = {
								'unknown_feed': 'Данный тип ленты не поддержиывается',
								'parser_not_found': 'В браузере не найден xml парсер'
							}[uFeed.err];
							if (msg) alert(msg);
							console.warn(msg || uFeed.err);
						} else {
							var newItems = [];

							uFeed.items.some(function(item, ii) {
								if (+new Date(item.date) === +new Date(feed[0].date)) {
									return true;
								} else {
									item.read = false;
									item.id = id++;
									newItems.push(item);
									return false;
								}
							});

							feed = newItems.concat(feed);
							feeds[i].updated = uFeed.updated;

							dataService.add('feeds', feeds);
							dataService.add('feed-'+feeds[i].id, feed);
						}
					}, onError);
				})(i);
			}

			function onError(e) {
				if(e.status === 404) alert('Лента с таким url не найдена');
			}
		}
})();