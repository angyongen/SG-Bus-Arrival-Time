
var buses = [];
for (var bus of Object.keys(busDirections)) {
	buses.push(bus);
}

var bus;
var i = 0;
var d = -1;
var directionObjArray;
function requestNext() {
	if (d >= 0) {
	} else {
		bus = buses[i++]
		directionObjArray = busDirections[bus]
		d = directionObjArray.length - 1
	}
	
	var direction = busDirections[bus][d].direction
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			busDirections[bus][d].route = JSON.parse(this.responseText);
			d--;
			setTimeout(requestNext, 400)
		}
	};
	xhttp.open("GET", "./busarrivaltime/jcr:content/par/bus_arrival_time.getRoutes?busServiceId="+bus+"&direction="+direction, true);
	xhttp.send()
}

requestNext();