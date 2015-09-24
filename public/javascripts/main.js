/**
 * Created by Brandon W on 2015-09-16.
 */
function getUserCoordinates() {
    var container = $("#container");
    var result;

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
            container.append(data);
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
    var temperature = 0;

    for (var i = 0; i < weatherDataArray.length; i++) {
        newDate = new Date(weatherDataArray[i].dt * 1000);

        if (compareDates(date, newDate)) {
            temperatureArray.push(Math.round(weatherDataArray[i].main.temp_max));
        } else {
            temperatureArray.sort();

            weekday = WEEKDAY_NAMES[date.getDay()];
            temperature = Math.max(...temperatureArray);
            //console.log(weekday + " " + temperature);
            weeklyData.push([weekday, temperature]);

            temperatureArray = [];
            date = newDate;
        }
    }

    if (temperatureArray != []) {
        temperatureArray.sort();

        weekday = WEEKDAY_NAMES[date.getDay()];
        temperature = Math.max(...temperatureArray);
        weeklyData.push([weekday, temperature]);
        //console.log(weekday + " " + temperature);
    }

    console.log(weeklyData);
}

function compareDates(firstDate, secondDate) {
    return(firstDate.getFullYear() == secondDate.getFullYear()) &&
          (firstDate.getMonth() == secondDate.getMonth()) &&
          (firstDate.getDate() == secondDate.getDate());
}

function roundToNearestMultiple(value, multiple) {
    return multiple * (Math.round(value / multiple));
}