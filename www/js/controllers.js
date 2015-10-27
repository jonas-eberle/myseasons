/**
 * MySeasons AngularJS Controller File
 * Version: 1.0.0
 * Author: Jonas Eberle <jonas.eberle@uni-jena.de>
 * License: EUPL v1.1 (see LICENSE)
 */

angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $rootScope) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});
  
  $rootScope.$on('$stateChangeSuccess', 
	function(event, toState, toParams, fromState, fromParams){ 
	    $('ion-side-menu ion-item').removeClass('active'); 
		$('ion-side-menu ion-item.'+toState.url.substr(1)).addClass('active');
	});

  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    //console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})

.controller('HomeCtrl', function($scope, $state, $ionicModal, $ionicPopup, mySeasonsDB, settings, $activities, $ionicSlideBoxDelegate, $translate){
	
	$scope.data = $activities.data;	
	$scope.reload = function() {	
		$activities.load();
	};
	
	$scope.delete = function($event, entry) {
		var _this = this;
		$translate(['WARNING', 'DELETE_QUESTION', 'CANCEL']).then(function (translations) {
			var confirmPopup = $ionicPopup.confirm({
		       title: translations.WARNING,
		       template: translations.DELETE_QUESTION,
			   cancelText: translations.CANCEL
		    }).then(function(res) {
		       if(res) {
				 mySeasonsDB.delete(entry.id, function(){
				 	_this.reload();
					//$($event.target).parents('.list.card').remove();
				 });
		       }
		    });
		});
	}
	
	$scope.close = function($event) {
		$($event.target).parents('.list.card').remove();
	};
	
	$scope.start = function() {
		if (typeof analytics !== 'undefined') {
			analytics.trackEvent('Home', 'Button', 'Start exploring');
		}
		//$state.go('app.maps');
		$('.menu-left .list .maps a').click();
	}
	
	$ionicModal.fromTemplateUrl('templates/analyze.html', {
    	scope: $scope
  	}).then(function(modal) {
  	  $scope.modal = modal;
 	 });
  
  	$scope.closeLogin = function() {
  		$scope.modal.hide();
  	}
	
	$scope.share = function() {
		var index = $ionicSlideBoxDelegate.currentIndex();
		var url = null;
		var name = null;
		if (index == 1) {
			url = $scope.data_analysis.tsPlot;
			name = 'timeseries chart';
		} else if (index == 2) {
			url = $scope.data_analysis.timesat;
			name = 'timesat chart';
		} else {
			url = $scope.data_analysis.phenoChart;
			name = 'pheno chart';
		}
		window.plugins.socialsharing.share(null, null, url, null);
		if (typeof analytics !== 'undefined') {
			analytics.trackEvent('Share', name, url);
		}
	}
	
	$scope.export = function() {
		window.plugins.socialsharing.share(null, null, 'http://artemis.geogr.uni-jena.de/myseasons/export/'+$scope.data_analysis.uuid+'.zip', null);
		if (typeof analytics !== 'undefined') {
			analytics.trackEvent('Save', 'Start', $scope.data_analysis.uuid);
		}
	}
	
	$scope.showCard = function(entry) {
  		$scope.data_analysis = {
			id: entry.id,
			type: entry.type,
			lat: entry.pos_lat,
			lon: entry.pos_lon,
			timestamp: entry.pubDateStr,
			phenoChart: entry.phenochart,
			timesat: entry.timesat,
			tsPlot: entry.tsplot
		}
		if (entry.type == 'Data collection') {
			try {
				$scope.data_analysis['inputdata'] = JSON.parse(entry.inputdata);
			} catch(e) {
				$scope.data_analysis['inputdata'] = {};
			}
		}
		$ionicSlideBoxDelegate.update();
		$ionicSlideBoxDelegate.slide(0);
		$scope.modal.show();
		if (typeof analytics !== 'undefined') {
			analytics.trackView('/'+entry.type);
		}
  	}
})

