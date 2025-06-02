// content.js

const THEME_STYLE_ID = { // Artık sadece tek bir ID kullanacağız, içeriği değiştireceğiz
    RED: "sauconfig-red-theme-styles",
    DARK: "sauconfig-dark-theme-styles"
};

const STORAGE_KEYS = {
    REDMODE: "redmode_state",
    DARKMODE: "darkmode_state",
    STEALTH: "stealth_state",
    CALCULATE: "calculate_state"
};

// Kırmızı Tema CSS Kuralları (red-theme.css içeriği)
const redThemeCssRules = `
    .aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover .menu-heading .menu-text,
    .aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover .menu-link .menu-text { color: #df1212 !important; }
    .text-right { text-align: right !important; color: #4d4d4d !important;}
    .table th, .table td { vertical-align: middle; font-weight: 500; }
    .aside-menu .menu-nav > .menu-item.menu-item-active > .menu-heading .menu-text,
    .aside-menu .menu-nav > .menu-item.menu-item-active > .menu-link .menu-text {color: #df1212 !important;font-weight: 500;}
    .aside-menu .menu-nav > .menu-item > .menu-heading .menu-text,
    .aside-menu .menu-nav > .menu-item > .menu-link .menu-text {color: #6f6f76; font-weight: 500;}
    .form-control:focus { border-color: #df1212; border-width: 2px;}
    .text-primary {color: #df1212 !important; font-weight: 500; }
    .bg-primary {background-color: #b7140f !important;}
    a.text-primary:hover, a.text-primary:focus { color: #df1212 !important; }
    .text-dark-50 { color: #5c5c5c !important; }
    .text-dark {color: #2a2a2a !important;}
    .navi .navi-item .navi-link.active .navi-text { color: #df1212 !important;}
    .symbol.symbol-light-primary .symbol-label { background-color: #ffe1e1; color: #df1212; }
    .aside-menu .menu-nav > .menu-item.menu-item-active > .menu-heading .menu-icon,
    .aside-menu .menu-nav > .menu-item.menu-item-active > .menu-link .menu-icon { color: #df1212; }
    .aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover > .menu-heading .menu-icon,
    .aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover > .menu-link .menu-icon { color: #df1212; }
    @media (min-width: 992px) { .header .header-menu .menu-nav > .menu-item.menu-item-here > .menu-link,
    .header .header-menu .menu-nav > .menu-item.menu-item-active > .menu-link { background-color: #631515; } }
    @media (min-width: 992px) { .brand .btn .svg-icon svg g [fill] { fill: #ffffff; } }
    .navi .navi-item .navi-link:hover .navi-text { color: #df1212 !important;}
    .topbar .btn.btn-icon:active, .topbar .btn.btn-icon.active, .topbar .btn.btn-icon:hover, .topbar .btn.btn-icon:focus,
    .topbar .show .btn.btn-icon.btn-dropdown { background-color: #a50606 !important; border-radius: 50px !important;}
    a.text-hover-primary:hover, .text-hover-primary:hover {color: #df1212 !important;}
    .btn-link:hover {color: #df1212;text-decoration: underline;}
    .fc-unthemed .fc-toolbar .fc-button:focus, .fc-unthemed .fc-toolbar .fc-button:active, .fc-unthemed .fc-toolbar .fc-button.fc-button-active { background: #df1212 !important; color: #FFFFFF; border: 1px solid #df1212 !important;}
    @media (min-width: 992px) { .brand .btn.active .svg-icon svg g [fill], .brand .btn:hover .svg-icon svg g [fill] {fill: #ffffff; }}
    .btn.btn-light-primary:hover:not(.btn-text):not(:disabled):not(.disabled), .btn.btn-light-primary:focus:not(.btn-text), .btn.btn-light-primary.focus:not(.btn-text) {  color: #FFFFFF;  background-color: #df1212;  border-color: transparent;} .navi .navi-item .navi-link.active .navi-icon i { color: #df1212; } .navi .navi-item .navi-link:hover .navi-icon i { color: #df1212; }
    a {font-weight: 600;}
    span.text-dark-50.font-weight-bolder.font-size-base.d-none.d-md-inline.mr-3 {color: #fff !important;}
    .card-body > span {font-size: 18px; color: black; font-weight: bold; margin-left: 4px;}
    .scrolltop {background-color: #9d0c09;}
    [class*="card card-custom mb-5"] [class*="card-body"] {display: grid;gap: 2px;}
    .page-loader.page-loader-logo {background-color: #900f0b !important;}
    [class*="text-right"] > span {font-weight: bold;}
    .symbol.symbol-120.symbol-success.overflow-hidden {border: 4px solid #e5e5e5; border-radius: 60%;}
    body {background: #ffffff;}
    .aside .aside-menu.ps > .ps__rail-y > .ps__thumb-y:hover, .aside .aside-menu.ps > .ps__rail-y > .ps__thumb-y:focus {background: #900f0b !important;}
    .aside-menu .menu-nav > .menu-item.menu-item-active > .menu-heading, .aside-menu .menu-nav > .menu-item.menu-item-active > .menu-link {background-color: #ffffff;}
    .symbol.symbol-success .symbol-label {background-color: #d7d7d7;color: #ffffff;}
    .header-var1 .logo-wrapper img {filter: brightness(10);}
    .home-table > li span {background-color: #7c1715;text-align: center;}
    .home-table > li .before-bg {height: 230px;border: 2px solid #d3d3d3;}
    .home-table > li ul {border:0;}
    .home-table {padding:0 !important;}
   .btn {border: 2px solid transparent;}
   .btn-default:hover {background: #931d1d !important;border: 2px solid #6f1a17 !important;color: white;}
    .btn-success { background: #289728 !important; border: 2px solid #289728 !important; }
    .btn.btn-secondary {border: 0 !important;}
    .btn-success:hover {background: #089d08 !important; border: 2px solid #289728 !important;}
    .btn-default, .btn-primary, .btn-success, .btn-info, .btn-warning, .btn-danger {text-shadow: none;-webkit-box-shadow: none;box-shadow: none;}
    .btn-default {border: 2px solid #eee !important;background: #f5f5f5 !important;}
    small i {color: white;}
    .nav-collapse ul li a {color: #ffffff;}
    .header-var1 nav > ul > li > a:hover {color: #c5c5c5;}
    .home-table {background-color: #ffffff;}
    .footer-fluid {display: none;}
    .contact-container {padding: 10px 0px 0px 0px !important;margin: 0 !important;}
    .aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover > .menu-heading, .aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover > .menu-link { background-color: #fbfbfb;}
    .subheader.subheader-solid {border-top: 0 !important;}
    .card.card-custom {border: 3px solid #efefef;}
    .card-header {border-bottom: 3px solid #EBEDF3;}
    .detail > ul > li {padding: 2px 25px;text-align: left;}
    .detail > ul {list-style: none;padding-left: 12px;padding-right: 12px;}
    .home-table .aktif {box-shadow: 0 0 18px 7px #3d3d3d;background: #dddddd;}
    .listing.active {box-shadow: 0 0 17px 8px rgb(70 70 70 / 45%);}
    .header-var1 .right-nav .submit-recipe {color: #c5c5c5;border-color: #c5c5c5;}
    .header-var1 .right-nav .submit-recipe:hover {color: #fff;}
    .fc-unthemed .fc-event.fc-event-success.fc-start .fc-content:before, .fc-unthemed .fc-event-dot.fc-event-success.fc-start .fc-content:before {background: #c51b1b;}
    .page-loader {background-color: #900f0b !important;}
    .aside-menu .menu-nav > .menu-item > .menu-heading .menu-text, .aside-menu .menu-nav > .menu-item > .menu-link .menu-text {color: #4d4d4d;font-weight: 500;}
    .card-header:first-child { border-radius: 0; }
    .swal2-container .swal2-html-container {height: auto !important;width: 800px;max-height: none;}
    #swal2-content > div > span { padding: 5px 10px; border: 2px solid #ddd; text-align: center; margin: 1px 5px 4px 5px; background: #f3f3f3; }
    #swal2-content > div { display: inline-grid; grid-template-columns: auto auto auto auto; gap: 0px; align-items: center; }
    .swal2-popup { width: auto; }
    .swal2-container.swal2-backdrop-show, .swal2-container.swal2-noanimation { background: rgb(147 0 0 / 40%); }
    .text-ogrenci { margin: 10px 8px 4px 15px; border: 3px solid #2e2e2e; background-color: rgb(30 30 30 / 60%); padding: 10px; }
    .text-danger { color: #d3172b !important; }
    .alert.alert-primary { background-color: #df1212ab; border-color: transparent; }
    .btn { transition: none !important; }
    .symbol.symbol-light-danger .symbol-label { background-color: #7b000d; color: #ff4141; }
    .symbol.symbol-light-success .symbol-label { background-color: #007974; color: #1BC5BD; }
    i.symbol-badge.bg-info { filter: hue-rotate(85deg) saturate(5.5); }
    @media (min-width: 992px) { .header { background-color: #790000; } }
    @media (min-width: 992px) { .brand { background-color: #690101; } }
    @media (max-width: 991.98px) { .header-mobile { background-color: #790000 !important; } }
    @media (max-width: 991.98px) { .header-mobile .burger-icon span { background-color: #c3c3c3; } }
    @media (max-width: 991.98px) { .header-mobile .burger-icon span::before, .header-mobile .burger-icon span::after { background-color: #c3c3c3; } }
    @media (max-width: 991.98px) { .header-mobile .btn .svg-icon svg g [fill] { fill: #ebebeb; } }
    @media (max-width: 991.98px) { .header-mobile .btn.active .svg-icon svg g [fill], .header-mobile .btn:hover .svg-icon svg g [fill] { fill: #ffffff; } }
    @media (max-width: 991.98px) { .header-mobile .burger-icon:hover span { background-color: #ffffff; } }
    @media (max-width: 991.98px) { .header-mobile .burger-icon:hover span::before, .header-mobile .burger-icon:hover span::after { background-color: #ffffff; } }
    @media (max-width: 991.98px) { .topbar-mobile-on .topbar { border-top: 1px solid #e1e1e1; } }
    @media (max-width: 991.98px) { .topbar { background-color: #680000; -webkit-box-shadow: none; box-shadow: none; } }
    @media (max-width: 991.98px) { .header-menu-wrapper { background-color: #790000; } }
    @media (max-width: 991.98px) { .header-menu-mobile { background-color: #790000; } }
    @media (max-width: 991.98px) { .header-menu-mobile .menu-nav > .menu-item.menu-item-active > .menu-heading, .header-menu-mobile .menu-nav > .menu-item.menu-item-active > .menu-link { background-color: #8d0000; } }
    .container-fluid.d-flex.align-items-center.justify-content-start.flex-wrap.flex-sm-nowrap.pl-0 { background: #111111 !important; }
    .firstRow td { border-top: 3px solid #f5f5f5 !important; border-bottom: 3px solid #f5f5f5 !important; border-top-width: 3px; border-top-color: #f5f5f5; }
    tr.firstRow { border-left: 4px solid #df1212 !important; }
    td { background: #dbdbdb1c !important; border: 0 !important; }
    .wizard.wizard-3 .wizard-nav .wizard-steps .wizard-step[data-wizard-state="current"] .wizard-label { color: #000000 !important; background: #ffffff !important; }
    .wizard.wizard-3 .wizard-nav .wizard-steps .wizard-step[data-wizard-state="current"] .wizard-label .wizard-bar:after { background-color: #000 !important; }
    .radio > input:checked ~ span { background-color: #b7140f !important; }
    .radio > input:checked ~ span:after { background-color: #b7140f !important; }
    button.btn.btn-outline-danger.btn-sm { color: rgb(255, 173, 182) !important; background-color: rgb(173, 43, 57) !important; }
    .answered::after { background-color: #ffffff !important; }
    .unanswered { color: #b7140f !important; }
    .unanswered::after { background-color: white !important; }
    .wizard-bar.unanswered { background: none !important; }
    .btn.btn-light-primary:hover:not(.btn-text):not(:disabled):not(.disabled), .btn.btn-light-primary:focus:not(.btn-text), .btn.btn-light-primary.focus:not(.btn-text) { color: #FFFFFF; background-color: #a50000 !important; }
    .btn.btn-light-primary { background-color: rgb(191 15 15) !important; color: white; }
    .question-number { color: #474747; border: none !important; background-color: #f5f5f5; font-size: 16px !important; }
    .radio.radio-success > input:checked ~ span:after { background-color: #b7140f !important; border-color: #b7140f !important; }
    .table-hover tbody tr:hover { background-color: #fbfbfbab; }
    .btn.btn-outline-primary { background-color: #3699FF; color: white !important; }
    td.fc-widget-content { background: #ffffff; border: 1px solid #dfdfdf !important; }
    .table thead th, .table thead td { border-bottom-width: 2px; }
    .fc-unthemed th.fc-day-header > a, .fc-unthemed th.fc-day-header > span { color: #3f3f3f; }
    a.fc-day-number { color: #4b4b4b; font-weight: 600; }
    .fc-unthemed .fc-list-item.fc-event-solid-success .fc-event-dot, .fc-unthemed .fc-list-item.fc-event-success .fc-event-dot { background: #c51b1b !important; border-color: #c51b1b !important; }
    .fc-unthemed .fc-divider, .fc-unthemed .fc-popover .fc-header, .fc-unthemed .fc-list-heading td { background: #f5f5f5 !important; }
    td.fc-list-item-time.fc-widget-content { border: none !important; }
    td.fc-list-item-marker.fc-widget-content { border: none !important; }
    td.fc-list-item-title.fc-widget-content { border: none !important; }
    .fc-unthemed th, .fc-unthemed td, .fc-unthemed thead, .fc-unthemed tbody, .fc-unthemed .fc-divider, .fc-unthemed .fc-row, .fc-unthemed .fc-content, .fc-unthemed .fc-popover, .fc-unthemed .fc-list-view, .fc-unthemed .fc-list-heading td { border-color: #ffffff; }
    .table-danger, .table-danger > th, .table-danger > td { background-color: #ab213052 !important; }
    tr:has(> td[colspan*="3"]) { border-left: 4px solid #3699FF; background: #efefef; }
    tr:has(> td[colspan*="5"]) { border-left: 4px solid #d9d9d9; }
    .navi.navi-active .navi-item .navi-link.active { background-color: #fbfbfb; }
    .navi.navi-hover .navi-item .navi-link:hover { background-color: #fbfbfb; }
    .fa-arrow-left:before { content: "\\f060"; color: white; }
`;

