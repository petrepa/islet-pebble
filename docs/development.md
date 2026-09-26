# Development

Need [Pebble SDK](https://developer.repebble.com/sdk/) 4.9+ and Node.js.

```bash
npm install
pebble build                          # → build/islet-pebble.pbw
pebble install --emulator emery       # emulator
pebble install --phone <PHONE_IP>     # real watch (developer connection)
```

## Fake AndroidAPS for emulator

In emulator, phone script run on your computer. `127.0.0.1:28891` = your computer. Serve test data:

```bash
python3 -c '
import http.server, json, time
class H(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200); self.end_headers()
        self.wfile.write(json.dumps([{"date": int(time.time()*1000), "sgv": 110, "delta": 3.6,
            "direction": "FortyFiveUp", "units_hint": "mmol", "iob": 1.44}]).encode())
http.server.HTTPServer(("127.0.0.1", 28891), H).serve_forever()'
```

## Layout

| Path | What |
|---|---|
| `src/c/main.c` | Watch: layout, drawing, messages |
| `src/js/index.js` | Phone: AndroidAPS fetch, weather, phone battery |
| `src/js/config.json` | Settings page (Clay) |
| `resources/` | Montserrat Bold for clock |

## Messages phone → watch

| Key | Name | Type | Meaning |
|---|---|---|---|
| 0 | `icon` | string | Arrow: `1` ⇈, `2` ↑, `3` ↗, `4` →, `5` ↘, `6` ↓, `7` ⇊, `0` none |
| 1 | `bg` | string | Glucose, formatted (`"6.1"` / `"110"`) |
| 2 | `tcgm` | uint32 | Reading time, Unix seconds UTC |
| 4 | `dlta` | string | Delta, formatted (`"+0.2"`) |
| 5 | `ubat` | string | Phone battery % |
| 13 | `iob` | string | IOB (`"1.44"`) |
| 14 | `iob_time` | uint32 | When IOB read, Unix seconds UTC |
| 200 | `weather_temp` | int32 | Temperature °C |
| 1000 | `sync` | — | Watch → phone: "send fresh data" (every minute) |

Core Devices Pebble app give JS payload keys by **name**, not number. Check both.
