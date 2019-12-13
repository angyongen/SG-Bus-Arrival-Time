var etaUrl = '//s3-ap-southeast-1.amazonaws.com/lta-eta-web-2/bus_arrival.baf3.js';
var ntpUrl = '//s3-ap-southeast-1.amazonaws.com/lta-ntp-web/utctime.txt';
var etaCallback = function() {};
var ntpCallback = function() {};
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

function busArrivalTimeDecode(arrivalText) {
    var serviceArr = arrivalText.split(':');
    var serviceId = serviceArr[0];
    var timeText = serviceArr[1];
    var endStop = serviceArr[2];
    
    var times = [];
    var unitLength = 10;
    for (var i = 0; i < timeText.length / unitLength; i++) {
    	var year = busArrivalTimeCharMap[timeText.charAt(i * unitLength)];
    	var month = busArrivalTimeCharMap[timeText.charAt(i * unitLength + 1)];
    	var date = busArrivalTimeCharMap[timeText.charAt(i * unitLength + 2)];
    	var hour = busArrivalTimeCharMap[timeText.charAt(i * unitLength + 3)];
        var minute = busArrivalTimeCharMap[timeText.charAt(i * unitLength + 4)];
        var second = busArrivalTimeCharMap[timeText.charAt(i * unitLength + 5)];
        var wheelchair = timeText.charAt(i * unitLength + 6);
        var occupancyLevel = timeText.charAt(i * unitLength + 7);
        var busType = timeText.charAt(i * unitLength + 8);

        times[i] = {};
        times[i].arrivalTime = year == '-' || month == '-' || date == '-' || hour == '-' || minute == '-' || second == '-' ? '-' : '20' + year + '-' + month + '-' + date + ' ' + hour + ':' + minute + ':' + second;
        times[i].wheelchair = wheelchair;
        times[i].occupancyLevel = occupancyLevel;
        times[i].busType = busType;
    }
    return {
        serviceId: serviceId,
        endStop: endStop,
        times: times
    };
}

function parseBusArrivalTime(arrivalString) {
    var busArrivalTimes = {};
    
    if (arrivalString != '') {
	    var busStopArr = arrivalString.split('$');
	    for (var i = 0; i < busStopArr.length; i++) {
	    	var busStopText = busStopArr[i];
	        var busStopId = busStopText.substring(0, 5);
	        var busArrivalArr = busStopText.substring(6).split(';');
	        busArrivalTimes[busStopId] = {};
	        for (var j = 0; j < busArrivalArr.length; j++) {
                var arrivalTime = busArrivalTimeDecode(busArrivalArr[j]);
	        	if (!busArrivalTimes[busStopId][arrivalTime.serviceId]) {
                    busArrivalTimes[busStopId][arrivalTime.serviceId] = [];
                }
	            busArrivalTimes[busStopId][arrivalTime.serviceId].push(arrivalTime);
	        }
	    }
    }

    return busArrivalTimes;
}

function calculateArrivalMinites(arrivalTime, currentTime) {
	return parseInt(moment(arrivalTime).diff(moment(currentTime)) / 1000 / 60);
}

function uniqueArray(arr) {
    return arr.filter(function (e, i, a) {
        return i === a.indexOf(e);
    });
}

function parseIntNatural(a) {
    var b = parseInt(a);
    return isNaN(b) ? 0 : b;
}

function naturalSortArray(arr) {
    arr.sort(function (a, b) {
        var c = parseIntNatural(a) - parseIntNatural(b);
        return c === 0 ? a > b : c;
    });
}