// Karanlık Tema CSS Kuralları (dark-theme.css içeriği)
const darkThemeCssRules = `
    .header { background: #111111; }
    .brand { background: #111111; }
    .card-body{ background: #131313; }
    .content { background: #111111; }
    .flex-column-fluid { background: #111111; }
    .aside-menu .menu-nav { background: #111111; }
    .form-control { color: #cdcdcd; background-color: #121212; }
    .form-control:focus { background-color: #121212; color: #cdcdcd; }
    .table thead th { vertical-align: bottom; border-bottom: 2px solid #1a1a1a; }
    th { color: white; }
    .card.card-custom { border: 3px solid #181818 !important; }
    .bg-white { background-color: #111111 !important; }
    .aside-menu { background-color: #111111; }
    .aside-menu .menu-nav > .menu-item.menu-item-active > .menu-heading, .aside-menu .menu-nav > .menu-item.menu-item-active > .menu-link { background-color: #121212 !important; }
    .aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover > .menu-heading, .aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover > .menu-link { background-color: #111111; }
    .table th, .table td { border-top: 1px solid #1a1a1a; color: #9d9d9d; }
    .symbol.symbol-light-primary .symbol-label { background-color: #161616 !important; }
    .card.card-custom > .card-header { background-color: #111111; }
    .card-header { border-bottom: 3px solid #181818; }
    .timeline.timeline-4 .timeline-items .timeline-item .timeline-content { background-color: #111111; }
    .timeline.timeline-4 .timeline-items .timeline-item .timeline-badge { background: #1e1e1e; }
    .timeline.timeline-4:after { background-color: #181818; }
    .timeline.timeline-4.timeline-justified .timeline-items .timeline-item:after { border-right: solid 10px #111111; }
    .timeline.timeline-4 .timeline-bar { background-color: #1a1a1a; }
    .card.card-custom > .card-header .card-title, .card.card-custom > .card-header .card-title .card-label { color: #aeaeae; }
    .fc-unthemed th, .fc-unthemed td, .fc-unthemed thead, .fc-unthemed tbody, .fc-unthemed .fc-divider, .fc-unthemed .fc-row, .fc-unthemed .fc-content, .fc-unthemed .fc-popover, .fc-unthemed .fc-list-view, .fc-unthemed .fc-list-heading td { border-color: #111111 !important; }
    td.fc-widget-content { border: 1px solid #212121 !important; }
    .fc-unthemed .fc-divider, .fc-unthemed .fc-popover .fc-header, .fc-unthemed .fc-list-heading td { background: #1c1c1c !important; }
    .fc-unthemed .fc-toolbar .fc-button { border: 1px solid #181818; }
    .fc-unthemed .fc-toolbar .fc-button:hover { background: #2d2d2d; border: 1px solid #2b2b2b; color: #f1f1f1; }
    td.fc-axis.fc-time.fc-widget-content { color: #B5B5C3; }
    td { background: #111111 !important; border: 0 !important; }
    .table-bordered { border: 1px solid #111111 !important; }
    .card-header:first-child { border-radius: 0; }
    .table-bordered th, .table-bordered td { border: 0 !important; }
    .card { border-radius: 0 !important; }
    .h2 { color: #9f9f9f !important; }
    body { color: #515151; }
    .text-dark-75 { color: #595959 !important; }
    .text-dark {color: #bfbfbf !important;}
    .text-muted { color: #a5a5a5 !important; }
    .navi.navi-bold .navi-item .navi-link .navi-text { color: #707070; }
    .navi.navi-hover .navi-item .navi-link:hover { background-color: #111111; }
    .navi.navi-active .navi-item .navi-link.active { background-color: #111111; }
    .alert.alert-custom.alert-outline-primary.fade.show.mb-5 { background-color: #101010 !important; }
    [class*="text-right"] > span { font-weight: bold; }
    .form-control { border: 2px solid #1e1e1e; }
    .fc-unthemed .fc-event, .fc-unthemed .fc-event-dot { background: #121212; border: 1px solid #141414; }
    .fc-unthemed .fc-event, .fc-unthemed .fc-event-dot { box-shadow: 0px 0px 9px 0px rgb(0 0 0 / 47%); }
    .fc-unthemed .fc-event .fc-title, .fc-unthemed .fc-event-dot .fc-title { color: #575757; }
    .fc-unthemed .fc-event .fc-time, .fc-unthemed .fc-event-dot .fc-time { color: #ffffff; }
    .card.card-custom { box-shadow: none !important; }
    .aside { box-shadow: 0px 0px 5px 0px rgba(82, 63, 105, 0.08) !important; }
    .header-fixed .header { box-shadow: 0px 0px 5px 0px rgba(82, 63, 105, 0.08) !important; }
    .dropdown-menu { box-shadow: 0px 0px 5px 0px rgba(82, 63, 105, 0.08) !important; }
    .navi { background: #121212; }
    .card-footer { background-color: #141414 !important; border-top: 3px solid #1c1c1c; }
    .alert.alert-custom.alert-light-danger { background-color: #65000af5; margin-top: 10px; }
    .form-group label { color: #9b9b9b; }
    .custom-file-label { background-color: #121212; border: 2px solid #1e1e1e; }
    .card.card-custom.gutter-b { background: none; }
    .aside-menu .menu-nav > .menu-item > .menu-heading .menu-text, .aside-menu .menu-nav > .menu-item > .menu-link .menu-text { color: #9f9f9f }
    .swal2-container .swal2-html-container { height: auto !important; width: 800px; max-height: none; }
    #swal2-content > div > span { padding: 5px 10px; border: 2px solid #232323 !important; text-align: center; color: #686868 !important; margin: 1px 5px 4px 5px; background: #141414 !important; }
    #swal2-content > div { display: inline-grid; grid-template-columns: auto auto auto auto; gap: 0px; align-items: center; }
    .swal2-popup { width: auto; background: #101010; }
    .card-body > span { font-size: 18px; color: white !important; font-weight: bold; margin-left: 4px; }
    .text-ogrenci { margin: 10px 8px 4px 15px; border: 3px solid #2e2e2e; background-color: rgb(30 30 30 / 60%); padding: 10px; }
    #notOrtalama{ color: white !important; }
    .symbol .symbol-label { color: whitesmoke; background-color: #171717; }
    .btn { transition: none !important; }
    .text-right { text-align: right !important; color: #9d9d9d !important;}
    .modal-content { background-color: #121212; }
    .modal .modal-header .modal-title { color: #ffffff; }
    .modal-header { border-bottom: 2px solid #1c1c1c; }
    .modal-footer { border-top: 2px solid #1c1c1c; }
    .swal2-popup .swal2-title { color: #e3e3e3; }
    .swal2-popup .swal2-content { color: #9d9d9d; }
    .firstRow td { border-top: 3px solid #141414 !important; border-bottom: 3px solid #141414 !important; }
    tr.firstRow { border-left: 4px solid #222222; }
    .subheader.subheader-solid { border-top: 0 !important; }
    .symbol.symbol-success .symbol-label { background-color: #d7d7d7; color: #ffffff; }
    .d-flex.justify-content-between.border-top.mt-5.p-5.bg-white.waterrmark { border: none !important; }
    .text-dark-100.font-size-lg.mt-2.jdflkgjlk { color: white !important; }
    .btn.btn-light-primary { background-color: rgb(191 15 15) !important; color: white; }
    .card { background-color: #131313 !important; }
    .answered { color: #ffffff !important; }
    .unanswered::after { background-color: white !important; }
    .question-number { color: #373737; border: none !important; background-color: #e3e3e3; font-size: 16px !important; }
    .wizard-bar.unanswered { background: none !important; }
    .col-sm-12 > .text-dark-50.font-size-lg.mt-2 > p { color: #ffffff !important; }
    .btn.btn-outline-primary { background-color: #3699FF; color: white !important; }
    a.fc-day-number { color: #e3e3e3 !important; font-weight: 600 !important; }
    .fc-unthemed .fc-list-heading .fc-list-heading-main { color: #e2e3e5; }
    td.fc-list-item-time.fc-widget-content { border: none !important; }
    td.fc-list-item-marker.fc-widget-content { border: none !important; }
    td.fc-list-item-title.fc-widget-content { border: none !important; }
    .fc-unthemed .fc-description { color: #afafaf; }
    .table-danger, .table-danger > th, .table-danger > td { background-color: #ab213052 !important; }
    .table-primary, .table-primary > th, .table-primary > td { background-color: #214bab52 !important; }
    .table-active, .table-active > th, .table-active > td { background-color: #101010 !important; }
    .table-hover .table-active:hover > td, .table-hover .table-active:hover > th { background-color: #121212 !important; }
    tr:has(> td[colspan*="3"]) { border-left: 4px solid #3699FF; background: #111111 !important; }
    tr:has(> td[colspan*="5"]) { border-left: 4px solid #d9d9d9; }
    .navi .navi-item .navi-link .navi-icon i { color: #707070; }
    .aside-menu .menu-nav > .menu-item > .menu-heading .menu-icon, .aside-menu .menu-nav > .menu-item > .menu-link .menu-icon { color: #707070; }
    .scroll.ps > .ps__rail-y > .ps__thumb-y { background: #181818 !important; }
`;

