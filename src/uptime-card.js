/*
 * Uptime Card for Home Assistant
 * https://github.com/juju35/ha-uptime-card
 *
 * Lovelace cards to watch services at a glance, on top of the integrations you already use: Uptime Kuma
 * (https://www.home-assistant.io/integrations/uptime_kuma/), Healthchecks.io (https://github.com/custom-components/healthchecksio),
 * Ping (https://www.home-assistant.io/integrations/ping/), any connectivity binary sensor and Certificate Expiry
 * (https://www.home-assistant.io/integrations/cert_expiry/).
 * Services are found through the entity and device registries (platform, translation_key and device), so they work
 * whatever the Home Assistant language or entity ids.
 */

const VERSION = "__VERSION__";

// Accent of the card (light, dark theme): the buttons, the header icon without a state and the group icons.
const ACCENT = ["#5c6bc0", "#8c9eff"];

const ICONS = {
  heart_pulse:
    "M7.5,4A5.5,5.5 0 0,0 2,9.5C2,10 2.09,10.5 2.22,11H6.3L7.57,7.63C7.87,6.83 9.05,6.75 9.43,7.63L11.5,13L12.09,11.58C12.22,11.25 12.57,11 13,11H21.78C21.91,10.5 22,10 22,9.5A5.5,5.5 0 0,0 16.5,4C14.64,4 13,4.93 12,6.34C11,4.93 9.36,4 7.5,4V4M3,12.5A1,1 0 0,0 2,13.5A1,1 0 0,0 3,14.5H5.44L11,20C12,20.9 12,20.9 13,20L18.56,14.5H21A1,1 0 0,0 22,13.5A1,1 0 0,0 21,12.5H13.4L12.47,14.8C12.07,15.81 10.92,15.67 10.55,14.83L8.5,9.5L7.54,11.83C7.39,12.21 7.05,12.5 6.6,12.5H3Z",
  web: "M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
  lan: "M4,1C2.89,1 2,1.89 2,3V7C2,8.11 2.89,9 4,9H1V11H13V9H10C11.11,9 12,8.11 12,7V3C12,1.89 11.11,1 10,1H4M4,3H10V7H4V3M3,13V18L3,20H10V18H5V13H3M14,13C12.89,13 12,13.89 12,15V19C12,20.11 12.89,21 14,21H11V23H23V21H20C21.11,21 22,20.11 22,19V15C22,13.89 21.11,13 20,13H14M14,15H20V19H14V15Z",
  timer_check:
    "M11 8H13V14H11V8M15 1H9V3H15V1M12 20C8.13 20 5 16.87 5 13S8.13 6 12 6 19 9.13 19 13C19.7 13 20.36 13.13 21 13.35C21 13.23 21 13.12 21 13C21 10.88 20.26 8.93 19.03 7.39L20.45 5.97C20 5.46 19.55 5 19.04 4.56L17.62 6C16.07 4.74 14.12 4 12 4C7.03 4 3 8.03 3 13S7.03 22 12 22C12.59 22 13.16 21.94 13.71 21.83C13.4 21.25 13.18 20.6 13.08 19.91C12.72 19.96 12.37 20 12 20M21.34 15.84L17.75 19.43L16.16 17.84L15 19L17.75 22L22.5 17.25L21.34 15.84Z",
  certificate:
    "M4,3C2.89,3 2,3.89 2,5V15A2,2 0 0,0 4,17H12V22L15,19L18,22V17H20A2,2 0 0,0 22,15V8L22,6V5A2,2 0 0,0 20,3H16V3H4M12,5L15,7L18,5V8.5L21,10L18,11.5V15L15,13L12,15V11.5L9,10L12,8.5V5M4,5H9V7H4V5M4,9H7V11H4V9M4,13H9V15H4V13Z",
  connection:
    "M21.4 7.5C22.2 8.3 22.2 9.6 21.4 10.3L18.6 13.1L10.8 5.3L13.6 2.5C14.4 1.7 15.7 1.7 16.4 2.5L18.2 4.3L21.2 1.3L22.6 2.7L19.6 5.7L21.4 7.5M15.6 13.3L14.2 11.9L11.4 14.7L9.3 12.6L12.1 9.8L10.7 8.4L7.9 11.2L6.4 9.8L3.6 12.6C2.8 13.4 2.8 14.7 3.6 15.4L5.4 17.2L1.4 21.2L2.8 22.6L6.8 18.6L8.6 20.4C9.4 21.2 10.7 21.2 11.4 20.4L14.2 17.6L12.8 16.2L15.6 13.3Z",
  server:
    "M4,1H20A1,1 0 0,1 21,2V6A1,1 0 0,1 20,7H4A1,1 0 0,1 3,6V2A1,1 0 0,1 4,1M4,9H20A1,1 0 0,1 21,10V14A1,1 0 0,1 20,15H4A1,1 0 0,1 3,14V10A1,1 0 0,1 4,9M4,17H20A1,1 0 0,1 21,18V22A1,1 0 0,1 20,23H4A1,1 0 0,1 3,22V18A1,1 0 0,1 4,17M9,5H10V3H9V5M9,13H10V11H9V13M9,21H10V19H9V21M5,3V5H7V3H5M5,11V13H7V11H5M5,19V21H7V19H5Z",
  tag: "M21.41 11.58L12.41 2.58A2 2 0 0 0 11 2H4A2 2 0 0 0 2 4V11A2 2 0 0 0 2.59 12.42L11.59 21.42A2 2 0 0 0 13 22A2 2 0 0 0 14.41 21.41L21.41 14.41A2 2 0 0 0 22 13A2 2 0 0 0 21.41 11.58M13 20L4 11V4H11L20 13M6.5 5A1.5 1.5 0 1 1 5 6.5A1.5 1.5 0 0 1 6.5 5Z",
  lock: "M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z",
  lock_alert:
    "M10 17C11.1 17 12 16.1 12 15C12 13.9 11.1 13 10 13C8.9 13 8 13.9 8 15S8.9 17 10 17M16 8C17.1 8 18 8.9 18 10V20C18 21.1 17.1 22 16 22H4C2.9 22 2 21.1 2 20V10C2 8.9 2.9 8 4 8H5V6C5 3.2 7.2 1 10 1S15 3.2 15 6V8H16M10 3C8.3 3 7 4.3 7 6V8H13V6C13 4.3 11.7 3 10 3M22 13H20V7H22V13M22 17H20V15H22V17Z",
  alert: "M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
  check_circle: "M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z",
  wrench: "M22.7,19L13.6,9.9C14.5,7.6 14,4.9 12.1,3C10.1,1 7.1,0.6 4.7,1.7L9,6L6,9L1.6,4.7C0.4,7.1 0.9,10.1 2.9,12.1C4.8,14 7.5,14.5 9.8,13.6L18.9,22.7C19.3,23.1 19.9,23.1 20.3,22.7L22.6,20.4C23.1,20 23.1,19.3 22.7,19Z",
  chevron_down: "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
  expand: "M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z",
  collapse: "M19.5,3.09L15,7.59V4H13V11H20V9H16.41L20.91,4.5L19.5,3.09M4,13V15H7.59L3.09,19.5L4.5,20.91L9,16.41V20H11V13H4Z",
};

// Integrations the services come from: label (a product name, not translated) and the icon of their rows.
const SOURCES = {
  uptime_kuma: { label: "Uptime Kuma", icon: "web" },
  healthchecks: { label: "Healthchecks.io", icon: "timer_check" },
  ping: { label: "Ping", icon: "lan" },
  cert_expiry: { label: "Certificate Expiry", icon: "certificate" },
  entity: { label: null, icon: "connection" },
};
const SOURCE_ORDER = Object.keys(SOURCES);

