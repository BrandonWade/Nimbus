/**
 * Logic to retrieve and display weather forecast information based on the user's location.
 */

var API_KEY = null;

function getUserCoordinates() {
    var apiKeyRequest = getApiKeyRequest();

    $.when(apiKeyRequest).done(function() {
        // Read the api key from a conf file
        API_KEY = getApiKey(apiKeyRequest.responseText);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(processCoordinates);
        } else {
            var container = $("#container");
            container.append("Your browser does not support geolocation. We were unable to retrieve your position.");
        }
    });
}

// Read in the conf file that contains the api key
function getApiKeyRequest() {
    return $.get("key.conf");
}

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

function processCoordinates(position) {
    var container = $("#container");
    var requestUrl = "http://api.openweathermap.org/data/2.5/forecast/daily?lat=" + position.coords.latitude + "&lon=" + position.coords.longitude + "&units=metric&cnt=7&APPID=" + API_KEY;

    // Retrieve the weather data for the week
    $.ajax({
        type: "GET",
        url: requestUrl,
        cache: false,
        crossDomain: true,
        success: function(data) {
            processWeatherData(data, position);
        },
        failure: function(XMLHttpRequest, textStatus, errorThrown) {
            container.append("Request for weather data failed.");
        }
    });
}

function processWeatherData(weatherDataObject, position) {
    var WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var weatherDataArray = weatherDataObject.list;
    var weeklyData = [];
    var date = null;
    var weekday = "";
    var conditionText = "";
    var conditionIcon = "";
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
        conditionIcon = "http://openweathermap.org/img/w/" + skyConditions.icon;
        maxTemperature = Math.round(rawDailyData.temp.max);
        minTemperature = Math.round(rawDailyData.temp.min);

        var formattedDailyData = { weekday: weekday,
                                   conditionText: conditionText,
                                   conditionIcon: conditionIcon,
                                   maxTemperature: maxTemperature,
                                   minTemperature: minTemperature };

        weeklyData.push(formattedDailyData);
    }

    var currentTempRequest = getCurrentTemperatureRequest(position);
    $.when(currentTempRequest).done(function() {
        weeklyData[0].currentTemp = Math.round(currentTempRequest.responseJSON.main.temp);

        console.log(weeklyData);
        outputForecast(weeklyData);
    });
}

function getSkyConditions(weatherData) {
    var weatherCode = String(weatherData.weather[0].id);
    var weatherCodePrefix = "";
    var skyConditions = null;

    if (weatherCode.length > 0) {
        weatherCodePrefix = weatherCode.substr(0, 1);
    }

    switch (weatherCodePrefix) {
        case "2" : // Code is in 2XX range
            skyConditions = {description: "Thunderstorm", icon: "11d.png"};
            break;
        case "3" : // Code is in 3XX range
            skyConditions = {description: "Drizzle", icon: "09d.png"};
            break;
        case "5" : // Code is in 5XX range
            skyConditions = {description: "Rain", icon: "10d.png"};
            break;
        case "6" : // Code is in 6XX range
            skyConditions = {description: "Snow", icon: "13d.png"};
            break;
        case "7" : // Code is in 7XX range
            // Atmosphere
            break;
        case "8" : // Code is in 8XX range
            skyConditions = {description: "Cloudy", icon: "03d.png"};
            break;
        case "9" : // Code is in 9XX range
            // Other / Extreme
            break;
        default :
            skyConditions = null;
            break;
    }

    return skyConditions;
}

function getCurrentTemperatureRequest(position) {
    var requestUrl = "http://api.openweathermap.org/data/2.5/weather?lat=" + position.coords.latitude + "&lon=" + position.coords.longitude + "&units=metric&APPID=" + API_KEY;

    // Retrieve a promise that will contain data about the current weather
    return $.ajax({
        type: "GET",
        url: requestUrl,
        cache: false,
        crossDomain: true
    });
}

function outputForecast(weeklyData) {
    var forecastList = $("#forecastList");

    var currentTemp = $("#currentTemp");
    var currentCondition = $("#currentCondition");

    currentTemp.append("<div>" + weeklyData[0].currentTemp + "&deg; </div>");
    currentCondition.append("<div>" + weeklyData[0].conditionText + "</div>");

    for (var i = 1; i < weeklyData.length; i++) {
        forecastList.append("<li><div>" + weeklyData[i].weekday +
                            "</div><div>" + "<img src=\"" + weeklyData[i].conditionIcon + "\">" +
                            "</div><div>" + weeklyData[i].maxTemperature + "&deg;" +
                                " / " + weeklyData[i].minTemperature + "&deg; </div></li>");
    }

    $("#forecastListContainer").append(forecastList);
}