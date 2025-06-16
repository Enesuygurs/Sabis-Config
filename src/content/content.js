const THEME_LINK_ID_PREFIX = "sauconfig-theme-";
const STORAGE_KEYS = {
    REDMODE: "redmode_state",
    DARKMODE: "darkmode_state",
    STEALTH: "stealth_state",
    CALCULATE: "calculate_state"
};
const SABIS_DERS_URL_PREFIX = "https://obs.sabis.sakarya.edu.tr/Ders";

function manageTheme(themeName, cssFileName, enable) {
    const themeId = THEME_LINK_ID_PREFIX + themeName;
    let linkElement = document.getElementById(themeId);
    if (enable) {
        if (!linkElement) {
            linkElement = document.createElement("link");
            linkElement.id = themeId;
            linkElement.rel = "stylesheet";
            linkElement.type = "text/css";
            linkElement.href = chrome.runtime.getURL(`assets/themes/${cssFileName}`);
            document.head.appendChild(linkElement);
        }
    } else if (linkElement) {
        linkElement.remove();
    }
}

function enableStealthMode() {
    const avatarUrl = chrome.runtime.getURL("assets/images/avatar.png");

    document.querySelectorAll(".symbol-label img, .symbol.symbol-35.symbol-light-success img")
        .forEach(img => {
            img.style.display = "none";
            const parent = img.parentElement;
            if (parent) {
                Object.assign(parent.style, {
                    backgroundImage: `url('${avatarUrl}')`,
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
        ".font-weight-bold.text-dark-50.font-size-sm.pb-6": "Sabis Config",
        ".text-dark-50.font-weight-bolder.font-size-base.d-none.d-md-inline.mr-3": "Anonymous"
    };
    for (const selector in selectorsAndText) {
        document.querySelectorAll(selector).forEach(el => {
            el.style.setProperty("color", "#898989", "important");
            el.style.setProperty("font-weight", "bold", "important");
            el.innerText = selectorsAndText[selector];
        });
    }

    document.querySelectorAll(".navi-footer.px-8.py-5").forEach(footer => {
        Array.from(footer.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && /^[gGbB]\d+$/.test(node.textContent.trim())) {
                node.textContent = "";
            }
        });
    });

    document.querySelectorAll(".card-body .pb-5 .pt-1").forEach(el => el.style.display = "none");

    document.querySelectorAll("*").forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle?.getPropertyValue("background-image").includes("data:image/svg+xml")) {
            try {
                const bgImage = computedStyle.getPropertyValue("background-image");
                const decodedSvg = decodeURIComponent(bgImage.substring(bgImage.indexOf(',') + 1, bgImage.length - 2));
                if (decodedSvg.includes("<text")) {
                    const updatedSvg = decodedSvg.replace(/<text[^>]*>.*?<\/text>/g, (match) => match.replace(/>(.*?)</, ">SABİS Config<"));
                    element.style.setProperty("background-image", `url("data:image/svg+xml,${encodeURIComponent(updatedSvg)}")`, "important");
                }
            } catch (e) { /* SVG parse hatası, işlem yapma */ }
        }
    });
}

function formatGradeNumber(number) {
    let formatted = Number(number).toFixed(10).replace(/\.?0+$/, "");
    if (!formatted.includes(".")) formatted += ".00";
    else if (formatted.split(".")[1].length === 1) formatted += "0";
    return formatted;
}

function getPrimaryTextContent(element) {
    return Array.from(element?.childNodes || [])
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent.trim())
        .join(" ");
}

