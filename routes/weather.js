var http = require('http');
var express = require('express');
var router = express.Router();
var API_KEY = null;

/* GET weather data. */
router.get('/', function(req, res, next) {
  var fs = require('fs');

  fs.readFile('../key.conf', 'utf8', function(error, data) {
    if (error) {
      return console.log(error);
    }

    if (req.query.latitude && req.query.longitude) {
      // Read the api key from a conf file
      API_KEY = getApiKey(data);
      processCoordinates(req.query.latitude, req.query.longitude, res);
    } else {
      var err = new Error('Not Found');
      err.status = 404;
      next(err);
    }
  });
});


// TODO: Repurpose key.conf to also read in server URL
// Parse the pairs in the conf file until the api key is found
function getApiKey(confStrings) {
  var tokens = confStrings.split("\n");
  var apiKey = null;
  var currentPair = null;

  for (var i = 0; i < tokens.length && apiKey == null; i++) {
    currentPair = tokens[i].split("=");

    if (currentPair.length == 2 && currentPair[0] == "api_key") {
      apiKey = currentPair[1];
    }
  }

  return apiKey;
}

function processCoordinates(latitude, longitude, res) {
  // Parameters for the weekly weather data
  var options = {
    method: 'GET',
    host: 'api.openweathermap.org',
    port: 80,
    path: '/data/2.5/forecast/daily?lat=' + latitude + '&lon=' + longitude + '&units=metric&cnt=7&APPID=' + API_KEY
  };

  // Retrieve the weather data for the week
  var data = "";
  var request = http.request(options, function(response) {
    response.setEncoding('utf8');

    response.on('data', function(chunk) {
      data += chunk;
    });

    response.on('end', function() {
      var weatherDataObject = JSON.parse(data);
      processWeatherData(weatherDataObject, latitude, longitude, res);
    });
  });

  request.end();
}

function processWeatherData(weatherDataObject, latitude, longitude, res) {
  var WEEKDAY_NAMES = [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ];
  var weatherDataArray = weatherDataObject.list;
  var weeklyData = [ ];
  var date = null;
  var weekday = "";
  var conditionText = "";
  var conditionIcon = "";
  var background = null;
  var maxTemperature = 0;
  var minTemperature = 0;

  // Parameters for the current weather data
  var options = {
    method: 'GET',
    host: 'api.openweathermap.org',
    port: 80,
    path: '/data/2.5/weather?lat=' + latitude + '&lon=' + longitude + '&units=metric&APPID=' + API_KEY
  };

  // Retrieve the current weather data
  var data = "";
  var request = http.request(options, function(response){
    response.setEncoding('utf8');

    response.on('data', function(chunk) {
      data += chunk;
    });

    response.on('end', function() {
      var currentWeatherDataObject = JSON.parse(data);
      var isDaytime = getDaylightStatus(currentWeatherDataObject.sys);

      for (var i = 0; i < weatherDataArray.length; i++) {
        var rawDailyData = weatherDataArray[i];
        var skyConditions = getSkyConditions(weatherDataArray[i], isDaytime);
        date = new Date(rawDailyData.dt * 1000);
        weekday = WEEKDAY_NAMES[date.getDay()];
        conditionText = skyConditions.description;
        conditionIcon = "/images/" + skyConditions.icon;
        background = skyConditions.background;
        maxTemperature = Math.round(rawDailyData.temp.max);
        minTemperature = Math.round(rawDailyData.temp.min);

        var formattedDailyData = { weekday: weekday,
          conditionText: conditionText,
          conditionIcon: conditionIcon,
          background: background,
          maxTemperature: maxTemperature,
          minTemperature: minTemperature };

        weeklyData.push(formattedDailyData);
      }

      weeklyData[0].currentTemp = Math.round(currentWeatherDataObject.main.temp);
      res.send(weeklyData);
    });
  });

  request.end();
}

function getDaylightStatus(sys) {
  var timeOfSunrise = new Date(sys.sunrise * 1000);
  var timeOfSunset = new Date(sys.sunset * 1000);
  var currentTime = new Date();

  return ((currentTime.getTime() >= timeOfSunrise.getTime()) && (currentTime.getTime() < timeOfSunset.getTime()));
}

