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

    Array.from(tbody.querySelectorAll("tr"))
        .filter(row => row.querySelector("td:nth-child(2)")?.textContent.trim() === "Ortalama" && row.querySelector("td:nth-child(2)")?.classList.contains("font-weight-bold"))
        .forEach(row => row.remove());

    tbody.querySelectorAll("span#notOrtalama[data-calculated-score='true'], span[data-calculated-score='sub']")
        .forEach(span => span.remove());

    const currentRows = Array.from(tbody.querySelectorAll("tr"));
    let totalPoints = 0;
    let hasMakeupExam = false;

    currentRows.forEach(row => {
        const oranCell = row.querySelector("td:nth-child(1)");
        const notCellParentTd = row.querySelector("td:nth-child(4)") || row.querySelector("td:nth-child(3)");
        const notCellSpan = notCellParentTd?.querySelector("span:first-child");
        const calismaTipiCell = row.querySelector("td:nth-child(2)");

        if (!oranCell || !notCellSpan || !calismaTipiCell) return;
        if (calismaTipiCell.textContent.includes("Bütünleme")) hasMakeupExam = true;

        const oranText = oranCell.textContent.trim().replace(",", ".");
        const notTextContent = getPrimaryTextContent(notCellSpan).split(" ")[0].replace(",", ".");
        const oran = parseFloat(oranText);
        const not = parseFloat(notTextContent);

        if (oran > 0 && notTextContent && notTextContent !== "-" && !isNaN(not) && not >= 0) {
            const calculatedPoint = (oran * not) / 100;
            totalPoints += calculatedPoint;
            const subScoreElement = document.createElement("span");
            subScoreElement.style.cssText = "color: rgb(52, 52, 52); font-size: 0.9em;";
            subScoreElement.textContent = ` (${formatGradeNumber(calculatedPoint)})`;
            subScoreElement.setAttribute("data-calculated-score", "sub");
            notCellSpan.appendChild(subScoreElement);
        }
    });

    if (hasMakeupExam) {
        currentRows.forEach(row => {
            if (row.querySelector("td:nth-child(2)")?.textContent.includes("Final")) {
                const oranCell = row.querySelector("td:nth-child(1)");
                const notCellParentTd = row.querySelector("td:nth-child(4)") || row.querySelector("td:nth-child(3)");
                const notCellSpan = notCellParentTd?.querySelector("span:first-child");
                if (oranCell && notCellSpan) {
                    const oran = parseFloat(oranCell.textContent.trim().replace(",", "."));
                    const not = parseFloat(getPrimaryTextContent(notCellSpan).split(" ")[0].replace(",", "."));
                    if (!isNaN(oran) && !isNaN(not) && getPrimaryTextContent(notCellSpan) && getPrimaryTextContent(notCellSpan) !== "-") {
                        totalPoints -= (oran * not) / 100;
                    }
                }
            }
        });
    }

    const formattedTotal = formatGradeNumber(totalPoints);
    const successGradeRow = currentRows.find(row => row.querySelector("td:nth-child(2)")?.textContent.includes("Başarı Notu"));

    if (successGradeRow) {
        const successGradeCellSpan = successGradeRow.querySelector("td:nth-child(3) span:first-child");
        if (successGradeCellSpan) {
            const letterGrade = getPrimaryTextContent(successGradeCellSpan).match(/^[A-ZÇĞİÖŞÜ]{1,2}(?![a-z])/)?.[0] || "";
            const colors = { FF: "#df1212", FD: "#df1212", DD: "blue", DC: "blue", DZ: "orange", GR: "orange" };
            successGradeCellSpan.style.color = colors[letterGrade] || "green";
            const totalPointsElement = document.createElement("span");
            totalPointsElement.style.color = "#000";
            totalPointsElement.textContent = ` (${formattedTotal})`;
            totalPointsElement.setAttribute("data-calculated-score", "true");
            totalPointsElement.id = "notOrtalama";
            successGradeCellSpan.appendChild(totalPointsElement);
        }
    } else {
        const newAverageRow = document.createElement("tr");
        const isDetailPage = !!table.closest("#icerik");
        newAverageRow.innerHTML = `<td></td><td class="font-weight-bold">Ortalama</td>${isDetailPage ? '<td></td>' : ''}<td class="text-right font-weight-bold"><span id="notOrtalama" data-calculated-score="true" style="color: #000">${formattedTotal}</span></td>`;
        const referenceKeywords = ["Anket", "Bütünleme Başvurusu", "İş Sağlığı ve Güvenliği", "Devam Durumu"];
        const referenceNode = currentRows.find(r =>
            referenceKeywords.some(text => r.querySelector("td:nth-child(2)")?.textContent.includes(text) || (r.querySelector("td:nth-child(3)") || r.querySelector("td:nth-child(4)"))?.textContent.includes(text))
        );
        tbody.insertBefore(newAverageRow, referenceNode || null);
    }
}

function enableCalculateGrade() {
    if (!window.location.href.startsWith(SABIS_DERS_URL_PREFIX)) return;
    const tablesToProcess = [];
    const urlPath = new URL(window.location.href).pathname;

    if (urlPath === "/Ders" || /^\/Ders\/\d{4}\/\d{1}$/.test(urlPath)) {
        document.querySelectorAll(".card-body table").forEach(table => tablesToProcess.push(table));
    } else if (urlPath.startsWith("/Ders/Grup/")) {
        const table = document.querySelector("#icerik div.card > div.card-body > table.table");
        if (table) tablesToProcess.push(table);
    }

    tablesToProcess.forEach(processGradeTable);
    initGradeClickHandlers();
}

