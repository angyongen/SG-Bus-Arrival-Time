
var etaUrl = '//s3-ap-southeast-1.amazonaws.com/lta-eta-web-2/bus_arrival.baf3.js';
var ntpUrl = '//s3-ap-southeast-1.amazonaws.com/lta-ntp-web/utctime.txt';

//var etaCallback = function() {};
//var ntpCallback = function() {};
var etaCallback, ntpCallback;
var c = document.createElement("div");
document.head.appendChild(c);
function getEta(callback) {
	var s = document.createElement("script");
	etaCallback = function(r) {
		callback(r);
		c.innerHTML = "";
	}
	s.src = "https:" + etaUrl;
	c.appendChild(s);
}
function getNtp(callback) {
	var s = document.createElement("script");
	ntpCallback = function(r) {
		callback(r);
		c.innerHTML = "";
	}
	s.src = "https:" + ntpUrl;
	c.appendChild(s);
}
var busArrivalTimeCharMap = {
'0': '00',
'1': '01',
'2': '02',
'3': '03',
'4': '04',
'5': '05',
'6': '06',
'7': '07',
'8': '08',
'9': '09',
'A': '10',
'B': '11',
'C': '12',
'D': '13',
'E': '14',
'F': '15',
'G': '16',
'H': '17',
'I': '18',
'J': '19',
'K': '20',
'L': '21',
'M': '22',
'N': '23',
'O': '24',
'P': '25',
'Q': '26',
'R': '27',
'S': '28',
'T': '29',
'U': '30',
'V': '31',
'W': '32',
'X': '33',
'Y': '34',
'Z': '35',
'a': '36',
'b': '37',
'c': '38',
'd': '39',
'e': '40',
'f': '41',
'g': '42',
'h': '43',
'i': '44',
'j': '45',
'k': '46',
'l': '47',
'm': '48',
'n': '49',
'o': '50',
'p': '51',
'q': '52',
'r': '53',
's': '54',
't': '55',
'u': '56',
'v': '57',
'w': '58',
'x': '59',
'-': '-'
}

function parseEtaMoment(momentString) {
	//YYYYMMDDHHmmss
	var Y = momentString.substr(0, 4);
	var M = momentString.substr(4, 2);
	var D = momentString.substr(6, 2);
	var H = momentString.substr(8, 2);
	var m = momentString.substr(10, 2);
	var s = momentString.substr(12, 2);
	return Date.UTC(Y, M - 1, D, H - 8, m, s)
}

function parseNtpMoment(momentString) {
	//YYYY-MM-DD HH:mm:ss
	var Y = momentString.substr(0, 4);
	var M = momentString.substr(5, 2);
	var D = momentString.substr(8, 2);
	var H = momentString.substr(11, 2);
	var m = momentString.substr(14, 2);
	var s = momentString.substr(17, 2);
	return Date.UTC(Y, M - 1, D, H, m, s)
}

