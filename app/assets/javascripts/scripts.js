// Initialize mapbox
var map = L.map('map').setView([43.65323,-79.38318
], 12);

// Disable scrolling when hovering on map
map.scrollWheelZoom.disable();

// Some Mapbox specifics for on load [suplied by mapbox]
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'rbnhmll.n1oca4ci',
    accessToken: "pk.eyJ1IjoicmJuaG1sbCIsImEiOiI3NjY4ZDk5NjFhMTYyMDMxMWFmMmM5YWEzMzlkMDgwZiJ9.Ep7u1zX_6SFI94jPki9O-w"
}).addTo(map);

// define app object.
var app = {};
app.clientId = "RUPFMKH0N5PWTIS43LH20C1AWZCMSRJOF02L1Q0PBXEVXIR0";
app.clientSecret = "YRFJZOCG0J3RAJCLGTTAPORHLNBHRNO0X0DSBTBRNA21HMFS";
app.mapBoxKey = "pk.eyJ1IjoicmJuaG1sbCIsImEiOiI3NjY4ZDk5NjFhMTYyMDMxMWFmMmM5YWEzMzlkMDgwZiJ9.Ep7u1zX_6SFI94jPki9O-w";


//-----------------------------------------------------//
// Take User Inputs and Convert to Coordinates
// Decide on Number of Address Inputs
// Pass the coordinate sets into variables for future use
// Take coordinate variables & pass to Turf.center to locate halfway point
// Create variable for halfway point
// Use halfway variable within foursquare
// Display venue selection within proximity of halfway variable
// Add additional user option of coffee or beer for 4S search
//-----------------------------------------------------//


//move user inputs into variables//
app.getUserInputs = function() {
	
	$(".submitBtn").on("click", function(e){
		e.preventDefault();
		if ($(".yourLocation").val() == "" && $(".friendLocation").val() == "") {
			alert("Please fill in the two location fields!");
		}
		else if ($(".yourLocation").val() == "") {
			alert("Please fill in your location!");
		}
		else if ($(".friendLocation").val() == "") {
			alert("Please fill in your friend's location!");
		}
		else if ( !($("input[type=radio]").is(':checked')) ) {
			alert("Please choose either Coffee or Beer!");
		}
		else {
			$('html, body').animate({
	        scrollTop: $("#map").offset().top
	    }, 800);
			var yourLocation = $(".yourLocation").val();
			var friendLocation = $(".friendLocation").val();
			app.venueType = $("input:radio[name=venueType]:checked").val();
			$(".resultsContainer").removeClass("hide").addClass("animated bounceInUp");
			app.convertToGeo(yourLocation,friendLocation);
		};
	});
};




// Convert user-entered data to properly formatted object using Split//
app.convertToGeo = function(yourLocation,friendLocation) {
	app.userEntry1 = yourLocation.split(" ");
	app.userEntry2 = friendLocation.split(" ");
	app.getGeocode(app.userEntry1,app.userEntry2);
};




app.getGeocode = function() {

	var call1 = $.ajax({

		url: "http://api.mapbox.com/v4/geocode/mapbox.places/" + app.userEntry1 + ".json?" + app.mapBoxKey,
		type: "GET",
		dataType: "json",
		data: {
			access_token: app.mapBoxKey,
			format: "json"
		}
	});

		
	var call2 = $.ajax({

		url: "http://api.mapbox.com/v4/geocode/mapbox.places/" + app.userEntry2 + ".json?" + app.mapBoxKey,
		type: "GET",
		dataType: "json",
		data: {
			access_token: app.mapBoxKey,
			format: "json"
		}
	});
	// This is a promise.
	$.when(call1,call2).then(function(res1,res2) {
		var coords1 = res1[0].features[0].geometry.coordinates;
		var coords2 = res2[0].features[0].geometry.coordinates;
		// reverse the array order.
		coords1.reverse();
		coords2.reverse();
		app.getMidpoint(coords1,coords2);
	})


};