function getSkyConditions(weatherData, isDaytime) {
  var weatherCode = String(weatherData.weather[0].id);
  var weatherCodePrefix = "";
  var background = null;
  var skyConditions = null;
  var icon = null;

  if (weatherCode.length > 0) {
    weatherCodePrefix = weatherCode.substr(0, 1);
  }

  switch (weatherCodePrefix) {
    case "2" : // Code is in 2XX range
      background = [ ["#00002a", "0%"], ["#200040", "40%"], ["#330053", "100%"] ];
      skyConditions = { description: "Thunderstorm", icon: "thunderstorm.png", background: background };
      break;
    case "3" : // Code is in 3XX range
      background = [ ["#93cede", "0%"], ["#75bdd1", "41%"], ["#49a5bf", "100%"] ];
      skyConditions = { description: "Drizzle", icon: "rain.png", background: background };
      break;
    case "5" : // Code is in 5XX range
      background = [ ["#3e8ebc", "0%"], ["#0082aa", "25%"], ["#5562a3", "90%"] ];
      skyConditions = { description: "Rain", icon: "rain.png", background: background };
      break;
    case "6" : // Code is in 6XX range
      background = [ ["#a3e6ff", "0%"], ["#afe5ff", "30%"], ["#d7d7d7", "125%"] ];
      skyConditions = { description: "Snow", icon: "snow.png", background: background };
      break;
    case "7" : // Code is in 7XX range
      if (weatherCode == "701") {
        icon = isDaytime ? "atmospheric_day.png" : "atmospheric_night.png";
        background = [ ["#9ac9d6", "0%"], ["#a1dbff", "25%"], ["#84a2c9", "90%"] ];
        skyConditions = { description: "Mist", icon: icon, background: background };
      } else if (weatherCode == "711") {
        icon = isDaytime ? "atmospheric_day.png" : "atmospheric_night.png";
        background = [ ["#d3d1c4", "0%"], ["#aaa77c", "25%"], ["#3d3d3d", "90%"] ];
        skyConditions = { description: "Smoke", icon: icon, background: background };
      } else if (weatherCode == "721") {
        icon = isDaytime ? "atmospheric_day.png" : "atmospheric_night.png";
        background = [ ["#d3d1c4", "0%"], ["#aaa77c", "25%"], ["#3d3d3d", "90%"] ];
        skyConditions = { description: "Haze", icon: icon, background: background };
      } else if (weatherCode == "731") {
        icon = isDaytime ? "atmospheric_day.png" : "atmospheric_night.png";
        background = [ ["#d3d1c4", "0%"], ["#aaa77c", "25%"], ["#3d3d3d", "90%"] ];
        skyConditions = { description: "Sand / Dust Whirls", icon: icon, background: background };
      } else if (weatherCode == "741") {
        icon = isDaytime ? "atmospheric_day.png" : "atmospheric_night.png";
        background = [ ["#9ac9d6", "0%"], ["#a1dbff", "25%"], ["#84a2c9", "90%"] ];
        skyConditions = { description: "Fog", icon: icon, background: background };
      } else if (weatherCode == "751") {
        icon = isDaytime ? "atmospheric_day.png" : "atmospheric_night.png";
        background = [ ["#d3d1c4", "0%"], ["#aaa77c", "25%"], ["#3d3d3d", "90%"] ];
        skyConditions = { description: "Sand", icon: icon, background: background };
      } else if (weatherCode == "761") {
        icon = isDaytime ? "atmospheric_day.png" : "atmospheric_night.png";
        background = [ ["#d3d1c4", "0%"], ["#aaa77c", "25%"], ["#3d3d3d", "90%"] ];
        skyConditions = { description: "Dust", icon: icon, background: background };
      } else if (weatherCode == "762") {
        icon = isDaytime ? "atmospheric_day.png" : "atmospheric_night.png";
        background = [ ["#d3d1c4", "0%"], ["#aaa77c", "25%"], ["#3d3d3d", "90%"] ];
        skyConditions = { description: "Volcanic Ash", icon: icon, background: background };
      } else if (weatherCode == "771") {
        background = [ ["#3e8ebc", "0%"], ["#0082aa", "25%"], ["#5562a3", "90%"] ];
        skyConditions = { description: "Squalls", icon: "rain.png", background: background };
      } else if (weatherCode == "781") {
        background = [ ["#00002a", "0%"], ["#200040", "40%"], ["#330053", "100%"] ];
        skyConditions = { description: "Tornado", icon: "extreme.png", background: background };
      }
      break;
    case "8" : // Code is in 8XX range
      if (weatherCode == "800") {
        icon = isDaytime ? "clear_day.png" : "clear_night.png";
        background = [ ["#87e0fd", "0%"], ["#53cbf1", "40%"], ["#05abe0", "100%"] ];
        skyConditions = { description: "Clear Skies", icon: icon, background: background }
      } else {
        background = [ ["#ddddf5", "0%"], ["#999999", "60%"], ["#596a70", "100%"] ];
        skyConditions = { description: "Cloudy", icon: "cloudy.png", background: background };
      }
      break;
    case "9" : // Code is in 9XX range
      if (weatherCode == "900") {
        background = [ ["#00002a", "0%"], ["#200040", "40%"], ["#330053", "100%"] ];
        skyConditions = { description: "Tornado", icon: "extreme.png", background: background };
      } else if (weatherCode == "901") {
        background = [ ["#00002a", "0%"], ["#200040", "40%"], ["#330053", "100%"] ];
        skyConditions = { description: "Tropical Storm", icon: "extreme.png", background: background };
      } else if (weatherCode == "902") {
        background = [ ["#00002a", "0%"], ["#200040", "40%"], ["#330053", "100%"] ];
        skyConditions = { description: "Hurricane", icon: "extreme.png", background: background };
      } else if (weatherCode == "903") {
        background = [ ["#0A003A", "0%"], ["#000172", "40%"], ["#0063E5", "100%"] ];
        skyConditions = { description: "Extreme Cold", icon: "extreme.png", background: background };
      } else if (weatherCode == "904") {
        background = [ ["#840000", "0%"], ["#A53A00", "40%"], ["#E08200", "100%"] ];
        skyConditions = { description: "Extreme Heat", icon: "extreme.png", background: background };
      } else if (weatherCode == "905") {
        background = [ ["#62788C", "0%"], ["#90A3AF", "35%"], ["#C0D0D8", "100%"] ];
        skyConditions = { description: "High Winds", icon: "extreme.png", background: background };
      } else if (weatherCode == "906") {
        background = [ ["#0A003A", "0%"], ["#000172", "40%"], ["#0063E5", "100%"] ];
        skyConditions = { description: "Hail", icon: "extreme.png", background: background };
      }
      break;
    default :
      skyConditions = null;
      break;
  }

  return skyConditions;
}

module.exports = router;