function applyThemeStyle(themeId, cssRules, enable) {
    let styleElement = document.getElementById(themeId);
    if (enable) {
        if (!styleElement) {
            styleElement = document.createElement("style");
            styleElement.id = themeId;
            styleElement.textContent = cssRules;
            document.head.appendChild(styleElement);
        } else {
            // Stil zaten varsa ve içerik farklıysa güncelle (opsiyonel)
            if (styleElement.textContent !== cssRules) {
                styleElement.textContent = cssRules;
            }
        }
    } else {
        if (styleElement) {
            styleElement.remove();
        }
    }
}

function enableStealthMode() {
    document.querySelectorAll(".symbol-label img, .symbol.symbol-35.symbol-light-success img")
        .forEach(img => {
            img.style.display = "none";
            const parent = img.parentElement;
            if (parent) {
                Object.assign(parent.style, {
                    backgroundImage: "url('https://attic.sh/prxqzg7nk65j2ccjjyogebflzb4q')",
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                });
                if (parent.classList.contains('symbol-35')) {
                    Object.assign(parent.style, {
                        backgroundColor: "#d7d7d7",
                        width: "35px",
                        height: "35px",
                        borderRadius: "50%"
                    });
                }
            }
        });
    const selectorsAndText = {
        ".card-title.font-weight-bolder.text-dark-75.text-hover-primary.font-size-h4.m-0.pt-7.pb-1": "Anonymous",
        ".font-weight-bold.text-dark-50.font-size-sm.pb-6": "Stealth Mode ON",
        ".text-dark-50.font-weight-bolder.font-size-base.d-none.d-md-inline.mr-3": "Anonymous"
    };
    for (const selector in selectorsAndText) {
        document.querySelectorAll(selector).forEach(el => {
            el.style.setProperty("color", "#b9b9b9", "important");
            el.style.setProperty("font-weight", "bold", "important");
            el.innerText = selectorsAndText[selector];
        });
    }
    document.querySelectorAll(".card-body .pb-5 .pt-1, .navi-spacer-x-0")
        .forEach(el => el.style.display = "none");
    document.querySelectorAll("*").forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle) {
            const backgroundImage = computedStyle.getPropertyValue("background-image");
            if (backgroundImage.includes("data:image/svg+xml")) {
                try {
                    const decodedSvg = decodeURIComponent(backgroundImage.substring(backgroundImage.indexOf(',') + 1, backgroundImage.length - 2));
                    if (decodedSvg.includes("<text")) {
                        const updatedSvg = decodedSvg.replace(/<text[^>]*>.*?<\/text>/g, (match) => {
                            return match.replace(/>(.*?)</, ">Stealth Mode ON<");
                        });
                        element.style.setProperty("background-image", `url("data:image/svg+xml,${encodeURIComponent(updatedSvg)}")`, "important");
                    }
                } catch (e) { /* no-op */ }
            }
        }
    });
}