function busArrivalTimeDecode(arrivalText) {
	var serviceArr = arrivalText.split(':');
	var serviceId = serviceArr[0];
	var timeText = serviceArr[1];
	var endStop = serviceArr[2];

	var times = [];
	var i = 0;
	for (var entry = 0; entry < timeText.length / 10; entry++) {
		var year = busArrivalTimeCharMap[timeText[i++]];
		var month = busArrivalTimeCharMap[timeText[i++]];
		var date = busArrivalTimeCharMap[timeText[i++]];
		var hour = busArrivalTimeCharMap[timeText[i++]];
		var minute = busArrivalTimeCharMap[timeText[i++]];
		var second = busArrivalTimeCharMap[timeText[i++]];
		var wheelchair = timeText[i++];
		var occupancyLevel = timeText[i++];
		var busType = timeText[i++];
		var u1 = timeText[i++];
		var u2 = timeText[i++];
		times.push({
			arrivalTime: year == '-' || month == '-' || date == '-' || hour == '-' || minute == '-' || second == '-' ? '-' : '20' + year + '-' + month + '-' + date + ' ' + hour + ':' + minute + ':' + second,
			wheelchair: wheelchair,
			occupancyLevel: occupancyLevel,
			busType: busType,
		});
	}
	return {
		serviceId: serviceId,
		endStop: endStop,
		times: times
	};
}
function parseBusStops(str) {
	var busStops = {};
	var busStopServices = [];
	var busStopId = "";
	var busStopData = {};

	var serviceId = "";
	var serviceEndBusStop = "";
	var serviceTimings = [];
	var state = 0;
	var l = str.length
	for (var i = 0; i < l; ++i) {
		var char = str[i]
		switch (char) {
			case '$':
			if (state == 4) {
				state = 5;
				busStopServices.push({
					serviceId: serviceId,
					endStop: serviceEndBusStop,
					times: serviceTimings
				});
			}
			if (state != 5) {throw new Error('unexpected token $');}
			busStops[parseInt(busStopId)] = busStopServices;
			busStopServices = [];
			busStopData = {};
			busStopId = "";
			state = 0;
			break;
			case '|':
			if (state == 1) {
				serviceId = "";
				state = 2;
			} else {throw new Error('unexpected token |');}
			break;
			case ':':
			if (state == 2) {
				serviceTimings = [];
				state = 3;
			} else if (state == 3) {
				serviceEndBusStop = "";
				state = 4;
			} else {throw new Error('unexpected token :');}
			break;
			case ';':
			if (state == 4) {
				busStopServices.push({
					serviceId: serviceId,
					endStop: serviceEndBusStop,
					times: serviceTimings
				});
				serviceId = "";
				state = 2;
			}
			break;
			default:
			switch (state) {
				case 0:
				busStopId += char;
				if (busStopId.length == 5) state = 1;
				break;
				case 2:
				serviceId += char;
				break;
				case 3:
				var serviceTiming = {}
				var Y=0,M=0,D=0,H=0,m=0,s=0;
				for (var j = 0; j<10; ++j) {
					char = str[i++]
					switch (j) {
						case 0:
						Y = "20" + busArrivalTimeCharMap[char]
						break;
						case 1:
						M = busArrivalTimeCharMap[char]
						break;
						case 2:
						D = busArrivalTimeCharMap[char]
						break;
						case 3:
						H = busArrivalTimeCharMap[char]
						break;
						case 4:
						m = busArrivalTimeCharMap[char]
						break;
						case 5:
						s = busArrivalTimeCharMap[char]
						serviceTiming.arrivalTime = Date.UTC(Y, M-1, D, H, m, s)
						break;
						case 6:
						serviceTiming.wheelchair = char;
						break;
						case 7:
						serviceTiming.occupancyLevel = char;
						break;
						case 8:
						serviceTiming.busType = char;
						break;
						case 9:
						//serviceTiming.u1 = char;
						break;
						case 10:
						//serviceTiming.u2 = char;
						break;
					}
				}
				serviceTimings.push(serviceTiming)
				--i;
				break;
				case 4:
				serviceEndBusStop += char;
				break;
			}
		}
	}
	if (state == 4) {
		busStopServices.push({
			serviceId: serviceId,
			endStop: serviceEndBusStop,
			times: serviceTimings
		});
		serviceId = "";
		state = 2;
	}
	if (state != 2 || serviceId != "") {throw new Error('unexpected end of string');}
	busStops[busStopId] = busStopServices;
	busStopServices = [];
	busStopData = {};
	busStopId = "";
	state = 0;
	return busStops;
}

//bus stop [service1{id,end,times},service2{id,end,times}]
//format
//0..........12....3...................4.........5
//busstopid[5]|{bus:arrivalTimes[n][10]:endstopid;}[n]$

/*

//bus stop [service1{id,end,times},service2{id,end,times}]
//format
//busstopid[5]|{bus:arrivalTimes[n][10]:endstopid;}[n]$

function parseBusStops(arrivalString) {
	var busStops = {};

	var busStopServices = [];
	var busStopId = "";

	var l = arrivalString.length
	var i = 0
	var char;
	while (i < l) {
		char = arrivalString[i]
		if (char == '$') {
			busStops[parseInt(busStopId)] = busStopServices;
			busStopServices = [];
			busStopId = "";
		} else {
			while (i < l) {
				char = arrivalString[i];
				
				++i;
			}
		}
		++i;
	}
}
*/
/*
function parseBusStops_1(str) {
	if (str != '') {
		var result = {}
		var busStops = str.split('$');
		for (var i = 0; i < busStops.length; i++) {
			var busStop = busStops[i];
			var busStopId = busStop.substring(0, 5);
			var busServiceTimings = busStop.substring(6).split(';');
			result[busStopId] = {};
			for (var j = 0; j < busServiceTimings.length; j++) {
				var busServiceTiming = busArrivalTimeDecode(busServiceTimings[j]);
				result[busStopId][busServiceTiming.serviceId] = busServiceTiming;
			}
		}
		return result;
	} else {
		return {};
	}
}
*/