const STRINGS = {
  en: {
    title: "Services",
    up: "Up",
    down: "Down",
    pending: "Pending",
    maintenance: "Maintenance",
    unknown: "Unknown",
    all_up: "All up",
    n_down: "{n} down",
    n_pending: "{n} pending",
    n_maintenance: "{n} in maintenance",
    summary: "{up}/{total} up",
    services_up: "services up",
    all_operational: "All services operational",
    down_for: "Down for {d}",
    last_ping: "Last ping {when}",
    latency: "Latency",
    uptime: "Uptime",
    history: "Last {h} hours",
    ssl_in: "SSL {d}",
    ssl_expires_on: "Certificate expires on {date}",
    ssl_expired: "SSL expired",
    ssl_invalid: "SSL invalid",
    other: "Other",
    src_entity: "Other sensors",
    no_services:
      "No service found. Set up a supported integration (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry) or list entities in the card options.",
    no_registry: "This card needs Home Assistant 2024.8 or later.",
    zoom_in: "Show details",
    zoom_out: "Show less",
    // Editor
    entities: "Services (empty: found automatically)",
    auto: "Also add every service found",
    sources: "Integrations to find services in (empty: all)",
    exclude: "Services found to leave out",
    tags: "Only the services with these tags (empty: all)",
    collapsed: "Groups folded by default (by name)",
    group_by: "Group by",
    group_tag: "Tag",
    group_source: "Integration",
    group_none: "No grouping",
    sort: "Sort",
    sort_status: "Status (problems first)",
    sort_name: "Name",
    show_hero: "Show the overview (picture and alerts)",
    show_title: "Show title",
    show_subtitle: "Show subtitle",
    show_latency: "Show latency",
    show_history: "Show the uptime bar",
    show_uptime: "Show the uptime percentage",
    show_ssl: "Show certificate expiry",
    only_problems: "Only show services with a problem",
    hours: "History length (hours)",
    ssl_warning_days: "Certificate warning (days left)",
    ssl_critical_days: "Certificate alert (days left)",
    latency_warning: "Slow response above (ms)",
    max_items: "Services listed on the mini card",
    zoom: "Detail button",
    zoom_helper: "Switches the mini card to the full list and back",
    language: "Language",
    lang_auto: "Automatic (Home Assistant language)",
  },
  fr: {
    title: "Services",
    up: "En ligne",
    down: "Hors ligne",
    pending: "En attente",
    maintenance: "Maintenance",
    unknown: "Inconnu",
    all_up: "Tout est en ligne",
    n_down: "Hors ligne : {n}",
    n_pending: "En attente : {n}",
    n_maintenance: "En maintenance : {n}",
    summary: "{up}/{total} en ligne",
    services_up: "services en ligne",
    all_operational: "Tous les services fonctionnent",
    down_for: "Hors ligne depuis {d}",
    last_ping: "Dernier ping {when}",
    latency: "Latence",
    uptime: "Disponibilité",
    history: "Dernières {h} heures",
    ssl_in: "SSL {d}",
    ssl_expires_on: "Le certificat expire le {date}",
    ssl_expired: "SSL expiré",
    ssl_invalid: "SSL invalide",
    other: "Autres",
    src_entity: "Autres capteurs",
    no_services: "Aucun service trouvé. Configurez une intégration prise en charge (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry) ou listez des entités dans les options de la carte.",
    no_registry: "Cette carte nécessite Home Assistant 2024.8 ou plus récent.",
    zoom_in: "Afficher le détail",
    zoom_out: "Réduire",
    entities: "Services (vide : détection automatique)",
    auto: "Ajouter aussi tous les services trouvés",
    sources: "Intégrations où chercher les services (vide : toutes)",
    exclude: "Services trouvés à exclure",
    tags: "Seulement les services avec ces étiquettes (vide : tous)",
    collapsed: "Groupes repliés par défaut (par nom)",
    group_by: "Regrouper par",
    group_tag: "Étiquette",
    group_source: "Intégration",
    group_none: "Sans regroupement",
    sort: "Tri",
    sort_status: "État (problèmes d'abord)",
    sort_name: "Nom",
    show_hero: "Afficher la vue d'ensemble (image et alertes)",
    show_title: "Afficher le titre",
    show_subtitle: "Afficher le sous-titre",
    show_latency: "Afficher la latence",
    show_history: "Afficher la barre de disponibilité",
    show_uptime: "Afficher le pourcentage de disponibilité",
    show_ssl: "Afficher l'expiration des certificats",
    only_problems: "N'afficher que les services en problème",
    hours: "Durée de l'historique (heures)",
    ssl_warning_days: "Alerte certificat (jours restants)",
    ssl_critical_days: "Alerte critique certificat (jours restants)",
    latency_warning: "Réponse lente au-delà de (ms)",
    max_items: "Services listés sur la mini-carte",
    zoom: "Bouton détail",
    zoom_helper: "Bascule la mini-carte vers la liste complète et inversement",
    language: "Langue",
    lang_auto: "Automatique (langue de Home Assistant)",
  },
  de: {
    title: "Dienste",
    up: "Online",
    down: "Offline",
    pending: "Ausstehend",
    maintenance: "Wartung",
    unknown: "Unbekannt",
    all_up: "Alles online",
    n_down: "Offline: {n}",
    n_pending: "Ausstehend: {n}",
    n_maintenance: "In Wartung: {n}",
    summary: "{up}/{total} online",
    services_up: "Dienste online",
    all_operational: "Alle Dienste laufen",
    down_for: "Seit {d} offline",
    last_ping: "Letzter Ping {when}",
    latency: "Latenz",
    uptime: "Verfügbarkeit",
    history: "Letzte {h} Stunden",
    ssl_in: "SSL {d}",
    ssl_expires_on: "Zertifikat läuft am {date} ab",
    ssl_expired: "SSL abgelaufen",
    ssl_invalid: "SSL ungültig",
    other: "Sonstige",
    src_entity: "Andere Sensoren",
    no_services: "Kein Dienst gefunden. Richte eine unterstützte Integration ein (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry) oder liste Entitäten in den Kartenoptionen auf.",
    no_registry: "Diese Karte benötigt Home Assistant 2024.8 oder neuer.",
    zoom_in: "Details anzeigen",
    zoom_out: "Weniger anzeigen",
    entities: "Dienste (leer: automatisch gefunden)",
    auto: "Auch alle gefundenen Dienste hinzufügen",
    sources: "Integrationen für die Dienstsuche (leer: alle)",
    exclude: "Gefundene Dienste, die ausgelassen werden",
    tags: "Nur Dienste mit diesen Tags (leer: alle)",
    collapsed: "Standardmäßig eingeklappte Gruppen (nach Name)",
    group_by: "Gruppieren nach",
    group_tag: "Tag",
    group_source: "Integration",
    group_none: "Keine Gruppierung",
    sort: "Sortierung",
    sort_status: "Status (Probleme zuerst)",
    sort_name: "Name",
    show_hero: "Übersicht anzeigen (Bild und Warnungen)",
    show_title: "Titel anzeigen",
    show_subtitle: "Untertitel anzeigen",
    show_latency: "Latenz anzeigen",
    show_history: "Verfügbarkeitsleiste anzeigen",
    show_uptime: "Verfügbarkeit in Prozent anzeigen",
    show_ssl: "Zertifikatsablauf anzeigen",
    only_problems: "Nur Dienste mit Problemen anzeigen",
    hours: "Verlaufsdauer (Stunden)",
    ssl_warning_days: "Zertifikatswarnung (verbleibende Tage)",
    ssl_critical_days: "Zertifikatsalarm (verbleibende Tage)",
    latency_warning: "Langsame Antwort ab (ms)",
    max_items: "Auf der Mini-Karte aufgeführte Dienste",
    zoom: "Detail-Schaltfläche",
    zoom_helper: "Schaltet die Mini-Karte auf die vollständige Liste um und zurück",
    language: "Sprache",
    lang_auto: "Automatisch (Sprache von Home Assistant)",
  },
  es: {
    title: "Servicios",
    up: "Activo",
    down: "Caído",
    pending: "Pendiente",
    maintenance: "Mantenimiento",
    unknown: "Desconocido",
    all_up: "Todo activo",
    n_down: "Caídos: {n}",
    n_pending: "Pendientes: {n}",
    n_maintenance: "En mantenimiento: {n}",
    summary: "{up}/{total} activos",
    services_up: "servicios activos",
    all_operational: "Todos los servicios funcionan",
    down_for: "Caído desde hace {d}",
    last_ping: "Último ping {when}",
    latency: "Latencia",
    uptime: "Disponibilidad",
    history: "Últimas {h} horas",
    ssl_in: "SSL {d}",
    ssl_expires_on: "El certificado caduca el {date}",
    ssl_expired: "SSL caducado",
    ssl_invalid: "SSL no válido",
    other: "Otros",
    src_entity: "Otros sensores",
    no_services: "No se ha encontrado ningún servicio. Configura una integración compatible (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry) o indica entidades en las opciones de la tarjeta.",
    no_registry: "Esta tarjeta necesita Home Assistant 2024.8 o posterior.",
    zoom_in: "Mostrar detalles",
    zoom_out: "Mostrar menos",
    entities: "Servicios (vacío: detección automática)",
    auto: "Añadir también todos los servicios encontrados",
    sources: "Integraciones donde buscar servicios (vacío: todas)",
    exclude: "Servicios encontrados que se excluyen",
    tags: "Solo los servicios con estas etiquetas (vacío: todos)",
    collapsed: "Grupos plegados por defecto (por nombre)",
    group_by: "Agrupar por",
    group_tag: "Etiqueta",
    group_source: "Integración",
    group_none: "Sin agrupar",
    sort: "Orden",
    sort_status: "Estado (problemas primero)",
    sort_name: "Nombre",
    show_hero: "Mostrar el resumen (imagen y alertas)",
    show_title: "Mostrar el título",
    show_subtitle: "Mostrar el subtítulo",
    show_latency: "Mostrar la latencia",
    show_history: "Mostrar la barra de disponibilidad",
    show_uptime: "Mostrar el porcentaje de disponibilidad",
    show_ssl: "Mostrar la caducidad de los certificados",
    only_problems: "Mostrar solo los servicios con problemas",
    hours: "Duración del historial (horas)",
    ssl_warning_days: "Aviso de certificado (días restantes)",
    ssl_critical_days: "Alerta de certificado (días restantes)",
    latency_warning: "Respuesta lenta a partir de (ms)",
    max_items: "Servicios listados en la minitarjeta",
    zoom: "Botón de detalle",
    zoom_helper: "Cambia la minitarjeta a la lista completa y viceversa",
    language: "Idioma",
    lang_auto: "Automático (idioma de Home Assistant)",
  },
  it: {
    title: "Servizi",
    up: "Online",
    down: "Offline",
    pending: "In attesa",
    maintenance: "Manutenzione",
    unknown: "Sconosciuto",
    all_up: "Tutto online",
    n_down: "Offline: {n}",
    n_pending: "In attesa: {n}",
    n_maintenance: "In manutenzione: {n}",
    summary: "{up}/{total} online",
    services_up: "servizi online",
    all_operational: "Tutti i servizi funzionano",
    down_for: "Offline da {d}",
    last_ping: "Ultimo ping {when}",
    latency: "Latenza",
    uptime: "Disponibilità",
    history: "Ultime {h} ore",
    ssl_in: "SSL {d}",
    ssl_expires_on: "Il certificato scade il {date}",
    ssl_expired: "SSL scaduto",
    ssl_invalid: "SSL non valido",
    other: "Altri",
    src_entity: "Altri sensori",
    no_services: "Nessun servizio trovato. Configura un'integrazione supportata (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry) o elenca delle entità nelle opzioni della scheda.",
    no_registry: "Questa scheda richiede Home Assistant 2024.8 o successivo.",
    zoom_in: "Mostra dettagli",
    zoom_out: "Mostra meno",
    entities: "Servizi (vuoto: trovati automaticamente)",
    auto: "Aggiungi anche tutti i servizi trovati",
    sources: "Integrazioni in cui cercare i servizi (vuoto: tutte)",
    exclude: "Servizi trovati da escludere",
    tags: "Solo i servizi con questi tag (vuoto: tutti)",
    collapsed: "Gruppi chiusi per impostazione predefinita (per nome)",
    group_by: "Raggruppa per",
    group_tag: "Tag",
    group_source: "Integrazione",
    group_none: "Nessun raggruppamento",
    sort: "Ordinamento",
    sort_status: "Stato (prima i problemi)",
    sort_name: "Nome",
    show_hero: "Mostra il riepilogo (immagine e avvisi)",
    show_title: "Mostra il titolo",
    show_subtitle: "Mostra il sottotitolo",
    show_latency: "Mostra la latenza",
    show_history: "Mostra la barra di disponibilità",
    show_uptime: "Mostra la percentuale di disponibilità",
    show_ssl: "Mostra la scadenza dei certificati",
    only_problems: "Mostra solo i servizi con problemi",
    hours: "Durata dello storico (ore)",
    ssl_warning_days: "Avviso certificato (giorni rimanenti)",
    ssl_critical_days: "Allarme certificato (giorni rimanenti)",
    latency_warning: "Risposta lenta oltre (ms)",
    max_items: "Servizi elencati nella mini scheda",
    zoom: "Pulsante dettagli",
    zoom_helper: "Passa dalla mini scheda all'elenco completo e viceversa",
    language: "Lingua",
    lang_auto: "Automatica (lingua di Home Assistant)",
  },
  nl: {
    title: "Diensten",
    up: "Online",
    down: "Offline",
    pending: "In afwachting",
    maintenance: "Onderhoud",
    unknown: "Onbekend",
    all_up: "Alles online",
    n_down: "Offline: {n}",
    n_pending: "In afwachting: {n}",
    n_maintenance: "In onderhoud: {n}",
    summary: "{up}/{total} online",
    services_up: "diensten online",
    all_operational: "Alle diensten werken",
    down_for: "Al {d} offline",
    last_ping: "Laatste ping {when}",
    latency: "Latentie",
    uptime: "Beschikbaarheid",
    history: "Laatste {h} uur",
    ssl_in: "SSL {d}",
    ssl_expires_on: "Certificaat verloopt op {date}",
    ssl_expired: "SSL verlopen",
    ssl_invalid: "SSL ongeldig",
    other: "Overige",
    src_entity: "Overige sensoren",
    no_services: "Geen dienst gevonden. Stel een ondersteunde integratie in (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry) of geef entiteiten op in de kaartopties.",
    no_registry: "Deze kaart vereist Home Assistant 2024.8 of nieuwer.",
    zoom_in: "Details tonen",
    zoom_out: "Minder tonen",
    entities: "Diensten (leeg: automatisch gevonden)",
    auto: "Ook alle gevonden diensten toevoegen",
    sources: "Integraties om diensten in te zoeken (leeg: alle)",
    exclude: "Gevonden diensten die worden weggelaten",
    tags: "Alleen diensten met deze labels (leeg: alle)",
    collapsed: "Standaard ingeklapte groepen (op naam)",
    group_by: "Groeperen op",
    group_tag: "Label",
    group_source: "Integratie",
    group_none: "Niet groeperen",
    sort: "Sortering",
    sort_status: "Status (problemen eerst)",
    sort_name: "Naam",
    show_hero: "Overzicht tonen (afbeelding en meldingen)",
    show_title: "Titel tonen",
    show_subtitle: "Ondertitel tonen",
    show_latency: "Latentie tonen",
    show_history: "Beschikbaarheidsbalk tonen",
    show_uptime: "Beschikbaarheidspercentage tonen",
    show_ssl: "Verloop van certificaten tonen",
    only_problems: "Alleen diensten met een probleem tonen",
    hours: "Duur van de geschiedenis (uren)",
    ssl_warning_days: "Certificaatwaarschuwing (resterende dagen)",
    ssl_critical_days: "Certificaatalarm (resterende dagen)",
    latency_warning: "Trage reactie boven (ms)",
    max_items: "Diensten op de minikaart",
    zoom: "Detailknop",
    zoom_helper: "Schakelt de minikaart naar de volledige lijst en terug",
    language: "Taal",
    lang_auto: "Automatisch (taal van Home Assistant)",
  },
  pt: {
    title: "Serviços",
    up: "Ativo",
    down: "Em baixo",
    pending: "Pendente",
    maintenance: "Manutenção",
    unknown: "Desconhecido",
    all_up: "Tudo ativo",
    n_down: "Em baixo: {n}",
    n_pending: "Pendentes: {n}",
    n_maintenance: "Em manutenção: {n}",
    summary: "{up}/{total} ativos",
    services_up: "serviços ativos",
    all_operational: "Todos os serviços a funcionar",
    down_for: "Em baixo há {d}",
    last_ping: "Último ping {when}",
    latency: "Latência",
    uptime: "Disponibilidade",
    history: "Últimas {h} horas",
    ssl_in: "SSL {d}",
    ssl_expires_on: "O certificado expira a {date}",
    ssl_expired: "SSL expirado",
    ssl_invalid: "SSL inválido",
    other: "Outros",
    src_entity: "Outros sensores",
    no_services: "Nenhum serviço encontrado. Configure uma integração suportada (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry) ou indique entidades nas opções do cartão.",
    no_registry: "Este cartão requer o Home Assistant 2024.8 ou posterior.",
    zoom_in: "Mostrar detalhes",
    zoom_out: "Mostrar menos",
    entities: "Serviços (vazio: deteção automática)",
    auto: "Adicionar também todos os serviços encontrados",
    sources: "Integrações onde procurar serviços (vazio: todas)",
    exclude: "Serviços encontrados a excluir",
    tags: "Apenas os serviços com estas etiquetas (vazio: todos)",
    collapsed: "Grupos recolhidos por omissão (por nome)",
    group_by: "Agrupar por",
    group_tag: "Etiqueta",
    group_source: "Integração",
    group_none: "Sem agrupamento",
    sort: "Ordenação",
    sort_status: "Estado (problemas primeiro)",
    sort_name: "Nome",
    show_hero: "Mostrar a vista geral (imagem e alertas)",
    show_title: "Mostrar o título",
    show_subtitle: "Mostrar o subtítulo",
    show_latency: "Mostrar a latência",
    show_history: "Mostrar a barra de disponibilidade",
    show_uptime: "Mostrar a percentagem de disponibilidade",
    show_ssl: "Mostrar a expiração dos certificados",
    only_problems: "Mostrar apenas os serviços com problemas",
    hours: "Duração do histórico (horas)",
    ssl_warning_days: "Aviso de certificado (dias restantes)",
    ssl_critical_days: "Alerta de certificado (dias restantes)",
    latency_warning: "Resposta lenta acima de (ms)",
    max_items: "Serviços listados no minicartão",
    zoom: "Botão de detalhe",
    zoom_helper: "Alterna o minicartão para a lista completa e vice-versa",
    language: "Idioma",
    lang_auto: "Automático (idioma do Home Assistant)",
  },
  pl: {
    title: "Usługi",
    up: "Działa",
    down: "Niedostępna",
    pending: "Oczekuje",
    maintenance: "Konserwacja",
    unknown: "Nieznany",
    all_up: "Wszystko działa",
    n_down: "Niedostępne: {n}",
    n_pending: "Oczekujące: {n}",
    n_maintenance: "W konserwacji: {n}",
    summary: "Działa: {up}/{total}",
    services_up: "usług działa",
    all_operational: "Wszystkie usługi działają",
    down_for: "Niedostępna od {d}",
    last_ping: "Ostatni ping {when}",
    latency: "Opóźnienie",
    uptime: "Dostępność",
    history: "Ostatnie {h} godz.",
    ssl_in: "SSL {d}",
    ssl_expires_on: "Certyfikat wygasa {date}",
    ssl_expired: "SSL wygasł",
    ssl_invalid: "SSL nieważny",
    other: "Inne",
    src_entity: "Inne czujniki",
    no_services: "Nie znaleziono żadnej usługi. Skonfiguruj obsługiwaną integrację (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry) lub wskaż encje w opcjach karty.",
    no_registry: "Ta karta wymaga Home Assistant 2024.8 lub nowszego.",
    zoom_in: "Pokaż szczegóły",
    zoom_out: "Pokaż mniej",
    entities: "Usługi (puste: wykrywane automatycznie)",
    auto: "Dodaj też wszystkie znalezione usługi",
    sources: "Integracje, w których szukać usług (puste: wszystkie)",
    exclude: "Znalezione usługi do pominięcia",
    tags: "Tylko usługi z tymi tagami (puste: wszystkie)",
    collapsed: "Grupy domyślnie zwinięte (według nazwy)",
    group_by: "Grupuj według",
    group_tag: "Tag",
    group_source: "Integracja",
    group_none: "Bez grupowania",
    sort: "Sortowanie",
    sort_status: "Stan (najpierw problemy)",
    sort_name: "Nazwa",
    show_hero: "Pokaż podsumowanie (obraz i alerty)",
    show_title: "Pokaż tytuł",
    show_subtitle: "Pokaż podtytuł",
    show_latency: "Pokaż opóźnienie",
    show_history: "Pokaż pasek dostępności",
    show_uptime: "Pokaż procent dostępności",
    show_ssl: "Pokaż wygasanie certyfikatów",
    only_problems: "Pokaż tylko usługi z problemem",
    hours: "Długość historii (godziny)",
    ssl_warning_days: "Ostrzeżenie certyfikatu (pozostałe dni)",
    ssl_critical_days: "Alarm certyfikatu (pozostałe dni)",
    latency_warning: "Wolna odpowiedź powyżej (ms)",
    max_items: "Usługi na mini karcie",
    zoom: "Przycisk szczegółów",
    zoom_helper: "Przełącza mini kartę na pełną listę i z powrotem",
    language: "Język",
    lang_auto: "Automatyczny (język Home Assistant)",
  },
  sr: {
    title: "Сервиси",
    up: "Ради",
    down: "Не ради",
    pending: "На чекању",
    maintenance: "Одржавање",
    unknown: "Непознато",
    all_up: "Све ради",
    n_down: "Не ради: {n}",
    n_pending: "На чекању: {n}",
    n_maintenance: "У одржавању: {n}",
    summary: "Ради: {up}/{total}",
    services_up: "сервиса ради",
    all_operational: "Сви сервиси раде",
    down_for: "Не ради већ {d}",
    last_ping: "Последњи пинг {when}",
    latency: "Кашњење",
    uptime: "Доступност",
    history: "Последњих {h} ч",
    ssl_in: "SSL {d}",
    ssl_expires_on: "Сертификат истиче {date}",
    ssl_expired: "SSL истекао",
    ssl_invalid: "SSL неважећи",
    other: "Остало",
    src_entity: "Остали сензори",
    no_services: "Није пронађен ниједан сервис. Подесите подржану интеграцију (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry) или наведите ентитете у опцијама картице.",
    no_registry: "Ова картица захтева Home Assistant 2024.8 или новији.",
    zoom_in: "Прикажи детаље",
    zoom_out: "Прикажи мање",
    entities: "Сервиси (празно: аутоматски пронађени)",
    auto: "Додај и све пронађене сервисе",
    sources: "Интеграције у којима се траже сервиси (празно: све)",
    exclude: "Пронађени сервиси који се изостављају",
    tags: "Само сервиси са овим ознакама (празно: сви)",
    collapsed: "Подразумевано скупљене групе (по имену)",
    group_by: "Групиши по",
    group_tag: "Ознака",
    group_source: "Интеграција",
    group_none: "Без груписања",
    sort: "Сортирање",
    sort_status: "Стање (прво проблеми)",
    sort_name: "Назив",
    show_hero: "Прикажи преглед (слика и упозорења)",
    show_title: "Прикажи наслов",
    show_subtitle: "Прикажи поднаслов",
    show_latency: "Прикажи кашњење",
    show_history: "Прикажи траку доступности",
    show_uptime: "Прикажи проценат доступности",
    show_ssl: "Прикажи истек сертификата",
    only_problems: "Прикажи само сервисе са проблемом",
    hours: "Трајање историје (сати)",
    ssl_warning_days: "Упозорење за сертификат (преостали дани)",
    ssl_critical_days: "Узбуна за сертификат (преостали дани)",
    latency_warning: "Спор одговор изнад (ms)",
    max_items: "Сервиси на мини картици",
    zoom: "Дугме за детаље",
    zoom_helper: "Пребацује мини картицу на целу листу и назад",
    language: "Језик",
    lang_auto: "Аутоматски (језик Home Assistant-а)",
  },
  "sr-Latn": {
    title: "Servisi",
    up: "Radi",
    down: "Ne radi",
    pending: "Na čekanju",
    maintenance: "Održavanje",
    unknown: "Nepoznato",
    all_up: "Sve radi",
    n_down: "Ne radi: {n}",
    n_pending: "Na čekanju: {n}",
    n_maintenance: "U održavanju: {n}",
    summary: "Radi: {up}/{total}",
    services_up: "servisa radi",
    all_operational: "Svi servisi rade",
    down_for: "Ne radi već {d}",
    last_ping: "Poslednji ping {when}",
    latency: "Kašnjenje",
    uptime: "Dostupnost",
    history: "Poslednjih {h} č",
    ssl_in: "SSL {d}",
    ssl_expires_on: "Sertifikat ističe {date}",
    ssl_expired: "SSL istekao",
    ssl_invalid: "SSL nevažeći",
    other: "Ostalo",
    src_entity: "Ostali senzori",
    no_services: "Nije pronađen nijedan servis. Podesite podržanu integraciju (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry) ili navedite entitete u opcijama kartice.",
    no_registry: "Ova kartica zahteva Home Assistant 2024.8 ili noviji.",
    zoom_in: "Prikaži detalje",
    zoom_out: "Prikaži manje",
    entities: "Servisi (prazno: automatski pronađeni)",
    auto: "Dodaj i sve pronađene servise",
    sources: "Integracije u kojima se traže servisi (prazno: sve)",
    exclude: "Pronađeni servisi koji se izostavljaju",
    tags: "Samo servisi sa ovim oznakama (prazno: svi)",
    collapsed: "Podrazumevano skupljene grupe (po imenu)",
    group_by: "Grupiši po",
    group_tag: "Oznaka",
    group_source: "Integracija",
    group_none: "Bez grupisanja",
    sort: "Sortiranje",
    sort_status: "Stanje (prvo problemi)",
    sort_name: "Naziv",
    show_hero: "Prikaži pregled (slika i upozorenja)",
    show_title: "Prikaži naslov",
    show_subtitle: "Prikaži podnaslov",
    show_latency: "Prikaži kašnjenje",
    show_history: "Prikaži traku dostupnosti",
    show_uptime: "Prikaži procenat dostupnosti",
    show_ssl: "Prikaži istek sertifikata",
    only_problems: "Prikaži samo servise sa problemom",
    hours: "Trajanje istorije (sati)",
    ssl_warning_days: "Upozorenje za sertifikat (preostali dani)",
    ssl_critical_days: "Uzbuna za sertifikat (preostali dani)",
    latency_warning: "Spor odgovor iznad (ms)",
    max_items: "Servisi na mini kartici",
    zoom: "Dugme za detalje",
    zoom_helper: "Prebacuje mini karticu na celu listu i nazad",
    language: "Jezik",
    lang_auto: "Automatski (jezik Home Assistant-a)",
  },
  ro: {
    title: "Servicii",
    up: "Activ",
    down: "Căzut",
    pending: "În așteptare",
    maintenance: "Mentenanță",
    unknown: "Necunoscut",
    all_up: "Totul activ",
    n_down: "Căzute: {n}",
    n_pending: "În așteptare: {n}",
    n_maintenance: "În mentenanță: {n}",
    summary: "Active: {up}/{total}",
    services_up: "servicii active",
    all_operational: "Toate serviciile funcționează",
    down_for: "Căzut de {d}",
    last_ping: "Ultimul ping {when}",
    latency: "Latență",
    uptime: "Disponibilitate",
    history: "Ultimele {h} ore",
    ssl_in: "SSL {d}",
    ssl_expires_on: "Certificatul expiră pe {date}",
    ssl_expired: "SSL expirat",
    ssl_invalid: "SSL invalid",
    other: "Altele",
    src_entity: "Alți senzori",
    no_services: "Niciun serviciu găsit. Configurați o integrare acceptată (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry) sau indicați entități în opțiunile cardului.",
    no_registry: "Acest card necesită Home Assistant 2024.8 sau mai nou.",
    zoom_in: "Afișează detaliile",
    zoom_out: "Afișează mai puțin",
    entities: "Servicii (gol: găsite automat)",
    auto: "Adaugă și toate serviciile găsite",
    sources: "Integrări în care se caută servicii (gol: toate)",
    exclude: "Servicii găsite care sunt omise",
    tags: "Doar serviciile cu aceste etichete (gol: toate)",
    collapsed: "Grupuri restrânse implicit (după nume)",
    group_by: "Grupează după",
    group_tag: "Etichetă",
    group_source: "Integrare",
    group_none: "Fără grupare",
    sort: "Sortare",
    sort_status: "Stare (problemele întâi)",
    sort_name: "Nume",
    show_hero: "Afișează rezumatul (imagine și alerte)",
    show_title: "Afișează titlul",
    show_subtitle: "Afișează subtitlul",
    show_latency: "Afișează latența",
    show_history: "Afișează bara de disponibilitate",
    show_uptime: "Afișează procentul de disponibilitate",
    show_ssl: "Afișează expirarea certificatelor",
    only_problems: "Afișează doar serviciile cu probleme",
    hours: "Durata istoricului (ore)",
    ssl_warning_days: "Avertizare certificat (zile rămase)",
    ssl_critical_days: "Alertă certificat (zile rămase)",
    latency_warning: "Răspuns lent peste (ms)",
    max_items: "Servicii listate pe mini card",
    zoom: "Buton de detalii",
    zoom_helper: "Comută mini cardul la lista completă și înapoi",
    language: "Limbă",
    lang_auto: "Automat (limba Home Assistant)",
  },
  da: {
    title: "Tjenester",
    up: "Oppe",
    down: "Nede",
    pending: "Afventer",
    maintenance: "Vedligeholdelse",
    unknown: "Ukendt",
    all_up: "Alt er oppe",
    n_down: "Nede: {n}",
    n_pending: "Afventer: {n}",
    n_maintenance: "Under vedligeholdelse: {n}",
    summary: "{up}/{total} oppe",
    services_up: "tjenester oppe",
    all_operational: "Alle tjenester kører",
    down_for: "Nede i {d}",
    last_ping: "Seneste ping {when}",
    latency: "Latens",
    uptime: "Oppetid",
    history: "Seneste {h} timer",
    ssl_in: "SSL {d}",
    ssl_expires_on: "Certifikatet udløber {date}",
    ssl_expired: "SSL udløbet",
    ssl_invalid: "SSL ugyldigt",
    other: "Andre",
    src_entity: "Andre sensorer",
    no_services: "Ingen tjeneste fundet. Opsæt en understøttet integration (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry) eller angiv entiteter i kortets indstillinger.",
    no_registry: "Dette kort kræver Home Assistant 2024.8 eller nyere.",
    zoom_in: "Vis detaljer",
    zoom_out: "Vis mindre",
    entities: "Tjenester (tom: findes automatisk)",
    auto: "Tilføj også alle fundne tjenester",
    sources: "Integrationer at finde tjenester i (tom: alle)",
    exclude: "Fundne tjenester, der udelades",
    tags: "Kun tjenester med disse mærker (tom: alle)",
    collapsed: "Grupper foldet sammen som standard (efter navn)",
    group_by: "Gruppér efter",
    group_tag: "Mærke",
    group_source: "Integration",
    group_none: "Ingen gruppering",
    sort: "Sortering",
    sort_status: "Status (problemer først)",
    sort_name: "Navn",
    show_hero: "Vis oversigten (billede og advarsler)",
    show_title: "Vis titel",
    show_subtitle: "Vis undertitel",
    show_latency: "Vis latens",
    show_history: "Vis oppetidslinjen",
    show_uptime: "Vis oppetid i procent",
    show_ssl: "Vis certifikaters udløb",
    only_problems: "Vis kun tjenester med et problem",
    hours: "Historikkens længde (timer)",
    ssl_warning_days: "Certifikatadvarsel (dage tilbage)",
    ssl_critical_days: "Certifikatalarm (dage tilbage)",
    latency_warning: "Langsomt svar over (ms)",
    max_items: "Tjenester vist på minikortet",
    zoom: "Detaljeknap",
    zoom_helper: "Skifter minikortet til den fulde liste og tilbage",
    language: "Sprog",
    lang_auto: "Automatisk (Home Assistants sprog)",
  },
  sv: {
    title: "Tjänster",
    up: "Uppe",
    down: "Nere",
    pending: "Väntar",
    maintenance: "Underhåll",
    unknown: "Okänd",
    all_up: "Allt är uppe",
    n_down: "Nere: {n}",
    n_pending: "Väntar: {n}",
    n_maintenance: "Under underhåll: {n}",
    summary: "{up}/{total} uppe",
    services_up: "tjänster uppe",
    all_operational: "Alla tjänster fungerar",
    down_for: "Nere i {d}",
    last_ping: "Senaste ping {when}",
    latency: "Latens",
    uptime: "Drifttid",
    history: "Senaste {h} timmarna",
    ssl_in: "SSL {d}",
    ssl_expires_on: "Certifikatet går ut {date}",
    ssl_expired: "SSL har gått ut",
    ssl_invalid: "SSL ogiltigt",
    other: "Övriga",
    src_entity: "Övriga sensorer",
    no_services: "Ingen tjänst hittades. Konfigurera en integration som stöds (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry) eller ange entiteter i kortets inställningar.",
    no_registry: "Det här kortet kräver Home Assistant 2024.8 eller senare.",
    zoom_in: "Visa detaljer",
    zoom_out: "Visa mindre",
    entities: "Tjänster (tomt: hittas automatiskt)",
    auto: "Lägg även till alla hittade tjänster",
    sources: "Integrationer att hitta tjänster i (tomt: alla)",
    exclude: "Hittade tjänster som utelämnas",
    tags: "Endast tjänster med dessa taggar (tomt: alla)",
    collapsed: "Grupper hopfällda som standard (efter namn)",
    group_by: "Gruppera efter",
    group_tag: "Tagg",
    group_source: "Integration",
    group_none: "Ingen gruppering",
    sort: "Sortering",
    sort_status: "Status (problem först)",
    sort_name: "Namn",
    show_hero: "Visa översikten (bild och varningar)",
    show_title: "Visa titel",
    show_subtitle: "Visa undertitel",
    show_latency: "Visa latens",
    show_history: "Visa drifttidsfältet",
    show_uptime: "Visa drifttid i procent",
    show_ssl: "Visa certifikatens utgång",
    only_problems: "Visa endast tjänster med problem",
    hours: "Historikens längd (timmar)",
    ssl_warning_days: "Certifikatvarning (dagar kvar)",
    ssl_critical_days: "Certifikatlarm (dagar kvar)",
    latency_warning: "Långsamt svar över (ms)",
    max_items: "Tjänster som visas på minikortet",
    zoom: "Detaljknapp",
    zoom_helper: "Växlar minikortet till hela listan och tillbaka",
    language: "Språk",
    lang_auto: "Automatiskt (Home Assistants språk)",
  },
  bg: {
    title: "Услуги",
    up: "Работи",
    down: "Не работи",
    pending: "Изчакване",
    maintenance: "Поддръжка",
    unknown: "Неизвестно",
    all_up: "Всичко работи",
    n_down: "Не работят: {n}",
    n_pending: "Изчакват: {n}",
    n_maintenance: "В поддръжка: {n}",
    summary: "Работят: {up}/{total}",
    services_up: "услуги работят",
    all_operational: "Всички услуги работят",
    down_for: "Не работи от {d}",
    last_ping: "Последен пинг {when}",
    latency: "Закъснение",
    uptime: "Наличност",
    history: "Последните {h} часа",
    ssl_in: "SSL {d}",
    ssl_expires_on: "Сертификатът изтича на {date}",
    ssl_expired: "SSL е изтекъл",
    ssl_invalid: "Невалиден SSL",
    other: "Други",
    src_entity: "Други сензори",
    no_services: "Не е открита услуга. Настройте поддържана интеграция (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry) или посочете обекти в опциите на картата.",
    no_registry: "Тази карта изисква Home Assistant 2024.8 или по-нов.",
    zoom_in: "Покажи подробности",
    zoom_out: "Покажи по-малко",
    entities: "Услуги (празно: откриват се автоматично)",
    auto: "Добави и всички открити услуги",
    sources: "Интеграции, в които се търсят услуги (празно: всички)",
    exclude: "Открити услуги, които се изключват",
    tags: "Само услугите с тези етикети (празно: всички)",
    collapsed: "Свити по подразбиране групи (по име)",
    group_by: "Групиране по",
    group_tag: "Етикет",
    group_source: "Интеграция",
    group_none: "Без групиране",
    sort: "Подреждане",
    sort_status: "Състояние (първо проблемите)",
    sort_name: "Име",
    show_hero: "Покажи обобщението (изображение и сигнали)",
    show_title: "Покажи заглавието",
    show_subtitle: "Покажи подзаглавието",
    show_latency: "Покажи закъснението",
    show_history: "Покажи лентата на наличност",
    show_uptime: "Покажи процента на наличност",
    show_ssl: "Покажи изтичането на сертификатите",
    only_problems: "Покажи само услугите с проблем",
    hours: "Продължителност на историята (часове)",
    ssl_warning_days: "Предупреждение за сертификат (оставащи дни)",
    ssl_critical_days: "Тревога за сертификат (оставащи дни)",
    latency_warning: "Бавен отговор над (ms)",
    max_items: "Услуги в мини картата",
    zoom: "Бутон за подробности",
    zoom_helper: "Превключва мини картата към пълния списък и обратно",
    language: "Език",
    lang_auto: "Автоматично (езикът на Home Assistant)",
  },
  ru: {
    title: "Сервисы",
    up: "Работает",
    down: "Недоступен",
    pending: "Ожидание",
    maintenance: "Обслуживание",
    unknown: "Неизвестно",
    all_up: "Всё работает",
    n_down: "Недоступны: {n}",
    n_pending: "Ожидают: {n}",
    n_maintenance: "На обслуживании: {n}",
    summary: "Работают: {up}/{total}",
    services_up: "сервисов работают",
    all_operational: "Все сервисы работают",
    down_for: "Недоступен уже {d}",
    last_ping: "Последний пинг {when}",
    latency: "Задержка",
    uptime: "Доступность",
    history: "Последние {h} ч",
    ssl_in: "SSL {d}",
    ssl_expires_on: "Сертификат истекает {date}",
    ssl_expired: "SSL истёк",
    ssl_invalid: "SSL недействителен",
    other: "Прочее",
    src_entity: "Другие датчики",
    no_services: "Сервисы не найдены. Настройте поддерживаемую интеграцию (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry) или укажите объекты в настройках карточки.",
    no_registry: "Для этой карточки нужен Home Assistant 2024.8 или новее.",
    zoom_in: "Показать подробности",
    zoom_out: "Показать меньше",
    entities: "Сервисы (пусто: находятся автоматически)",
    auto: "Также добавлять все найденные сервисы",
    sources: "Интеграции для поиска сервисов (пусто: все)",
    exclude: "Найденные сервисы, которые исключаются",
    tags: "Только сервисы с этими тегами (пусто: все)",
    collapsed: "Свёрнутые по умолчанию группы (по имени)",
    group_by: "Группировать по",
    group_tag: "Тег",
    group_source: "Интеграция",
    group_none: "Без группировки",
    sort: "Сортировка",
    sort_status: "Состояние (сначала проблемы)",
    sort_name: "Название",
    show_hero: "Показывать обзор (изображение и предупреждения)",
    show_title: "Показывать заголовок",
    show_subtitle: "Показывать подзаголовок",
    show_latency: "Показывать задержку",
    show_history: "Показывать полосу доступности",
    show_uptime: "Показывать процент доступности",
    show_ssl: "Показывать срок действия сертификатов",
    only_problems: "Показывать только сервисы с проблемами",
    hours: "Длительность истории (часы)",
    ssl_warning_days: "Предупреждение о сертификате (осталось дней)",
    ssl_critical_days: "Тревога о сертификате (осталось дней)",
    latency_warning: "Медленный ответ свыше (ms)",
    max_items: "Сервисы в мини-карточке",
    zoom: "Кнопка подробностей",
    zoom_helper: "Переключает мини-карточку на полный список и обратно",
    language: "Язык",
    lang_auto: "Автоматически (язык Home Assistant)",
  },
  uk: {
    title: "Сервіси",
    up: "Працює",
    down: "Недоступний",
    pending: "Очікування",
    maintenance: "Обслуговування",
    unknown: "Невідомо",
    all_up: "Усе працює",
    n_down: "Недоступні: {n}",
    n_pending: "Очікують: {n}",
    n_maintenance: "На обслуговуванні: {n}",
    summary: "Працюють: {up}/{total}",
    services_up: "сервісів працюють",
    all_operational: "Усі сервіси працюють",
    down_for: "Недоступний уже {d}",
    last_ping: "Останній пінг {when}",
    latency: "Затримка",
    uptime: "Доступність",
    history: "Останні {h} год",
    ssl_in: "SSL {d}",
    ssl_expires_on: "Сертифікат спливає {date}",
    ssl_expired: "SSL сплив",
    ssl_invalid: "SSL недійсний",
    other: "Інше",
    src_entity: "Інші датчики",
    no_services: "Сервіси не знайдено. Налаштуйте підтримувану інтеграцію (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry) або вкажіть об'єкти в налаштуваннях картки.",
    no_registry: "Для цієї картки потрібен Home Assistant 2024.8 або новіший.",
    zoom_in: "Показати подробиці",
    zoom_out: "Показати менше",
    entities: "Сервіси (порожньо: знаходяться автоматично)",
    auto: "Також додавати всі знайдені сервіси",
    sources: "Інтеграції для пошуку сервісів (порожньо: усі)",
    exclude: "Знайдені сервіси, які виключаються",
    tags: "Лише сервіси з цими тегами (порожньо: усі)",
    collapsed: "Типово згорнуті групи (за назвою)",
    group_by: "Групувати за",
    group_tag: "Тег",
    group_source: "Інтеграція",
    group_none: "Без групування",
    sort: "Сортування",
    sort_status: "Стан (спершу проблеми)",
    sort_name: "Назва",
    show_hero: "Показувати огляд (зображення та попередження)",
    show_title: "Показувати заголовок",
    show_subtitle: "Показувати підзаголовок",
    show_latency: "Показувати затримку",
    show_history: "Показувати смугу доступності",
    show_uptime: "Показувати відсоток доступності",
    show_ssl: "Показувати термін дії сертифікатів",
    only_problems: "Показувати лише сервіси з проблемами",
    hours: "Тривалість історії (години)",
    ssl_warning_days: "Попередження про сертифікат (залишилось днів)",
    ssl_critical_days: "Тривога щодо сертифіката (залишилось днів)",
    latency_warning: "Повільна відповідь понад (ms)",
    max_items: "Сервіси в міні-картці",
    zoom: "Кнопка подробиць",
    zoom_helper: "Перемикає міні-картку на повний список і назад",
    language: "Мова",
    lang_auto: "Автоматично (мова Home Assistant)",
  },
  hu: {
    title: "Szolgáltatások",
    up: "Elérhető",
    down: "Nem elérhető",
    pending: "Függőben",
    maintenance: "Karbantartás",
    unknown: "Ismeretlen",
    all_up: "Minden elérhető",
    n_down: "Nem elérhető: {n}",
    n_pending: "Függőben: {n}",
    n_maintenance: "Karbantartás alatt: {n}",
    summary: "Elérhető: {up}/{total}",
    services_up: "szolgáltatás elérhető",
    all_operational: "Minden szolgáltatás működik",
    down_for: "{d} óta nem elérhető",
    last_ping: "Utolsó ping: {when}",
    latency: "Késleltetés",
    uptime: "Rendelkezésre állás",
    history: "Utolsó {h} óra",
    ssl_in: "SSL {d}",
    ssl_expires_on: "A tanúsítvány lejár: {date}",
    ssl_expired: "SSL lejárt",
    ssl_invalid: "SSL érvénytelen",
    other: "Egyéb",
    src_entity: "Egyéb érzékelők",
    no_services: "Nem található szolgáltatás. Állíts be egy támogatott integrációt (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry), vagy adj meg entitásokat a kártya beállításaiban.",
    no_registry: "Ehhez a kártyához Home Assistant 2024.8 vagy újabb szükséges.",
    zoom_in: "Részletek",
    zoom_out: "Kevesebb",
    entities: "Szolgáltatások (üres: automatikus keresés)",
    auto: "Az összes talált szolgáltatás hozzáadása is",
    sources: "Integrációk a szolgáltatások kereséséhez (üres: mind)",
    exclude: "Kihagyott talált szolgáltatások",
    tags: "Csak az ilyen címkéjű szolgáltatások (üres: mind)",
    collapsed: "Alapértelmezésben összecsukott csoportok (név szerint)",
    group_by: "Csoportosítás",
    group_tag: "Címke",
    group_source: "Integráció",
    group_none: "Nincs csoportosítás",
    sort: "Rendezés",
    sort_status: "Állapot (problémák elöl)",
    sort_name: "Név",
    show_hero: "Áttekintés megjelenítése (kép és riasztások)",
    show_title: "Cím megjelenítése",
    show_subtitle: "Alcím megjelenítése",
    show_latency: "Késleltetés megjelenítése",
    show_history: "Rendelkezésre állási sáv megjelenítése",
    show_uptime: "Rendelkezésre állás százalékban",
    show_ssl: "Tanúsítványok lejáratának megjelenítése",
    only_problems: "Csak a hibás szolgáltatások megjelenítése",
    hours: "Előzmények hossza (óra)",
    ssl_warning_days: "Tanúsítvány figyelmeztetés (hátralévő napok)",
    ssl_critical_days: "Tanúsítvány riasztás (hátralévő napok)",
    latency_warning: "Lassú válasz e fölött (ms)",
    max_items: "A mini kártyán listázott szolgáltatások",
    zoom: "Részletek gomb",
    zoom_helper: "A mini kártyát a teljes listára váltja és vissza",
    language: "Nyelv",
    lang_auto: "Automatikus (a Home Assistant nyelve)",
  },
  sk: {
    title: "Služby",
    up: "Beží",
    down: "Nedostupné",
    pending: "Čaká",
    maintenance: "Údržba",
    unknown: "Neznámy",
    all_up: "Všetko beží",
    n_down: "Nedostupné: {n}",
    n_pending: "Čakajúce: {n}",
    n_maintenance: "V údržbe: {n}",
    summary: "Beží: {up}/{total}",
    services_up: "služieb beží",
    all_operational: "Všetky služby bežia",
    down_for: "Nedostupné {d}",
    last_ping: "Posledný ping {when}",
    latency: "Latencia",
    uptime: "Dostupnosť",
    history: "Posledných {h} h",
    ssl_in: "SSL {d}",
    ssl_expires_on: "Platnosť certifikátu končí {date}",
    ssl_expired: "Platnosť SSL vypršala",
    ssl_invalid: "Neplatné SSL",
    other: "Ostatné",
    src_entity: "Ostatné senzory",
    no_services: "Nenašla sa žiadna služba. Nastavte podporovanú integráciu (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry) alebo uveďte entity v nastaveniach karty.",
    no_registry: "Táto karta vyžaduje Home Assistant 2024.8 alebo novší.",
    zoom_in: "Zobraziť podrobnosti",
    zoom_out: "Zobraziť menej",
    entities: "Služby (prázdne: nájdené automaticky)",
    auto: "Pridať aj všetky nájdené služby",
    sources: "Integrácie na hľadanie služieb (prázdne: všetky)",
    exclude: "Nájdené služby, ktoré sa vynechajú",
    tags: "Iba služby s týmito štítkami (prázdne: všetky)",
    collapsed: "Predvolene zbalené skupiny (podľa názvu)",
    group_by: "Zoskupiť podľa",
    group_tag: "Štítok",
    group_source: "Integrácia",
    group_none: "Bez zoskupenia",
    sort: "Zoradenie",
    sort_status: "Stav (najprv problémy)",
    sort_name: "Názov",
    show_hero: "Zobraziť prehľad (obrázok a upozornenia)",
    show_title: "Zobraziť názov",
    show_subtitle: "Zobraziť podnadpis",
    show_latency: "Zobraziť latenciu",
    show_history: "Zobraziť pruh dostupnosti",
    show_uptime: "Zobraziť percento dostupnosti",
    show_ssl: "Zobraziť platnosť certifikátov",
    only_problems: "Zobraziť iba služby s problémom",
    hours: "Dĺžka histórie (hodiny)",
    ssl_warning_days: "Upozornenie na certifikát (zostávajúce dni)",
    ssl_critical_days: "Poplach certifikátu (zostávajúce dni)",
    latency_warning: "Pomalá odpoveď nad (ms)",
    max_items: "Služby na mini karte",
    zoom: "Tlačidlo podrobností",
    zoom_helper: "Prepína mini kartu na celý zoznam a späť",
    language: "Jazyk",
    lang_auto: "Automaticky (jazyk Home Assistant)",
  },
  cs: {
    title: "Služby",
    up: "Běží",
    down: "Nedostupné",
    pending: "Čeká",
    maintenance: "Údržba",
    unknown: "Neznámý",
    all_up: "Vše běží",
    n_down: "Nedostupné: {n}",
    n_pending: "Čekající: {n}",
    n_maintenance: "V údržbě: {n}",
    summary: "Běží: {up}/{total}",
    services_up: "služeb běží",
    all_operational: "Všechny služby běží",
    down_for: "Nedostupné {d}",
    last_ping: "Poslední ping {when}",
    latency: "Latence",
    uptime: "Dostupnost",
    history: "Posledních {h} h",
    ssl_in: "SSL {d}",
    ssl_expires_on: "Platnost certifikátu končí {date}",
    ssl_expired: "Platnost SSL vypršela",
    ssl_invalid: "Neplatné SSL",
    other: "Ostatní",
    src_entity: "Ostatní senzory",
    no_services: "Nebyla nalezena žádná služba. Nastavte podporovanou integraci (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry) nebo uveďte entity v nastavení karty.",
    no_registry: "Tato karta vyžaduje Home Assistant 2024.8 nebo novější.",
    zoom_in: "Zobrazit podrobnosti",
    zoom_out: "Zobrazit méně",
    entities: "Služby (prázdné: nalezeny automaticky)",
    auto: "Přidat i všechny nalezené služby",
    sources: "Integrace pro hledání služeb (prázdné: všechny)",
    exclude: "Nalezené služby, které se vynechají",
    tags: "Jen služby s těmito štítky (prázdné: všechny)",
    collapsed: "Výchozí sbalené skupiny (podle názvu)",
    group_by: "Seskupit podle",
    group_tag: "Štítek",
    group_source: "Integrace",
    group_none: "Bez seskupení",
    sort: "Řazení",
    sort_status: "Stav (nejdřív problémy)",
    sort_name: "Název",
    show_hero: "Zobrazit přehled (obrázek a upozornění)",
    show_title: "Zobrazit název",
    show_subtitle: "Zobrazit podnadpis",
    show_latency: "Zobrazit latenci",
    show_history: "Zobrazit pruh dostupnosti",
    show_uptime: "Zobrazit procento dostupnosti",
    show_ssl: "Zobrazit platnost certifikátů",
    only_problems: "Zobrazit jen služby s problémem",
    hours: "Délka historie (hodiny)",
    ssl_warning_days: "Upozornění na certifikát (zbývající dny)",
    ssl_critical_days: "Poplach certifikátu (zbývající dny)",
    latency_warning: "Pomalá odpověď nad (ms)",
    max_items: "Služby na mini kartě",
    zoom: "Tlačítko podrobností",
    zoom_helper: "Přepíná mini kartu na celý seznam a zpět",
    language: "Jazyk",
    lang_auto: "Automaticky (jazyk Home Assistant)",
  },
  sl: {
    title: "Storitve",
    up: "Deluje",
    down: "Ne deluje",
    pending: "V čakanju",
    maintenance: "Vzdrževanje",
    unknown: "Neznano",
    all_up: "Vse deluje",
    n_down: "Ne deluje: {n}",
    n_pending: "V čakanju: {n}",
    n_maintenance: "V vzdrževanju: {n}",
    summary: "Deluje: {up}/{total}",
    services_up: "storitev deluje",
    all_operational: "Vse storitve delujejo",
    down_for: "Ne deluje že {d}",
    last_ping: "Zadnji ping {when}",
    latency: "Zakasnitev",
    uptime: "Razpoložljivost",
    history: "Zadnjih {h} ur",
    ssl_in: "SSL {d}",
    ssl_expires_on: "Potrdilo poteče {date}",
    ssl_expired: "SSL je potekel",
    ssl_invalid: "SSL ni veljaven",
    other: "Drugo",
    src_entity: "Drugi senzorji",
    no_services: "Ni najdene storitve. Nastavite podprto integracijo (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry) ali navedite entitete v možnostih kartice.",
    no_registry: "Ta kartica zahteva Home Assistant 2024.8 ali novejši.",
    zoom_in: "Pokaži podrobnosti",
    zoom_out: "Pokaži manj",
    entities: "Storitve (prazno: samodejno najdene)",
    auto: "Dodaj tudi vse najdene storitve",
    sources: "Integracije za iskanje storitev (prazno: vse)",
    exclude: "Najdene storitve, ki se izpustijo",
    tags: "Samo storitve s temi oznakami (prazno: vse)",
    collapsed: "Privzeto strnjene skupine (po imenu)",
    group_by: "Združi po",
    group_tag: "Oznaka",
    group_source: "Integracija",
    group_none: "Brez združevanja",
    sort: "Razvrščanje",
    sort_status: "Stanje (najprej težave)",
    sort_name: "Ime",
    show_hero: "Pokaži pregled (slika in opozorila)",
    show_title: "Pokaži naslov",
    show_subtitle: "Pokaži podnaslov",
    show_latency: "Pokaži zakasnitev",
    show_history: "Pokaži vrstico razpoložljivosti",
    show_uptime: "Pokaži odstotek razpoložljivosti",
    show_ssl: "Pokaži potek potrdil",
    only_problems: "Pokaži samo storitve s težavo",
    hours: "Dolžina zgodovine (ure)",
    ssl_warning_days: "Opozorilo za potrdilo (preostali dnevi)",
    ssl_critical_days: "Alarm za potrdilo (preostali dnevi)",
    latency_warning: "Počasen odziv nad (ms)",
    max_items: "Storitve na mini kartici",
    zoom: "Gumb za podrobnosti",
    zoom_helper: "Preklopi mini kartico na celoten seznam in nazaj",
    language: "Jezik",
    lang_auto: "Samodejno (jezik Home Assistanta)",
  },
  lv: {
    title: "Pakalpojumi",
    up: "Darbojas",
    down: "Nedarbojas",
    pending: "Gaida",
    maintenance: "Apkope",
    unknown: "Nezināms",
    all_up: "Viss darbojas",
    n_down: "Nedarbojas: {n}",
    n_pending: "Gaida: {n}",
    n_maintenance: "Apkopē: {n}",
    summary: "Darbojas: {up}/{total}",
    services_up: "pakalpojumi darbojas",
    all_operational: "Visi pakalpojumi darbojas",
    down_for: "Nedarbojas jau {d}",
    last_ping: "Pēdējais pings {when}",
    latency: "Aizture",
    uptime: "Pieejamība",
    history: "Pēdējās {h} stundas",
    ssl_in: "SSL {d}",
    ssl_expires_on: "Sertifikāts beidzas {date}",
    ssl_expired: "SSL beidzies",
    ssl_invalid: "SSL nederīgs",
    other: "Citi",
    src_entity: "Citi sensori",
    no_services: "Neviens pakalpojums nav atrasts. Iestatiet atbalstītu integrāciju (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry) vai norādiet entītijas kartītes opcijās.",
    no_registry: "Šai kartītei nepieciešams Home Assistant 2024.8 vai jaunāks.",
    zoom_in: "Rādīt detaļas",
    zoom_out: "Rādīt mazāk",
    entities: "Pakalpojumi (tukšs: atrod automātiski)",
    auto: "Pievienot arī visus atrastos pakalpojumus",
    sources: "Integrācijas pakalpojumu meklēšanai (tukšs: visas)",
    exclude: "Atrastie pakalpojumi, kurus izlaist",
    tags: "Tikai pakalpojumi ar šīm birkām (tukšs: visi)",
    collapsed: "Pēc noklusējuma sakļautās grupas (pēc nosaukuma)",
    group_by: "Grupēt pēc",
    group_tag: "Birka",
    group_source: "Integrācija",
    group_none: "Bez grupēšanas",
    sort: "Kārtošana",
    sort_status: "Stāvoklis (vispirms problēmas)",
    sort_name: "Nosaukums",
    show_hero: "Rādīt pārskatu (attēls un brīdinājumi)",
    show_title: "Rādīt virsrakstu",
    show_subtitle: "Rādīt apakšvirsrakstu",
    show_latency: "Rādīt aizturi",
    show_history: "Rādīt pieejamības joslu",
    show_uptime: "Rādīt pieejamības procentus",
    show_ssl: "Rādīt sertifikātu derīguma termiņu",
    only_problems: "Rādīt tikai pakalpojumus ar problēmu",
    hours: "Vēstures ilgums (stundas)",
    ssl_warning_days: "Sertifikāta brīdinājums (atlikušās dienas)",
    ssl_critical_days: "Sertifikāta trauksme (atlikušās dienas)",
    latency_warning: "Lēna atbilde virs (ms)",
    max_items: "Pakalpojumi mini kartītē",
    zoom: "Detaļu poga",
    zoom_helper: "Pārslēdz mini kartīti uz pilno sarakstu un atpakaļ",
    language: "Valoda",
    lang_auto: "Automātiski (Home Assistant valoda)",
  },
  el: {
    title: "Υπηρεσίες",
    up: "Σε λειτουργία",
    down: "Εκτός λειτουργίας",
    pending: "Σε αναμονή",
    maintenance: "Συντήρηση",
    unknown: "Άγνωστο",
    all_up: "Όλα σε λειτουργία",
    n_down: "Εκτός λειτουργίας: {n}",
    n_pending: "Σε αναμονή: {n}",
    n_maintenance: "Σε συντήρηση: {n}",
    summary: "Σε λειτουργία: {up}/{total}",
    services_up: "υπηρεσίες σε λειτουργία",
    all_operational: "Όλες οι υπηρεσίες λειτουργούν",
    down_for: "Εκτός λειτουργίας για {d}",
    last_ping: "Τελευταίο ping {when}",
    latency: "Καθυστέρηση",
    uptime: "Διαθεσιμότητα",
    history: "Τελευταίες {h} ώρες",
    ssl_in: "SSL {d}",
    ssl_expires_on: "Το πιστοποιητικό λήγει στις {date}",
    ssl_expired: "Το SSL έληξε",
    ssl_invalid: "Μη έγκυρο SSL",
    other: "Άλλα",
    src_entity: "Άλλοι αισθητήρες",
    no_services: "Δεν βρέθηκε καμία υπηρεσία. Ρυθμίστε μια υποστηριζόμενη ενσωμάτωση (Uptime Kuma, Healthchecks.io, Ping, Certificate Expiry) ή δηλώστε οντότητες στις επιλογές της κάρτας.",
    no_registry: "Αυτή η κάρτα απαιτεί Home Assistant 2024.8 ή νεότερο.",
    zoom_in: "Εμφάνιση λεπτομερειών",
    zoom_out: "Εμφάνιση λιγότερων",
    entities: "Υπηρεσίες (κενό: αυτόματος εντοπισμός)",
    auto: "Προσθήκη και όλων των υπηρεσιών που βρέθηκαν",
    sources: "Ενσωματώσεις για εύρεση υπηρεσιών (κενό: όλες)",
    exclude: "Υπηρεσίες που βρέθηκαν και παραλείπονται",
    tags: "Μόνο οι υπηρεσίες με αυτές τις ετικέτες (κενό: όλες)",
    collapsed: "Ομάδες κλειστές από προεπιλογή (κατά όνομα)",
    group_by: "Ομαδοποίηση κατά",
    group_tag: "Ετικέτα",
    group_source: "Ενσωμάτωση",
    group_none: "Χωρίς ομαδοποίηση",
    sort: "Ταξινόμηση",
    sort_status: "Κατάσταση (πρώτα τα προβλήματα)",
    sort_name: "Όνομα",
    show_hero: "Εμφάνιση επισκόπησης (εικόνα και ειδοποιήσεις)",
    show_title: "Εμφάνιση τίτλου",
    show_subtitle: "Εμφάνιση υπότιτλου",
    show_latency: "Εμφάνιση καθυστέρησης",
    show_history: "Εμφάνιση γραμμής διαθεσιμότητας",
    show_uptime: "Εμφάνιση ποσοστού διαθεσιμότητας",
    show_ssl: "Εμφάνιση λήξης πιστοποιητικών",
    only_problems: "Εμφάνιση μόνο υπηρεσιών με πρόβλημα",
    hours: "Διάρκεια ιστορικού (ώρες)",
    ssl_warning_days: "Προειδοποίηση πιστοποιητικού (εναπομείνασες ημέρες)",
    ssl_critical_days: "Συναγερμός πιστοποιητικού (εναπομείνασες ημέρες)",
    latency_warning: "Αργή απόκριση πάνω από (ms)",
    max_items: "Υπηρεσίες στη μίνι κάρτα",
    zoom: "Κουμπί λεπτομερειών",
    zoom_helper: "Εναλλάσσει τη μίνι κάρτα στην πλήρη λίστα και πίσω",
    language: "Γλώσσα",
    lang_auto: "Αυτόματη (γλώσσα του Home Assistant)",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

// Locale for Intl: the card's language: option, else HA's full locale (keeps its region) when its base matches the
// resolved card language, else that language. A bare "pt" (European Portuguese in HA) becomes "pt-PT".
const intlLocale = (hass, config) => {
  const l = lang(hass, config);
  const src = config?.language || (hass && (hass.locale?.language || hass.language)) || "";
  const out = src && src.split("-")[0] === l.split("-")[0] ? src : l;
  return out === "pt" ? "pt-PT" : out;
};

const t = (hass, config, key, vars = {}) =>
  String(STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

const valid = (s) => !!s && !["unknown", "unavailable", ""].includes(s.state);

const num = (s) => {
  if (!valid(s)) return null;
  const v = parseFloat(s.state);
  return Number.isFinite(v) ? v : null;
};

const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;

const UNIT_FMT = {};
const fmtUnit = (v, unit, locale, digits = 0) =>
  (UNIT_FMT[`${locale}|${unit}|${digits}`] ??= new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "short", maximumFractionDigits: digits })).format(v);

// A duration in milliseconds as one short unit: "12 min", "3 h", "2 d" (whole units, rounded down).
const fmtDuration = (ms, locale) => {
  const min = Math.max(0, Math.floor(ms / 60000));
  if (min < 60) return fmtUnit(min, "minute", locale);
  const h = Math.floor(min / 60);
  if (h < 48) return fmtUnit(h, "hour", locale);
  return fmtUnit(Math.floor(h / 24), "day", locale);
};

// A response time: "42 ms" below a second, "1.2 s" above.
const fmtLatency = (ms, locale) => (ms < 1000 ? fmtUnit(Math.round(ms), "millisecond", locale) : fmtUnit(ms / 1000, "second", locale, 1));

// Uptime as a whole percentage, rounded down below 100: any downtime shows (99.97 % reads 99 %, never 100 %).
const fmtPct = (p, locale) => `${(p >= 100 ? 100 : Math.max(0, Math.floor(p))).toLocaleString(locale)} %`;

const RTF = {};
const ago = (locale, ms) => {
  const rtf = (RTF[locale] ??= new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "long" }));
  const s = Math.round((ms - Date.now()) / 1000);
  const a = Math.abs(s);
  if (a < 60) return rtf.format(0, "minute");
  if (a < 3600) return rtf.format(Math.trunc(s / 60), "minute");
  if (a < 86400) return rtf.format(Math.trunc(s / 3600), "hour");
  return rtf.format(Math.trunc(s / 86400), "day");
};

