/**
 * Created by Brandon W on 2015-09-16.
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
    var requestUrl = "http://api.openweathermap.org/data/2.5/forecast?lat=" + position.coords.latitude + "&lon=" + position.coords.longitude + "&units=metric";

    container.append(requestUrl);
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
            container.append("FAILED");
        }
    });
}

function processWeatherData(weatherDataObject) {
    var WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var weatherDataArray = weatherDataObject.list;
    var temperatureArray = [];
    var weeklyData = [];
    var date = new Date(weatherDataArray[0].dt * 1000);
    var newDate = null;
    var weekday = "";
    var conditionText = "";
    var conditionIcon = "";
    var maxTemperature = 0;
    var minTemperature = 0;

    for (var i = 0; i < weatherDataArray.length; i++) {
        newDate = new Date(weatherDataArray[i].dt * 1000);

        if (compareDates(date, newDate)) {
            temperatureArray.push(Math.round(weatherDataArray[i].main.temp_max));
        } else {
            var skyConditions = getSkyConditions(weatherDataArray[i]);
            weekday = WEEKDAY_NAMES[date.getDay()];
            conditionText = skyConditions.description;
            conditionIcon = "http://openweathermap.org/img/w/" + skyConditions.icon;
            maxTemperature = Math.max(...temperatureArray);
            minTemperature = Math.min(...temperatureArray);

            var dailyData = {weekday: weekday, conditionText: conditionText, conditionIcon: conditionIcon, maxTemperature: maxTemperature, minTemperature: minTemperature};
            weeklyData.push(dailyData);

            temperatureArray = [];
            date = newDate;
        }
    }

    console.log(weeklyData);
    outputForecast(weeklyData);
}

function compareDates(firstDate, secondDate) {
    return(firstDate.getFullYear() == secondDate.getFullYear()) &&
          (firstDate.getMonth() == secondDate.getMonth()) &&
          (firstDate.getDate() == secondDate.getDate());
}

function roundToNearestMultiple(value, multiple) {
    return multiple * (Math.round(value / multiple));
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