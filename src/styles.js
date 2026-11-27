// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
import { ACCENT } from "./core.js";

export const BASE_STYLE = `
  :host { --uc-accent: ${ACCENT[0]}; --uc-ok: var(--success-color, #43a047); --uc-warn: var(--warning-color, #ffa600);
          --uc-crit: var(--error-color, #db4437); --uc-idle: var(--secondary-text-color, #9e9e9e); --uc-maint: var(--info-color, #039be5);
          /* Text in a state or accent color is mixed with the text color so that it reads at 4.5:1 at least; dots,
             bars and icons keep the plain color. */
          --uc-accent-text: color-mix(in srgb, var(--uc-accent) 50%, var(--primary-text-color)); }
  :host([dark]) { --uc-accent: ${ACCENT[1]}; }
  ha-card { overflow: hidden; container: ut-card / inline-size; }
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
  .header { display: flex; align-items: flex-start; gap: 10px; padding: 12px 12px 0; }
  .type-icon { position: relative; display: flex; width: 40px; height: 40px; border-radius: 50%; align-items: center; justify-content: center; flex: none;
               --uc-tint: var(--c, var(--uc-accent)); background: color-mix(in srgb, var(--uc-tint) 16%, transparent); transition: background-color .3s ease; }
  .type-icon .icon { width: 24px; height: 24px; fill: var(--uc-accent); transition: fill .3s ease; }
  .type-icon:is(.ok, .warn, .crit, .idle, .maint) .icon { fill: color-mix(in srgb, var(--uc-tint) 60%, var(--primary-text-color)); }
  .titles { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; justify-content: center; min-height: 40px; }
  :host([hide-title]) .titles .name, :host([hide-subtitle]) .titles .sub { display: none; }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .warning { padding: 16px; color: color-mix(in srgb, var(--uc-warn) 50%, var(--primary-text-color)); }
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: 8px -4px 0 0; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--uc-idle) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, var(--uc-accent)); outline-offset: 1px; }
  @container ut-card (max-width: 230px) { .header { gap: 6px; } }
  /* The status pill, in every header: on the title row right after the title only when the whole title and the pill's
     whole label fit there; otherwise on its own line under the subtitle, cut to one line; its dot alone, beside the
     title, when the banner has no room left above its ground strip, or on a card of 200 px or less. Decided by
     measurement (see _fitPill), so that every language and every width gets it right. */
  .titles .trow { display: flex; align-items: center; gap: 8px; min-width: 0; width: 100%; }
  .titles .trow > .name { flex: 0 1 auto; min-width: 0; }
  .titles .trow > .chip { flex: none; max-width: none; margin: 0; align-self: center; }
  .titles.below { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; }
  .titles.below > * { max-width: 100%; }
  .titles.below .trow { display: contents; }
  .titles.below .trow > .name { max-width: 100%; }
  .titles.below .trow > .chip { order: 9; max-width: 100%; margin-top: 2px; align-self: flex-start; }
  /* In the banner, a pill on its own line may run over the picture, up to the banner's edge. */
  .banner .titles.below .trow > .chip { max-width: none; }
  .titles.below :is(.sub) { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .titles.dotonly .trow > .chip { padding: 4px; } .titles.dotonly .trow > .chip .chip-text { display: none; }
  @container ut-card (max-width: 200px) { .titles .trow > .chip { padding: 4px; } .titles .trow > .chip .chip-text { display: none; } }
`;

export const FULL_STYLE = `
  .content { padding: 8px 12px 12px; display: flex; flex-direction: column; gap: 10px; }
  .hero { display: flex; gap: 12px; align-items: center; }
  .picture { flex: none; display: flex; align-items: center; justify-content: center; width: 88px; height: 102px; }
  .picture img { max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(0,0,0,.18)); }
  .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .state { font-size: 22px; font-weight: 400; line-height: 1.1; overflow-wrap: anywhere;
           color: color-mix(in srgb, var(--c, var(--primary-text-color)) 50%, var(--primary-text-color)); }
  .state.uptime { display: flex; align-items: baseline; flex-wrap: wrap; column-gap: 8px; row-gap: 2px; }
  .state.uptime.ok { color: var(--primary-text-color); }
  .state.uptime .v { font-variant-numeric: tabular-nums; white-space: nowrap; }
  .state.uptime .cap { font-size: 12px; color: var(--secondary-text-color); }
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
  /* Periods up of a service tracked up, under its bar. */
  .periods { grid-column: 2 / 4; display: flex; flex-wrap: wrap; gap: 4px; font-size: 12px; color: var(--secondary-text-color); font-variant-numeric: tabular-nums; }
  .period { padding: 1px 6px; border-radius: 6px; background: color-mix(in srgb, var(--uc-ok) 12%, transparent); white-space: nowrap; }
  .period.open { color: color-mix(in srgb, var(--uc-ok) 50%, var(--primary-text-color)); font-weight: 500; }
  .period.more { background: none; }
  .empty-line { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--secondary-text-color); padding: 4px 0; }
  .empty-line .icon { color: var(--uc-ok); width: 16px; height: 16px; }
  /* Narrow card: the uptime percentage gives way first, then the bar takes a thinner slice gap. */
  @container ut-card (max-width: 300px) {
    .picture { width: 64px; height: 74px; }
    .hero { gap: 10px; }
    .meta .pct { display: none; }
    .hbar { gap: 1px; }
  }
  /* Narrowest full card: the picture goes above the overview instead of beside it. */
  @container ut-card (max-width: 260px) {
    .hero { flex-direction: column; align-items: stretch; gap: 8px; }
    .hero .picture { align-self: center; }
    .svc { padding: 8px; column-gap: 8px; }
  }
`;

export const MINI_STYLE = `
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
  @container ut-card (max-width: 200px) {
    .picture { display: none; }
    .item .since { display: none; }
  }
`;
