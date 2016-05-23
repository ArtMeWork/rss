(function() {
	angular
		.module('app', [
			'ngRoute'
		])
		.config(appConfig);

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
				});

			remoteFeedProvider
				.setBaseUrl('http://192.168.137.1:8000/');
		}
})();