// Initialize mapbox
var map = L.map('map').setView([43.65323,-79.38318
], 12);

// Disable scrolling when hovering on map
map.scrollWheelZoom.disable();

// Some Mapbox specifics for on load [suplied by mapbox]
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
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

		url: "https://api.mapbox.com/v4/geocode/mapbox.places/" + app.userEntry1 + ".json?" + app.mapBoxKey,
		type: "GET",
		dataType: "json",
		data: {
			access_token: app.mapBoxKey,
			format: "json"
		}
	});

		
	var call2 = $.ajax({

		url: "https://api.mapbox.com/v4/geocode/mapbox.places/" + app.userEntry2 + ".json?" + app.mapBoxKey,
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
			limit: 6,
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

  // Grab results container, and template from HTML
	var resultsContainer = $('.resultsContainer');
	var venueTemplate = $('#venue-template').html();
	
  // Setup forEach to loop over each of the results, and 
	localVenues.forEach(function(venueItem) {
		// Shorten object call
		var v = venueItem.venue;

		// Set variables for each piece of object info
		var venueName = v.name;
		var venueAddress = v.location.formattedAddress[0];
		var venueDistance = v.location.distance;
		var venueCity = v.location.formattedAddress[1];
		var venueImage = v.featuredPhotos.items[0].prefix + "300x300" + v.photos.groups[0].items[0].suffix;
		var venueId = v.id;
		var venueUrlPrefix = "https://foursquare.com/v/";

		// Set template as variable so we can append it easier later.
		var templateItem = $(venueTemplate);

		// Find elements within template, and place in data.
		templateItem.find('.venue__image').attr('src', venueImage);
		templateItem.find('.venue__name').text(venueName);
		templateItem.find('.venue__addr').text(venueAddress);
		templateItem.find('.venue__city').text(venueCity);
		templateItem.find('.venue__dist span').text(venueDistance + "m");
		templateItem.find('.venue__link').attr("href", venueUrlPrefix + venueId);

		resultsContainer.append(templateItem);

		L.marker([venueItem.venue.location.lat,venueItem.venue.location.lng]).addTo(map).bindPopup(venueName + ":" + "<br>" + venueAddress);

		map.setView([localVenues[0].venue.location.lat,venueItem.venue.location.lng], 15);
		});

};





// Show modal on click.
app.showModal = function() {
	$(".show-button").on("click", function() {
		$(".modal-container").addClass("show");
	});
};

// Hide modal on click
app.closeModal = function() {
	$(".close-button").on("click", function(){
		$(".modal-container").removeClass("show");
	});
};

// Hide modal on Esc
app.escapeModal = function(){
	$(document).keyup(function(ev){
	  if(ev.keyCode == 27) {
	    $(".close-button").trigger("click");
	  };
	});
};

app.init = function() {
	app.getUserInputs();
	this.showModal();
	this.closeModal();
	this.escapeModal();
};

$(function(){
	app.init();
});