function formatGradeNumber(number) {
    let formatted = number.toFixed(10).replace(/\.?0+$/, "");
    if (!formatted.includes(".")) formatted += ".00";
    else if (formatted.split(".")[1].length === 1) formatted += "0";
    return formatted;
}

function getPrimaryTextContent(element) {
    let text = "";
    if (element) {
        Array.from(element.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) text += node.textContent.trim();
        });
    }
    return text.trim();
}

function runGradeLogic(calculate) {
    if (!window.location.href.startsWith("https://obs.sabis.sakarya.edu.tr/Ders")) return;
    if (calculate) {
        enableCalculateGrade();
    } else {
        initGradeClickHandlers();
    }
}

function enableCalculateGrade() {
    if (!window.location.href.startsWith("https://obs.sabis.sakarya.edu.tr/Ders")) return;
    let tablesToProcess = [];
    const urlPath = new URL(window.location.href).pathname;

    if (urlPath === "/Ders" || /^\/Ders\/\d{4}\/\d{1}$/.test(urlPath)) {
        document.querySelectorAll(".card-body").forEach(cardBody => {
            const table = cardBody.querySelector("table");
            if (table) tablesToProcess.push(table);
        });
    } else if (urlPath.startsWith("/Ders/Grup/")) {
        const table = document.querySelector("#icerik div.card > div.card-body > table.table");
        if (table) tablesToProcess.push(table);
    }

    if (tablesToProcess.length === 0) {
        initGradeClickHandlers();
        return;
    }

    tablesToProcess.forEach(table => {
        const tbody = table.querySelector("tbody");
        if (!tbody) return;

        Array.from(tbody.querySelectorAll("tr"))
            .filter(row => row.querySelector("td:nth-child(2)")?.textContent.trim() === "Ortalama")
            .forEach(row => row.remove());
        tbody.querySelectorAll("span#notOrtalama[data-calculated-score='true'], span[data-calculated-score='sub']")
            .forEach(span => span.remove());

        const currentRows = tbody.querySelectorAll("tr");
        let toplamPuan = 0;
        let butunlemeVar = false;

        currentRows.forEach(row => {
            const oranCell = row.querySelector("td:nth-child(1)");
            const notCellParentTd = row.querySelector("td:nth-child(4)") || row.querySelector("td:nth-child(3)");
            const notCellSpan = notCellParentTd?.querySelector("span:first-child");
            const calismaTipiCell = row.querySelector("td:nth-child(2)");

            if (!oranCell || !notCellSpan || !calismaTipiCell) return;
            if (calismaTipiCell.textContent.includes("Bütünleme")) butunlemeVar = true;

            const oranText = oranCell.textContent.trim().replace(",", ".");
            const notTextContent = getPrimaryTextContent(notCellSpan).split(" ")[0].replace(",", ".");

            if (!isNaN(parseFloat(oranText)) && parseFloat(oranText) > 0 &&
                notTextContent && notTextContent !== "-" && !isNaN(parseFloat(notTextContent)) && parseFloat(notTextContent) >= 0) {
                const oran = parseFloat(oranText);
                const not = parseFloat(notTextContent);
                const hesaplananPuan = (oran * not) / 100;
                toplamPuan += hesaplananPuan;
                const sonucElementi = document.createElement("span");
                sonucElementi.style.cssText = "color: rgb(52, 52, 52); font-size: 0.9em;";
                sonucElementi.textContent = ` (${formatGradeNumber(hesaplananPuan)})`;
                sonucElementi.setAttribute("data-calculated-score", "sub");
                notCellSpan.appendChild(sonucElementi);
            }
        });

        if (butunlemeVar) {
            currentRows.forEach(row => {
                const calismaTipiCell = row.querySelector("td:nth-child(2)");
                if (calismaTipiCell?.textContent.includes("Final")) {
                    const oranCell = row.querySelector("td:nth-child(1)");
                    const notCellParentTd = row.querySelector("td:nth-child(4)") || row.querySelector("td:nth-child(3)");
                    const notCellSpan = notCellParentTd?.querySelector("span:first-child");
                    if (oranCell && notCellSpan) {
                        const oranText = oranCell.textContent.trim().replace(",", ".");
                        const notTextContent = getPrimaryTextContent(notCellSpan).split(" ")[0].replace(",", ".");
                        if (!isNaN(parseFloat(oranText)) && notTextContent && notTextContent !== "-" && !isNaN(parseFloat(notTextContent)) && parseFloat(notTextContent) >= 0) {
                            toplamPuan -= (parseFloat(oranText) * parseFloat(notTextContent)) / 100;
                        }
                    }
                }
            });
        }

        const formattedTotal = formatGradeNumber(toplamPuan);
        const basariNotuRow = Array.from(currentRows).find(row => row.querySelector("td:nth-child(2)")?.textContent.includes("Başarı Notu"));

        if (basariNotuRow) {
            const basariNotuCellSpan = basariNotuRow.querySelector("td:nth-child(3) span:first-child");
            if (basariNotuCellSpan) {
                const harfNotu = getPrimaryTextContent(basariNotuCellSpan).match(/^[A-ZÇĞİÖŞÜ]{1,2}(?![a-z])/)?.[0] || "";
                const renkler = { FF: "#df1212", FD: "#df1212", DD: "blue", DC: "blue", DZ: "orange", GR: "orange" };
                basariNotuCellSpan.style.color = renkler[harfNotu] || "green";
                const toplamPuanElementi = document.createElement("span");
                toplamPuanElementi.style.color = "#000";
                toplamPuanElementi.textContent = ` (${formattedTotal})`;
                toplamPuanElementi.setAttribute("data-calculated-score", "true");
                toplamPuanElementi.id = "notOrtalama";
                basariNotuCellSpan.appendChild(toplamPuanElementi);
            }
        } else {
            const newAverageRow = document.createElement("tr");
            const isDetailPage = !!table.closest("#icerik");
            newAverageRow.innerHTML = `<td></td><td class="font-weight-bold">Ortalama</td>${isDetailPage ? '<td></td>' : ''}<td class="text-right font-weight-bold"><span id="notOrtalama" data-calculated-score="true" style="color: #000">${formattedTotal}</span></td>`;
            let referenceNode = Array.from(tbody.querySelectorAll("tr")).find(r =>
                ["Anket", "Bütünleme Başvurusu", "İş Sağlığı ve Güvenliği", "Devam Durumu"]
                .some(text => r.querySelector("td:nth-child(2)")?.textContent.includes(text) || (r.querySelector("td:nth-child(3)") || r.querySelector("td:nth-child(4)"))?.textContent.includes(text))
            );
            tbody.insertBefore(newAverageRow, referenceNode || null);
        }
    });
    initGradeClickHandlers();
}

