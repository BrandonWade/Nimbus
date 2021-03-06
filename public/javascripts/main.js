/**
 * Logic to retrieve and display weather forecast information based on the user's location.
 */
function getUserCoordinates() {
    if ((localStorage.getItem("latitude") === null) || (localStorage.getItem("longitude") === null)) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var latitude = position.coords.latitude;
                var longitude = position.coords.longitude;

                localStorage.setItem("latitude", latitude);
                localStorage.setItem("longitude", longitude);
                makeDataRequest(latitude, longitude);
            });
        } else {
            var container = $("#container");
            container.append("Your browser does not support geolocation. We were unable to retrieve your position.");
        }
    } else {
        var latitude = localStorage.getItem("latitude");
        var longitude = localStorage.getItem("longitude");

        makeDataRequest(latitude, longitude);
    }
}

function makeDataRequest(latitude, longitude) {
    $.ajax({
        type: 'GET',
        url: 'http://localhost:3000/weather',
        data: { latitude: latitude, longitude: longitude },
        success: function(weeklyData) {
            outputForecast(weeklyData);
        },
        failure: function() {
            console.log('Error contacting server for weather data.');
        }
    });
}

function outputForecast(weeklyData) {
    var forecastList = $("#forecastList");

    var currentTemp = $("#currentTemp");
    var currentCondition = $("#currentCondition");

    $(document.body).css({
        'background' : buildGradientString(weeklyData[0].background),
        'background-repeat' : 'no-repeat',
        'background-attachment' : 'fixed'
    });

    var currentTempDataDiv = document.createElement("div");
    currentTempDataDiv.innerHTML = weeklyData[0].currentTemp + "&deg;";
    currentTemp.append(currentTempDataDiv);

    var currentConditionDataDiv = document.createElement("div");
    currentConditionDataDiv.innerHTML = weeklyData[0].conditionText;
    currentCondition.append(currentConditionDataDiv);

    for (var i = 1; i < weeklyData.length; i++) {
        var weekdayDiv = document.createElement("div");
        var weekdayDivText = document.createTextNode(weeklyData[i].weekday);
        weekdayDiv.setAttribute("class", "weekdayName");
        weekdayDiv.appendChild(weekdayDivText);

        var conditionIconDiv = document.createElement("div");
        var conditionIconImg = document.createElement("img");
        conditionIconImg.setAttribute("src", weeklyData[i].conditionIcon);
        conditionIconImg.setAttribute("title", weeklyData[i].conditionText);
        conditionIconDiv.appendChild(conditionIconImg);

        var maxTemperatureDiv = document.createElement("div");
        maxTemperatureDiv.setAttribute("class", "weekdayTemp");
        maxTemperatureDiv.setAttribute("title", "High of " + weeklyData[i].maxTemperature + "°");
        maxTemperatureDiv.innerHTML = weeklyData[i].maxTemperature + "&deg;";

        var minTemperatureDiv = document.createElement("div");
        minTemperatureDiv.setAttribute("class", "weekdayTemp");
        minTemperatureDiv.setAttribute("title", "Low of " + weeklyData[i].minTemperature + "°");
        minTemperatureDiv.innerHTML = weeklyData[i].minTemperature + "&deg;";

        var listItem = document.createElement("li");
        listItem.appendChild(weekdayDiv);
        listItem.appendChild(conditionIconDiv);
        listItem.appendChild(maxTemperatureDiv);
        listItem.appendChild(minTemperatureDiv);

        forecastList.append(listItem);
    }

    $("#forecastListContainer").append(forecastList);
    $("#weatherContainer").fadeIn(300);
}

function buildGradientString(hexValues) {
    var gradientString = "";

    for (var i = 0; i < hexValues.length; i++) {
        gradientString += hexValues[i][0] + ' ' + hexValues[i][1];

        if (i < hexValues.length - 1) {
            gradientString += ', ';
        }
    }

    return 'linear-gradient(to bottom, ' + gradientString + ')';
}

function resetLocation() {
    localStorage.removeItem("latitude");
    localStorage.removeItem("longitude");
}

$(window).on("load", function() {
    $("#configButton").on("click", function() {
        $("#configMenu").toggle();
    });
});