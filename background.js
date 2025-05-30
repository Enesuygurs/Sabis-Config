chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "calculateGrades") calculateGrades();
  else if (message.action === "removeCalculatedGrades") removeCalculatedGrades();
  // ! KULLANILMIYOR
  /*
  else if (message.action === "openStealthMode") openStealthMode();
  else if (message.action === "enableRed") applyTheme();
  else if (message.action === "enableDark") applyDarkTheme();
  */
  // ! KULLANILMIYOR
});

function calculateGrades() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    const targetUrl = "https://obs.sabis.sakarya.edu.tr/Ders";

    if (currentTab.url.startsWith(targetUrl)) {
      chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        function: () => {
          const cardBodies = document.querySelectorAll(".card-body");

          function formatDecimal(number) {
            let formatted = number.toFixed(10).replace(/\.?0+$/, "");
            if (!formatted.includes(".")) {
              formatted += ".00";
            } else if (formatted.split(".")[1].length === 1) {
              formatted += "0";
            }
            return formatted;
          }

          cardBodies.forEach((cardBody) => {
            const rows = cardBody.querySelectorAll("tbody tr");

            let toplamPuan = 0;
            let butunlemeVar = false;

            rows.forEach((row) => {
              const oranCell = row.querySelector("td:nth-child(1)");
              const notCell = row.querySelector("td:nth-child(3) span");
              const calismaTipi = row.querySelector("td:nth-child(2)").textContent;

              if (calismaTipi.includes("Bütünleme")) {
                butunlemeVar = true;
              }

              if (oranCell && notCell && !isNaN(parseFloat(oranCell.textContent)) && !isNaN(parseFloat(notCell.textContent))) {
                const oran = parseFloat(oranCell.innerText.replace(",", "."));
                const not = parseFloat(notCell.innerText.replace(",", "."));
                const hesaplananPuan = (oran * not) / 100;
                toplamPuan += hesaplananPuan;

                const existingSpan = notCell.querySelector("[data-calculated-score]");
                if (!existingSpan) {
                  const sonucElementi = document.createElement("span");
                  sonucElementi.style.color = "#343434";
                  sonucElementi.textContent = ` (${formatDecimal(hesaplananPuan)})`;
                  sonucElementi.setAttribute("data-calculated-score", "true");
                  notCell.appendChild(sonucElementi);
                }
              }
            });

            if (butunlemeVar) {
              rows.forEach((row) => {
                const calismaTipi = row.querySelector("td:nth-child(2)").textContent;
                if (calismaTipi.includes("Final")) {
                  const oranCell = row.querySelector("td:nth-child(1)");
                  const notCell = row.querySelector("td:nth-child(3) span");

                  if (oranCell && notCell && !isNaN(parseFloat(oranCell.textContent)) && !isNaN(parseFloat(notCell.textContent))) {
                    const oran = parseFloat(oranCell.innerText.replace(",", "."));
                    const not = parseFloat(notCell.innerText.replace(",", "."));
                    const hesaplananPuan = (oran * not) / 100;
                    toplamPuan -= hesaplananPuan;
                  }
                }
              });
            }

            const basariNotuRow = Array.from(rows).find((row) => row.querySelector("td:nth-child(2)").textContent.includes("Başarı Notu"));
            if (basariNotuRow) {
              const basariNotuCell = basariNotuRow.querySelector("td:nth-child(3) span");
              const harfNotu = basariNotuCell.textContent.trim().split(" ")[0];

              const renkler = {
                FF: "#df1212",
                FD: "#df1212",
                DD: "blue",
                DC: "blue",
                DZ: "orange",
                GR: "orange",
              };
              basariNotuCell.style.color = renkler[harfNotu] || "green";

              const toplamPuanElementi = document.createElement("span");
              toplamPuanElementi.style.color = "#000";
              toplamPuanElementi.textContent = ` (${formatDecimal(toplamPuan)})`;
              toplamPuanElementi.setAttribute("data-calculated-score", "true");
              toplamPuanElementi.setAttribute("id", "notOrtalama");
              basariNotuCell.appendChild(toplamPuanElementi);
            } else {
              const newAverageRow = document.createElement("tr");
              newAverageRow.innerHTML = `
                <td></td>
                <td class="font-weight-bold">Ortalama</td>
                <td class="text-right font-weight-bold">
                  <span id="notOrtalama" data-calculated-score="true" style="color: #000">${formatDecimal(toplamPuan)}</span>
                </td>
              `;
              cardBody.querySelector("tbody").appendChild(newAverageRow);
            }
          });
        },
      });
    }
  });
}

