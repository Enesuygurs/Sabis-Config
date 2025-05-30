/* 
// Tüm öğeleri seç
const allElements = document.querySelectorAll('*');

// Her bir öğeyi kontrol et
allElements.forEach(element => {
    // Yeni bir style elementi oluştur
    const styleElement = document.createElement('style');
    // Yeni CSS kuralını tanımla
    const newRule = 'body {color: #df1212;}.aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover .menu-heading .menu-text, .aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover .menu-link .menu-text { color: #ff3636 !important; } .text-right { text-align: right !important; color: red; text-shadow: 0 0 black; text-decoration: underline;} .table th, .table td {  vertical-align: middle;} .aside-menu .menu-nav > .menu-item.menu-item-active > .menu-heading .menu-text, .aside-menu .menu-nav > .menu-item.menu-item-active > .menu-link .menu-text {color: #df1212;font-weight: 500;} .aside-menu .menu-nav > .menu-item > .menu-heading .menu-text, .aside-menu .menu-nav > .menu-item > .menu-link .menu-text {color: #000000; font-weight: 500;} .form-control:focus {    border-color: #df1212; } p {color: black;} .text-primary {color: #df1212 !important; font-weight: 500; } .bg-primary {background-color: #df1212 !important; } a.text-primary:hover, a.text-primary:focus { color: #df1212 !important; } .text-dark-50 { color: #000 !important; } .navi .navi-item .navi-link.active .navi-text { color: #df1212;} .symbol.symbol-light-primary .symbol-label {      background-color: #ffe1e1;      color: #ff3636;  } .aside-menu .menu-nav > .menu-item.menu-item-active > .menu-heading .menu-icon, .aside-menu .menu-nav > .menu-item.menu-item-active > .menu-link .menu-icon {      color: #ff3636;  } .aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover > .menu-heading .menu-icon, .aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover > .menu-link .menu-icon {      color: #ff3636;  } .table th, .table td {      vertical-align: middle; font-weight: 500;  } @media (min-width: 992px) {      .brand { background-color: #a10606;  }  } @media (min-width: 992px) {    .header {  background-color: #8b1313;    }} @media (min-width: 992px) {    .header .header-menu .menu-nav > .menu-item.menu-item-here > .menu-link, .header .header-menu .menu-nav > .menu-item.menu-item-active > .menu-link {   background-color: #631515; }} @media (min-width: 992px) {    .brand .btn .svg-icon svg g [fill] { fill: #ffffff;    }} ';
    // Yeni kuralı style elementine ekle
    styleElement.appendChild(document.createTextNode(newRule));
    // Dokümanın head kısmına style elementini ekle
    document.head.appendChild(styleElement);








// Yeni bir style elementi oluştur
const styleElementf = document.createElement('style');
// Yeni CSS kuralını tanımla
const newRulef = '.navi .navi-item .navi-link:hover .navi-text { color: #df1212;} .topbar .btn.btn-icon:active, .topbar .btn.btn-icon.active, .topbar .btn.btn-icon:hover, .topbar .btn.btn-icon:focus, .topbar .show .btn.btn-icon.btn-dropdown { background-color: #df1212 !important;} a.text-hover-primary:hover, .text-hover-primary:hover {color: #df1212 !important;} .btn-link:hover {color: #df1212;text-decoration: underline;} .fc-unthemed .fc-toolbar .fc-button:focus, .fc-unthemed .fc-toolbar .fc-button:active, .fc-unthemed .fc-toolbar .fc-button.fc-button-active {  background: #ff3636;  color: #FFFFFF;  border: 1px solid #ffffff;} @media (min-width: 992px) {    .brand .btn.active .svg-icon svg g [fill], .brand .btn:hover .svg-icon svg g [fill] {fill: #ffffff; }} .btn.btn-light-primary {  color: #ff3636;  background-color: #ffe1e1;  border-color: transparent;} .btn.btn-light-primary:hover:not(.btn-text):not(:disabled):not(.disabled), .btn.btn-light-primary:focus:not(.btn-text), .btn.btn-light-primary.focus:not(.btn-text) {  color: #FFFFFF;  background-color: #ff3636;  border-color: transparent;}';
// Yeni kuralı style elementine ekle
styleElementf.appendChild(document.createTextNode(newRulef));
// Dokümanın head kısmına style elementini ekle
document.head.appendChild(styleElementf);
});
 */