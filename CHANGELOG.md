# Changelog

## 1.3.1 - 2026-11-22

### Performance
- Card picker: the cards no longer ask Home Assistant for a live preview (`preview: false` in `window.customCards`). The picker drew every card at once (history requests, animations), which made the list slow to open; it now shows each card's description instead.

## 1.3.0 - 2026-11-21

### Features
- **History period** (`period`, [#24](https://github.com/juju35/ha-uptime-card/issues/24)): besides the last `hours` (`rolling`, the default), the uptime bar, percentage and time up can cover `today` (since midnight, the bar spanning the whole day and filling up as it goes on), `yesterday` (midnight to midnight, closed by the status of that time) or `week` (this week, from the first day of the week of the language). The history is asked again when the day or the week turns; the tooltips, the bar's name and the overview caption name the period (`Uptime · Today`).
- **Time up instead of the percentage** (`uptime_display: duration`, [#24](https://github.com/juju35/ha-uptime-card/issues/24)): each service, and the overview, show the time up over the window (`23 hr 50 min`), still in orange or red when the share is low.
- Durations of 48 hours and more read in days and hours (`6 days 23 hr`), for `track: up` too.
- `period` and `uptime_display` are in the visual editors (the history length only for the rolling window), their labels in the 22 languages.

### Maintenance
- Tests: windows, durations, the history asked for yesterday, today's bar and the editor; the screenshots test only fails on orphan captures, so that a new capture can be committed by the Screenshots bot; a `card-duration` screenshot.

## 1.2.1 - 2026-11-21

### Fixes
- `track: up`: when every service is off, the rack illustration follows the status chip (`1 off`, green) and is drawn up, instead of grey and unknown.

## 1.2.0 - 2026-11-20

### Features
- **Time up instead of downtime** (`track: up`, for the card or per entity in `entities`), to follow the time on of a PC or a game console rather than its outages ([#21](https://github.com/juju35/ha-uptime-card/issues/21)): a service down reads `Off` in grey and is no longer a problem (no red, not in `only_problems`, the header chip reads `1 off` in green when the others are up), a service up reads `Up for 1 hr 20 min`, the time up over the window (`hours`, up to a week) replaces the percentage, and its periods up are listed under the bar, the latest first (`7:10 PM – now`, the day when not today, the first 6 then `+N`, all in the tooltip).
- `show_periods: false` hides those periods; `track` and `show_periods` are in the visual editors, their labels in the 22 languages.

## 1.1.2 - 2026-11-20

### Fixes
- A pending status-pill fit is cancelled when the card leaves the page.
- The card patches its content in place instead of rewriting it on every Uptime Kuma heartbeat: the rack and ECG animations no longer restart, the pictures are not decoded again, the hover stays, and `<ha-card>` is kept (Home Assistant drew a new one a moment later, so the status pill was measured on a collapsed card and the page could jump). The pill is measured again once a new `<ha-card>` has rendered.
- A Home Assistant label created, renamed or deleted shows without reloading the page (the card follows `label_registry_updated` while it is on the page).

### Maintenance
- README: the `names` option (display names by service key, YAML only) is documented, with a test.
- Tests: a browser test of heartbeats (no node removed for the card's own updates, nothing changed for other entities, no height change, no scroll), and a test of the label registry updates; two biome warnings of the pill test fixed.

## 1.1.1 - 2026-11-18

### Fixes
- Illustrated header: `auto` now follows the Home Assistant theme alone — a light theme keeps the day picture after sunset, a dark theme still shows the night one.

## 1.1.0 - 2026-11-17

### Features
- **Illustrated header** on the full and the mini card (90 px): the rack of the overall status, with its existing animations (heartbeat, alarm rings, pending dots, swinging wrench), stands in a server room on a 10 px concrete floor strip; the room's switch lights and network cable follow the status too. The title and the status (`1 down · 9/11 up`) sit on the left, next to the round heart-pulse icon in the status colour (green all up, amber pending or warning, red down, blue maintenance, grey unknown).
- Night picture after sunset (`sun.sun`) or with Home Assistant's dark mode even while the sun is up, forced with `illustration_theme: day | night`; `illustration: false` keeps the classic header with the rack in the overview. Both options are in the visual editors (the mini card's included), with their labels in the 22 languages.
- The status pill is back in the illustrated header, in the round icon's colour; the subtitle keeps the share of services up. In every header (illustrated or classic, full and mini card) it is placed by measurement, in every language: on the title row right after the title only when the whole title and its whole label fit there, otherwise on its own line under the subtitle (cut to one line); only its dot when the banner has no room left above its ground strip, and on a card of 200 px or less. The mini card's detail button sits in the banner's top-right corner, in the frosted style of the other cards.
- Full card: the big line under the header is now the average uptime of the services over the history window ("99 % Uptime · Last 24 hours") instead of repeating the status already in the header pill.

## 1.0.2 - 2026-11-14

### Fixes
- Visual editors: `auto`, `sources`, `exclude`, `tags` and `collapsed` were missing. `auto` shows its default (on without `entities`) and is written only when changed, `sources` lists the supported integrations, `exclude` offers the services found, `tags` and `collapsed` take a list of names; their labels in the 22 languages. `collapsed: true` (every group) stays YAML only.
- README: the full card's options that the mini card's detail view uses are marked for both cards, as its visual editor already offered them.

## 1.0.1 - 2026-11-13

### Fixes
- Folding back on a tap elsewhere now works on iOS (Safari and the companion app): a tap on something that is not clickable sent no click to the page, so the unfolded groups of the card and the detailed view of the mini card stayed open. The press and the release are caught instead; a slider dragged out of the card and a scroll do not fold anything.
- Leaving the card (another dashboard view, a conditional card hidden) brings it back in its default state: groups folded back to their defaults, mini card compact.
- A click could do nothing: Home Assistant updates the card several times a second, and a rewrite of the card between the press and the release replaced the element pressed, so that the click was lost. The card is no longer rewritten while a press is in progress; the pending update is drawn right after the click.
- No focus ring after a mouse click or a tap: the focus is kept across updates only for the keyboard.

## 1.0.0 - 2026-11-13

### Features
- First release: **Uptime Card** (`custom:uptime-card`) and **Uptime Mini Card** (`custom:uptime-mini-card`) to watch services from Uptime Kuma, Healthchecks.io, Ping, any connectivity binary sensor and Certificate Expiry, found on their own in the Home Assistant registries (or listed with `entities`).
- Each service: status (up, down, pending, maintenance) and how long it has been down, response time with a slow threshold, 24-hour uptime bar and uptime percentage from the history, SSL certificate expiry with warning and critical thresholds (a Certificate Expiry certificate goes to the service of the same host).
- Groups by tag (Uptime Kuma tags, Home Assistant labels), by integration or none, collapsible, a group with a service down always unfolded; filters (`only_problems`, `tags`, `sources`, `exclude`) and sort by status or name.
- Overview with a drawn server rack animated by the worst status (heartbeat when everything is up, alarm rings when a service is down, blinking dots while pending, swinging wrench in maintenance), honouring `prefers-reduced-motion`.
- Mini card: services up out of the total, a bar of the statuses and the services down; its detail button switches it to the full list and back.
- Visual editors for both cards, light and dark themes, 22 languages (English in the bundle, the others loaded on demand).