function processGradeTable(table) {
    const tbody = table.querySelector("tbody");
    if (!tbody) return;

    // Önceki hesaplama artıklarını temizle
    tbody.querySelectorAll("tr.calculated-average-row").forEach(row => row.remove());
    tbody.querySelectorAll("span[data-calculated-score='sub']").forEach(span => span.remove());

    const currentRows = Array.from(tbody.querySelectorAll("tr"));
    let totalPoints = 0;
    let hasMakeupExam = false;

    currentRows.forEach(row => {
        const calismaTipiCell = row.querySelector("td:nth-child(2)");
        if (calismaTipiCell?.textContent.includes("Bütünleme")) {
            hasMakeupExam = true;
        }
    });

    currentRows.forEach(row => {
        const oranCell = row.querySelector("td:nth-child(1)");
        const notCellParentTd = row.querySelector("td:nth-child(4)") || row.querySelector("td:nth-child(3)");
        const notCellSpan = notCellParentTd?.querySelector("span:first-child");
        const calismaTipiCell = row.querySelector("td:nth-child(2)");

        if (!oranCell || !notCellSpan || !calismaTipiCell) return;
        if (hasMakeupExam && calismaTipiCell.textContent.includes("Final")) return;

        const oranText = oranCell.textContent.trim().replace(",", ".");
        const oran = parseFloat(oranText);
        const notTextContent = getPrimaryTextContent(notCellSpan).split(" ")[0];
        const not = getGradeValue(notTextContent);

        // Oranı 0 olan satırları (İSG gibi) hesaplamaya katma
        if (oran > 0 && not !== null) {
            const calculatedPoint = (oran * not) / 100;
            totalPoints += calculatedPoint;

            const subScoreElement = document.createElement("span");
            subScoreElement.style.cssText = "color: rgb(52, 52, 52); font-size: 0.9em;";
            
            if (not === 0 && isNaN(parseFloat(notTextContent))) {
                 subScoreElement.textContent = ` (0)`;
            } else {
                 subScoreElement.textContent = ` (${formatGradeNumber(calculatedPoint)})`;
            }
            
            subScoreElement.setAttribute("data-calculated-score", "sub");
            notCellSpan.appendChild(subScoreElement);
        }
    });

    const formattedTotal = formatGradeNumber(totalPoints);
    const successGradeRow = currentRows.find(row => row.querySelector("td:nth-child(2)")?.textContent.includes("Başarı Notu"));

    if (successGradeRow) {
        // Bu bölüm ders detay sayfası içindir, zaten doğru çalışıyor.
        const successGradeCellSpan = successGradeRow.querySelector("td:nth-child(3) span:first-child");
        if (successGradeCellSpan) {
            const letterGrade = getPrimaryTextContent(successGradeCellSpan).match(/^[A-ZÇĞİÖŞÜ]{1,2}(?![a-z])/)?.[0] || "";
            const colors = { FF: "#df1212", FD: "#df1212", DD: "blue", DC: "blue", DZ: "orange", GR: "orange" };
            successGradeCellSpan.style.color = colors[letterGrade] || "green";
            successGradeCellSpan.querySelector("#notOrtalama")?.remove();
            
            const totalPointsElement = document.createElement("span");
            totalPointsElement.style.color = "#000";
            totalPointsElement.textContent = ` (${formattedTotal})`;
            totalPointsElement.setAttribute("data-calculated-score", "true");
            totalPointsElement.id = "notOrtalama";
            successGradeCellSpan.appendChild(totalPointsElement);
        }
    } else {
        // --- SORUNU ÇÖZEN DEĞİŞİKLİK BURADA ---
        // Bu bölüm ana ders listesi sayfası içindir.
        // Karmaşık yerleştirme mantığı yerine, ortalama satırını her zaman tbody'nin sonuna ekle.
        const newAverageRow = document.createElement("tr");
        newAverageRow.className = "calculated-average-row";
        newAverageRow.innerHTML = `<td></td><td class="font-weight-bold">Ortalama</td><td class="text-right font-weight-bold"><span id="notOrtalama" data-calculated-score="true" style="color: #000">${formattedTotal}</span></td>`;
        
        tbody.appendChild(newAverageRow);
    }
}

function enableCalculateGrade() {
    if (!window.location.href.startsWith(SABIS_DERS_URL_PREFIX)) return;
    
    const tablesToProcess = [];
    const url = new URL(window.location.href);
    const urlPath = url.pathname;
    const urlHash = url.hash;

    if (urlPath === "/Ders" || /^\/Ders\/\d{4}\/\d{1}$/.test(urlPath)) {
        document.querySelectorAll(".card-body table").forEach(table => tablesToProcess.push(table));
    } 
    else if (urlPath.startsWith("/Ders/Grup/") && urlHash === '#Not') {
        const table = document.querySelector("#icerik div.card > div.card-body > table.table");
        if (table) tablesToProcess.push(table);
    }

    tablesToProcess.forEach(processGradeTable);
    initGradeClickHandlers();
}

