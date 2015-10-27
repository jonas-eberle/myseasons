/**
 * MySeasons AngularJS App File
 * Version: 1.0.0
 * Author: Jonas Eberle <jonas.eberle@uni-jena.de>
 * License: EUPL v1.1 (see LICENSE)
 */

// Ionic Starter App
;(function($) {
    var delay = 0;
    $.fn.translate3d = function(translations, speed, easing, complete) {
        var opt = $.speed(speed, easing, complete);
        opt.easing = opt.easing || 'ease';
        translations = $.extend({x: 0, y: 0, z: 0}, translations);

        return this.each(function() {
            var $this = $(this);

            $this.css({ 
                transitionDuration: opt.duration + 'ms',
                transitionTimingFunction: opt.easing,
                transform: 'translate3d(' + translations.x + 'px, ' + translations.y + 'px, ' + translations.z + 'px)'
            });

            setTimeout(function() { 
                $this.css({ 
                    transitionDuration: '0s', 
                    transitionTimingFunction: 'ease'
                });

                opt.complete();
            }, opt.duration + (delay || 0));
        });
    };
})(jQuery);

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers','angular-loading-bar', 'pascalprecht.translate'])
.config(function($ionicConfigProvider) {
  $ionicConfigProvider.views.transition('none');
})
.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('app.home', {
    url: '/home',
    views: {
      'menuContent': {
        templateUrl: 'templates/01_home.html',
		controller: 'HomeCtrl'
      }
    },
	onEnter: function($activities) {
		try {
			$activities.load();
		} catch(e) {}
	}
  })

  .state('app.maps', {
      url: '/maps',
      views: {
        'menuContent': {
          templateUrl: 'templates/02_maps.html',
		  controller: 'MapsCtrl'
        }
      }
    })
    .state('app.settings', {
      url: '/settings',
      views: {
        'menuContent': {
          templateUrl: 'templates/03_settings.html',
		  controller: 'SettingsCtrl'
        }
      }
    })

  .state('app.about', {
    url: '/about',
    views: {
      'menuContent': {
        templateUrl: 'templates/04_about.html',
      }
    }
  })
  
  .state('app.funding', {
    url: '/funding',
    views: {
      'menuContent': {
        templateUrl: 'templates/05_funding.html'
      }
    }
  })  ;
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
})
.config(function ($translateProvider) {

  $translateProvider.useStaticFilesLoader({
    prefix: 'lang/',
    suffix: '.json'
  });
  $translateProvider.fallbackLanguage('en');
  
  $translateProvider.registerAvailableLanguageKeys(['en', 'de'], {
    'en_*': 'en',
	'en-*': 'en',
    'de_*': 'de',
	'de-*': 'de'
  }).determinePreferredLanguage();
})
.service('$activities', function(mySeasonsDB){
	var service = {
		'data': {
			'activities': []
		},
		'load': function() {
			var _this = this;
			mySeasonsDB.list(function(entries){
				_this.data.activities = entries;
			});
		}
	};
	return service;
})
.service('server', function server($q, $http, $rootScope){
	var service = {
		'proxy': null,
		'setProxy': function(proxy) {
			this.proxy = proxy;
		},
		'request': function(url, method, data) {
			if (this.proxy != null) {
				url = this.proxy+encodeURIComponent(url);
			}
			var deferred = $q.defer();
			$http({
				url: url,
				method: method,
				data: data
			}).then(function(response){
				deferred.resolve(response.data, response.status);
			}, function(response){
				deferred.reject(response.data, response.status, response.headers, response.config);
			});
			return deferred.promise;
		},
		'get': function(url, proxy) {
			return this.request(url, 'GET', null);
		},
		'post': function(url, data) {
			return this.request(url, 'POST', data);
		}
	};
	return service;
})
.service('mySeasonsDB', function mySeasonsDB($ionicPopup, $translate){
	var service = {
		'db': null,
		'init': function() {
			this.db = openDatabase("mySeasons_v4", "1.0", "My Seasons", 200000);
			this.db.transaction (function (transaction) {
				// table points
			    var sql = "CREATE TABLE IF NOT EXISTS activities (" +
			        "id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, " +
					"type VARCHAR(100) NOT NULL, " + 
					"pos_lat VARCHAR(100) NOT NULL, " + 
					"pos_lon VARCHAR(100) NOT NULL, " +
					"pubDate DATETIME NOT NULL, "+ 
					"timesat VARCHAR(200) NULL, "+ 
					"phenochart VARCHAR(200) NULL, "+ 
					"tsplot VARCHAR(200) NULL, "+ 
					"bbox DATETIME NULL, "+ 
					"uuid VARCHAR(20) NULL, "+ 
					"inputdata TEXT NULL)"
			    transaction.executeSql(sql, [], function(tx, results) {
					//console.log('Database table "activities" created!');
				});
			});
		},
		'insertAnalysis': function(lat, lon, timesat, phenochart, tsplot, bbox, uuid) {
			var sql = "INSERT INTO activities (type, pos_lat, pos_lon, pubDate, timesat, phenochart, tsplot, bbox, uuid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
			this.db.transaction(function(transInsert){
				transInsert.executeSql(sql, ['Analysis', lat, lon, new Date().getTime()+"", timesat, phenochart, tsplot, bbox, uuid], 
					function(transInsert, dbResults){
						dbID = dbResults.insertId;
						//console.log('Successfully inserted into activities: '+dbID);
					}, function(tx, err){
						//console.log('DB error - INSERT analysis to activities: '+err.message);
					}
				);
			});
		},
		'insertDataCollection': function(lat, lon, inputdata) {
			var _this = this;
			if (typeof(inputdata) == 'object') {
				inputdata = JSON.stringify(inputdata);
			}
			var sql = "INSERT INTO activities (type, pos_lat, pos_lon, pubDate, inputdata) VALUES (?, ?, ?, ?, ?)"
			this.db.transaction(function(transInsert){
				transInsert.executeSql(sql, ['Data collection', lat, lon, new Date().getTime()+"", inputdata], 
					function(transInsert, dbResults){
						_this.last_insert_id = dbResults.insertId;
						//console.log('Successfully inserted into activities: '+_this.last_insert_id);
					}, function(tx, err){
						//console.log('DB error - INSERT datacollection to activities: '+err.message);
					}
				);
			});
		},
		'updateDataCollection': function(id, timesat, phenochart, tsplot, bbox, uuid, callback) {
			var sql = "UPDATE activities SET timesat = ?, phenochart = ?, tsplot = ?, bbox = ?, uuid = ? WHERE id=?"
			this.db.transaction(function(transUpdate){
				transUpdate.executeSql(sql, [timesat, phenochart, tsplot, bbox, uuid, id], 
					function(transUpdate, dbResults){
						//console.log('Successfully updated activities with ID '+id);
						callback();
					}, function(tx, err){
						//console.log('DB error - UPDATE datacollection in activities: '+err.message);
					}
				);
			});
		},
		'convertDate': function(date) {
			var pubDate = new Date(parseInt(date));
			month = pubDate.getMonth() < 10 ? '0' + pubDate.getMonth() : pubDate.getMonth();
			date = pubDate.getDate() < 10 ? '0' + pubDate.getDate() : pubDate.getDate();
			hours = pubDate.getHours() < 10 ? '0' + pubDate.getHours() : pubDate.getHours();
			minutes = pubDate.getMinutes() < 10 ? '0' + pubDate.getMinutes() : pubDate.getMinutes();
			seconds = pubDate.getSeconds() < 10 ? '0' + pubDate.getSeconds() : pubDate.getSeconds();
			newDate = pubDate.getFullYear()+'-'+month+'-'+date+' '+hours+':'+minutes+':'+seconds;
			return newDate;
		},
		'list': function(callback) {
			var _this = this;
			var sql = "SELECT * FROM activities ORDER BY pubDate DESC";
			this.db.transaction(function(transaction){
				transaction.executeSql(sql, [], function(trans, result){
					entries = []
					for (i = 0; i < result.rows.length; i++) {
						entry = result.rows.item(i);
						entry.pubDateStr = _this.convertDate(entry.pubDate);
						entries.push(entry);
					}
					callback(entries);
					return entries;
				});
			});
		},
		'get': function(id, callback) {
			var _this = this;
			var sql = "SELECT * FROM activities WHERE id=?";
			this.db.transaction(function(transaction){
				transaction.executeSql(sql, [id], function(trans, result){
					if (result.rows.length > 0) {
						entry = result.rows.item(0);
						entry.pubDate = _this.convertDate(entry.pubDate);
						callback(entry);
					} else {
						callback(false);
					}
				});
			});
		},
		'delete': function(id, callback) {
			var sql = "DELETE FROM activities WHERE id=?";
			this.db.transaction(function(transaction){
				transaction.executeSql(sql, [id], function(trans, result){
					$translate(['SUCCESS', 'ITEM_DELETED']).then(function (translations) {
						$ionicPopup.alert({
					       title: translations.SUCCESS,
					       template: translations.ITEM_DELETED
					     });
						 callback();
					 });
				}, function(trans, err){
					//console.log(err);
					$translate(['ERROR', 'ERROR_OCCURRED']).then(function(translations){
						$ionicPopup.alert({
							title: translations.ERROR,
							template: translations.ERROR_OCCURRED
						});
					});
				});
			});
		},
		'clear': function(callback) {
			var sql = "DELETE FROM activities";
			this.db.transaction(function(transaction){
				transaction.executeSql(sql, [], function(trans, result){
					$translate(['SUCCESS', 'STORAGE_CLEARED']).then(function (translations) {
						$ionicPopup.alert({
					       title: translations.SUCCESS,
					       template: translations.STORAGE_CLEARED
					     });
						 callback();
					 });
				}, function(trans, err){
					//console.log(err);
					$translate(['ERROR', 'ERROR_OCCURRED']).then(function(translations){
						$ionicPopup.alert({
							title: translations.ERROR,
							template: translations.ERROR_OCCURRED
						});
					});
				});
			});
		}
	};
	return service;
})