function removeCalculatedGrades() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: () => {
        const cardBodies = document.querySelectorAll(".card-body");

        cardBodies.forEach((cardBody) => {
          const rows = cardBody.querySelectorAll("tbody tr");

          rows.forEach((row) => {
            const notCell = row.querySelector("td:nth-child(3) span");
            const existingSpan = notCell.querySelector("[data-calculated-score]");
            if (existingSpan) {
              existingSpan.remove(); // Remove calculated score for regular rows
            }
          });

          const basariNotuRow = Array.from(rows).find((row) => row.querySelector("td:nth-child(2)").textContent.includes("Başarı Notu"));
          if (basariNotuRow) {
            const basariNotuCell = basariNotuRow.querySelector("td:nth-child(3) span");
            const existingBasariNotuSpan = basariNotuCell.querySelector("[data-calculated-score]");
            if (existingBasariNotuSpan) {
              existingBasariNotuSpan.remove(); // Remove total score under Başarı Notu
            }
          }

          // Remove the "Ortalama" row if it exists
          const averageRow = Array.from(rows).find((row) => {
            const labelCell = row.querySelector("td:nth-child(2)");
            return labelCell && labelCell.textContent.trim() === "Ortalama";
          });
          if (averageRow) {
            averageRow.remove(); // Remove the entire row for "Ortalama"
          }
        });
      },
    });
  });
}