//Combine the two coordinate arrays into one midpoint array using turf.center.
app.getMidpoint = function(coords1,coords2) {

	var features = {
	  "type": "FeatureCollection",
	  "features": [
	    {
	      "type": "Feature",
	      "properties": {},
	      "geometry": {
	        "type": "Point",
	        "coordinates": coords1
	      }
	    }, {
	      "type": "Feature",
	      "properties": {},
	      "geometry": {
	        "type": "Point",
	        "coordinates": coords2
	      }
	    }
	  ]
	};


	var centerPt = turf.center(features);
	var centerPtResult = centerPt.geometry.coordinates;
	
	centerPtResult = centerPtResult[0] + "," + centerPtResult[1];
	app.centerPtResult = centerPtResult;

	app.getVenues(centerPtResult);
};




// --------------------//
//FourSquare API begins//

//1. Get a list of venues from 4S.
app.getVenues = function(centerPtResult) {

	if (app.venueType === "coffee") {
		var sectionSelect = "coffee";
		var querySelect = "coffee";
	}
	else if (app.venueType === "beer") {
		var sectionSelect = "drinks";
		var querySelect = "beer";
	};

//Foursquare API call
	var call3 = $.ajax({
		url: "https://api.foursquare.com/v2/venues/explore",
		type: "GET",
		dataType: "json",
		data: {
			ll: centerPtResult,
			client_id: app.clientId,
			client_secret: app.clientSecret,
			v: 20150722,
			radius: 3000,
			section: sectionSelect,
			openNow: 1,
			venuePhotos: 1,
			query: querySelect,
			limit: 3,
			sortByDistance: 1,
			format: "json"
		},
	});

	$.when(call3).then(function(res3) {
		var venueResult = res3.response.groups[0].items;
		console.log(venueResult);
		app.displayVenues(venueResult);
	});
};

//3. build our html to display on the page.
app.displayVenues = function(localVenues) {
	$(".resultsContainer").empty();
	if (localVenues.length === 0) {
		  var zilch = $('<h4>').text("Uh oh.  Looks like your query hasn't returned any results.  Your halfway point is probably in the middle of nowhere :(");
	    $('.resultsContainer').append(zilch);
	  };
	for (var i=0; i<localVenues.length; i++) {
		var venueName = localVenues[i].venue.name;
		var venueAddress = localVenues[i].venue.location.formattedAddress[0];
		var venueDistance = localVenues[i].venue.location.distance;
		var venueCity = localVenues[i].venue.location.formattedAddress[1];
		var venueImage = localVenues[i].venue.featuredPhotos.items[0].prefix + "300x300" + localVenues[i].venue.photos.groups[0].items[0].suffix;
		var venueId = localVenues[i].venue.id;
		var venueUrlPrefix = "https://foursquare.com/v/";
		var $venueContainer = $("<div>");
		$venueContainer.addClass("venueContainer");
		var $venueImage = $("<img>");
		$venueImage.attr("src", venueImage);


		$(".resultsContainer").append($venueContainer.append("<img src=" + venueImage +  ">" + "<h2>" + venueName + "</h2>" + "<p>" + venueAddress + "," + "</p>" + "<p>" + venueCity + "</p>" + "<p>" + "<span>" + venueDistance + "m" + "</span>" + " from midpoint." + "</p>" + "<a href='" + venueUrlPrefix + venueId + "' target='_blank'>" + "<i class='fa fa-foursquare'></i>" + " Visit On Foursquare" + "</a>" ).fadeIn(1500));

		L.marker([localVenues[i].venue.location.lat,localVenues[i].venue.location.lng]).addTo(map).bindPopup(venueName + ":" + "<br>" + venueAddress);
		// console.log(app.centerPtResult);
		map.setView([localVenues[0].venue.location.lat,localVenues[i].venue.location.lng], 15);
	};
};





app.showModal = function() {
// 1.When we click on the show button we want to show the modal box.
	$(".show-button").on("click", function() {
		$(".modal-container").addClass("show");
	});
};

// 2. When we click on the X close button, hide the modal box.
app.closeModal = function() {
	$(".close-button").on("click", function(){
		$(".modal-container").removeClass("show");
	});
};

app.init = function() {
	app.getUserInputs();
	this.showModal();
	this.closeModal();
};

$(function(){
	app.init();
});