// ---------------------------------------------------------------------------
// Statuses
// ---------------------------------------------------------------------------

// A service status, from best to worst; its class colors the dots, chips and bars.
const STATUS_RANK = { unknown: 0, up: 1, maintenance: 2, pending: 3, down: 4 };
const STATUS_CLASS = { up: "ok", down: "crit", pending: "warn", maintenance: "maint", unknown: "idle" };
const UP_WORDS = new Set(["up", "on", "online", "ok", "connected", "home", "true", "running", "available", "alive", "healthy"]);
const DOWN_WORDS = new Set(["down", "off", "offline", "error", "problem", "disconnected", "false", "unreachable", "failed", "dead", "unhealthy"]);

// Status of one raw state of a service's status entity. `deviceClass` is the one of its binary sensor: a "problem"
// sensor is on when the service is down.
const statusFromState = (entityId, raw, deviceClass) => {
  const s = String(raw ?? "").toLowerCase();
  if (!s || s === "unknown" || s === "unavailable") return "unknown";
  if (String(entityId).startsWith("binary_sensor.")) {
    const up = s === "on";
    if (s !== "on" && s !== "off") return "unknown";
    return deviceClass === "problem" ? (up ? "down" : "up") : up ? "up" : "down";
  }
  if (s === "pending" || s === "maintenance") return s;
  if (UP_WORDS.has(s)) return "up";
  if (DOWN_WORDS.has(s)) return "down";
  return "unknown";
};