.service('settings', function settings($translate){
	var service = {
		'data': {
			'statistics': true,
			'language': $translate.preferredLanguage(),
			'pattern_name': '',
			'pattern_mail': ''
		},
		'save': function() {
			try {
				window.localStorage.setItem('myseasons_settings', JSON.stringify(this.data));
			} catch(e) {
				//alert('Could not save settings');
				//console.log(e);
			}
		},
		'load': function() {
			var settings = window.localStorage.getItem('myseasons_settings');
			if (settings != null) {
				try {
					this.data = jQuery.parseJSON(settings);
				} catch(e) {
					//console.log(e);
				}
			}
		}
	};
	return service;
})

// from http://stackoverflow.com/questions/17063000/ng-model-for-input-type-file
.directive('appFilereader', function($q) {
    var slice = Array.prototype.slice;

    return {
        restrict: 'A',
        require: '?ngModel',
        link: function(scope, element, attrs, ngModel) {
                if (!ngModel) return;

                ngModel.$render = function() {};

                element.bind('change', function(e) {
                    var element = e.target;

                    $q.all(slice.call(element.files, 0).map(readFile))
                        .then(function(values) {
                            if (element.multiple) ngModel.$setViewValue(values);
                            else ngModel.$setViewValue(values.length ? values[0] : null);
                        });

                    function readFile(file) {
                        var deferred = $q.defer();

                        var reader = new FileReader();
                        reader.onload = function(e) {
							//console.log(e.target.result);
							new_data = e.target.result;
							
							/* not working on iOS 
							var img = document.createElement("img");
							img.src = e.target.result;
							
							var canvas = document.createElement("canvas");
							var ctx = canvas.getContext("2d");
							ctx.drawImage(img, 0, 0);
							
							var MAX_WIDTH = 1000;
							var MAX_HEIGHT = 800;
							var width = img.width;
							var height = img.height;
							
							if (width > height) {
							  if (width > MAX_WIDTH) {
							    height *= MAX_WIDTH / width;
							    width = MAX_WIDTH;
							  }
							} else {
							  if (height > MAX_HEIGHT) {
							    width *= MAX_HEIGHT / height;
							    height = MAX_HEIGHT;
							  }
							}
							
							width = parseInt(width);
							height = parseInt(height);
							
							canvas.width = width;
							canvas.height = height;
							var ctx = canvas.getContext("2d");
							ctx.drawImage(img, 0, 0, width, height);
							
							var new_data = canvas.toDataURL("image/png");
							//console.log(new_data);
							*/
							
                            deferred.resolve(new_data);
                        };
                        reader.onerror = function(e) {
                            deferred.reject(e);
                        };
                        reader.readAsDataURL(file);

                        return deferred.promise;
                    }

                }); //change

            } //link
    }; //return
})

.run(function($ionicPlatform, mySeasonsDB, server, settings, $ionicLoading, $translate, $activities, $rootScope) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
	  if (cordova.platformId == 'android') {
		    StatusBar.backgroundColorByHexString("#f39200");
		}
    }
	
	settings.load();
	//console.log('Set stored language: '+settings.data.language);
	//$translate.use(settings.data.language);
	mySeasonsDB.init();
	$activities.load();
	if (location.href.indexOf('myseasons.eu') > -1) {
		server.setProxy('proxy.php?url=');
	}
	
	// Add Analytics
	if(typeof analytics !== 'undefined') {
        analytics.startTrackerWithId("UA-68169687-1");
		analytics.trackView('/home');
    } else {
        //console.log("Google Analytics Unavailable");
    }
	
	if (settings.data.statistics == false) {
		window.analytics_de = analytics;
		analytics = undefined;
	}
	
	$rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
		if (typeof analytics !== 'undefined') {
			analytics.trackView(toState.url)
		}
		/*
		if (toState.url == '/maps') {
			google.maps.event.trigger(window.map, 'resize');
		}
		*/
	  })
  });
});