// ! KULLANILMIYOR
/*
function applyTheme() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    if (tab.url && tab.url.startsWith("chrome://")) return;
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: () => {
        newRule = `
    .aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover .menu-heading .menu-text, 
    .aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover .menu-link .menu-text { color: #df1212 !important; } 
    .text-right { text-align: right !important; color: #4d4d4d !important;} 
    .table th, .table td {  vertical-align: middle;} 
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
    .navi .navi-item .navi-link.active .navi-text { color: #df1212;} 
    .symbol.symbol-light-primary .symbol-label { background-color: #ffe1e1; color: #df1212; } 
    .aside-menu .menu-nav > .menu-item.menu-item-active > .menu-heading .menu-icon, 
    .aside-menu .menu-nav > .menu-item.menu-item-active > .menu-link .menu-icon { color: #df1212; } 
    .aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover > .menu-heading .menu-icon, 
    .aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover > .menu-link .menu-icon { color: #df1212; } 
    .table th, .table td { vertical-align: middle; font-weight: 500; } 
    @media (min-width: 992px) { .header .header-menu .menu-nav > .menu-item.menu-item-here > .menu-link, 
    .header .header-menu .menu-nav > .menu-item.menu-item-active > .menu-link { background-color: #631515; } } 
    @media (min-width: 992px) { .brand .btn .svg-icon svg g [fill] { fill: #ffffff; } } 
    .navi .navi-item .navi-link:hover .navi-text { color: #df1212;} 
    .topbar .btn.btn-icon:active, .topbar .btn.btn-icon.active, .topbar .btn.btn-icon:hover, .topbar .btn.btn-icon:focus, 
    .topbar .show .btn.btn-icon.btn-dropdown { background-color: #a50606 !important;
    border-radius: 50px !important;} 
    a.text-hover-primary:hover, .text-hover-primary:hover {color: #df1212 !important;} 
    .btn-link:hover {color: #df1212;text-decoration: underline;} 
    .fc-unthemed .fc-toolbar .fc-button:focus, .fc-unthemed .fc-toolbar .fc-button:active, .fc-unthemed .fc-toolbar .fc-button.fc-button-active { background: #df1212; color: #FFFFFF; border: 1px solid #911e1e;} 
    @media (min-width: 992px) { .brand .btn.active .svg-icon svg g [fill], .brand .btn:hover .svg-icon svg g [fill] {fill: #ffffff; }} 
    .btn.btn-light-primary { color: #df1212; background-color: #ffe1e1; border-color: transparent;} .btn.btn-light-primary:hover:not(.btn-text):not(:disabled):not(.disabled), .btn.btn-light-primary:focus:not(.btn-text), .btn.btn-light-primary.focus:not(.btn-text) {  color: #FFFFFF;  background-color: #df1212;  border-color: transparent;} .navi .navi-item .navi-link.active .navi-icon i { color: #df1212; } .navi .navi-item .navi-link:hover .navi-icon i { color: #df1212; }
    [class^=flaticon2-]:before, [class*=" flaticon2-"]:before {color: #434141;}
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
    .aside-menu .menu-nav > .menu-item.menu-item-active > .menu-heading, .aside-menu .menu-nav > .menu-item.menu-item-active > .menu-link {background-color: #f3f3f3;}
    .symbol.symbol-success .symbol-label {background-color: #d7d7d7;color: #ffffff;}
    .header-var1 .logo-wrapper img {filter: brightness(10);}
    .home-table > li span {background-color: #7c1715;text-align: center;}
    .home-table > li .before-bg {height: 230px;border: 2px solid #d3d3d3;}
    .home-table > li ul {border:0;}
    .home-table {padding:0 !important;}
   .btn {border: 2px solid transparent;}
   .btn-default:hover {background: #931d1d !important;border: 2px solid #6f1a17 !important;color: white;}
    .btn-success {background: #289728 !important; border: 0 !important;}
    .btn.btn-secondary {border: 0 !important;}
    .btn-success:hover {background: #089d08 !important; border: 0 !important;}
    .btn-default, .btn-primary, .btn-success, .btn-info, .btn-warning, .btn-danger {text-shadow: none;-webkit-box-shadow: none;box-shadow: none;}
    .btn-default {border: 2px solid #eee !important;background: #f5f5f5 !important;}
    small i {color: white;}
.nav-collapse ul li a {color: #ffffff;}
.header-var1 nav > ul > li > a:hover {color: #c5c5c5;}
.home-table {background-color: #ffffff;}
.footer-fluid {display: none;}
.contact-container {padding: 10px 0px 0px 0px !important;margin: 0 !important;}
.aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover > .menu-heading, .aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover > .menu-link {
    background-color: #f3f3f3;}
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
.card-header:first-child {
    border-radius: 0;
}
.swal2-container .swal2-html-container {height: auto !important;width: 800px;max-height: none;}

    #swal2-content > div > span {
    padding: 5px 10px;
    border: 2px solid #ddd;
    text-align: center;
    margin: 1px 5px 4px 5px;
    background: #f3f3f3;
}
#swal2-content > div {
    display: inline-grid;
    grid-template-columns: auto auto auto auto;
    gap: 0px;
    align-items: center;
}
.swal2-popup {
    width: auto;
}
.swal2-container.swal2-backdrop-show, .swal2-container.swal2-noanimation {
    background: rgb(147 0 0 / 40%);
}
.text-ogrenci {
    margin: 10px 8px 4px 15px;
    border: 3px solid #2e2e2e;
    background-color: rgb(30 30 30 / 60%);
    padding: 10px;
}
.text-danger {
    color: #d3172b !important;
}.alert.alert-primary {
    background-color: #df1212ab;
    border-color: transparent;
}
.btn {
    transition: none !important;
}
.symbol.symbol-light-danger .symbol-label {
    background-color: #7b000d;
    color: #ff4141;
}
.symbol.symbol-light-success .symbol-label {
    background-color: #007974;
    color: #1BC5BD;
}
i.symbol-badge.bg-info {
    filter: hue-rotate(85deg) saturate(5.5);
}
@media (min-width: 992px) {
    .header {
        background-color: #790000;
    }
}
@media (min-width: 992px) {
    .brand {
        background-color: #690101;
    }
}













    .fa-arrow-left:before {content: "\f060";color: white;}
    `;

        const styleElement = document.createElement("style");
        styleElement.id = "redmode";
        styleElement.appendChild(document.createTextNode(newRule));
        document.head.appendChild(styleElement);
      },
    });
  });
}

function applyDarkTheme() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    if (tab.url && tab.url.startsWith("chrome://")) return;
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: () => {
        newDarkRule = `
   .header {
        background: #111111;
    }
     .brand {
        background: #111111;
    }
    .card-body{
        background: #131313;
    }
    .content {
        background: #111111;
    }
    .flex-column-fluid {
    background: #111111;
}
    .aside-menu .menu-nav {
    background: #111111;
}
    .form-control {
    color: #cdcdcd;
    background-color: #121212;
}
    .form-control:focus {
    background-color: #121212;
    color: #cdcdcd;
}
    .table th, .table td {
    border-top: 1px solid #1a1a1a;
}
    .table thead th {
    vertical-align: bottom;
    border-bottom: 2px solid #1a1a1a;
}
    th {
    color: white;
}
    .card.card-custom {
    border: 3px solid #181818 !important;
}
    .bg-white {
    background-color: #111111 !important;
}
    .aside-menu {
    background-color: #111111;
}
    .aside-menu .menu-nav > .menu-item.menu-item-active > .menu-heading, .aside-menu .menu-nav > .menu-item.menu-item-active > .menu-link {
    background-color: #121212 !important;
}
    .aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover > .menu-heading, .aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover > .menu-link {
    background-color: #121212;
}
    .table th, .table td {
    border-top: 1px solid #1a1a1a;
    color: #9d9d9d;
}
    .symbol.symbol-light-primary .symbol-label {
    background-color: #161616 !important;
}
    .card.card-custom > .card-header {
    background-color: #111111;
}
    .card-header {
    border-bottom: 3px solid #181818;
}
.timeline.timeline-4 .timeline-items .timeline-item .timeline-content {
    background-color: #111111;
}
    .timeline.timeline-4 .timeline-items .timeline-item .timeline-badge {
    background: #1e1e1e;
}
    .timeline.timeline-4:after {
    background-color: #181818;
}
    .timeline.timeline-4.timeline-justified .timeline-items .timeline-item:after {
    border-right: solid 10px #111111;
}
    .timeline.timeline-4 .timeline-bar {
    background-color: #1a1a1a;
}
    .card.card-custom > .card-header .card-title, .card.card-custom > .card-header .card-title .card-label {
    color: #aeaeae;
}
    .fc-unthemed th, .fc-unthemed td, .fc-unthemed thead, .fc-unthemed tbody, .fc-unthemed .fc-divider, .fc-unthemed .fc-row, .fc-unthemed .fc-content, .fc-unthemed .fc-popover, .fc-unthemed .fc-list-view, .fc-unthemed .fc-list-heading td {
    border-color: #111111 !important;
}
    td.fc-widget-content {
    border: 1px solid #212121 !important;
}
    .fc-unthemed .fc-divider, .fc-unthemed .fc-popover .fc-header, .fc-unthemed .fc-list-heading td {
    background: #1c1c1c !important
}
    .fc-unthemed .fc-toolbar .fc-button {
    border: 1px solid #181818;
}
    .fc-unthemed .fc-toolbar .fc-button:hover {
    background: #0c0c0c;
    border: 1px solid #101010;
    color: #B5B5C3;
}
    td.fc-axis.fc-time.fc-widget-content {
    color: #B5B5C3;
}
    td {
    background: #111111 !important;
    border: 0 !important;
}
    .table-bordered {
    border: 1px solid #111111 !important;
}
    .card-header:first-child {
    border-radius: 0;
}
    .table-bordered th, .table-bordered td {
    border: 0 !important;
}
    .card {
    border-radius: 0 !important;
}
     .h2 {
          color: #9f9f9f !important;
    }
    body {
    color: #515151;
}
    .text-dark-75 {
    color: #595959 !important;
}
.text-dark {color: #bfbfbf !important;}

    .text-muted {
    color: #a5a5a5 !important;
}
   .navi.navi-bold .navi-item .navi-link .navi-text {
    color: #656565;
} 
    .navi.navi-hover .navi-item .navi-link:hover {
    background-color: #121212;
}
    .navi.navi-active .navi-item .navi-link.active {
        background-color: #121212;
}
    .alert.alert-custom.alert-outline-primary.fade.show.mb-5 {
    background-color: #101010 !important;
}
    [class*="text-right"] > span {font-weight: bold;}
.form-control {
    border: 2px solid #1e1e1e;
}
.fc-unthemed .fc-event, .fc-unthemed .fc-event-dot {
    background: #121212;
    border: 1px solid #272727;
}
.fc-unthemed .fc-event .fc-title, .fc-unthemed .fc-event-dot .fc-title {
    color: #575757;
}
.fc-unthemed .fc-event .fc-time, .fc-unthemed .fc-event-dot .fc-time {
    color: #ffffff;
}
.card.card-custom {
    box-shadow: none !important;
}
.aside {
    box-shadow: 0px 0px 5px 0px rgba(82, 63, 105, 0.08) !important;
}
.header-fixed .header {
    box-shadow: 0px 0px 5px 0px rgba(82, 63, 105, 0.08) !important;
}
    .dropdown-menu {
    box-shadow: 0px 0px 5px 0px rgba(82, 63, 105, 0.08) !important;
    }
.navi {
    background: #121212;
}
.card-footer {
    background-color: #141414 !important;
    border-top: 3px solid #1c1c1c;
}
.alert.alert-custom.alert-light-danger {
    background-color: #65000af5;
    margin-top: 10px;
}
.form-group label {
    color: #9b9b9b;
}
    .custom-file-label {
    background-color: #121212;
    border: 2px solid #1e1e1e;
}
    .card.card-custom.gutter-b {
    background: none;
}
.aside-menu .menu-nav > .menu-item > .menu-heading .menu-text, .aside-menu .menu-nav > .menu-item > .menu-link .menu-text {
color: #9f9f9f !important}
[class^=flaticon2-]:before, [class*=" flaticon2-"]:before {color: #595959 !important;}
.swal2-container .swal2-html-container {height: auto !important;width: 800px;max-height: none;}
#swal2-content > div > span {
    padding: 5px 10px;
    border: 2px solid #232323 !important;
    text-align: center;
    color: #686868 !important;
    margin: 1px 5px 4px 5px;
    background: #141414 !important;
}
#swal2-content > div {
    display: inline-grid;
    grid-template-columns: auto auto auto auto;
    gap: 0px;
    align-items: center;
}
.swal2-popup {
    width: auto;
}
.swal2-popup {
    background: #101010;
}
    .card-body > span {font-size: 18px; color: white !important; font-weight: bold; margin-left: 4px;}

.text-ogrenci {
    margin: 10px 8px 4px 15px;
    border: 3px solid #2e2e2e;
    background-color: rgb(30 30 30 / 60%);
    padding: 10px;
}
#notOrtalama{color: white !important;}
.symbol .symbol-label {
    color: whitesmoke;
    background-color: #171717;
}
.btn {
    transition: none !important;
}
    .text-right { text-align: right !important; color: #9d9d9d !important;} 


















  `;
        const styleElement = document.createElement("style");
        styleElement.id = "darkmode";
        styleElement.appendChild(document.createTextNode(newDarkRule));
        document.head.appendChild(styleElement);
      },
    });
  });
}

function openStealthMode() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    if (tab.url && tab.url.startsWith("chrome://")) return;
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: () => {
        document.querySelectorAll(".symbol-label img").forEach((imgElement) => {
          imgElement.style.display = "none"; // Fotoğrafı görünmez yap
          imgElement.parentElement.style.backgroundImage = "url('https://attic.sh/prxqzg7nk65j2ccjjyogebflzb4q')";
        });
        document.querySelectorAll(".symbol.symbol-35.symbol-light-success img").forEach((imgElement) => {
          imgElement.style.display = "none"; // Fotoğrafı görünmez yap
          imgElement.parentElement.style.backgroundColor = "#d7d7d7";
          imgElement.parentElement.style.backgroundImage = "url('https://attic.sh/prxqzg7nk65j2ccjjyogebflzb4q')";
          imgElement.parentElement.style.backgroundSize = "cover"; // Resmi kapsayacak şekilde yerleştir
          imgElement.parentElement.style.backgroundPosition = "center"; // Resmi ortalayarak yerleştir
          imgElement.parentElement.style.width = "35px"; // Genişlik
          imgElement.parentElement.style.height = "35px"; // Yükseklik
          imgElement.parentElement.style.borderRadius = "50%"; // Yuvarlak bir simge için
        });
        document.querySelectorAll(".card-title.font-weight-bolder.text-dark-75.text-hover-primary.font-size-h4.m-0.pt-7.pb-1").forEach((element) => {
          element.style.setProperty("color", "#292525", "important");
          element.style.setProperty("font-weight", "bold", "important");
          element.innerText = "Anonymous";
        });
        document.querySelectorAll(".text-dark-50.font-weight-bolder.font-size-base.d-none.d-md-inline.mr-3").forEach((element) => {
          element.style.setProperty("color", "white", "important");
          element.style.setProperty("font-weight", "bold", "important");
          element.innerText = "Stealth Mode ON";
        });
        document.querySelectorAll(".font-weight-bold.text-dark-50.font-size-sm.pb-6").forEach((element) => {
          element.style.setProperty("color", "#c71515", "important");
          element.style.setProperty("font-weight", "bold", "important");
          element.innerText = "Stealth Mode ON";
        });
        document.querySelectorAll(".card-body .pb-5 .pt-1").forEach((descElement) => {
          descElement.style.display = "none";
        });
        document.querySelectorAll(".navi-spacer-x-0").forEach((descElement) => {
          descElement.style.display = "none";
        });

        document.querySelectorAll("*").forEach((element) => {
          const backgroundImage = window.getComputedStyle(element).getPropertyValue("background-image");
          if (backgroundImage.includes("data:image/svg+xml")) {
            const updatedBackgroundImage = backgroundImage.replace(/<text[^>]*>(.*?)<\/text>/, "<text>$1</text>").replace(/>(.*?)</, ">Stealth Mode ON<");
            element.style.setProperty("background-image", updatedBackgroundImage, "important");
          }
        });
      },
    });
  });
}
*/
// ! KULLANILMIYOR