const worst = (list) => list.reduce((a, b) => (STATUS_RANK[b] > STATUS_RANK[a] ? b : a), "unknown");

// ---------------------------------------------------------------------------
// Picture: a drawn server rack with a heartbeat badge, colored and animated by the overall state
// ---------------------------------------------------------------------------

// Animations of the picture. It is an <img>, so CSS animations run but no script does.
//   up          — the heartbeat trace runs across the badge, the drive lights flicker
//   down        — alarm rings spread from the badge, the failed unit's lights blink red, the trace is flat
//   pending     — the badge's three dots light up in turn, the lights blink orange
//   maintenance — the wrench of the badge swings, the lights stay blue
const ANIM_CSS = `
  .trace { stroke-dasharray: 34 60; animation: trace 1.6s linear infinite; }
  .flicker { animation: flicker 1.2s steps(2, jump-none) infinite; }
  .blink { animation: blink 1s ease-in-out infinite; }
  .ring { transform-box: fill-box; transform-origin: center; animation: ring 1.8s ease-out infinite; }
  .dots circle { animation: dot 1.5s ease-in-out infinite; }
  .sway { transform-box: view-box; animation: sway 1.6s ease-in-out infinite alternate; }
  .d1 { animation-delay: -.5s; } .d2 { animation-delay: -1s; } .d3 { animation-delay: -.3s; } .d4 { animation-delay: -.8s; }
  @keyframes trace { from { stroke-dashoffset: 94; } to { stroke-dashoffset: 0; } }
  @keyframes flicker { 0% { opacity: 1; } 50% { opacity: .35; } 100% { opacity: 1; } }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: .15; } }
  @keyframes ring { from { transform: scale(.7); opacity: .9; } to { transform: scale(1.6); opacity: 0; } }
  @keyframes dot { 0%, 100% { opacity: .25; } 40% { opacity: 1; } }
  @keyframes sway { from { transform: rotate(-14deg); } to { transform: rotate(14deg); } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`;

