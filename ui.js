
//console.log(busStops)
var busStops_sorted = busStops.slice(0);
busStops_sorted.sort(function(a,b){
	if (a.id < b.id) {return -1}
	if (a.id > b.id) {return 1}
	return 0
})
var busStopIds = []
for (var busStop in busStops_sorted) {
	//var option = document.createElement("option")
	var busStopId = busStops_sorted[busStop].id
	//option.value = busStopId;
	//option.textContent = busStopId;
	//inputCodeSelect.add(option)
	busStopIds.push(busStopId);
}
autocomplete(inputCodeSelect, create_autocomplete_function(busStopIds))

var updater;

var eta, updateMoment, busArrivals;
var ntp, requestMoment, momentOffset;
var d = document.createElement("div");
document.body.appendChild(d);
var t = document.createElement("table");
document.body.appendChild(t)

function formatMoment(moment) {
	return new Date(moment).toString()
}
function updateUpdateInfo() {
	var currentMoment = (new Date).getTime() + momentOffset
	var updatedDifference = (currentMoment - updateMoment)
	var str = ""
	str += '[Server Updated at] ' + formatMoment(updateMoment)
	str += " ("
	str += Math.round(updatedDifference / 1000)
	str += " seconds ago)\n\n<br><br>"
	str += '[Client Updated at] ' + formatMoment(requestMoment)
	str += " ("
	str += Math.round((requestMoment - updateMoment) / 1000)
	str += " seconds after server)\n\n<br><br>"
	str += '[Synchronized Time] ' + formatMoment(currentMoment)
	str += ' (offset ' + momentOffset + ')'
	updateInfo.innerHTML = str;
	if (updatedDifference>60000) {
		//request(display(inputCodeSelect.value))
	}
}
var dateFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric', minute: 'numeric', second: 'numeric', })
function createBusTimingElement(timing) {
	var e1 = document.createElement("pre");
	if (!timing.arrivalTime || timing.wheelchair == '-' || timing.occupancyLevel == '-' || timing.busType == '-') {
	} else {
		var currentMoment = (new Date).getTime() + momentOffset
		var secondsLeft = Math.round((timing.arrivalTime - currentMoment)/1000)
		var minutesLeft = secondsLeft / 60;
		if (minutesLeft > 0) {
			minutesLeft = Math.floor(minutesLeft)
		} else {
			minutesLeft = Math.ceil(minutesLeft)
		}
		secondsLeft -= minutesLeft * 60;
		var text = "";
		text += "ETA=" + dateFormatter.format(new Date(timing.arrivalTime))
		text += "\n"
		text += "about " + minutesLeft + "m" + secondsLeft + "s left"
		text += "\n"
		text += "busType=" + timing.busType
		text += "\n"
		text += "occupancyLevel=" + timing.occupancyLevel
		text += "\n"
		text += "wheelchair=" + timing.wheelchair
		e1.textContent = text;
	}
	return e1;
}
	function display(busStopId) {
	var f = function() {
		updateUpdateInfo();

		var str = "";
		str += "Bus stop code: "
		str += busStopId
		//d.textContent = str

		t.innerHTML = ""
		var head = t.createTHead()
		var hrow = head.insertRow(0);    
		hrow.insertCell().textContent = "serviceId";
		hrow.insertCell().textContent = "endStop";
		hrow.insertCell().textContent = "1";
		hrow.insertCell().textContent = "2";
		hrow.insertCell().textContent = "3";
		hrow.insertCell().textContent = "4";
		var busStop = busArrivals[parseInt(busStopId)]
		for (var busKey in busStop) {
			var row = t.insertRow();
			var bus = busStop[busKey]
			row.insertCell().textContent = bus.serviceId;
			row.insertCell().textContent = bus.endStop;
			row.insertCell().appendChild(createBusTimingElement(bus.times[0]))
			row.insertCell().appendChild(createBusTimingElement(bus.times[1]))
			row.insertCell().appendChild(createBusTimingElement(bus.times[2]))
			row.insertCell().appendChild(createBusTimingElement(bus.times[3]))
		}
		if (busArrivals) {
			if (updater) {clearInterval(updater)}
			updater = setInterval(f, 1000);
		}
	}

	return f;
}
function request(callback) {
	getEta(function(NewEta) {
		eta = NewEta; 
		busArrivals = parseBusStops(eta[1])
		updateMoment = parseEtaMoment(eta[0])
		getNtp(function(NewNtp) {
			ntp = NewNtp;
			requestMoment = parseNtpMoment(ntp)
			momentOffset = (new Date).getTime() - requestMoment
			callback()
		})
	})
}