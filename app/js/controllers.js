(function() {
	angular
		.module('app')
		.controller('MainController', MainController)
		.controller('ListController', ListController)
		.controller('AddController', AddController)
		.controller('FeedController', FeedController)
		.controller('EditController', EditController)
		.controller('ModalController', ModalController);

	function MainController() {

	}

	ListController.$inject = ['$scope','$rootScope','dataService','modalService'];

	function ListController($scope, $rootScope, dataService,modalService) {
		var vm = this;
		vm.list = JSON.parse(dataService.get('feeds')) || [];
		
		$scope.$watch(function(){
			return dataService.get('feeds');
		}, function(newData, oldData){
			vm.list = JSON.parse(newData);
		});
	}

	AddController.$inject = ['remoteFeed', 'feedService', 'dataService'];

	function AddController(remoteFeed, feedService, dataService) {
		var vm = this;
		vm.add = getFeed;
		vm.url = "";
		vm.checkUrl = checkUrl;
		vm.valid = true;

		function checkUrl() {
			if (!vm.url || vm.url.match(/^(https?:\/\/)([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?\/([\da-z\.-]+)\.rss$/))
				vm.valid = true; else
				vm.valid = false;
		}
		function getFeed() {
			remoteFeed
				.feed({ url: vm.url })
				.then(saveFeed, onError);
		}

		function saveFeed(res) {
			var
				json    = feedService.parse(res.data),
				feed    = !json.err ? feedService.info(json) : json,
				feeds   = dataService.get('feeds'),
				now     = new Date,
				feedId  = Date.UTC(now.getFullYear(),now.getMonth(), now.getDate() , now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

			feeds = JSON.parse(feeds) || [];

			if(feed.err) {

				var msg = {
					'unknown_feed': 'Данный тип ленты не поддержиывается',
					'parser_not_found': 'В браузере не найден xml парсер'
				}[feed.err];
				if (msg) alert(msg);
				console.warn(msg || feed.err);

			} else {

				feeds.push({
					id: + feedId,
					title: feed.title,
					description: feed.description,
					updated: feed.updated,
					logo: feed.logo,
					url_feed: vm.url,
					url_site: feed.link
				});

				vm.list = feeds;
				
				var id = 0;
				feed.items = feed.items.map(function(item) {
					item.read = false;
					item.id = id++;
					return item;
				});

				dataService.add('feeds', feeds);
				dataService.add('feed-' + feedId, feed.items);
			}
		}

		function onError(e) {
			if(e.status === 404) alert('Лента с таким url не найдена');
		}
	}

	FeedController.$inject = ['$scope','$route', '$sce', '$location', 'dataService', 'modalService', '$filter', '$anchorScroll'];

	function FeedController($scope, $route, $sce, $location, dataService, modalService, $filter, $anchorScroll) {
		var
			vm = this,
			limit = 5,
			length = 0,
			dates = {},
			feed = JSON.parse(dataService.get('feeds')),
			items = JSON.parse(dataService.get('feed-' + $route.current.params.id));

		if ($route.current.params.page!==undefined && ($route.current.params.page<=0 || $route.current.params.page> Math.ceil(items.length / limit)))
			$route.updateParams({page:1});

		vm.info = {};
		vm.dateStack = dateStack;
		vm.dateType = dateType;
		vm.openItem = openItem;
		vm.remove = removeFeed;
		vm.filters = {},
		vm.addFilter = addFilter;
		vm.pagination = {
			current: $route.current.params.page || 1,
			go: function(page) {
				$route.updateParams({page: page});
				$anchorScroll('body');
			},
			prev: function() {
				if ($route.current.params.page>1)
					this.go($route.current.params.page - 1);
			},
			next: function() {
				if($route.current.params.page < length || !$route.current.params.page)
					this.go(($route.current.params.page || 1) + 1);
			}
		};

		vm.filters = getFilters();

		vm.items = $filter('filter')(angular.copy(items), vm.filters);

		length = Math.ceil(vm.items.length / limit);

		if ($route.current.params.page>length) $route.updateParams({page: undefined});

		vm.items = $filter('limitTo')(vm.items, limit, (+$route.current.params.page - 1 || 0) * limit);

		vm.paginate = new Array(length);

		vm.onEnter = function(e, name) {
			if (e.keyCode === 13) {
				vm.filters[name] = e.target.value;
				addFilter(name, e.target.value);
			}
		}

		for(var i=0; i<feed.length; i++) {
			if(feed[i].id==$route.current.params.id) {
				vm.info = feed[i];
				vm.info.index = i;
				return true;
			}
		}

		function addFilter(name, value) {
			if(name) {
				var f = getFilters();
				if(value)
					f[name] = value; else
					delete f[name];
				$route.updateParams({filter: Object.keys(f).length ? JSON.stringify(f).slice(1,-1) : undefined});
			}
		}

		function getFilters() {
			var _res = {};
			angular.forEach(
				decodeURIComponent($route.current.params.filter).split(','),
				function(i) {
					var r = i.match(/^[\"\']?([a-zA-Z\d-_]*)[\"\']?\:[\"\']?([a-zA-Zа-яА-Я\d\s-_]*)[\"\']?$/) || [];
					if(r.length===3) _res[r[1]] = r[2];
				}
			);
			return _res;
		}

		function dateStack(date, id) {
			var tDate = new Date(date);
			tDate = tDate.getDate()+"."+tDate.getMonth()+"."+tDate.getFullYear();
			if (!dates[tDate]) {
				dates[tDate] = id;
				return true;
			} else
				return dates[tDate] == id ? true : false;
		}

		function dateType(tt) {
			var tt = new Date(tt);
			var months = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];
			return tt.getDate() + " " + months[tt.getMonth()];
		}

		function openItem(id) {
			(function(){
				for(var i = 0; i < items.length; i++) {
					console.log(items[i].id);
					if (items[i].id == id) {
						items[i].read = true;
						$route.reload();
						return true;
					}
				}
			})();
			dataService.add('feed-' + vm.info.id, items);
		}

		function removeFeed() {
			modalService.setParams({
				show: true,
				title: 'Удалить фид',
				text: 'Действительно?',
				buttons: {
					save: 'Да',
					close: 'Нет'
				}
			});
			var unbind = $scope.$watch(function(){return modalService.params.show}, function(n,o) {
				if(!n) unbind();
				if(modalService.params.save) {
					dataService.remove('feed-' + vm.info.id);
					feed.splice(vm.info.index, 1);
					dataService.add('feeds', feed);
					$location.path('/');
				}
			});
		}
	}


	function EditController() {
	}


	ModalController.$inject = ['modalService'];

	function ModalController(modalService) {
		var vm = this;
		vm.ctx = "modal";
		vm.modal = modalService.params;

		vm.close = close;
		vm.save = save;

		function close() {
			modalService.params.show = false;
			modalService.params.save = false;
		}

		function save() {
			modalService.params.show = false;
			modalService.params.save = true;
		}
	}

})();