const STATE_COLORS = { ok: "#43a047", warn: "#ffa600", crit: "#db4437", maint: "#039be5", idle: "#9e9e9e" };

// The rack for an overall status (up, down, pending, maintenance, unknown): three units with their lights, and the
// badge at the bottom right.
const rackSvg = (status = "up") => {
  const cls = STATUS_CLASS[status] || "idle";
  const col = STATE_COLORS[cls];
  const units = [0, 1, 2]
    .map((i) => {
      const y = 22 + i * 32;
      const failed = status === "down" && i === 1;
      const lc = failed ? STATE_COLORS.crit : status === "unknown" ? "#6b7280" : status === "up" || status === "down" ? STATE_COLORS.ok : col;
      const anim = status === "up" || (status === "down" && !failed) ? `flicker d${i + 2}` : (status === "pending" || failed) ? `blink d${i}` : "";
      return `<rect x="26" y="${y}" width="68" height="24" rx="5" fill="#2b3038"/><rect x="26" y="${y}" width="68" height="4" rx="2" fill="#ffffff" opacity=".06"/>
        <circle cx="36" cy="${y + 12}" r="3" fill="${lc}" class="${anim}"/><circle cx="45" cy="${y + 12}" r="3" fill="${status === "up" || (status === "down" && !failed) ? "#8bc34a" : lc}" opacity=".85" class="${status === "up" || (status === "down" && !failed) ? `flicker d${i}` : anim}"/>
        ${[0, 1, 2, 3].map((k) => `<rect x="${56 + k * 8}" y="${y + 7}" width="4" height="10" rx="1.5" fill="#414852"/>`).join("")}`;
    })
    .join("");
  const bx = 92;
  const by = 112;
  let badge = `<circle cx="${bx}" cy="${by}" r="19" fill="${col}"/><circle cx="${bx}" cy="${by}" r="19" fill="none" stroke="#ffffff" stroke-opacity=".9" stroke-width="2.5"/>`;
  const ecg = `M${bx - 13} ${by} h6 l3 -8 l4 15 l3 -11 l2 4 h8`;
  if (status === "up") {
    badge += `<path d="${ecg}" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="${ecg}" fill="none" stroke="#ffffff" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round" class="trace"/>`;
  } else if (status === "down") {
    badge = [0, 1]
      .map((i) => `<circle cx="${bx}" cy="${by}" r="19" fill="none" stroke="${col}" stroke-width="2.5" class="ring d${i}"/>`)
      .join("") + badge;
    badge += `<path d="M${bx - 12} ${by} h24" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round"/>`;
  } else if (status === "pending") {
    badge += `<g class="dots" fill="#ffffff">${[-7, 0, 7].map((dx, i) => `<circle cx="${bx + dx}" cy="${by}" r="2.8" class="${i ? `d${i}` : ""}"/>`).join("")}</g>`;
  } else if (status === "maintenance") {
    badge += `<g class="sway" style="transform-origin:${bx}px ${by}px"><path transform="translate(${bx - 9} ${by - 9}) scale(.75)" fill="#ffffff" d="${ICONS.wrench}"/></g>`;
  } else {
    badge += `<path d="M${bx - 8} ${by} h16" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140"><style>${ANIM_CSS}</style><defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f3f6"/><stop offset="1" stop-color="#c3c9d2"/></linearGradient></defs>
    <ellipse cx="60" cy="134" rx="40" ry="4" opacity=".22"/>
    <rect x="18" y="10" width="84" height="122" rx="10" fill="url(#g)" stroke="#aab1bb"/>
    <rect x="22" y="14" width="76" height="102" rx="7" fill="#1d2127" opacity=".12"/>
    ${units}
    <rect x="30" y="124" width="10" height="6" rx="2" fill="#8d95a0"/><rect x="80" y="124" width="10" height="6" rx="2" fill="#8d95a0"/>
    ${badge}</svg>`;
};

const svgUri = (svg) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

// ---------------------------------------------------------------------------
// Discovery: services from the registries
// ---------------------------------------------------------------------------

// Host of a URL ("https://cloud.example.net/login" → "cloud.example.net"); null when it is not one.
const hostOf = (url) => {
  try {
    return new URL(String(url)).hostname.toLowerCase() || null;
  } catch {
    return null;
  }
};

const deviceName = (dev) => (dev ? dev.name_by_user || dev.name || "" : "");

// The services found in the registries, cached per registry objects (Home Assistant replaces them when they change):
// [{ key, source, name?, device_id, status, latency?, cert?, cert_kind?, uptime?, url?, hostname?, type?, tags_entity? }]
// The name, host and tags are read at render time, from the states.
const _cache = new WeakMap();
const discover = (hass) => {
  const ents = hass.entities;
  const devs = hass.devices || {};
  const hit = _cache.get(ents);
  if (hit && hit.devs === devs) return hit.list;
  const list = [];
  const kuma = new Map();
  const pingByDevice = new Map();
  const pings = [];
  for (const e of Object.values(ents)) {
    const id = e.entity_id;
    const domain = id.split(".")[0];
    // A hidden status entity hides its service; the hidden sensors that only add to it (URL, response time…) still do.
    const extra = (e.platform === "uptime_kuma" && e.translation_key !== "status") || (e.platform === "ping" && domain !== "binary_sensor");
    if (e.disabled_by || (e.hidden && !extra)) continue;
    if (e.platform === "uptime_kuma" && e.device_id) {
      const m = kuma.get(e.device_id) || {};
      if (e.translation_key) m[e.translation_key] = id;
      kuma.set(e.device_id, m);
    } else if (e.platform === "healthchecksio" && domain === "binary_sensor") {
      list.push({ key: id, source: "healthchecks", status: id, device_id: e.device_id });
    } else if (e.platform === "ping") {
      if (domain === "binary_sensor") pings.push(e);
      else if (e.translation_key === "round_trip_time_avg" && e.device_id) pingByDevice.set(e.device_id, id);
    } else if (e.platform === "cert_expiry" && domain === "sensor") {
      const ident = (devs[e.device_id]?.identifiers || []).find((i) => i[0] === "cert_expiry");
      const host = ident ? String(ident[1]).replace(/:\d+$/, "").toLowerCase() : null;
      list.push({ key: id, source: "cert_expiry", status: id, cert: id, cert_kind: "timestamp", device_id: e.device_id, cert_host: host });
    }
  }
  for (const [device_id, m] of kuma) {
    if (!m.status) continue;
    list.push({
      key: m.status,
      source: "uptime_kuma",
      device_id,
      status: m.status,
      latency: m.response_time,
      cert: m.cert_days_remaining,
      cert_kind: m.cert_days_remaining ? "days" : undefined,
      cert_src: m.cert_days_remaining ? "kuma" : undefined,
      uptime: m.uptime_1d,
      url: m.url,
      hostname: m.hostname,
      type: m.type,
      tags_entity: m.tags,
    });
  }
  for (const e of pings) {
    list.push({ key: e.entity_id, source: "ping", status: e.entity_id, device_id: e.device_id, latency: pingByDevice.get(e.device_id) });
  }
  _cache.set(ents, { devs, list });
  return list;
};

// A service as given in the `entities` option (an entity id, or { entity, name, tags, latency_entity, cert_entity,
// uptime_entity }): a discovered service when the entity is the status of one (its latency, certificate… come along),
// else a service of its own.
const fromConfig = (item, found) => {
  const o = typeof item === "string" ? { entity: item } : item || {};
  if (!o.entity) return null;
  const base = found.find((s) => s.status === o.entity) || { key: o.entity, source: "entity", status: o.entity };
  const svc = { ...base, key: o.entity, conf: o };
  if (o.latency_entity) svc.latency = o.latency_entity;
  if (o.uptime_entity) svc.uptime = o.uptime_entity;
  if (o.cert_entity) {
    svc.cert = o.cert_entity;
    svc.cert_src = "conf";
    svc.cert_kind = String(o.cert_entity).startsWith("sensor.") && base.source !== "uptime_kuma" ? undefined : svc.cert_kind;
  }
  return svc;
};

// The services a card shows, in discovery order: the `entities` option, or everything found (`auto`, the default
// without `entities`). A Certificate Expiry certificate whose host is the one of another service goes to that service
// (its row shows the expiry); the others are services of their own.
const servicesFor = (hass, config) => {
  const found = discover(hass);
  const list = [];
  const seen = new Set();
  const add = (s) => {
    if (s && !seen.has(s.key)) {
      seen.add(s.key);
      list.push(s);
    }
  };
  for (const item of Array.isArray(config.entities) ? config.entities : []) add(fromConfig(item, found));
  const auto = config.auto ?? !(Array.isArray(config.entities) && config.entities.length);
  if (auto) {
    const only = config.sources ? new Set([].concat(config.sources)) : null;
    const exclude = new Set([].concat(config.exclude || []));
    for (const s of found) if ((!only || only.has(s.source)) && !exclude.has(s.key)) add({ ...s });
  }
  // Certificates onto the service of the same host: the first one of each host without a certificate of its own (an
  // Uptime Kuma one gives way: Certificate Expiry also tells an invalid certificate). One pass over the services.
  const owners = new Map();
  if (list.some((s) => s.source === "cert_expiry" && s.cert_host && !s.conf)) {
    for (const o of list) {
      if (o.source === "cert_expiry" || (o.cert && o.cert_src !== "kuma")) continue;
      const host = hostFor(hass, o);
      if (host && !owners.has(host)) owners.set(host, o);
    }
  }
  const out = [];
  for (const s of list) {
    const owner = s.source === "cert_expiry" && s.cert_host && !s.conf ? owners.get(s.cert_host) : null;
    if (owner && owner.cert_src !== "cert_expiry") {
      owner.cert = s.cert;
      owner.cert_kind = "timestamp";
      owner.cert_src = "cert_expiry";
      continue;
    }
    out.push(s);
  }
  for (const s of out) if (s.cert && !s.cert_kind) s.cert_kind = hass.states[s.cert]?.attributes?.device_class === "timestamp" ? "timestamp" : "days";
  return out;
};

// Host of a service, for the certificate matching and its subtitle: the URL or hostname of an Uptime Kuma monitor,
// the device name of a Ping host.
const hostFor = (hass, svc) => {
  const st = (id) => (id ? hass.states[id] : undefined);
  if (svc.url && valid(st(svc.url))) return hostOf(st(svc.url).state);
  if (svc.hostname && valid(st(svc.hostname))) return String(st(svc.hostname).state).toLowerCase();
  if (svc.source === "ping") return String(hass.devices?.[svc.device_id]?.name || "").toLowerCase() || null;
  if (svc.cert_host) return svc.cert_host;
  return null;
};

// ---------------------------------------------------------------------------
// History: the uptime bar
// ---------------------------------------------------------------------------

const BUCKETS = 48;
const HISTORY_TTL = 5 * 60000;

// History of the websocket (compressed: { s, lu, lc } in seconds; or full: { state, last_changed }) as [{ t, s }].
const toTimeline = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .map((r) => ({ t: r.lc != null || r.lu != null ? (r.lc ?? r.lu) * 1000 : Date.parse(r.last_changed || r.last_updated), s: r.s ?? r.state }))
    .filter((r) => Number.isFinite(r.t))
    .sort((a, b) => a.t - b.t);

// Status segments of the window [start, end): [{ from, to, status }], the current status closing the last one.
const segments = (timeline, start, end, statusOf, current) => {
  const out = [];
  let cur = null;
  let from = start;
  for (const r of timeline) {
    if (r.t <= start) {
      cur = statusOf(r.s);
      continue;
    }
    if (r.t >= end) break;
    if (cur !== null) out.push({ from, to: r.t, status: cur });
    cur = statusOf(r.s);
    from = r.t;
  }
  out.push({ from, to: end, status: current ?? cur ?? "unknown" });
  return out;
};

// The bar: BUCKETS equal slices of the window, each with the worst status seen in it ("none": no data).
const buckets = (segs, start, end, n = BUCKETS) => {
  const w = (end - start) / n;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = start + i * w;
    const b = a + w;
    const seen = segs.filter((s) => s.from < b && s.to > a).map((s) => s.status);
    const st = worst(seen);
    out.push(seen.length && st !== "unknown" ? st : "none");
  }
  return out;
};

