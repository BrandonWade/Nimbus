/**
 * Created by Brandon W on 2015-09-16.
 */
function getUserCoordinates() {
    var container = $("#container");
    var result;

    if (navigator.geolocation) {
        function processCoordinates(position) {
            container.append("Your position is " + position.coords.latitude + ", " + position.coords.longitude);
        }
        navigator.geolocation.getCurrentPosition(processCoordinates);
    } else {
        container.append("Your browser does not support geolocation. We were unable to retrieve your position.");
    }
}