// content.js'deki mevcut initGradeClickHandlers fonksiyonunu bununla değiştirin

function initGradeClickHandlers() {
    if (!window.location.href.startsWith(SABIS_DERS_URL_PREFIX)) return;

    const gradeSpansQuery = ".card-body .text-right > span:first-child, #icerik .card-body table.table td.text-right > span:first-child";
    
    // Olay dinleyicilerinin tekrar tekrar eklenmesini önlemek için bir işaret kullanalım
    document.querySelectorAll(gradeSpansQuery).forEach(originalSpan => {
        if (originalSpan.dataset.handlerAttached) return; // Zaten eklenmişse atla

        const parentTd = originalSpan.closest("td");
        if (!parentTd || parentTd.classList.contains('font-weight-bold')) return;

        const row = parentTd.closest("tr");
        const labelCellInRow = row?.querySelector("td:nth-child(2)");
        if (labelCellInRow && (labelCellInRow.textContent.includes("Başarı Notu") || labelCellInRow.textContent.includes("Ortalama"))) return;

        // Olay dinleyicisini doğrudan orijinal span'a ekliyoruz, klonlamaya gerek yok
        const gradeSpan = originalSpan;
        gradeSpan.style.cursor = "pointer";
        gradeSpan.dataset.handlerAttached = "true"; // İşaretle

        // Başlangıç durumunu ayarla: Geçersiz notları '-' yap
        const currentGradeText = getPrimaryTextContent(gradeSpan).split(" ")[0];
        const gradeValue = getGradeValue(currentGradeText);
        if (gradeValue === null && currentGradeText !== "-") {
            // Mevcut alt skoru koruyarak ana metni değiştir
            const subScoreSpan = gradeSpan.querySelector("span[data-calculated-score='sub']");
            gradeSpan.textContent = "-";
            if(subScoreSpan) gradeSpan.appendChild(subScoreSpan);
        }

        gradeSpan.addEventListener("click", function handleClick() {
            const originalTextOnClick = getPrimaryTextContent(gradeSpan).split(" ")[0];
            const promptDefault = getGradeValue(originalTextOnClick) !== null ? getGradeValue(originalTextOnClick) : "";
            const newGradePrompt = prompt("Yeni notunuzu girin (0-100):", promptDefault);

            if (newGradePrompt === null) return;

            // Önceki alt skoru temizle
            gradeSpan.querySelector("span[data-calculated-score='sub']")?.remove();

            if (newGradePrompt.trim() === "") {
                gradeSpan.textContent = "-";
            } else {
                const gradeNumber = parseInt(newGradePrompt);
                if (isNaN(gradeNumber) || gradeNumber < 0 || gradeNumber > 100) {
                    alert("Geçerli bir not giriniz! (0-100)");
                    // Hatadan sonra orijinal metni geri yükle
                    gradeSpan.textContent = originalTextOnClick;
                    return;
                }
                gradeSpan.textContent = gradeNumber.toString();
            }

            // Not değiştirildikten sonra, ana ders kartındaki harf notunu temizle
            const courseCardBody = gradeSpan.closest(".card-body:not(#icerik .card-body)");
            if (courseCardBody) {
                const letterGradeElement = courseCardBody.querySelector("td.text-right.font-weight-bold > span:first-child");
                if (letterGradeElement) {
                    // Sadece harf notu kısmını sil, hesaplanan ortalamayı (varsa) koru
                    const avgSpan = letterGradeElement.querySelector("#notOrtalama");
                    letterGradeElement.textContent = ''; // Her şeyi temizle
                    if (avgSpan) letterGradeElement.appendChild(avgSpan); // Ortalama span'ini geri ekle
                }
            }

            // Hesaplamayı yeniden tetikle
            chrome.storage.local.get([STORAGE_KEYS.CALCULATE], data => {
                if (data[STORAGE_KEYS.CALCULATE]) {
                    // Detay sayfasındaysak tüm tabloyu, ana sayfadaysak sadece ilgili kartı yeniden işle
                    const tableToReprocess = gradeSpan.closest("table");
                    if (tableToReprocess) {
                        processGradeTable(tableToReprocess);
                    }
                }
            });
        });
    });
}