.controller('MapsCtrl', function($scope, $ionicLoading, $compile, $ionicModal, $ionicPopup, $timeout, $ionicSlideBoxDelegate, server, mySeasonsDB, settings, $translate) { 
  function initialize() {
	// leaflet start
	window.map = L.map('map', { zoomControl:false }).setView([51.505, -0.09], 13);
	$scope.map = window.map;

	$scope.baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
		detectRetina: true
	}).addTo($scope.map);
	
	var icon = L.icon({
	    iconUrl: 'img/fadenkreuz.png',
	    iconSize:     [70, 70],
	    iconAnchor:   [35, 35],
	});
	
	$scope.marker = L.marker([43.07493,-89.381388]).addTo($scope.map);

	$scope.map.on('click', function(evt) {
		$scope.marker.setLatLng([evt.latlng.lat, evt.latlng.lng]);
		$('#findLocation').removeClass('active');
	});
	
	$scope.findLocation(false);
    
  }
  
  $scope.position = {};
  $scope.geolocOptions = {maximumAge: 0, timeout: 20000, enableHighAccuracy:true};
  
  $scope.findLocation = function(setZoom) {
  	if (setZoom == true) {
		
		if (typeof analytics !== 'undefined') {
			analytics.trackEvent('Map', 'Find Location', '');
		}
		
		$translate(['GET_CURRENT_LOCATION']).then(function (translations) {
			$ionicLoading.show({
		      template: '<ion-spinner></ion-spinner><br />'+translations.GET_CURRENT_LOCATION+'...',
		      showBackdrop: true
		    });
		});
	}
	
	try {
		navigator.geolocation.getCurrentPosition(function(pos){
			$scope.position = pos;
			currentPositionLat = pos.coords.latitude;
			currentPositionLon = pos.coords.longitude;
			$scope.marker.setLatLng([currentPositionLat, currentPositionLon]);
			$scope.map.setView([currentPositionLat, currentPositionLon], $scope.map.getZoom());
			
			if (setZoom == true) {
				$scope.map.setZoom(14);
				$('#map_satellite').click();
				$('#findLocation').addClass('active');
				$ionicLoading.hide();
			}
			//trackEvent('GPS', 'action', 'activated');
		}, function(err) {
			var positionErrorCodes = {
				1: 'Permission denied',
				2: 'Position unavailable',
				3: 'Timeout'
			}
			$translate(['GPS_ERROR', 'ERROR']).then(function (translations) {
				$ionicPopup.alert({
			       title: translations.ERROR,
			       template: translations.GPS_ERROR+': '+positionErrorCodes[err.code]
			     });
			 });
			$ionicLoading.hide();
		}, $scope.geolocOptions);
	} catch(e) {
		
	}
  }
  
  initialize();
  //google.maps.event.addDomListener(window, 'load', initialize);  
  
  $scope.infoMapTypeNames = {'mod13q1_trend': 'VEGETATIOIN_TREND_MAP', 'mcd12q2': 'START_SEASON_MAP'};
  
  $scope.info = function(map) {
  	$scope.currentInfoType = map;
	$scope.currentInfoTypeName = $scope.infoMapTypeNames[map];
	$ionicModal.fromTemplateUrl('templates/mapinfo.html', {
	    scope: $scope,
		animation: 'slide-in-up'
	  }).then(function(mapinfo) {
	    $scope.win_mapinfo = mapinfo;
		$scope.win_mapinfo.show();
	  });
  }
  
  $scope.closeMapInfo = function() {
  	$scope.win_mapinfo.hide();
  }
  
  $scope.changeInput = function(evt) {
  	var elem = evt.target;
	$('.option', $('#'+elem.id).parents('.list')).removeClass('active');
	$('.option', $('#'+elem.id).parents('label')).addClass('active');
  	//$ionicSlideBoxDelegate.update();
  }
  
  $scope.collectData = {};
  
  // slider based on http://codepen.io/ikkez/pen/eNzvLd
  $ionicModal.fromTemplateUrl('templates/collect.html', {
    scope: $scope,
	animation: 'slide-in-up'
  }).then(function(collect) {
    $scope.collect_win = collect;
	$scope.selectModalSlider = $ionicSlideBoxDelegate.$getByHandle('modalSlider');
	$scope.selectModalSlider.enableSlide(false);
  });
  
  // Properties
  $scope.properties = {'blattentfaltung': 1, 'bluete': 2, 'fruchtreife': 3, 'blattverfaerbung': 4, 'blattfall': 5};
  $scope.lastSlide = 6;
  
  // Baume
  $scope.baeume = [{name:'HAZELNUT',properties:['bluete']}, 
{name:'SNOWDROPS',properties:['bluete']},
{name:'FORSYTHIA',properties:['bluete']},
{name:'GOOSEBERRY',properties:['blattentfaltung']},
{name:'APPLE_TREE',properties:['bluete','blattfall']},
{name:'COMMON_OAK',properties:['blattentfaltung','fruchtreife','blattverfaerbung','blattfall']},
{name:'BLACK_ELDER',properties:['bluete','fruchtreife']},
{name:'ROBINIA',properties:['bluete']},
{name:'LARGE_LEAVED_LINDEN',properties:['bluete']},
{name:'CURRANT',properties:['fruchtreife']},
{name:'EARLY_APPLE',properties:['fruchtreife']},
{name:'ROWAN',properties:['fruchtreife','blattfall']},
{name:'CORNELIAN_CHERRY',properties:['fruchtreife']},
{name:'HORSE_CHESTNUT',properties:['fruchtreife']} 
];

	$scope.selectedBaum = null;
	$scope.currentSetting = null;
  
    $scope.selectBaum = function(baum) {
  		$('ion-content ion-slide .list .option').removeClass('active');
		$scope.selectedBaum = baum;
		$scope.collectData = {'baum': baum.name, 'name': settings.data.pattern_name, 'mail': settings.data.pattern_mail};
		var pos = $scope.marker.getLatLng();
		$scope.collectData.lat = pos.lat.toFixed(4);
		$scope.collectData.lon = pos.lng.toFixed(4);
		
		$scope.currentSetting = null;
		$scope.currentSlide = 0;
		$scope.nextSlideIndex = null;
		$scope.previousSlideIndexes = [];
		$scope.nextSlide($scope.properties[baum.properties[0]], 'next');
	};
	
	$scope.foto = function(imageId){
		try {
			
			if (typeof analytics !== 'undefined') {
				analytics.trackEvent('Collect', 'Foto', $scope.collectData.baum+': '+imageId);
			}
			
			$translate(['PROCESS_PICTURE']).then(function (translations) {
				$ionicLoading.show({
			      template: '<ion-spinner></ion-spinner><br />'+translations.PROCESS_PICTURE+'...',
			      showBackdrop: true
			    });
			});
			
			navigator.camera.getPicture(function(imageData){
				$scope.collectData[imageId] = "data:image/jpeg;base64,"+imageData;
				var image = document.getElementById(imageId);
	    		image.src = "data:image/jpeg;base64," + imageData;
				try {
					$ionicLoading.hide();
				} catch(e) {}
			}, function(message){
				$ionicPopup.alert({
			       title: 'Error',
			       template: message
			     });
			}, { quality: 75, targetWidth: 1000, targetHeight: 1000, destinationType: 0 });  
    	} catch(e) {}
		
	}
	
	$scope.selectBluete = function(bluete) {
		$scope.selectedBluete = bluete;
	};
	
	$scope.itemDisabled = false;
	$scope.currentSlide = null;
	$scope.previousSlideIndex = null;
	$scope.previousSlideIndexes = [];
	
	$scope.prevSlide = function(){
		var prevSlideIndex = $scope.previousSlideIndexes[$scope.previousSlideIndexes.length-1];
		$scope.nextSlide(prevSlideIndex, 'prev');
	}
	
	$scope.submit = function(){
		var _this = this;
		//console.log($scope.collectData);
		
		$translate(['UPLOAD_DATA']).then(function (translations) {
			$ionicLoading.show({
		      template: '<ion-spinner></ion-spinner><br />'+translations.UPLOAD_DATA+'...',
		      showBackdrop: true
		    });
		});
		
		if (typeof analytics !== 'undefined') {
			analytics.trackEvent('Collect', 'Submit', $scope.collectData.lat+' | '+$scope.collectData.lon);
			analytics.trackEvent('Collect', 'Baumart', $scope.collectData.baum);
		}
		
		mySeasonsDB.insertDataCollection($scope.collectData.lat, $scope.collectData.lon, $scope.collectData);
		
		server.post('http://artemis.geogr.uni-jena.de/mySeasons/collect', $scope.collectData).then(function(data){
			mySeasonsDB.updateDataCollection(mySeasonsDB.last_insert_id, data.timesatPlot, data.phenoPlot, data.tsPlot, data.pointBBOX, data.uuid, function(){
				mySeasonsDB.get(mySeasonsDB.last_insert_id, function(entry){
					$ionicLoading.hide();
					_this.closeCollect();
					if (entry != false) {
						$scope.data_analysis = {
							type: entry.type,
							timestamp: new Date().toISOString(),
							lat: entry.pos_lat,
							lon: entry.pos_lon,
							tsPlot: entry.tsplot,
							phenoChart: entry.phenochart,
							timesat: entry.timesat,
							uuid: entry.uuid,
							inputdata: JSON.parse(entry.inputdata)
						};
						$scope.card.show();
					}
				})
			});
			
		})
		//$scope.closeCollect();
	}
	
	$scope.nextSlideIndex = null;
	
	$scope.slideChanged = function(index) {
		$('.modal.active .collect .scroll').translate3d({ x: 0, y: 0, z: 0}, 10);
	}
	
	$scope.showRightsOfUse = function() {
		$translate(['RIGHTS_USE', 'RIGHTS_USE_TEXT']).then(function (translations) {
			$ionicPopup.alert({
		       title: translations.RIGHTS_USE,
		       template: translations.RIGHTS_USE_TEXT
		     });
		 });
	}
	
	$scope.checkCollectForm = function() {
		if ($scope.nextSlideIndex == -1) {
			if ($scope.collectData.nutzung != true) {
				$translate(['ERROR', 'ACCEPT_TERMS_OF_USE']).then(function (translations) {
					$ionicPopup.alert({
				       title: translations.ERROR,
				       template: translations.ACCEPT_TERMS_OF_USE
				     });
				 });
				 return false;
			}
			$scope.submit();
			return true;
		}
		var currentKey = $scope.selectedBaum.properties[$scope.currentSetting];
		if (typeof($scope.collectData[currentKey]) == 'undefined') {
			$translate(['ERROR', 'SPECIFY_VALUE']).then(function (translations) {
				$ionicPopup.alert({
			       title: translations.ERROR,
			       template: translations.SPECIFY_VALUE
			     });
			 });
		} else {
			$scope.nextSlide(null, 'next');
		}
	};
	
	$scope.nextSlide = function(slide, type) {
		if (type == 'next') {
			$scope.previousSlideIndex = $ionicSlideBoxDelegate.$getByHandle('modalSlider').currentIndex();
			$scope.previousSlideIndexes.push($scope.previousSlideIndex);
		} else {
			$scope.previousSlideIndexes.splice(-1, 1);
		}
		if (slide != null) {
			$ionicSlideBoxDelegate.$getByHandle('modalSlider').slide(slide);
		} else if ($scope.nextSlideIndex != null) {
			$ionicSlideBoxDelegate.$getByHandle('modalSlider').slide($scope.nextSlideIndex);
		} else if (slide == null) {
			$ionicSlideBoxDelegate.$getByHandle('modalSlider').next();
		}
		
		$scope.currentSlide = $ionicSlideBoxDelegate.$getByHandle('modalSlider').currentIndex();
		
		if ($scope.currentSlide > 0 && $scope.currentSlide <= $scope.lastSlide) {
			if ($scope.currentSetting == null) {
				$scope.currentSetting = 0;
			} else {
				if (type == 'prev') {
					$scope.currentSetting = $scope.currentSetting - 1;
				} else {
					$scope.currentSetting = $scope.currentSetting + 1;	
				}
			}
		}
		
		if ($ionicSlideBoxDelegate.$getByHandle('modalSlider').currentIndex() == $scope.lastSlide) {
			$scope.itemDisabled = true;
			$translate(['SUBMIT']).then(function (translations) {
				$('#nextSlide').text(translations.SUBMIT);
			});
			$scope.nextSlideIndex = -1;
		} else if ($ionicSlideBoxDelegate.$getByHandle('modalSlider').currentIndex() == 0) {
			$('#prevSlide').hide();
			$('#nextSlide').hide();
		} else {
			if ($scope.selectedBaum.properties.length > $scope.currentSetting+1) {
				$scope.nextSlideIndex = $scope.properties[$scope.selectedBaum.properties[$scope.currentSetting+1]];
			} else {
				$scope.nextSlideIndex = $scope.lastSlide;
			}
			$translate(['NEXT']).then(function (translations) {
				$('#nextSlide').text(translations.NEXT);
			});
			$('#prevSlide').show();
			$('#nextSlide').show();
		}
	};
  
  $ionicModal.fromTemplateUrl('templates/analyze.html', {
    	scope: $scope
  }).then(function(card) {
    	$scope.card = card;
  });
  $scope.data_analysis = {
  		timestamp: '2014',
		lat: '123',
		lon: '125'
  };
  
  $scope.changeMap = function(type, $event) {
	if (typeof analytics !== 'undefined') {
		analytics.trackView('/maps/'+type);
	}
	
	if (typeof($scope.activeOverlay) != 'undefined') {
		$scope.map.removeLayer($scope.activeOverlay);
	}
	
	if (type == 'mcd12q2') {
		$scope.activeOverlay = L.tileLayer('http://artemis.geogr.uni-jena.de/myseasons/mcd12q2/tms/{z}/{x}/{y}.png', {
			minZoom: 1,
			maxZoom: 10,
			tms: true
		}).addTo($scope.map);
		
		$('#legende1').show();
		$('#legende2').hide();
		if ($scope.map.getZoom() > 10) {
			$scope.map.setZoom(10);
		}
	} else if (type == 'mod13q1_trend') {
		$scope.activeOverlay = L.tileLayer('http://artemis.geogr.uni-jena.de/myseasons/mod13q1_trend/tms/{z}/{x}/{y}.png', {
			minZoom: 1,
			maxZoom: 10,
			tms: true
		}).addTo($scope.map);
		
		$('#legende1').hide();
		$('#legende2').show();
		if ($scope.map.getZoom() > 10) {
			$scope.map.setZoom(10);
		}
	} else {
		$('#legende1').hide();
		$('#legende2').hide();
	}
	$('.map-buttons a').removeClass('button-positive')
	$($event.target).addClass('button-positive');
  }
  
  $scope.showModal = function() {
  	$scope.modal.show();
  }
  
  $scope.analyze = function() {
	var pos = $scope.marker.getLatLng();
	var lat = pos.lat.toFixed(4);
	var lon = pos.lng.toFixed(4);
	
	if (typeof analytics !== 'undefined') {
		analytics.trackEvent('Analysis', 'Start', lat+' | '+lon);
	}
	
	$translate(['ANALYZE_DATA']).then(function (translations) {
		$ionicLoading.show({
	      template: '<ion-spinner></ion-spinner><br />'+translations.ANALYZE_DATA+'...',
	      showBackdrop: true
	    });
	});	
	
	server.get('http://artemis.geogr.uni-jena.de/mySeasons/analysis?pointX='+lon+'&pointY='+lat).then(function(data){
		mySeasonsDB.insertAnalysis(lat, lon, data.timesatPlot, data.phenoPlot, data.tsPlot, data.pointBBOX, data.uuid);
		$scope.data_analysis = {
			type: 'Analysis',
			timestamp: new Date().toISOString(),
			lat: lat,
			lon: lon,
			tsPlot: data.tsPlot,
			phenoChart: data.phenoPlot,
			timesat: data.timesatPlot,
			uuid: data.uuid
		};
		$ionicLoading.hide();
		$scope.card.show();
	});
	
  }
  
  $scope.share = function(image) {
	var index = $ionicSlideBoxDelegate.currentIndex();
	var url = null;
	var name = null;
	if (index == 1) {
		url = $scope.data_analysis.tsPlot;
		name = 'timeseries chart';
	} else if (index == 2) {
		url = $scope.data_analysis.timesat;
		name = 'timesat chart';
	} else {
		url = $scope.data_analysis.phenoChart;
		name = 'pheno chart';
	}
	window.plugins.socialsharing.share(null, null, url, null);
	if (typeof analytics !== 'undefined') {
		analytics.trackEvent('Share', name, url);
	}
  }
	
  $scope.export = function() {
	window.plugins.socialsharing.share(null, null, 'http://artemis.geogr.uni-jena.de/myseasons/export/'+$scope.data_analysis.uuid+'.zip', null);
	if (typeof analytics !== 'undefined') {
		analytics.trackEvent('Save', 'Start', $scope.data_analysis.uuid);
	}
  }
  
  $scope.closeLogin = function() {
  	$scope.card.hide();
  }
  
  $scope.closeCollect = function() {
	$scope.collect_win.hide();
  }
  
  $scope.collect = function() {
    if(!$scope.map) {
      return;
    }
	$('ion-content ion-slide .list .option').removeClass('active');

	$translate(['GET_CURRENT_LOCATION']).then(function (translations) {
		$ionicLoading.show({
	      template: '<ion-spinner></ion-spinner><br />'+translations.GET_CURRENT_LOCATION+'...',
	      showBackdrop: true
	    });
	});
		
	navigator.geolocation.getCurrentPosition(function(pos){
			$scope.position = pos;
			currentPositionLat = pos.coords.latitude;
			currentPositionLon = pos.coords.longitude;
			$scope.marker.setLatLng([currentPositionLat, currentPositionLon]);
			$scope.map.setView([currentPositionLat, currentPositionLon], $scope.map.getZoom());
			
			$scope.map.setZoom(14);
			$('#map_satellite').click();
			$('#findLocation').addClass('active');
			
			$ionicSlideBoxDelegate.$getByHandle('modalSlider').slide(0);
			$translate(['NEXT']).then(function (translations) {
				$('#nextSlide').text(translations.NEXT);
			});
			$scope.currentSlide = 0;
			$scope.collect_win.show();
			$scope.collectData = {'name': settings.data.pattern_name, 'mail': settings.data.pattern_mail};
			
			var pos = $scope.marker.getLatLng();
			$scope.collectData.lat = pos.lat.toFixed(4);
			$scope.collectData.lon = pos.lng.toFixed(4);
			
			if (typeof analytics !== 'undefined') {
				analytics.trackEvent('Collect', 'Button', $scope.collectData.lat+' | '+$scope.collectData.lon);
			}
			
			$ionicLoading.hide();
			
		}, function(err) {
			var positionErrorCodes = {
				1: 'Permission denied',
				2: 'Position unavailable',
				3: 'Timeout'
			}
			$translate(['GPS_ERROR', 'ERROR']).then(function (translations) {
				$ionicPopup.alert({
			       title: translations.ERROR,
			       template: translations.GPS_ERROR+': '+positionErrorCodes[err.code]
			     });
			 });
			$ionicLoading.hide();
		}, $scope.geolocOptions);
  }; 
})

