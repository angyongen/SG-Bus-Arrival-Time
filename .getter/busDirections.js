var busDirections = {};
var i = 0;
for (var b = 0; b < buses.length; b++) {
	var bus = buses[b]
	setTimeout(function(){
		var xhttp = new XMLHttpRequest();
		var bus = this.bus;
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				busDirections[bus] = JSON.parse(this.responseText);
			}
		};
		xhttp.open("GET", "./busarrivaltime/jcr:content/par/bus_arrival_time.getDirections?busServiceId="+bus, true);
		xhttp.send()
	}.bind({bus:bus}), 200 * i++);
}