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

    // Read the api key from a conf file
    API_KEY = getApiKey(data);
    processCoordinates(req.query.latitude, req.query.longitude, res);
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
  // Retrieve the weather data for the week
  var options = {
    method: 'GET',
    host: 'api.openweathermap.org',
    port: 80,
    path: '/data/2.5/forecast/daily?lat=' + latitude + '&lon=' + longitude + '&units=metric&cnt=7&APPID=' + API_KEY
  };

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
  var WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var weatherDataArray = weatherDataObject.list;
  var weeklyData = [];
  var date = null;
  var weekday = "";
  var conditionText = "";
  var conditionIcon = "";
  var background = null;
  var maxTemperature = 0;
  var minTemperature = 0;

  // View the raw weather data
  //console.log(weatherDataArray);

  for (var i = 0; i < weatherDataArray.length; i++) {
    var rawDailyData = weatherDataArray[i];
    var skyConditions = getSkyConditions(weatherDataArray[i]);
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

  var options = {
    method: 'GET',
    host: 'api.openweathermap.org',
    port: 80,
    path: '/data/2.5/weather?lat=' + latitude + '&lon=' + longitude + '&units=metric&cnt=7&APPID=' + API_KEY
  };

  var data = "";
  var request = http.request(options, function(response){
    response.setEncoding('utf8');

    response.on('data', function(chunk) {
      data += chunk;
    });

    response.on('end', function() {
      var currentWeatherDataObject = JSON.parse(data);
      weeklyData[0].currentTemp = Math.round(currentWeatherDataObject.main.temp);
      res.send(weeklyData);
    });
  });

  request.end();
}

function getSkyConditions(weatherData) {
  var weatherCode = String(weatherData.weather[0].id);
  var weatherCodePrefix = "";
  var background = null;
  var skyConditions = null;

  if (weatherCode.length > 0) {
    weatherCodePrefix = weatherCode.substr(0, 1);
  }

  switch (weatherCodePrefix) {
    case "2" : // Code is in 2XX range
      background = [["#00002a", "0%"], ["#200040", "40%"], ["#330053", "100%"]];
      skyConditions = {description: "Thunderstorm", icon: "thunderstorm.png", background: background};
      break;
    case "3" : // Code is in 3XX range
      background = [["#93cede", "0%"], ["#75bdd1", "41%"], ["#49a5bf", "100%"]];
      skyConditions = {description: "Drizzle", icon: "rain.png", background: background};
      break;
    case "5" : // Code is in 5XX range
      background = [["#3e8ebc", "0%"], ["#0082aa", "25%"], ["#5562a3", "90%"]];
      skyConditions = {description: "Rain", icon: "rain.png", background: background};
      break;
    case "6" : // Code is in 6XX range
      background = [["#a3e6ff", "0%"], ["#afe5ff", "30%"], ["#d7d7d7", "125%"]];
      skyConditions = {description: "Snow", icon: "snow.png", background: background};
      break;
    case "7" : // Code is in 7XX range
      if (weatherCode == "701") {
        // Mist
      } else if (weatherCode == "711") {
        // Smoke
      } else if (weatherCode == "721") {
        // Haze
      } else if (weatherCode == "731") {
        // Sand / Dust whirls
      } else if (weatherCode == "741") {
        // Fog
      } else if (weatherCode == "751") {
        // Sand
      } else if (weatherCode == "761") {
        // Dust
      } else if (weatherCode == "762") {
        // Volcanic Ash
      } else if (weatherCode == "771") {
        // Squalls
      } else if (weatherCode == "781") {
        // Tornado
      }
      break;
    case "8" : // Code is in 8XX range
      if (weatherCode == "800") {
        background = [["#87e0fd", "0%"], ["#53cbf1", "40%"], ["#05abe0", "100%"]];
        skyConditions = {description: "Clear Skies", icon: "clear_day.png", background: background}
      } else {
        background = [["#ddddf5", "0%"], ["#999999", "60%"], ["#596a70", "100%"]];
        skyConditions = {description: "Cloudy", icon: "cloudy.png", background: background};
      }
      break;
    case "9" : // Code is in 9XX range
      if (weatherCode == "900") {
        // Tornado
      } else if (weatherCode == "901") {
        // Tropical Storm
      } else if (weatherCode == "902") {
        // Hurricane
      } else if (weatherCode == "903") {
        // Cold
      } else if (weatherCode == "904") {
        // Hot
      } else if (weatherCode == "905") {
        // Windy
      } else if (weatherCode == "906") {
        // Hail
      }
      break;
    default :
      skyConditions = null;
      break;
  }

  return skyConditions;
}

module.exports = router;
