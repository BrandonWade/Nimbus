/**
 * Logic to retrieve and display weather forecast information based on the user's location.
 */
function getUserCoordinates() {
    var container = $("#container");

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(processCoordinates);
    } else {
        container.append("Your browser does not support geolocation. We were unable to retrieve your position.");
    }
}

function processCoordinates(position) {
    var container = $("#container");
    var requestUrl = "http://api.openweathermap.org/data/2.5/forecast/daily?lat=" + position.coords.latitude + "&lon=" + position.coords.longitude + "&units=metric&cnt=7&APPID=ff86e164b9a0a0af7127d1329a7b149b";

    container.append(requestUrl);

    // Retrieve the weather data
    $.ajax({
        type: "GET",
        url: requestUrl,
        cache: false,
        crossDomain: true,
        success: function(data) {
            console.log(data);
            processWeatherData(data);
        },
        failure: function(XMLHttpRequest, textStatus, errorThrown) {
            container.append("Request for weather data failed.");
        }
    });
}

function processWeatherData(weatherDataObject) {
    var WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var weatherDataArray = weatherDataObject.list;
    var weeklyData = [];
    var date = null;
    var weekday = "";
    var conditionText = "";
    var conditionIcon = "";

    console.log(weatherDataArray);

    for (var i = 0; i < weatherDataArray.length; i++) {
        var rawDailyData = weatherDataArray[i];
        var skyConditions = getSkyConditions(weatherDataArray[i]);
        date = new Date(rawDailyData.dt * 1000);
        weekday = WEEKDAY_NAMES[date.getDay()];
        conditionText = skyConditions.description;
        conditionIcon = "http://openweathermap.org/img/w/" + skyConditions.icon;
        maxTemperature = rawDailyData.temp.max;
        minTemperature = rawDailyData.temp.min;

        var formattedDailyData = {weekday: weekday, conditionText: conditionText, conditionIcon: conditionIcon, maxTemperature: maxTemperature, minTemperature: minTemperature};
        weeklyData.push(formattedDailyData);
    }

    console.log(weeklyData);
    outputForecast(weeklyData);
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
            skyConditions = {description: "Clouds", icon: "03d.png"};
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

function outputForecast(weeklyData) {
    var forecastList = $("#forecastList");

    for (var i = 0; i < weeklyData.length; i++) {
        forecastList.append("<li><div>" + weeklyData[i].weekday +
                            "</div><div>" + weeklyData[i].conditionText +
                            "</div><div>" + weeklyData[i].maxTemperature +
                            "</div><div>" + weeklyData[i].minTemperature +
                            "</div><div>" + "<img src=\"" + weeklyData[i].conditionIcon + "\">" + "</div></li>");
    }

    $("#forecastListContainer").append(forecastList);
}