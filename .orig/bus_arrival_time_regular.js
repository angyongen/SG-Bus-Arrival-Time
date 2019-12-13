(function ($) {
    $(function () {
        var resourcePath = $('.bus-arrival-time-container .bus_arrival_time_path').val()
        var $container = $('.bus-arrival-time-container');
        var AUTO_REFRESH_INTERVAL = 20 * 1000;

        // load cookie
        var BUS_ARRIVAL_FAV = {};
        var busCookie = $.cookie('bus_arrival_time');
        if (busCookie != null) {
            $(busCookie.split(',')).each(function () {
                var arr = this.split('_');
                var busStopId = arr[0];
                BUS_ARRIVAL_FAV[busStopId] = arr.slice(1);
            });
            $container.find('#concierge_ctrl_reset').show();
        }

        function isFavorite(busStopId, busService_id) {
            return BUS_ARRIVAL_FAV[busStopId] && BUS_ARRIVAL_FAV[busStopId].indexOf(busService_id) != -1;
        }

        function refreshDropdownValue(el) {
            var $el = $(el);
            var text = $el.find('option:selected').text();
            $el.prev('.drop-down').children('p').text(text);
        }

        function refreshBusArrivalTimeDropdown() {
            $container.find('select').each(function () {
                if ($(this).prev('.drop-down').length == 0) {
                    $(this).before('<div class="drop-down"><p></p></div>');
                    $(this).change(function () {
                        refreshDropdownValue(this);
                    });
                }
                refreshDropdownValue(this);
            });
        }

        function resetDirection() {
            var direction = '<option value="default">Select Direction</option>';
            $container.find('.direction').html(direction).parent().parent().hide();
            resetBusStop();
        }

        function resetBusStop() {
            var busStopId = '<option value="default">Select Bus Stop</option>';
            $container.find('.bus-stop').html(busStopId).parent().parent().hide();
            refreshBusArrivalTimeDropdown();
        }

        function isNotDefaultOption(val) {
            return val != 'default';
        }

        function toggleBusStop(busStopId) {
            var $busStopTrigger = $container.find('.svc_result .trigger[bus-stop-id=' + busStopId + ']');
            $busStopTrigger.toggleClass("active").next('.toggle_container').slideToggle();

            if ($container.find('.svc_result .trigger.active').length == 0) {
                $container.find('.svc_result .toggle').removeClass("active");
            } else if ($container.find('.svc_result .trigger.active').length == $container
                .find('.svc_result .trigger').length) {
                $container.find('.svc_result .toggle').addClass("active");
            }
        }

        function closeAllBusStops() {
            $container.find('.svc_result .trigger.active').each(function () {
                toggleBusStop($(this).attr('bus-stop-id'));
            });
        }

        function toggleAllBusStops() {
            var isToggleActive = $(this).hasClass('active');
            $container.find('.svc_result .trigger').each(function () {
                if ($(this).hasClass('active') == isToggleActive) {
                    toggleBusStop($(this).attr('bus-stop-id'));
                }
            });
        }

        function displayBusStop(busStop, etaData, ntpData) {
            var lastUpdated = moment(etaData[0], 'YYYYMMDDHHmmss').format('[Updated as of] D MMM YYYY HH:mm [hrs]');
            $container.find('.last-updated').text(lastUpdated);

            if (busStop.busStopId != null && busStop.buses.length > 0) {
                $container.find('.svc_result').show();

                var $busStopContainer = $container.find('.svc_result .toggle_container[bus-stop-id=' + busStop.busStopId + ']');

                // create new bus stop
                if ($busStopContainer.length == 0) {
                    var busStopTrigger = '<div class="trigger" bus-stop-id="'
                        + busStop.busStopId
                        + '" longitude="'
                        + busStop.longitude
                        + '" latitude="'
                        + busStop.latitude
                        + '"><div class="data_label_box">'
                        + busStop.busStopId
                        + ' - '
                        + busStop.busStopDescription
                        + '</div><button class="res_view_map"></button></div>';
                    var $busStopTrigger = $(busStopTrigger).appendTo($container.find('.svc_result .bus-stops'));

                    $busStopTrigger.click(function () {
                        toggleBusStop(busStop.busStopId);
                    });
                    $busStopTrigger.find('.res_view_map').click(function (event) {
                        var lon = $busStopTrigger.attr('longitude');
                        var lat = $busStopTrigger.attr('latitude');
                        if (lon != null && lat != null) {
                            window.open(
                                '/content/mytransport/staticmap.html?overlay=&lon=' + lon + '&lat=' + lat,
                                'map_window',
                                'width=800,height=600,resizable=0,toolbar=0,scrollbars=0,menubar=0,status=0,directories=0'
                            ).focus();
                        } else {
                            alert("Bus Stop location not found");
                        }
                        event.stopPropagation();
                    });

                    var busStopContainer = '<div class="toggle_container hidden" bus-stop-id="'
                        + busStop.busStopId
                        + '"><div class="scv_result_header scv_result_detail"><ul><li class="bus_arrival_result_ch">Select</li><li class="bus_arrival_result_bn">Bus No.</li><li class="bus_arrival_result_ar"><div class="arrival-time">Arriving</div><div class="ol-wc"></div></li><li class="bus_arrival_result_nb"><div class="arrival-time">Next Bus</div><div class="ol-wc"></div></li></ul></div><div class="buses"></div></div>';
                    $busStopContainer = $(busStopContainer).appendTo($container.find('.svc_result .bus-stops'));
                }

                var busArrivalTimes = parseBusArrivalTime(etaData[1]);

                var $busServiceContainer = $busStopContainer.find('.buses');
                // empty buses
                $busServiceContainer.empty();

                // merge master data with BAF
                for (var i in busArrivalTimes[busStop.busStopId]) {
                    if (busStop.buses.indexOf(i) == -1) {
                        busStop.buses.push(i);
                    }
                }

                naturalSortArray(busStop.buses);

                // update bus stop
                $(busStop.buses).each(function (index, busServiceId) {
                    var at, ol, wc, bt;
                    function constructBusService(busServiceId, endStop, at, ol, wc, bt) {
                        return '<div class="scv_result_detail busReq" bus-service-id="'
                                + busServiceId
                                + '" end-stop="'
                                + endStop
                                + '"><div><div class="bus_arrival_result_ch"><input type="checkbox" class="busCookieBox"></div><div class="bus_arrival_result_bn">'
                                + busServiceId
                                + '<br><span class="end-stop"></span></div><div class="bus_arrival_result_ar">'
                                + '<div class="arrival-time">' + at[0] + '</div>'
                                + '<div class="occupancy-level occupancy-level-' + ol[0] + '"></div>'
                                + '<div class="wheelchair wheelchair-' + wc[0] + '"></div>'
                                + '<div class="bus-type bus-type-' + bt[0] + '"></div>'
                                + '</div><div class="bus_arrival_result_nb">'
                                + '<div class="arrival-time">' + at[1] + '</div>'
                                + '<div class="occupancy-level occupancy-level-' + ol[1] + '"></div>'
                                + '<div class="wheelchair wheelchair-' + wc[1] + '"></div>'
                                + '<div class="bus-type bus-type-' + bt[1] + '"></div>'
                                + '</div></div>';
                    }

                    if (busArrivalTimes[busStop.busStopId] != null && busArrivalTimes[busStop.busStopId][busServiceId] != null) {
                        $(busArrivalTimes[busStop.busStopId][busServiceId]).each(function (index, busArrivalService) {
                            at = ['N.A.', 'N.A.'];
                            ol = ['', ''];
                            wc = ['', ''];
                            bt = ['', ''];
                            var selectedArrivals = [];
                            for (var i = 0; i < busArrivalService.times.length && selectedArrivals.length < 2; i++) {
                                if (busArrivalService.times[i].arrivalTime != '-') {
                                    busArrivalService.times[i].arrivalTime = calculateArrivalMinites(busArrivalService.times[i].arrivalTime, ntpData);
                                    if (busArrivalService.times[i].arrivalTime >= 0) {
                                        selectedArrivals.push(busArrivalService.times[i]);
                                    }
                                }
                            }

                            if (selectedArrivals.length > 0) {
                                at[0] = selectedArrivals[0].arrivalTime == '0' ? 'Arr' : selectedArrivals[0].arrivalTime + ' min';
                                ol[0] = selectedArrivals[0].occupancyLevel;
                                wc[0] = selectedArrivals[0].wheelchair;
                                bt[0] = selectedArrivals[0].busType;
                                if (selectedArrivals.length > 1) {
                                    at[1] = selectedArrivals[1].arrivalTime == '0' ? 'Arr' : selectedArrivals[1].arrivalTime + ' min';
                                    ol[1] = selectedArrivals[1].occupancyLevel;
                                    wc[1] = selectedArrivals[1].wheelchair;
                                    bt[1] = selectedArrivals[1].busType;
                                }
                            }

                            var $busService = $(constructBusService(busServiceId, busArrivalService.endStop, at, ol, wc, bt));
                            $busService.appendTo($busServiceContainer);

                            // Multi-Direction handling
                            if (busArrivalTimes[busStop.busStopId][busServiceId].length > 1) {
                                getBusStop(busArrivalService.endStop, function (endStop) {
                                    $busService.find('.end-stop').text('To ' + endStop.busStopDescription);
                                });
                            }

                            // MyConcierge cookie
                            if (isFavorite(busStop.busStopId, busServiceId)) {
                                $busService.find('.busCookieBox').prop('checked', true);
                            }
                        });
                    } else {
                        at = ['N.A.', 'N.A.'];
                        ol = ['', ''];
                        wc = ['', ''];
                        bt = ['', ''];
                        var $busService = $(constructBusService(busServiceId, '', at, ol, wc, bt));
                        $busService.appendTo($busServiceContainer);

                        // MyConcierge cookie
                        if (isFavorite(busStop.busStopId, busServiceId)) {
                            $busService.find('.busCookieBox').prop('checked', true);
                        }
                    }
                });

                closeAllBusStops();
                toggleBusStop(busStop.busStopId);
            } else {
                alert('Please enter a valid bus stop code');
            }
        }

        function getBusStop(busStopId, callback) {
            var url = resourcePath + '.getBusStop?query=' + busStopId;
            $.getJSON(url, callback);
        }

        function getEta(callback) {
            $.ajax({
                url: etaUrl,
                type: 'GET',
                dataType: 'jsonp',
                jsonp: 'callback',
                jsonpCallback: 'etaCallback',
                success: callback
            });
        }

        function getNtp(callback) {
            $.ajax({
                url: ntpUrl,
                type: 'GET',
                dataType: 'jsonp',
                jsonp: 'callback',
                jsonpCallback: 'ntpCallback',
                success: callback
            });
        }

        function getBusArrivalTime(busStopObj) {
            var busStopIds = [];
            if (typeof busStopObj === 'string') {
                busStopIds.push(busStopObj);
            } else {
                for (busStopId in busStopObj) {
                    busStopIds.push(busStopId);
                }
            }

            getEta(function (etaData) {
                getNtp(function (ntpData) {
                    $(busStopIds).each(function () {
                        getBusStop(this, function (busStop) {
                            busStop.buses = uniqueArray(busStop.buses);
                            displayBusStop(busStop, etaData, ntpData);
                        });
                    });               
                });
            });
        }

        $container.find('.search-bus-stop-id').click(function () {
            var busStopId = $container.find('.bus-stop-id').val();
            if (busStopId != "") {
                getBusArrivalTime(busStopId);
            } else {
                alert('Please enter a bus stop code');
            }
        });

        $container.find('.bus-stop-id').keydown(function (e) {
            if (e.keyCode == 13) {
                $container.find('.search-bus-stop-id').click();
            }

            // reset bus service / stop searching
            $container.find('.bus-service').val('default');
            resetDirection();
        });

        $container.find('.bus-stop-id').placeholder();

        $.getJSON(resourcePath + '.getBuses?', function (data) {
            $(data).each(function () {
                var busServiceId = '<option value="' + this + '">' + this + '</option>'
                $container.find('.bus-service').append(busServiceId);
            });
            refreshBusArrivalTimeDropdown();
        });

        $container.find('.bus-service').change(function () {
            resetDirection();
            var busServiceId = $(this).val();
            if (isNotDefaultOption(busServiceId)) {
                $.getJSON(resourcePath + '.getDirections?busServiceId=' + busServiceId, function (data) {
                    $(data).each(function () {
                        var direction = '<option value="' + this.direction + '">' + this.description + '</option>'
                        $container.find('.direction').append(direction).parent().parent().show();
                    });
                    refreshBusArrivalTimeDropdown();
                });
            }
        });

        $container.find('.direction').change(function () {
            resetBusStop();
            var busServiceId = $container.find('.bus-service').val();
            var direction = $(this).val();
            if (isNotDefaultOption(busServiceId) && isNotDefaultOption(direction)) {
                $.getJSON(resourcePath + '.getRoutes?busServiceId=' + busServiceId + "&direction=" + direction, function (data) {
                    $(data).each(function () {
                        var busStop = '<option value="' + this.busStopId + '">' + this.busStopId + ' - ' + this.busStopDescription + '</option>'
                        $container.find('.bus-stop').append(busStop).parent().parent().show();
                    });
                    refreshBusArrivalTimeDropdown();
                });
            }
        });

        $container.find('.bus-stop').change(function () {
            var busStopId = $(this).val();
            if (isNotDefaultOption(busStopId)) {
                getBusArrivalTime(busStopId);
            } else {
                alert('Please select a bus service / stop');
            }
        });

        $container.find('.get-bus-arrival-time').click(function () {
            $container.find('.bus-stop').change();
        });

        // reset bus stop id searching
        $container.find('.bus-service, .direction, .bus-stop').change(function () {
            $container.find('.bus-stop-id').val('');
        });

        $container.find('.svc_result .toggle').click(toggleAllBusStops);

        // auto refresh
        setInterval(function () {
            $container.find('.svc_result .bus-stops .toggle_container').each(function() {
                getBusArrivalTime($(this).attr('bus-stop-id'));
            });
        }, AUTO_REFRESH_INTERVAL);

        // load cookie
        getBusArrivalTime(BUS_ARRIVAL_FAV);
        $container.find('#concierge_ctrl_reset').show();

        $container.find('#concierge_ctrl_add').click(function () {
            var $checked = $container.find('.svc_result .busCookieBox:checked');
            if ($checked.length == 0) {
                alert('Please select at least one bus service');
            } else if ($checked.length > 3) {
                alert('The no. of services selected has exceeded the maximum limit of 3');
            } else {
                var busStops = [];
                var busStopMap = {};
                $checked.each(function () {
                    var busStopId = $(this).parents('.toggle_container').attr('bus-stop-id');
                    var busServiceId = $(this).parents('.busReq').attr('bus-service-id');
                    if (busStopMap[busStopId] == null) {
                        busStopMap[busStopId] = [];
                    }
                    busStopMap[busStopId].push(busServiceId);
                });
                for (var i in busStopMap) {
                    busStops.push(i + '_' + busStopMap[i].join('_'));
                }
                $.cookie('bus_arrival_time', busStops.join(','), { expires: 365, path: '/' });
                checkCookiesSeq('D');
                alert('The services have been added to MyConcierge successfully');
                location.reload();
            }
        });

        $container.find('#concierge_ctrl_reset').click(function () {
            if (confirm("Are you sure you want to remove the services from MyConcierge?")) {
                $.cookie('bus_arrival_time', null, { expires: 365, path: '/' });
                removeCookiesSeqByInd('D');
                alert("This service has been removed from MyConcierge successfully");
                location.reload();
            }
        });
    });
})(jQuery);
