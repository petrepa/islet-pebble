var Clay = require('@rebble/clay');
var clayConfig = require('./config.json');
var clay = new Clay(clayConfig);

// Weather message keys — must match C defines
var WEATHER_TEMP_KEY = 200;
var WEATHER_COND_KEY = 201;
var WEATHER_REQ_KEY  = 202;

// CGM message keys — must match C defines
var CGM_ICON_KEY     = 0;
var CGM_BG_KEY       = 1;
var CGM_TCGM_KEY     = 2;
var CGM_DLTA_KEY     = 4;
var CGM_UBAT_KEY     = 5;
var CGM_IOB_KEY      = 13;
var CGM_IOB_TIME_KEY = 14;
var CGM_SYNC_KEY     = 1000;

// AndroidAPS Garmin plugin local HTTP server (only reachable from the phone)
var AAPS_URL = 'http://127.0.0.1:28891/sgv.json?count=1&brief_mode=true';

// Nightscout-style direction -> arrow index used by the watch
var DIRECTION_ICON = {
    DoubleUp: '1', SingleUp: '2', FortyFiveUp: '3', Flat: '4',
    FortyFiveDown: '5', SingleDown: '6', DoubleDown: '7'
};

function xhrRequest(url, type, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() { callback(this.responseText); };
    xhr.onerror = function() { console.log('XHR error for ' + url); };
    xhr.ontimeout = function() { console.log('XHR timeout for ' + url); };
    xhr.open(type, url);
    xhr.timeout = 10000;
    xhr.send();
}

function weatherCodeToCondition(code) {
    if (code === 0)  return 'Clear';
    if (code <= 3)   return 'Cloudy';
    if (code <= 48)  return 'Fog';
    if (code <= 55)  return 'Drizzle';
    if (code <= 65)  return 'Rain';
    if (code <= 75)  return 'Snow';
    if (code <= 82)  return 'Showers';
    if (code <= 86)  return 'Snow Showers';
    if (code >= 95)  return 'T-Storm';
    return 'Unknown';
}

function getWeather() {
    navigator.geolocation.getCurrentPosition(
        function(pos) {
            var url = 'https://api.open-meteo.com/v1/forecast' +
                '?latitude='  + pos.coords.latitude +
                '&longitude=' + pos.coords.longitude +
                '&current=temperature_2m,weather_code';

            xhrRequest(url, 'GET', function(body) {
                try {
                    var json = JSON.parse(body);
                    var temp = Math.round(json.current.temperature_2m);
                    var cond = weatherCodeToCondition(json.current.weather_code);
                    var dict = {};
                    dict[WEATHER_TEMP_KEY] = temp;
                    dict[WEATHER_COND_KEY] = cond;
                    Pebble.sendAppMessage(dict,
                        function()  { console.log('Weather sent OK: ' + temp + 'C ' + cond); },
                        function(e) { console.log('Weather send failed: ' + JSON.stringify(e)); }
                    );
                } catch(e) {
                    console.log('Weather parse error: ' + e);
                }
            });
        },
        function(err) {
            console.log('Geolocation error: ' + err.message);
        },
        { timeout: 15000, maximumAge: 300000 }
    );
}

function formatDelta(mgdl, mmol) {
    if (typeof mgdl !== 'number') return '';
    var value = mmol ? (mgdl / 18).toFixed(1) : String(Math.round(mgdl));
    return (parseFloat(value) >= 0 ? '+' : '') + value;
}

function getPhoneBattery(callback) {
    try {
        if (navigator.getBattery) {
            navigator.getBattery().then(
                function(b) { callback(Math.round(b.level * 100)); },
                function()  { callback(null); });
            return;
        }
        if (navigator.battery) {
            callback(Math.round(navigator.battery.level * 100));
            return;
        }
    } catch (e) {
        console.log('Battery API error: ' + e);
    }
    callback(null);
}

function getAapsData() {
    xhrRequest(AAPS_URL, 'GET', function(body) {
        var entry;
        try {
            entry = JSON.parse(body)[0];
        } catch (e) {
            console.log('AAPS parse error: ' + e);
            return;
        }
        if (!entry || typeof entry.sgv !== 'number') {
            console.log('No glucose from AAPS');
            return;
        }
        var mmol = entry.units_hint === 'mmol';
        var dict = {};
        dict[CGM_BG_KEY]   = mmol ? (entry.sgv / 18).toFixed(1) : String(entry.sgv);
        dict[CGM_ICON_KEY] = DIRECTION_ICON[entry.direction] || '0';
        dict[CGM_TCGM_KEY] = Math.round(entry.date / 1000);
        dict[CGM_DLTA_KEY] = formatDelta(entry.delta, mmol);
        if (typeof entry.iob === 'number') {
            dict[CGM_IOB_KEY]      = entry.iob.toFixed(2);
            dict[CGM_IOB_TIME_KEY] = Math.round(Date.now() / 1000);
        }
        getPhoneBattery(function(level) {
            if (level !== null) dict[CGM_UBAT_KEY] = String(level);
            Pebble.sendAppMessage(dict,
                function()  { console.log('AAPS data sent OK: ' + dict[CGM_BG_KEY]); },
                function(e) { console.log('AAPS data send failed: ' + JSON.stringify(e)); }
            );
        });
    });
}

Pebble.addEventListener('ready', function() {
    console.log('PebbleKit JS ready — fetching weather and AAPS data');
    getWeather();
    getAapsData();
});

// Payload keys may arrive as message key names or as numbers
function hasKey(payload, name, number) {
    return payload[name] !== undefined || payload[number] !== undefined;
}

Pebble.addEventListener('appmessage', function(e) {
    if (hasKey(e.payload, 'weather_req', WEATHER_REQ_KEY)) {
        console.log('Watch requested weather refresh');
        getWeather();
    }
    if (hasKey(e.payload, 'sync', CGM_SYNC_KEY)) {
        console.log('Watch requested AAPS data');
        getAapsData();
    }
});