.controller('SettingsCtrl', function($scope, settings, $translate, mySeasonsDB, $ionicPopup) {
	$scope.data = settings.data;
	
	$scope.changeLang = function() {
		$translate.use($scope.data.language).then(function (key) {
	      //console.log("Sprache zu " + key + " gewechselt.");
		    if (typeof analytics !== 'undefined') {
				analytics.trackEvent('Language', 'Select', $scope.data.language);
			}
	    }, function (key) {
	      //console.log("Irgendwas lief schief.");
	    });
	}
	
	$scope.changeAnalytics = function() {
		if ($scope.data.statistics == true) {
			if (typeof analytics == 'undefined') {
				analytics = window.analytics_de;
			}
		} else {
			window.analytics_de = analytics;
			analytics = undefined;
		}		
	}
	
	$scope.clearStorage = function() {
		
		$translate(['WARNING', 'CLEAR_QUESTION', 'CANCEL']).then(function (translations) {
			var confirmPopup = $ionicPopup.confirm({
		       title: translations.WARNING,
		       template: translations.CLEAR_QUESTION,
			   cancelText: translations.CANCEL
		    }).then(function(res) {
		       if(res) {
				 mySeasonsDB.clear(function(){});
		       }
		    });
		});
		
		
	}
	
	$scope.$watchCollection('data', function(newVal, oldVal){
	 	settings.save();
	});
	
});