// Share of the window the service was up, among the time it was up or down (maintenance, pending and no data left
// out); null without any.
const uptimeShare = (segs) => {
  let up = 0;
  let down = 0;
  for (const s of segs) {
    if (s.status === "up") up += s.to - s.from;
    else if (s.status === "down") down += s.to - s.from;
  }
  return up + down > 0 ? (100 * up) / (up + down) : null;
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const BASE_STYLE = `
  :host { --uc-accent: ${ACCENT[0]}; --uc-ok: var(--success-color, #43a047); --uc-warn: var(--warning-color, #ffa600);
          --uc-crit: var(--error-color, #db4437); --uc-idle: var(--disabled-text-color, #9e9e9e); --uc-maint: var(--info-color, #039be5);
          /* Text in a state or accent color is mixed with the text color so that it reads at 4.5:1 at least; dots,
             bars and icons keep the plain color. */
          --uc-accent-text: color-mix(in srgb, var(--uc-accent) 50%, var(--primary-text-color)); }
  :host([dark]) { --uc-accent: ${ACCENT[1]}; }
  ha-card { overflow: hidden; container-type: inline-size; }
  /* A size container has no width of its own content: this empty, zero-height grid gives the card a natural width
     without any minimum, so that it neither falls to its borders in a parent sized by its content nor overflows a
     narrow grid track. */
  :host { display: block; min-width: 0; --uc-natural-width: 400px; }
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, var(--uc-natural-width)); height: 0; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible { outline: 2px solid var(--primary-color, var(--uc-accent)); outline-offset: 2px; border-radius: 4px; }
  .ratio { display: flex; height: 6px; border-radius: 3px; overflow: hidden; gap: 2px; }
  .ratio i { background: var(--c); }
  .ok { --c: var(--uc-ok); } .warn { --c: var(--uc-warn); } .crit { --c: var(--uc-crit); } .idle { --c: var(--uc-idle); } .maint { --c: var(--uc-maint); }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--c, var(--uc-ok)); flex: none; display: inline-block; }
  /* A service down pulses, a pending one breathes: the two animations of the card. */
  .svc .dot.crit, .item .dot.crit { animation: uc-pulse 1.6s ease-out infinite; }
  .svc .dot.warn, .item .dot.warn { animation: uc-breathe 2s ease-in-out infinite; }
  @keyframes uc-pulse {
    0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--uc-crit) 60%, transparent); }
    70% { box-shadow: 0 0 0 7px color-mix(in srgb, var(--uc-crit) 0%, transparent); }
    100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--uc-crit) 0%, transparent); }
  }
  @keyframes uc-breathe { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; white-space: nowrap;
          background: color-mix(in srgb, var(--c, var(--uc-ok)) 15%, transparent); color: color-mix(in srgb, var(--c, var(--uc-ok)) 50%, var(--primary-text-color));
          flex: 0 1 auto; min-width: 0; max-width: 50%; overflow: hidden; box-sizing: border-box; }
  .chip .dot { width: 6px; height: 6px; }
  .chip-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  /* The status chip sits on the title line, at the right of the header. */
  .header { display: flex; align-items: flex-start; gap: 10px; padding: 12px 12px 0; }
  .header > .chip { margin-top: 4px; }
  .header.nosub > .chip, :host([hide-subtitle]) .header > .chip { margin-top: 12px; }
  :host([hide-title]) .header > .chip { margin-top: 12px; }
  .type-icon { position: relative; display: flex; width: 40px; height: 40px; border-radius: 50%; align-items: center; justify-content: center; flex: none;
               --uc-tint: var(--c, var(--uc-accent)); background: color-mix(in srgb, var(--uc-tint) 16%, transparent); transition: background-color .3s ease; }
  .type-icon .icon { width: 24px; height: 24px; fill: var(--uc-accent); transition: fill .3s ease; }
  .type-icon:is(.ok, .warn, .crit, .idle, .maint) .icon { fill: color-mix(in srgb, var(--uc-tint) 60%, var(--primary-text-color)); }
  .titles { flex: 1 1 0; min-width: 5ch; display: flex; flex-direction: column; justify-content: center; min-height: 40px; }
  :host([hide-title]) .titles > .name, :host([hide-subtitle]) .titles > .sub { display: none; }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .warning { padding: 16px; color: color-mix(in srgb, var(--uc-warn) 50%, var(--primary-text-color)); }
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: 8px -4px 0 0; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--uc-idle) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, var(--uc-accent)); outline-offset: 1px; }
  @container (max-width: 230px) {
    .chip { padding: 4px; flex: none; }
    .chip-text { display: none; }
    .header { gap: 6px; }
  }
`;

const FULL_STYLE = `
  .content { padding: 8px 12px 12px; display: flex; flex-direction: column; gap: 10px; }
  .hero { display: flex; gap: 12px; align-items: center; }
  .picture { flex: none; display: flex; align-items: center; justify-content: center; width: 88px; height: 102px; }
  .picture img { max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(0,0,0,.18)); }
  .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .state { font-size: 22px; font-weight: 400; line-height: 1.1; overflow-wrap: anywhere;
           color: color-mix(in srgb, var(--c, var(--primary-text-color)) 50%, var(--primary-text-color)); }
  .ratio-line { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--secondary-text-color); }
  .ratio-line .ratio { flex: 1; max-width: 160px; }
  .ratio-line .v { font-weight: 500; color: var(--primary-text-color); white-space: nowrap; }
  .alert-line { display: flex; align-items: center; gap: 6px; font-size: 13px; min-width: 0;
                color: color-mix(in srgb, var(--c, var(--uc-crit)) 50%, var(--primary-text-color)); }
  .alert-line .icon { width: 16px; height: 16px; color: var(--c, var(--uc-crit)); }
  .alert-line span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tags { display: flex; flex-wrap: wrap; gap: 4px; }
  .tag { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 2px 6px; border-radius: 8px;
         background: var(--secondary-background-color, rgba(127,127,127,.12)); color: var(--primary-text-color); white-space: nowrap;
         max-width: 100%; min-width: 0; box-sizing: border-box; overflow: hidden; }
  .tag span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .tag .icon { width: 14px; height: 14px; color: var(--secondary-text-color); }
  .tag b { font-weight: 500; color: var(--secondary-text-color); }
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; text-transform: uppercase;
                   letter-spacing: .04em; color: var(--secondary-text-color); margin-bottom: 6px; }
  .section-title .icon { width: 16px; height: 16px; }
  .section-title .icon.tag-icon { color: var(--uc-accent); }
  .section-title .label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .section-title .count { margin-left: auto; text-transform: none; letter-spacing: 0; font-weight: 400; white-space: nowrap; }
  .section-title .count.crit, .section-title .count.warn { color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color)); font-weight: 500; }
  .section-title.toggle { cursor: pointer; user-select: none; }
  .section-title.toggle[aria-expanded="false"] { margin-bottom: 0; }
  /* Folded: the chevron points right; unfolded: down. */
  .section-title .chevron { width: 16px; height: 16px; transition: transform .2s ease; }
  .section-title.toggle[aria-expanded="false"] .chevron { transform: rotate(-90deg); }
  .list { display: flex; flex-direction: column; gap: 4px; }
  .svc { display: grid; grid-template-columns: 8px minmax(0, 1fr) auto; column-gap: 10px; row-gap: 6px; align-items: center;
         padding: 8px 10px; border-radius: 10px; background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .svc:hover { background: color-mix(in srgb, var(--uc-accent) 8%, var(--secondary-background-color, rgba(127,127,127,.08))); }
  .svc-main { min-width: 0; }
  .svc-name { font-size: 14px; font-weight: 500; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .svc-sub { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--secondary-text-color); min-width: 0; white-space: nowrap; }
  .svc-sub .icon { width: 13px; height: 13px; }
  .svc-sub > .icon { flex: none; }
  .svc-sub .txt { min-width: 0; overflow: hidden; text-overflow: ellipsis; flex: 0 10000 auto; }
  /* Too long a line: the host gives way first, then the certificate, the status in words last. */
  .svc-sub .stxt { color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color)); font-weight: 500; flex: 0 1 auto; }
  .ssl { display: inline-flex; align-items: center; gap: 2px; flex: 0 100 auto; min-width: 0; overflow: hidden; }
  .ssl span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .ssl.warn, .ssl.crit { color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color)); font-weight: 500; }
  .ssl.warn .icon, .ssl.crit .icon { color: var(--c); }
  .sep { flex: none; }
  .meta { display: flex; align-items: baseline; gap: 10px; font-size: 13px; white-space: nowrap; }
  .meta .lat { color: var(--secondary-text-color); }
  .meta .lat.warn { color: color-mix(in srgb, var(--uc-warn) 50%, var(--primary-text-color)); font-weight: 500; }
  .meta .pct { font-weight: 500; min-width: 4ch; text-align: right; }
  .meta .pct.warn, .meta .pct.crit { color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color)); }
  .hbar { grid-column: 2 / 4; display: flex; gap: 2px; height: 14px; }
  .hbar i { flex: 1 1 0; min-width: 0; border-radius: 2px; background: var(--c, var(--divider-color, rgba(127,127,127,.25))); }
  .hbar i.none { --c: var(--divider-color, rgba(127,127,127,.25)); }
  .empty-line { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--secondary-text-color); padding: 4px 0; }
  .empty-line .icon { color: var(--uc-ok); width: 16px; height: 16px; }
  /* Narrow card: the uptime percentage gives way first, then the bar takes a thinner slice gap. */
  @container (max-width: 300px) {
    .picture { width: 64px; height: 74px; }
    .hero { gap: 10px; }
    .meta .pct { display: none; }
    .hbar { gap: 1px; }
  }
  /* Narrowest full card: the picture goes above the overview instead of beside it. */
  @container (max-width: 260px) {
    .hero { flex-direction: column; align-items: stretch; gap: 8px; }
    .hero .picture { align-self: center; }
    .svc { padding: 8px; column-gap: 8px; }
  }
`;

const MINI_STYLE = `
  :host { --uc-natural-width: 300px; }
  .content { padding: 8px 12px 12px; display: flex; align-items: center; gap: 12px; }
  .picture { flex: none; display: flex; align-items: center; justify-content: center; width: 64px; height: 74px; }
  .picture img { max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,.18)); }
  .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
  .total { display: flex; align-items: baseline; gap: 2px; }
  .total .lbl { margin-left: 6px; }
  .total .big { font-size: 30px; font-weight: 400; line-height: 1; }
  .total .of { font-size: 16px; color: var(--secondary-text-color); }
  .total .lbl { font-size: 13px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  .items { display: flex; flex-direction: column; gap: 4px; }
  .item { display: flex; align-items: center; gap: 8px; font-size: 13px; padding: 6px 8px; border-radius: 8px; min-width: 0;
          background: color-mix(in srgb, var(--c) 10%, transparent); }
  .item .nm { flex: 1 1 auto; min-width: 0; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .item .since { flex: none; font-size: 12px; color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color)); white-space: nowrap; }
  .more { font-size: 12px; color: var(--secondary-text-color); padding: 0 8px; }
  .ok-line { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--secondary-text-color); }
  .ok-line .icon { width: 16px; height: 16px; color: var(--uc-ok); }
  @container (max-width: 200px) {
    .picture { display: none; }
    .item .since { display: none; }
  }
`;

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

// Element names of Home Assistant dialogs (the more-info opened from the card, among others).
const DIALOG_TAGS = new Set(["HA-MORE-INFO-DIALOG", "HA-DIALOG", "DIALOG"]);
const isOutside = (card, ev) => {
  const path = ev.composedPath();
  return !path.includes(card) && !path.some((n) => DIALOG_TAGS.has(n.tagName));
};

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. It counts when the press and the release are both outside the card (a slider dragged out of the card
// does not fold it), and a scroll does not count (the browser cancels the pointer). Keyboard clicks still go through
// the click event.
const watchOutside = (card, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = isOutside(card, ev);
  };
  const onUp = (ev) => {
    if (downOutside && isOutside(card, ev)) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0 && isOutside(card, ev)) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    // A tap (press and release at the same spot), for the tests.
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
  };
};

const FOCUS_SELECTOR = "[data-action], [data-entity]";
const focusKey = (el) => {
  const data = Object.entries({ ...el.dataset });
  return data.length ? `${el.tagName}|${JSON.stringify(data)}` : "";
};

const sameDeps = (a, b) => !!a && a.length === b.length && a.every((d, i) => d === b[i]);

const DEFAULTS = { hours: 24, ssl_warning_days: 14, ssl_critical_days: 3, latency_warning: 1000, max_items: 5 };

class UptimeBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this._rev = 0;
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    // No rewrite of the card between the press and the release: Home Assistant updates the card several times a
    // second, and a rewrite under the pointer replaces the element pressed, so that the click lands on the card itself
    // and does nothing. The pending render is done once released (after the click). The focus is only kept across
    // rewrites for the keyboard: put back after a mouse click or a tap, it would draw the focus ring.
    this.shadowRoot.addEventListener("pointerdown", () => {
      this._byPointer = true;
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    });
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      setTimeout(() => {
        this._pressing = false;
        if (this._dirty) this._update();
      }, 0);
    };
    // Enter / Space on an element with the button role acts as a click, as on a <button>.
    this.shadowRoot.addEventListener("keydown", (ev) => {
      this._byPointer = false;
      if ((ev.key !== "Enter" && ev.key !== " ") || ev.target?.getAttribute?.("role") !== "button") return;
      ev.preventDefault();
      ev.target.click();
    });
  }

  // Home Assistant pushes a new hass on every state change of the whole instance: the card is only rebuilt when
  // something it shows changed (see _deps).
  set hass(hass) {
    this._hass = hass;
    this.toggleAttribute?.("dark", !!hass?.themes?.darkMode);
    this._loadLabels();
    const deps = this._deps();
    const prev = this._lastDeps;
    if (deps && prev && deps.length === prev.length && deps.every((d, i) => d === prev[i])) return;
    this._lastDeps = deps;
    this._update();
  }

  get hass() {
    return this._hass;
  }

  // What a render reads: the registries, the language, the theme, the labels and history loaded, the minute (relative
  // times) and the state objects of every entity of the services shown.
  _deps() {
    const h = this._hass;
    if (!h?.entities || !this._config) return null;
    const ids = this._services().flatMap((s) => [s.status, s.latency, s.cert, s.uptime, s.url, s.hostname, s.type, s.tags_entity]);
    return [h.entities, h.devices, h.language, h.locale, h.themes?.darkMode, this._rev, this._minute, ...ids.map((id) => (id ? h.states[id] : undefined))];
  }

  connectedCallback() {
    // A click elsewhere on the page folds the groups back to their defaults (clicks inside a dialog opened from the
    // card leave them as they are).
    this._onOutside ??= (ev) => {
      if (!this._toggled?.size || !isOutside(this, ev)) return;
      this._toggled = new Map();
      this._update();
    };
    (this._outside ??= watchOutside(this, (ev) => this._onOutside(ev))).on();
    // Back on the page after leaving it: rendered again in its default state.
    if (this._hass && this._config) this._update();
    // "Down for 12 min" moves on its own, and the uptime bar slides: re-checked every minute.
    clearInterval(this._tick);
    this._minute = Math.floor(Date.now() / 60000);
    this._tick = setInterval(() => {
      this._minute = Math.floor(Date.now() / 60000);
      if (this._hass) this.hass = this._hass;
    }, 60000);
  }

  disconnectedCallback() {
    clearInterval(this._tick);
    this._tick = null;
    this._outside?.off();
    this._pressing = false;
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    // Left (another dashboard view, a conditional card hidden): back to the defaults, so that the card does not come
    // back unfolded or with its popup open.
    this._toggled = new Map();
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { ...config };
    this.toggleAttribute?.("hide-title", config.show_title === false);
    this.toggleAttribute?.("hide-subtitle", config.show_subtitle === false);
    this._html = "";
    this._lastDeps = null;
    this._history = null;
    this._update();
  }

  _opt(key) {
    const v = Number(this._config[key]);
    return Number.isFinite(v) && this._config[key] !== "" && this._config[key] !== null ? v : DEFAULTS[key];
  }

  _t(key, vars) {
    return t(this._hass, this._config, key, vars);
  }

  _locale() {
    return intlLocale(this._hass, this._config);
  }

  _s(id) {
    return id ? this._hass.states[id] : undefined;
  }

  // The services of the card, kept while the registries, the config and the few states they depend on (URLs and
  // hostnames for the certificate matching, listed certificates for their kind) stay the same: Home Assistant replaces
  // hass.states on every state change of the instance, so keying on it would redo the matching all the time.
  _services() {
    const h = this._hass;
    const found = discover(h);
    if (this._svcFound !== found || this._svcConf !== this._config) {
      this._svcFound = found;
      this._svcConf = this._config;
      const conf = [].concat(this._config.entities || []).map((o) => o?.cert_entity);
      this._svcIds = [...found.flatMap((s) => [s.url, s.hostname]), ...conf].filter(Boolean);
    }
    const key = [found, h.devices, this._config, ...this._svcIds.map((id) => h.states[id])];
    if (this._svcKey && sameDeps(this._svcKey, key)) return this._svcList;
    this._svcKey = key;
    this._svcList = servicesFor(h, this._config);
    return this._svcList;
  }

  // HA labels of the entities and devices, by id → name (the label registry is not in hass): loaded once.
  _loadLabels() {
    const h = this._hass;
    if (this._labels || this._labelsLoading || typeof h?.callWS !== "function") return;
    this._labelsLoading = true;
    Promise.resolve(h.callWS({ type: "config/label_registry/list" }))
      .then((rows) => {
        this._labels = Object.fromEntries((Array.isArray(rows) ? rows : []).map((l) => [l.label_id, l.name]));
        this._rev++;
        if (this._hass) this.hass = this._hass;
      })
      .catch(() => {
        this._labels = {};
      });
  }

  // Loads the history of the status entities for the uptime bar and percentage, again after HISTORY_TTL or when
  // the services change.
  _loadHistory(services) {
    const h = this._hass;
    const c = this._config;
    if (typeof h?.callWS !== "function" || (c.show_history === false && c.show_uptime === false)) return;
    const ids = services.filter((s) => s.source !== "cert_expiry").map((s) => s.status);
    if (!ids.length) return;
    const key = `${ids.join(",")}|${this._opt("hours")}`;
    const fresh = this._history && this._history.key === key && Date.now() - this._history.at < HISTORY_TTL;
    if (fresh || this._historyLoading === key) return;
    this._historyLoading = key;
    const start = new Date(Date.now() - this._opt("hours") * 3600e3).toISOString();
    Promise.resolve(
      h.callWS({ type: "history/history_during_period", start_time: start, entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false }),
    )
      .then((res) => {
        this._history = { key, at: Date.now(), data: Object.fromEntries(ids.map((id) => [id, toTimeline(res?.[id])])) };
      })
      .catch(() => {
        this._history = { key, at: Date.now(), data: {} };
      })
      .finally(() => {
        this._historyLoading = null;
        this._rev++;
        if (this._hass && this.isConnected !== false) this.hass = this._hass;
      });
  }

  _update() {
    if (!this._hass || !this._config) return;
    if (this._pressing) {
      this._dirty = true;
      return;
    }
    this._dirty = false;
    const html = this._render();
    if (html !== this._html) {
      const kept = this._byPointer ? null : this._focusedSpot();
      this._html = html;
      this.shadowRoot.innerHTML = html;
      if (kept) this._restoreFocus(kept);
    }
  }

  _focusedSpot() {
    const el = this.shadowRoot.activeElement;
    if (!el?.dataset) return null;
    const key = focusKey(el);
    if (!key) return null;
    const index = this._focusables(key).indexOf(el);
    return index < 0 ? null : { key, index };
  }

  _focusables(key) {
    return [...this.shadowRoot.querySelectorAll(FOCUS_SELECTOR)].filter((n) => focusKey(n) === key);
  }

  _restoreFocus({ key, index }) {
    this._focusables(key)[index]?.focus({ preventScroll: true });
  }

  _onClick(ev) {
    this._pressing = false;
    if (ev.detail === 0) this._byPointer = false;
    const el = ev.composedPath().find((n) => n.dataset && (n.dataset.entity || n.dataset.action));
    if (!el) return;
    ev.stopPropagation();
    const { action, entity } = el.dataset;
    if (action === "zoom") return this._toggleZoom(ev);
    if (action === "toggle_group") {
      const key = el.dataset.group;
      this._toggled = new Map(this._toggled).set(key, !this._isCollapsed(key, el.dataset.problem === "1"));
      return this._update();
    }
    if (entity) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: entity }, bubbles: true, composed: true }));
  }

  // Everything a row shows about a service, read from the states.
  _view(svc) {
    const h = this._hass;
    const c = this._config;
    const st = this._s(svc.status);
    const locale = this._locale();
    const view = { svc, entity: svc.status, name: c.names?.[svc.key] || svc.conf?.name || "" };
    // Status
    if (svc.source === "cert_expiry") {
      // A certificate that fails validation has no expiry: its sensor reads unknown, with is_valid false.
      const exp = st && Date.parse(st.state);
      view.status =
        st?.attributes?.is_valid === false ? "down" : !valid(st) ? "unknown" : Number.isFinite(exp) && exp < Date.now() ? "down" : "up";
    } else {
      view.status = statusFromState(svc.status, st?.state, st?.attributes?.device_class);
    }
    if (!view.name) {
      const dev = h.devices?.[svc.device_id];
      view.name =
        svc.source === "uptime_kuma" || svc.source === "ping"
          ? deviceName(dev) || st?.attributes?.friendly_name || svc.status
          : svc.source === "cert_expiry"
            ? deviceName(dev) || svc.cert_host || st?.attributes?.friendly_name || svc.status
            : st?.attributes?.friendly_name || deviceName(dev) || svc.status;
    }
    view.since = st && view.status !== "up" && svc.source !== "cert_expiry" ? Date.parse(st.last_changed) : null;
    // Subtitle: host, monitor type or last ping
    const host = hostFor(h, svc);
    if (svc.source === "healthchecks" && st?.attributes?.last_ping) {
      const lp = Date.parse(st.attributes.last_ping);
      if (Number.isFinite(lp)) view.detail = this._t("last_ping", { when: ago(locale, lp) });
    } else if (svc.source === "cert_expiry") {
      view.detail = svc.cert_host || "";
    } else if (host && host !== String(view.name).toLowerCase()) {
      view.detail = host;
    } else if (svc.type && valid(this._s(svc.type))) {
      const ts = this._s(svc.type);
      view.detail = h.formatEntityState ? h.formatEntityState(ts) : ts.state;
    }
    // Latency in ms
    const ls = this._s(svc.latency);
    let lat = num(ls);
    if (lat !== null && ls.attributes?.unit_of_measurement === "s") lat *= 1000;
    if (lat !== null && ls.attributes?.unit_of_measurement === "µs") lat /= 1000;
    view.latency = view.status === "up" || view.status === "pending" ? lat : null;
    view.latencyCls = lat !== null && lat > this._opt("latency_warning") ? "warn" : "";
    // Certificate: days left, date
    const cs = this._s(svc.cert);
    if (cs?.attributes?.is_valid === false) view.cert = { days: null, date: null, invalid: true, cls: "crit" };
    else if (cs && valid(cs)) {
      let days = null;
      let date = null;
      if (svc.cert_kind === "timestamp") {
        const ms = Date.parse(cs.state);
        if (Number.isFinite(ms)) {
          days = Math.floor((ms - Date.now()) / 86400e3);
          date = ms;
        }
      } else {
        days = num(cs);
        if (days !== null) date = Date.now() + days * 86400e3;
      }
      // An Uptime Kuma monitor of a plain http:// URL has no certificate (its sensor reads 0 or -1); a Certificate Expiry
      // one of the same host still counts.
      const plain = svc.cert_src === "kuma" && svc.url && /^http:/i.test(this._s(svc.url)?.state || "");
      if (days !== null && !plain) {
        const invalid = cs.attributes?.is_valid === false;
        view.cert = {
          days,
          date,
          invalid,
          cls: invalid || days < 0 || days <= this._opt("ssl_critical_days") ? "crit" : days <= this._opt("ssl_warning_days") ? "warn" : "ok",
        };
      }
    }
    // Tags: Uptime Kuma's, the HA labels of the entity and its device, the option's
    view.tags = this._tagsOf(svc);
    // History and uptime
    const hours = this._opt("hours");
    const end = Date.now();
    const start = end - hours * 3600e3;
    let timeline = this._history?.data?.[svc.status];
    // The history is reloaded every few minutes: a change since then is added from the state, so that the current
    // status only covers the time since it began (not everything since the last change recorded in the history).
    const lc = st ? Date.parse(st.last_changed) : Number.NaN;
    if (timeline && Number.isFinite(lc) && !(timeline.length && timeline[timeline.length - 1].t >= lc)) timeline = [...timeline, { t: lc, s: st.state }];
    if (timeline && svc.source !== "cert_expiry") {
      const dc = st?.attributes?.device_class;
      const segs = segments(timeline, start, end, (raw) => statusFromState(svc.status, raw, dc), view.status);
      view.bar = buckets(segs, start, end);
      view.share = uptimeShare(segs);
    }
    const us = this._s(svc.uptime);
    if (hours === 24 && num(us) !== null) view.share = num(us);
    return view;
  }

  _tagsOf(svc) {
    const out = [];
    const add = (v) => {
      const s = String(v ?? "").trim();
      if (s && !out.includes(s)) out.push(s);
    };
    const ts = this._s(svc.tags_entity);
    for (const tag of (Array.isArray(ts?.attributes?.tags) ? ts.attributes.tags : [])) {
      if (tag && typeof tag === "object") add(tag.value ? `${tag.name}: ${tag.value}` : tag.name);
      else add(tag);
    }
    const labels = this._labels || {};
    const ent = this._hass.entities[svc.status];
    const dev = this._hass.devices?.[ent?.device_id ?? svc.device_id];
    for (const id of [...(ent?.labels || []), ...(dev?.labels || [])]) add(labels[id] || id);
    for (const tag of [].concat(svc.conf?.tags || [])) add(tag);
    return out;
  }

  _isProblem(v) {
    return v.status !== "up" || (v.cert && v.cert.cls !== "ok" && this._config.show_ssl !== false);
  }

  // Views of the services shown, sorted.
  _views(all = this._allViews()) {
    let views = [...all];
    if (this._config.only_problems) views = views.filter((v) => this._isProblem(v));
    const byName = (a, b) => String(a.name).localeCompare(String(b.name), this._locale());
    const order = { down: 0, pending: 1, maintenance: 2, unknown: 3, up: 4 };
    views.sort(this._config.sort === "name" ? byName : (a, b) => order[a.status] - order[b.status] || byName(a, b));
    return views;
  }

  // Counts over every service of the card (the filters of the list left aside but the tags one).
  _summary(views) {
    const count = (st) => views.filter((v) => v.status === st).length;
    const certs = views.filter((v) => v.cert && v.cert.cls !== "ok" && this._config.show_ssl !== false).map((v) => (v.cert.cls === "crit" ? "crit" : "warn"));
    const slow = views.some((v) => v.latencyCls === "warn" && this._config.show_latency !== false);
    const total = views.length;
    const up = count("up");
    const down = count("down");
    const pending = count("pending");
    const maint = count("maintenance");
    let chip;
    if (down) chip = { cls: "crit", text: this._t("n_down", { n: down }) };
    else if (pending) chip = { cls: "warn", text: this._t("n_pending", { n: pending }) };
    else if (maint) chip = { cls: "maint", text: this._t("n_maintenance", { n: maint }) };
    else if (total && up === total) chip = { cls: "ok", text: this._t("all_up") };
    else chip = total ? { cls: "idle", text: this._t("unknown") } : null;
    const levels = [chip?.cls || "", ...certs, slow ? "warn" : ""];
    const icon = levels.includes("crit") ? "crit" : levels.includes("warn") ? "warn" : chip?.cls || "";
    return { total, up, down, pending, maint, chip, icon };
  }

  // Every service of the card, the tags filter applied (not only_problems): what the totals count.
  _allViews() {
    const services = this._services();
    this._loadHistory(services);
    let views = services.map((s) => this._view(s));
    const filter = this._config.tags ? [].concat(this._config.tags).map(String) : null;
    if (filter) views = views.filter((v) => v.tags.some((tg) => filter.includes(tg)));
    return views;
  }

  // Overall status drawn by the picture: down, pending or maintenance when one service is, up when all others are.
  _overall(sum) {
    if (sum.down) return "down";
    if (sum.pending) return "pending";
    if (sum.maint) return "maintenance";
    return sum.up ? "up" : "unknown";
  }

  // Share of the services in each status, as a thin segmented bar.
  _ratio(sum) {
    const parts = [
      ["ok", sum.up],
      ["maint", sum.maint],
      ["warn", sum.pending],
      ["crit", sum.down],
      ["idle", sum.total - sum.up - sum.maint - sum.pending - sum.down],
    ].filter(([, n]) => n > 0);
    return `<div class="ratio" aria-hidden="true">${parts.map(([cls, n]) => `<i class="${cls}" style="flex:${n}"></i>`).join("")}</div>`;
  }

  // The rack picture (opens the first service down, else nothing more than the card).
  _pictureBlock(overall, views) {
    const target = views.find((v) => v.status === overall && overall !== "up") || null;
    const label = esc(this._config.title || this._t("title"));
    const attrs = target ? ` clickable" role="button" tabindex="0" data-entity="${esc(target.entity)}` : `" role="img`;
    return `<div class="picture${attrs}" aria-label="${label}"><img src="${svgUri(rackSvg(overall))}" alt=""></div>`;
  }

  _certLabel(cert) {
    if (cert.invalid) return this._t("ssl_invalid");
    if (cert.days < 0) return this._t("ssl_expired");
    return this._t("ssl_in", { d: fmtUnit(cert.days, "day", this._locale()) });
  }

  _header(sum, sub) {
    const c = this._config;
    const chip = sum.chip;
    return `
      <div class="header${sub ? "" : " nosub"}">
        <span class="type-icon${sum.icon ? ` ${sum.icon}` : ""}">${svgIcon(ICONS.heart_pulse)}</span>
        <div class="titles">
          <div class="name">${esc(c.title || this._t("title"))}</div>
          ${sub ? `<div class="sub">${esc(sub)}</div>` : ""}
        </div>
        ${
          chip
            ? `<span class="chip ${chip.cls}" title="${esc(chip.text)}" aria-label="${esc(chip.text)}"><span class="dot"></span><span class="chip-text">${esc(chip.text)}</span></span>`
            : ""
        }
        ${this._zoomButton()}
      </div>`;
  }

  _zoomButton() {
    return "";
  }

  _toggleZoom() {}

  _errorCard(key) {
    return `<style>${BASE_STYLE}</style><ha-card><div class="warning">${esc(this._t(key))}</div></ha-card>`;
  }

  _statusText(v) {
    if (v.status === "down" && Number.isFinite(v.since)) return this._t("down_for", { d: fmtDuration(Date.now() - v.since, this._locale()) });
    return this._t(v.status);
  }
}

