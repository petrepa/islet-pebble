# Islet

Pebble Time 2 watchface. Glucose, trend, delta, IOB straight from AndroidAPS on phone. No Nightscout. No xDrip+. No internet.

<p>
  <img src="docs/emery_screenshot_1.png" width="200" alt="In range: 6.1 mmol/L, rising slowly, IOB 1.44 U">
  <img src="docs/emery_screenshot_2.png" width="200" alt="Low: 3.6 mmol/L, falling, IOB 0.12 U">
  <img src="docs/emery_screenshot_3.png" width="200" alt="High: 12.4 mmol/L, rising fast, IOB 3.20 U">
</p>

## Setup

1. AndroidAPS → Config Builder → Synchronization → tick **Garmin**. Open its settings, turn on **Local HTTP server** (port 28891). No Garmin watch needed.
2. Install **[Islet for AndroidAPS](https://apps.rePebble.com/a5543813bd14472f90ff7542)** from Pebble app store. Or grab `.pbw` from [Releases](../../releases).
3. Turn off xDrip+ (or other app) sending to Pebble.

Done. Watch pulls fresh data every minute.

## Docs

- [Usage](docs/usage.md) — what face shows, settings, troubleshooting
- [Development](docs/development.md) — build, emulator test data, message keys

## Credits

Started from [xDrip-Pebble-E](https://github.com/jstevensog/xDrip-Pebble-E) / [cgm-pebble](https://github.com/nightscout/cgm-pebble). Font [Montserrat](https://github.com/JulietaUla/Montserrat) (OFL). Weather [Open-Meteo](https://open-meteo.com/). Data [AndroidAPS](https://github.com/nightscout/AndroidAPS).

MIT, see [LICENSE](LICENSE).