function initGradeClickHandlers() {
    if (!window.location.href.startsWith(SABIS_DERS_URL_PREFIX)) return;

    const gradeSpansQuery = ".card-body .text-right > span:first-child, #icerik .card-body table.table td.text-right > span:first-child";
    document.querySelectorAll(gradeSpansQuery).forEach(originalSpan => {
        const parentTd = originalSpan.closest("td");
        if (!parentTd || parentTd.classList.contains('font-weight-bold')) return;

        const row = parentTd.closest("tr");
        const labelCellInRow = row?.querySelector("td:nth-child(2)");
        if (labelCellInRow && (labelCellInRow.textContent.includes("Başarı Notu") || labelCellInRow.textContent.includes("Ortalama"))) return;

        const gradeSpan = originalSpan.cloneNode(true); // Event listener'ları temizlemek için
        originalSpan.parentNode.replaceChild(gradeSpan, originalSpan);

        gradeSpan.style.cursor = "pointer";
        const currentGradeText = getPrimaryTextContent(gradeSpan);
        const currentGradeValue = currentGradeText.split(" ")[0];

        if (!currentGradeText || (currentGradeValue !== "-" && isNaN(parseFloat(currentGradeValue.replace(",", "."))))) {
            if (currentGradeValue !== "-") {
                gradeSpan.textContent = "-";
                gradeSpan.querySelectorAll("span[data-calculated-score='sub']").forEach(s => s.remove());
            }
            gradeSpan.style.fontWeight = "bold";
        } else if (currentGradeValue !== "-") {
            gradeSpan.style.fontWeight = "";
        }

        gradeSpan.addEventListener("click", function handleClick() {
            const originalTextOnClick = getPrimaryTextContent(gradeSpan).split(" ")[0];
            const promptDefault = (originalTextOnClick !== "-" && !isNaN(parseInt(originalTextOnClick))) ? parseInt(originalTextOnClick) : "";
            const newGradePrompt = prompt("Yeni notunuzu girin (0-100):", promptDefault);

            if (newGradePrompt === null) return;

            gradeSpan.querySelectorAll("span[data-calculated-score='sub']").forEach(s => s.remove());

            if (newGradePrompt.trim() === "") {
                gradeSpan.textContent = "-";
                gradeSpan.style.fontWeight = "bold";
            } else {
                const gradeNumber = parseInt(newGradePrompt);
                if (isNaN(gradeNumber) || gradeNumber < 0 || gradeNumber > 100) {
                    alert("Geçerli bir not giriniz! (0-100)");
                    gradeSpan.textContent = originalTextOnClick; // Eski haline getir
                    return;
                }
                gradeSpan.textContent = gradeNumber.toString();
                gradeSpan.style.fontWeight = "";
            }

            const courseCardBody = gradeSpan.closest(".card-body:not(#icerik .card-body)");
            if (courseCardBody) {
                const letterGradeElement = courseCardBody.querySelector("td.text-right.font-weight-bold > span:first-child");
                if (letterGradeElement) {
                    const letterGradeText = getPrimaryTextContent(letterGradeElement);
                    const letterGradeMatch = letterGradeText.match(/^[A-ZÇĞİÖŞÜ]{1,2}(?![a-z])/);
                    if (letterGradeMatch) {
                        const textNodeVal = letterGradeText.replace(letterGradeMatch[0], "").trim();
                        const avgSpan = letterGradeElement.querySelector("#notOrtalama");
                        letterGradeElement.innerHTML = '';
                        if (textNodeVal || !avgSpan) letterGradeElement.appendChild(document.createTextNode(textNodeVal));
                        if (avgSpan) letterGradeElement.appendChild(avgSpan);
                    }
                }
            }
            chrome.storage.local.get([STORAGE_KEYS.CALCULATE], data => {
                if (data[STORAGE_KEYS.CALCULATE]) enableCalculateGrade();
            });
        });
    });
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
        initGradeClickHandlers(); // Tıklanabilirlik ve "-" için yine de çağır
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
            // Anında değişiklik istenirse:
            // changes[STORAGE_KEYS.STEALTH].newValue ? enableStealthMode() : window.location.reload();
        }
        if (changes[STORAGE_KEYS.CALCULATE] !== undefined) {
            runOrClearGradeLogic(!!changes[STORAGE_KEYS.CALCULATE].newValue);
        }
    }
});

if (window.location.href.includes("/Ders/Grup/")) {
    const targetNode = document.getElementById('icerik');
    if (targetNode) {
        const observer = new MutationObserver(mutations => {
            const tableAdded = mutations.some(m =>
                m.type === 'childList' &&
                Array.from(m.addedNodes).some(n =>
                    n.nodeType === Node.ELEMENT_NODE && (n.querySelector("table.table") || n.classList?.contains("table"))
                )
            );
            if (tableAdded) {
                setTimeout(() => { // DOM güncellemelerinin oturması için kısa bir bekleme
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
    return true; // Asenkron yanıtlar için veya gelecekteki mesajlar için.
});