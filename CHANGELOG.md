# Changelog

## 1.0.1 - 2026-11-13

### Fixes
- Folding back on a tap elsewhere now works on iOS (Safari and the companion app): a tap on something that is not clickable sent no click to the page, so the unfolded groups of the card and the detailed view of the mini card stayed open. The press and the release are caught instead; a slider dragged out of the card and a scroll do not fold anything.
- Leaving the card (another dashboard view, a conditional card hidden) brings it back in its default state: groups folded back to their defaults, mini card compact.

## 1.0.0 - 2026-11-13

### Features
- First release: **Uptime Card** (`custom:uptime-card`) and **Uptime Mini Card** (`custom:uptime-mini-card`) to watch services from Uptime Kuma, Healthchecks.io, Ping, any connectivity binary sensor and Certificate Expiry, found on their own in the Home Assistant registries (or listed with `entities`).
- Each service: status (up, down, pending, maintenance) and how long it has been down, response time with a slow threshold, 24-hour uptime bar and uptime percentage from the history, SSL certificate expiry with warning and critical thresholds (a Certificate Expiry certificate goes to the service of the same host).
- Groups by tag (Uptime Kuma tags, Home Assistant labels), by integration or none, collapsible, a group with a service down always unfolded; filters (`only_problems`, `tags`, `sources`, `exclude`) and sort by status or name.
- Overview with a drawn server rack animated by the worst status (heartbeat when everything is up, alarm rings when a service is down, blinking dots while pending, swinging wrench in maintenance), honouring `prefers-reduced-motion`.
- Mini card: services up out of the total, a bar of the statuses and the services down; its detail button switches it to the full list and back.
- Visual editors for both cards, light and dark themes, 22 languages (English in the bundle, the others loaded on demand).