function getGradeValue(text) {
    const gradeText = text.trim().toUpperCase().replace(",", ".");
    const specialZeroGrades = ["GR", "YT", "YZ", "MU", "E", "EKSİK", "YETERLİ", "YETERSİZ", "MUAF"];

    if (specialZeroGrades.includes(gradeText)) {
        return 0;
    }

    const numericValue = parseFloat(gradeText);
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) {
        return numericValue;
    }
    
    // "-" veya geçersiz bir metin ise
    return null;
}

function runOrClearGradeLogic(calculateEnabled) {
    if (!window.location.href.startsWith(SABIS_DERS_URL_PREFIX)) return;

    if (calculateEnabled) {
        enableCalculateGrade();
    } else {
        document.querySelectorAll("span#notOrtalama[data-calculated-score='true'], span[data-calculated-score='sub']")
            .forEach(span => span.remove());
        document.querySelectorAll(".card-body table tbody tr, #icerik table tbody tr").forEach(row => {
            const labelCell = row.querySelector("td:nth-child(2)");
            if (labelCell?.textContent.trim() === "Ortalama" && labelCell.classList.contains("font-weight-bold")) {
                row.remove();
            }
        });
        initGradeClickHandlers(); 
    }
}

function applyInitialSettings(settings) {
    manageTheme("red", "red.css", !!settings[STORAGE_KEYS.REDMODE]);
    manageTheme("dark", "dark.css", !!settings[STORAGE_KEYS.DARKMODE]);
    if (settings[STORAGE_KEYS.STEALTH]) enableStealthMode();
    runOrClearGradeLogic(!!settings[STORAGE_KEYS.CALCULATE]);
}

chrome.storage.local.get(Object.values(STORAGE_KEYS), (settings) => {
    if (chrome.runtime.lastError) return;
    applyInitialSettings(settings);
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes[STORAGE_KEYS.REDMODE] !== undefined) {
            manageTheme("red", "red.css", !!changes[STORAGE_KEYS.REDMODE].newValue);
        }
        if (changes[STORAGE_KEYS.DARKMODE] !== undefined) {
            manageTheme("dark", "dark.css", !!changes[STORAGE_KEYS.DARKMODE].newValue);
        }
        if (changes[STORAGE_KEYS.STEALTH] !== undefined) {
            // Stealth modu popup.js tarafından sayfa yenileme ile yönetiliyor.
        }
        if (changes[STORAGE_KEYS.CALCULATE] !== undefined) {
            runOrClearGradeLogic(!!changes[STORAGE_KEYS.CALCULATE].newValue);
        }
    }
});

if (window.location.pathname.startsWith("/Ders/Grup/")) {
    const targetNode = document.getElementById('icerik');
    if (targetNode) {
        const observer = new MutationObserver(mutations => {
            if (window.location.hash !== '#Not') {
                return; 
            }

            const tableAdded = mutations.some(m =>
                m.type === 'childList' &&
                Array.from(m.addedNodes).some(n =>
                    n.nodeType === Node.ELEMENT_NODE && (n.querySelector("table.table") || n.classList?.contains("table"))
                )
            );
            if (tableAdded) {
                setTimeout(() => {
                    chrome.storage.local.get([STORAGE_KEYS.CALCULATE], data => {
                        if (!chrome.runtime.lastError) runOrClearGradeLogic(!!data[STORAGE_KEYS.CALCULATE]);
                    });
                }, 500);
            }
        });
        observer.observe(targetNode, { childList: true, subtree: true });
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case "recalculateGradesAfterChange":
            chrome.storage.local.get([STORAGE_KEYS.CALCULATE], data => {
                if (!chrome.runtime.lastError && data[STORAGE_KEYS.CALCULATE]) {
                    enableCalculateGrade();
                }
            });
            sendResponse({ status: "ok_recalculated" });
            break;
        case "toggleRedTheme":
            manageTheme("red", "red.css", request.state);
            sendResponse({ status: "red_theme_toggled" });
            break;
        case "toggleDarkTheme":
            manageTheme("dark", "dark.css", request.state);
            sendResponse({ status: "dark_theme_toggled" });
            break;
        default:
            sendResponse({status: "unknown_action"});
            break;
    }
    return true;
});