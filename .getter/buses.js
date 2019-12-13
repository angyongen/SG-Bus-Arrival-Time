var buses = []
var xhttp = new XMLHttpRequest();
xhttp.open("GET", "../../ptp_drawer_container/jcr:content/bus_arrival_time.getBuses?", true);
xhttp.onreadystatechange = function() {
	if (this.readyState == 4 && this.status == 200) {
		buses = JSON.parse(this.responseText);
	}
}
xhttp.send()