function initGradeClickHandlers() {
    if (!window.location.href.startsWith("https://obs.sabis.sakarya.edu.tr/Ders")) return;
    const notGirisSpanlari = Array.from(document.querySelectorAll(".card-body .text-right > span:first-child, #icerik .card-body table.table td.text-right > span:first-child"))
        .filter(span => {
            const parentTd = span.closest("td");
            if (!parentTd || parentTd.classList.contains('font-weight-bold')) return false;
            const row = parentTd.closest("tr");
            const labelCellInRow = row?.querySelector("td:nth-child(2)");
            return !(labelCellInRow && (labelCellInRow.textContent.includes("Başarı Notu") || labelCellInRow.textContent.includes("Ortalama")));
        });

    notGirisSpanlari.forEach(notElement => {
        const newElement = notElement.cloneNode(true);
        notElement.parentNode.replaceChild(newElement, notElement);
        notElement = newElement;
        notElement.style.cursor = "pointer";
        const currentGradeText = getPrimaryTextContent(notElement);

        if (!currentGradeText || (currentGradeText !== "-" && isNaN(parseFloat(currentGradeText.split(" ")[0])))) {
            if (currentGradeText !== "-") {
                notElement.textContent = "-";
                Array.from(notElement.querySelectorAll("span[data-calculated-score='sub']")).forEach(s => s.remove());
            }
            notElement.style.fontWeight = "bold";
        } else if (currentGradeText !== "-") {
            notElement.style.fontWeight = "";
        }

        notElement.addEventListener("click", function handleClick() {
            const originalTextForPrompt = getPrimaryTextContent(notElement).split(" ")[0];
            const promptDefaultValue = (originalTextForPrompt !== "-" && !isNaN(parseInt(originalTextForPrompt))) ? parseInt(originalTextForPrompt) : "";
            const yeniNotPrompt = prompt("Yeni notunuzu girin (0-100):", promptDefaultValue);

            if (yeniNotPrompt === null) return;
            Array.from(notElement.querySelectorAll("span[data-calculated-score='sub']")).forEach(s => s.remove());

            if (yeniNotPrompt.trim() === "") {
                notElement.textContent = "-";
                notElement.style.fontWeight = "bold";
            } else {
                const notSayisi = parseInt(yeniNotPrompt);
                if (isNaN(notSayisi) || notSayisi < 0 || notSayisi > 100) {
                    alert("Geçerli bir not giriniz! (0-100)");
                    return;
                }
                notElement.textContent = notSayisi.toString();
                notElement.style.fontWeight = "";
            }

            const dersCardElementi = notElement.closest(".card-body:not(#icerik .card-body)");
            if (dersCardElementi) {
                const harfNotuElement = dersCardElementi.querySelector("td.text-right.font-weight-bold > span:first-child");
                if (harfNotuElement) {
                    const harfNotuTextContent = getPrimaryTextContent(harfNotuElement);
                    const harfNotuMatch = harfNotuTextContent.match(/^[A-ZÇĞİÖŞÜ]{1,2}(?![a-z])/);
                    if (harfNotuMatch) {
                        const textNodeVal = harfNotuTextContent.replace(harfNotuMatch[0], "").trim();
                        const avgSpan = harfNotuElement.querySelector("#notOrtalama");
                        harfNotuElement.innerHTML = '';
                        if (textNodeVal || !avgSpan) harfNotuElement.appendChild(document.createTextNode(textNodeVal));
                        if (avgSpan) harfNotuElement.appendChild(avgSpan);
                    }
                }
            }
            chrome.storage.local.get([STORAGE_KEYS.CALCULATE], data => {
                if (data[STORAGE_KEYS.CALCULATE]) enableCalculateGrade();
            });
        });
    });
}