class UptimeCard extends UptimeBase {
  static getConfigElement() {
    return document.createElement("uptime-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  getCardSize() {
    const n = this._lastCount ?? 4;
    return Math.max(3, Math.ceil(n * 1.2) + 2);
  }

  getGridOptions() {
    return { columns: 12, min_columns: 9, rows: "auto" };
  }

  _isCollapsed(key, problem) {
    if (this._toggled?.has(key)) return this._toggled.get(key);
    // A group with a service down is always shown unfolded (it can still be folded by hand).
    if (problem) return false;
    const c = this._config.collapsed;
    if (c === true) return true;
    return [].concat(c || []).map(String).includes(key);
  }

  _row(v) {
    const c = this._config;
    const locale = this._locale();
    const cls = STATUS_CLASS[v.status];
    const statusTxt = this._statusText(v);
    const sub = [];
    const src = SOURCES[v.svc.source] || SOURCES.entity;
    if (v.status !== "up") sub.push(`<span class="txt stxt ${cls}">${esc(statusTxt)}</span>`);
    else if (v.detail) sub.push(`<span class="txt">${esc(v.detail)}</span>`);
    if (v.cert && c.show_ssl !== false) {
      const label = this._certLabel(v.cert);
      const title = Number.isFinite(v.cert.date)
        ? this._t("ssl_expires_on", { date: new Date(v.cert.date).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" }) })
        : label;
      if (sub.length) sub.push(`<span class="sep" aria-hidden="true">·</span>`);
      sub.push(`<span class="ssl ${v.cert.cls}" title="${esc(title)}">${svgIcon(v.cert.cls === "ok" ? ICONS.lock : ICONS.lock_alert)}<span>${esc(label)}</span></span>`);
    }
    const meta = [];
    if (c.show_latency !== false && v.latency !== null && v.latency !== undefined)
      meta.push(`<span class="lat ${v.latencyCls}" title="${esc(this._t("latency"))}">${esc(fmtLatency(v.latency, locale))}</span>`);
    if (c.show_uptime !== false && v.share !== null && v.share !== undefined) {
      const pc = v.share >= 99 ? "" : v.share >= 95 ? "warn" : "crit";
      meta.push(`<span class="pct ${pc}" title="${esc(this._t("uptime"))}">${esc(fmtPct(v.share, locale))}</span>`);
    }
    const bar =
      c.show_history !== false && v.bar
        ? `<div class="hbar" role="img" aria-label="${esc(`${this._t("history", { h: this._opt("hours") })}${v.share != null ? `: ${fmtPct(v.share, locale)}` : ""}`)}">${v.bar.map((b) => `<i class="${b === "none" ? "none" : STATUS_CLASS[b]}"></i>`).join("")}</div>`
        : "";
    const label = `${v.name}: ${statusTxt}`;
    return `<div class="svc clickable" role="button" tabindex="0" data-entity="${esc(v.entity)}" aria-label="${esc(label)}">
        <span class="dot ${cls}" title="${esc(statusTxt)}"></span>
        <div class="svc-main"><div class="svc-name">${esc(v.name)}</div><div class="svc-sub">${svgIcon(ICONS[src.icon])}${sub.join("")}</div></div>
        <div class="meta">${meta.join("")}</div>
        ${bar}
      </div>`;
  }

  // Groups of the list: [{ key, label, icon, views }], or null for a flat list.
  _groups(views) {
    const by = this._config.group_by ?? "tag";
    if (by === "none") return null;
    const map = new Map();
    const push = (key, label, icon, v) => {
      if (!map.has(key)) map.set(key, { key, label, icon, views: [] });
      map.get(key).views.push(v);
    };
    if (by === "source") {
      for (const v of views) {
        const s = v.svc.source;
        push(s, SOURCES[s]?.label || this._t("src_entity"), SOURCES[s]?.icon || "connection", v);
      }
      return SOURCE_ORDER.filter((k) => map.has(k)).map((k) => map.get(k));
    }
    if (!views.some((v) => v.tags.length)) return null;
    const filter = this._config.tags ? [].concat(this._config.tags).map(String) : null;
    const other = [];
    for (const v of views) {
      const tags = filter ? v.tags.filter((tg) => filter.includes(tg)) : v.tags;
      if (!tags.length) other.push(v);
      for (const tg of tags) push(`tag:${tg}`, tg, "tag", v);
    }
    const locale = this._locale();
    const groups = filter
      ? filter.filter((tg) => map.has(`tag:${tg}`)).map((tg) => map.get(`tag:${tg}`))
      : [...map.values()].sort((a, b) => a.label.localeCompare(b.label, locale));
    if (other.length) groups.push({ key: "other", label: this._t("other"), icon: "server", views: other });
    return groups;
  }

  _list(views) {
    return `<div class="list">${views.map((v) => this._row(v)).join("")}</div>`;
  }

  _group(g) {
    const sum = this._summary(g.views);
    const problem = g.views.some((v) => v.status === "down");
    const closed = this._isCollapsed(g.label, problem);
    const countCls = sum.down ? "crit" : sum.pending ? "warn" : "";
    return `<div class="group">
        <div class="section-title toggle" role="button" tabindex="0" data-action="toggle_group" data-group="${esc(g.label)}" data-problem="${problem ? 1 : 0}" aria-expanded="${!closed}">
          ${svgIcon(ICONS[g.icon], g.icon === "tag" ? "tag-icon" : "")}<span class="label">${esc(g.label)}</span>
          <span class="count ${countCls}">${esc(this._t("summary", { up: sum.up, total: sum.total }))}</span>${svgIcon(ICONS.chevron_down, "chevron")}
        </div>
        ${closed ? "" : this._list(g.views)}
      </div>`;
  }

  // The hero: the rack picture of the overall state, the state in words, the share of services up, the service
  // down the longest and the most urgent certificate, and the integrations the services come from.
  _hero(all, sum) {
    const c = this._config;
    const locale = this._locale();
    const lines = [];
    const down = all.filter((v) => v.status === "down").sort((a, b) => (a.since || 0) - (b.since || 0))[0];
    if (down)
      lines.push(
        `<div class="alert-line crit clickable" role="button" tabindex="0" data-entity="${esc(down.entity)}">${svgIcon(ICONS.alert)}<span>${esc(`${down.name}: ${this._statusText(down)}`)}</span></div>`,
      );
    if (c.show_ssl !== false) {
      const left = (v) => (v.cert.invalid ? -Infinity : v.cert.days);
      const cert = all.filter((v) => v.cert && v.cert.cls !== "ok").sort((a, b) => left(a) - left(b))[0];
      if (cert)
        lines.push(
          `<div class="alert-line ${cert.cert.cls} clickable" role="button" tabindex="0" data-entity="${esc(cert.svc.cert)}">${svgIcon(ICONS.lock_alert)}<span>${esc(`${cert.name}: ${this._certLabel(cert.cert)}`)}</span></div>`,
        );
    }
    const counts = new Map();
    for (const v of all) counts.set(v.svc.source, (counts.get(v.svc.source) || 0) + 1);
    const tags = SOURCE_ORDER.filter((k) => counts.has(k)).map(
      (k) => `<span class="tag">${svgIcon(ICONS[SOURCES[k].icon])}<span>${esc(SOURCES[k].label || this._t("src_entity"))}</span><b>${counts.get(k).toLocaleString(locale)}</b></span>`,
    );
    const overall = this._overall(sum);
    return `<div class="hero">
        ${this._pictureBlock(overall, all)}
        <div class="info">
          <div class="state ${sum.chip?.cls || ""}">${esc(sum.chip?.text || "")}</div>
          <div class="ratio-line">${this._ratio(sum)}<span class="v">${esc(this._t("summary", { up: sum.up.toLocaleString(locale), total: sum.total.toLocaleString(locale) }))}</span></div>
          ${lines.join("")}
          ${tags.length > 1 ? `<div class="tags">${tags.join("")}</div>` : ""}
        </div>
      </div>`;
  }

  _render() {
    if (!this._hass.entities) return this._errorCard("no_registry");
    const all = this._allViews();
    const views = this._views(all);
    this._lastCount = views.length;
    if (!all.length) return this._errorCard("no_services");
    const sum = this._summary(all);
    const groups = this._groups(views);
    let body;
    if (!views.length) body = `<div class="empty-line">${svgIcon(ICONS.check_circle)}<span>${esc(this._t("all_operational"))}</span></div>`;
    else body = groups ? groups.map((g) => this._group(g)).join("") : this._list(views);
    const hero = this._config.show_hero === false ? "" : this._hero(all, sum);
    return `<style>${BASE_STYLE}${FULL_STYLE}</style>
      <ha-card>
        ${this._header(sum, this._t("summary", { up: sum.up, total: sum.total }))}
        <div class="content">${hero}${body}</div>
      </ha-card>`;
  }
}

// The mini card: X/Y services up and the services down. Its detail button (top right, `zoom: false` removes it)
// switches it to the full list and back, and a click anywhere else on the page brings the compact view back.
class UptimeMiniCard extends UptimeCard {
  constructor() {
    super();
    this._onUnzoom = (ev) => {
      if (this._zoomed && isOutside(this, ev)) this._setZoom(false);
    };
  }

  static getConfigElement() {
    return document.createElement("uptime-mini-card-editor");
  }

  connectedCallback() {
    super.connectedCallback();
    (this._unzoom ??= watchOutside(this, (ev) => this._onUnzoom(ev))).on();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unzoom?.off();
    // Back to the compact view once off the screen (see the full card).
    this._zoomed = false;
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 3;
  }

  getGridOptions() {
    return { ...(this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 }), rows: "auto" };
  }

  _zoomButton() {
    if (this._config.zoom === false) return "";
    const z = this._zoomed;
    const label = esc(this._t(z ? "zoom_out" : "zoom_in"));
    return `<button class="zoom" data-action="zoom" title="${label}" aria-label="${label}">${svgIcon(z ? ICONS.collapse : ICONS.expand)}</button>`;
  }

  _setZoom(on) {
    this._zoomed = on;
    this._update();
    this.dispatchEvent(new CustomEvent("iron-resize", { bubbles: true, composed: true }));
  }

  _toggleZoom(ev) {
    this._setZoom(!this._zoomed);
    if (ev.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  }

  _render() {
    if (this._zoomed) return super._render();
    if (!this._hass.entities) return this._errorCard("no_registry");
    const views = this._allViews();
    if (!views.length) return this._errorCard("no_services");
    const sum = this._summary(views);
    const locale = this._locale();
    const down = views.filter((v) => v.status === "down").sort((a, b) => (b.since || 0) - (a.since || 0) || String(a.name).localeCompare(String(b.name), locale));
    const max = Math.max(0, Math.round(this._opt("max_items")));
    const shown = down.slice(0, max);
    const items = shown.length
      ? `<div class="items">${shown
          .map(
            (v) =>
              `<div class="item crit clickable" role="button" tabindex="0" data-entity="${esc(v.entity)}" aria-label="${esc(`${v.name}: ${this._statusText(v)}`)}"><span class="dot crit"></span><span class="nm">${esc(v.name)}</span>${
                Number.isFinite(v.since) ? `<span class="since">${esc(fmtDuration(Date.now() - v.since, locale))}</span>` : ""
              }</div>`,
          )
          .join("")}${down.length > shown.length ? `<div class="more">+${down.length - shown.length}</div>` : ""}</div>`
      : !down.length
        ? `<div class="ok-line">${svgIcon(ICONS.check_circle)}<span>${esc(sum.up === sum.total ? this._t("all_operational") : sum.chip?.text || "")}</span></div>`
        : "";
    return `<style>${BASE_STYLE}${MINI_STYLE}</style>
      <ha-card>
        ${this._header(sum, "")}
        <div class="content">
          ${this._pictureBlock(this._overall(sum), views)}
          <div class="info">
            <div class="total"><span class="big">${sum.up.toLocaleString(locale)}</span><span class="of">/${sum.total.toLocaleString(locale)}</span><span class="lbl">${esc(this._t("services_up"))}</span></div>
            ${this._ratio(sum)}
            ${items}
          </div>
        </div>
      </ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------

const LANGUAGES = [
  ["en", "English"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["es", "Español"],
  ["sr", "Српски"],
  ["sr-Latn", "Srpski (latinica)"],
  ["it", "Italiano"],
  ["nl", "Nederlands"],
  ["pt", "Português (Portugal)"],
  ["pl", "Polski"],
  ["ro", "Română"],
  ["da", "Dansk"],
  ["sv", "Svenska"],
  ["bg", "Български"],
  ["ru", "Русский"],
  ["uk", "Українська"],
  ["hu", "Magyar"],
  ["sk", "Slovenčina"],
  ["cs", "Čeština"],
  ["sl", "Slovenščina"],
  ["lv", "Latviešu"],
  ["el", "Ελληνικά"],
];

class UptimeEditorBase extends HTMLElement {
  // [name, default]
  static get toggles() {
    return [
      ["show_title", true],
      ["show_subtitle", true],
      ["show_hero", true],
      ["show_latency", true],
      ["show_history", true],
      ["show_uptime", true],
      ["show_ssl", true],
      ["only_problems", false],
    ];
  }

  static get numbers() {
    return ["hours", "ssl_warning_days", "ssl_critical_days", "latency_warning"];
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _schema() {
    const tr = (k) => t(this._hass, this._config, k);
    const nums = { hours: [1, 168, "h"], ssl_warning_days: [0, 365, "d"], ssl_critical_days: [0, 365, "d"], latency_warning: [1, 60000, "ms"], max_items: [0, 50] };
    return [
      { name: "title", selector: { text: {} } },
      { name: "entities", selector: { entity: { multiple: true, filter: [{ domain: "binary_sensor" }, { domain: "sensor" }] } } },
      ...this._discoveryFields(),
      {
        type: "grid",
        name: "",
        schema: [
          { name: "group_by", selector: { select: { mode: "dropdown", options: ["tag", "source", "none"].map((v) => ({ value: v, label: tr(`group_${v}`) })) } } },
          { name: "sort", selector: { select: { mode: "dropdown", options: ["status", "name"].map((v) => ({ value: v, label: tr(`sort_${v}`) })) } } },
        ],
      },
      { type: "grid", name: "", schema: this.constructor.toggles.map(([name]) => ({ name, selector: { boolean: {} } })) },
      {
        type: "grid",
        name: "",
        schema: this.constructor.numbers.map((name) => ({
          name,
          selector: { number: { min: nums[name][0], max: nums[name][1], mode: "box", ...(nums[name][2] ? { unit_of_measurement: nums[name][2] } : {}) } },
        })),
      },
      {
        name: "language",
        selector: { select: { mode: "dropdown", options: [{ value: "", label: tr("lang_auto") }, ...LANGUAGES.map(([value, label]) => ({ value, label }))] } },
      },
    ];
  }

  // What the card finds by itself: `auto`, the integrations to look in, the services found to leave out, and the tag
  // and folded-group filters (lists of names). `collapsed: true` (every group) stays as written, out of the form.
  _discoveryFields() {
    const found = this._hass ? discover(this._hass).map((s) => s.key) : [];
    const excluded = [].concat(this._config.exclude || []).filter((id) => !found.includes(id));
    const ids = [...found, ...excluded];
    return [
      { name: "auto", selector: { boolean: {} } },
      {
        name: "sources",
        selector: { select: { multiple: true, mode: "list", options: SOURCE_ORDER.filter((k) => SOURCES[k].label).map((value) => ({ value, label: SOURCES[value].label })) } },
      },
      ...(ids.length ? [{ name: "exclude", selector: { entity: { multiple: true, include_entities: ids } } }] : []),
      { name: "tags", selector: { text: { multiple: true } } },
      ...(this._config.collapsed === true ? [] : [{ name: "collapsed", selector: { text: { multiple: true } } }]),
    ];
  }

  // `auto` defaults to true without `entities`, else false.
  static autoDefault(config) {
    return ![].concat(config.entities || []).length;
  }

  _defaults() {
    return { ...Object.fromEntries(this.constructor.toggles), group_by: "tag", sort: "status", ...Object.fromEntries(this.constructor.numbers.map((n) => [n, DEFAULTS[n]])) };
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => t(this._hass, this._config, s.name);
      this._form.computeHelper = (s) => (s.name === "zoom" ? t(this._hass, this._config, "zoom_helper") : undefined);
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        // The entities keep their options (name, tags…) when they were objects in the YAML.
        if (Array.isArray(config.entities)) {
          const prev = new Map([].concat(this._config.entities || []).map((e) => [typeof e === "string" ? e : e?.entity, e]));
          config.entities = config.entities.map((id) => prev.get(id) ?? id);
        }
        const defaults = this._defaults();
        // `auto` left at its default (the one shown, or the one of the new `entities`) stays out of the YAML.
        const auto = this.constructor.autoDefault;
        if ((this._config.auto === undefined && config.auto === auto(this._config)) || config.auto === auto(config)) delete config.auto;
        for (const [k, v] of Object.entries(config)) {
          // Keep the YAML minimal: drop empty values and options left at their default.
          if (v === "" || v === undefined || v === null || (Array.isArray(v) && !v.length) || (k in defaults && JSON.stringify(v) === JSON.stringify(defaults[k])))
            delete config[k];
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const data = { ...this._defaults(), ...this._config };
    data.entities = [].concat(this._config.entities || []).map((e) => (typeof e === "string" ? e : e?.entity)).filter(Boolean);
    data.auto ??= this.constructor.autoDefault(this._config);
    for (const k of ["sources", "exclude", "tags"]) if (data[k] !== undefined) data[k] = [].concat(data[k]).map(String);
    if (data.collapsed !== undefined && data.collapsed !== true) data.collapsed = [].concat(data.collapsed).map(String);
    this._form.hass = this._hass;
    const h = this._hass;
    const dataDeps = [this._config];
    if (!sameDeps(this._dataDeps, dataDeps)) {
      this._dataDeps = dataDeps;
      this._form.data = data;
    }
    // The services found (the exclude list) and `collapsed: true` (no field) change the form too.
    const deps = [lang(h, this._config), h.entities, this._config.collapsed === true, String(this._config.exclude ?? "")];
    if (!sameDeps(this._schemaDeps, deps)) {
      this._schemaDeps = deps;
      this._form.schema = this._schema();
    }
  }
}

class UptimeCardEditor extends UptimeEditorBase {}

class UptimeMiniCardEditor extends UptimeEditorBase {
  static get toggles() {
    return [...UptimeEditorBase.toggles, ["zoom", true]];
  }

  static get numbers() {
    return [...UptimeEditorBase.numbers, "max_items"];
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const define = (name, cls) => {
  if (!customElements.get(name)) customElements.define(name, cls);
};
define("uptime-card", UptimeCard);
define("uptime-mini-card", UptimeMiniCard);
define("uptime-card-editor", UptimeCardEditor);
define("uptime-mini-card-editor", UptimeMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "uptime-card",
    name: "Uptime Card",
    description: "Services from Uptime Kuma, Healthchecks.io, Ping, connectivity sensors and Certificate Expiry: status, latency, 24-hour uptime bar, certificate expiry and groups by tag.",
  },
  {
    type: "uptime-mini-card",
    name: "Uptime Mini Card",
    description: "Compact service overview: how many services are up, and which ones are down.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-uptime-card" });
}

console.info(`%c UPTIME-CARD %c v${VERSION} `, `color: white; background: ${ACCENT[0]}; font-weight: 700;`, `color: ${ACCENT[0]}; background: white; font-weight: 700;`);