function handleInitialSettings(settings) {
    applyThemeStyle(THEME_STYLE_ID.RED, redThemeCssRules, settings[STORAGE_KEYS.REDMODE]);
    applyThemeStyle(THEME_STYLE_ID.DARK, darkThemeCssRules, settings[STORAGE_KEYS.DARKMODE]);

    if (settings[STORAGE_KEYS.STEALTH]) {
        enableStealthMode();
    }
    runGradeLogic(settings[STORAGE_KEYS.CALCULATE]);
}

chrome.storage.local.get(Object.values(STORAGE_KEYS), (settings) => {
    if (chrome.runtime.lastError) return;
    handleInitialSettings(settings);
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes[STORAGE_KEYS.REDMODE] !== undefined) {
            applyThemeStyle(THEME_STYLE_ID.RED, redThemeCssRules, changes[STORAGE_KEYS.REDMODE].newValue);
        }
        if (changes[STORAGE_KEYS.DARKMODE] !== undefined) {
            applyThemeStyle(THEME_STYLE_ID.DARK, darkThemeCssRules, changes[STORAGE_KEYS.DARKMODE].newValue);
        }
        if (changes[STORAGE_KEYS.STEALTH] !== undefined) {
            // Stealth modu popup.js'den sayfa yenileme ile yönetiliyor.
            // Eğer content.js'de de anında tepki vermesi gerekiyorsa (yenileme olmadan),
            // enableStealthMode veya bir disableStealthMode çağrılmalı.
            // Şimdilik, sayfa yenilemesine güveniyoruz.
            if (changes[STORAGE_KEYS.STEALTH].newValue) {
                enableStealthMode();
            } else {
                // Gizli modu kapatmak için en basit yol sayfayı yenilemektir,
                // çünkü DOM'a yapılan değişiklikleri geri almak karmaşık olabilir.
                // Bu genellikle popup.js tarafından yönetilir.
            }
        }
        if (changes[STORAGE_KEYS.CALCULATE] !== undefined) {
            runGradeLogic(changes[STORAGE_KEYS.CALCULATE].newValue);
        }
    }
});

if (window.location.href.includes("/Ders/Grup/")) {
    const targetNodeToObserve = document.getElementById('icerik');
    if (targetNodeToObserve) {
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' && Array.from(mutation.addedNodes).some(node => node.nodeType === Node.ELEMENT_NODE && (node.querySelector("table.table") || node.classList?.contains("table")))) {
                    setTimeout(() => {
                        chrome.storage.local.get([STORAGE_KEYS.CALCULATE], (data) => {
                            runGradeLogic(data[STORAGE_KEYS.CALCULATE]);
                        });
                    }, 500);
                    break;
                }
            }
        });
        observer.observe(targetNodeToObserve, { childList: true, subtree: true });
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "recalculateGradesAfterChange") {
         chrome.storage.local.get([STORAGE_KEYS.CALCULATE], data => {
            if (data[STORAGE_KEYS.CALCULATE]) enableCalculateGrade();
        });
        sendResponse({status: "ok_recalculated"});
        return true;
    }
});