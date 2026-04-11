const THEME_LINK_ID_PREFIX = "sauconfig-theme-";
const STORAGE_KEYS = {
    RED_MODE: "redmode_state",
    DARK_MODE: "darkmode_state",
    STEALTH: "stealth_state",
    CALCULATE: "calculate_state",
    DOWNLOAD_ALL: "downloadall_state",
    CHECK_QUESTIONS: "checkquestions_state",
    AUTO_SURVEY: "autosurvey_state"
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
    document.querySelectorAll(".symbol-label img, .symbol.symbol-35.symbol-light-success img").forEach(img => {
        img.style.display = "none";
        const parent = img.parentElement;
        if (parent) {
            Object.assign(parent.style, { backgroundImage: `url('${avatarUrl}')`, backgroundSize: "cover", backgroundPosition: "center" });
            if (parent.classList.contains('symbol-35')) {
                Object.assign(parent.style, { backgroundColor: "#d7d7d7", width: "35px", height: "35px", borderRadius: "50%" });
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
            if (node.nodeType === Node.TEXT_NODE && /^[gGbB]\d+$/.test(node.textContent.trim())) node.textContent = "";
        });
    });
    document.querySelectorAll(".card-body .pb-5 .pt-1").forEach(el => el.style.display = "none");
    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'META', 'LINK', 'BR', 'HR', 'HEAD', 'TITLE', 'NOSCRIPT', 'TEMPLATE', 'IFRAME', 'SVG', 'PATH']);
    document.querySelectorAll("body *").forEach(element => {
        if (SKIP_TAGS.has(element.tagName)) return;
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle?.getPropertyValue("background-image").includes("data:image/svg+xml")) {
            try {
                const bgImage = computedStyle.getPropertyValue("background-image");
                const decodedSvg = decodeURIComponent(bgImage.substring(bgImage.indexOf(',') + 1, bgImage.length - 2));
                if (decodedSvg.includes("<text")) {
                    const updatedSvg = decodedSvg.replace(/<text[^>]*>.*?<\/text>/g, (match) => match.replace(/>(.*?)</, ">SABİS Config<"));
                    element.style.setProperty("background-image", `url("data:image/svg+xml,${encodeURIComponent(updatedSvg)}")`, "important");
                }
            } catch (e) {
                console.warn('Stealth mode SVG parse hatası:', e);
            }
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
    return Array.from(element?.childNodes || []).filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent.trim()).join(" ");
}

function processGradeTable(table) {
    const tbody = table.querySelector("tbody");
    if (!tbody) return;
    tbody.querySelectorAll("tr.calculated-average-row, span[data-calculated-score='sub']").forEach(el => el.remove());
    const currentRows = Array.from(tbody.querySelectorAll("tr"));
    let totalPoints = 0;
    let hasMakeupExam = currentRows.some(row => row.textContent.includes("Bütünleme"));
    currentRows.forEach(row => {
        const oranCell = row.querySelector("td:nth-child(1)");
        const notCellParentTd = row.querySelector("td:nth-child(4)") || row.querySelector("td:nth-child(3)");
        const notCellSpan = notCellParentTd?.querySelector("span:first-child");
        const calismaTipiCell = row.querySelector("td:nth-child(2)");
        if (!oranCell || !notCellSpan || !calismaTipiCell) return;
        if (hasMakeupExam && calismaTipiCell.textContent.includes("Final")) return;
        const oran = parseFloat(oranCell.textContent.trim().replace(",", "."));
        const not = getGradeValue(getPrimaryTextContent(notCellSpan).split(" ")[0]);
        if (oran > 0 && not !== null) {
            const calculatedPoint = (oran * not) / 100;
            totalPoints += calculatedPoint;
            const subScoreElement = document.createElement("span");
            subScoreElement.style.cssText = "color: rgb(52, 52, 52); font-size: 0.9em;";
            subScoreElement.textContent = (not === 0 && isNaN(parseFloat(getPrimaryTextContent(notCellSpan).split(" ")[0]))) ? ` (0)` : ` (${formatGradeNumber(calculatedPoint)})`;
            subScoreElement.setAttribute("data-calculated-score", "sub");
            notCellSpan.appendChild(subScoreElement);
        }
    });
    const formattedTotal = formatGradeNumber(totalPoints);
    const successGradeRow = currentRows.find(row => row.querySelector("td:nth-child(2)")?.textContent.includes("Başarı Notu"));
    if (successGradeRow) {
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
        const newAverageRow = document.createElement("tr");
        newAverageRow.className = "calculated-average-row";
        const isDetailPage = !!table.closest("#icerik");
        newAverageRow.innerHTML = `<td></td><td class="font-weight-bold">Ortalama</td>${isDetailPage ? '<td></td>' : ''}<td class="text-right font-weight-bold"><span id="notOrtalama" data-calculated-score="true" style="color: #000">${formattedTotal}</span></td>`;
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
    } else if (urlPath.startsWith("/Ders/Grup/") && urlHash === '#Not') {
        const table = document.querySelector("#icerik div.card > div.card-body > table.table");
        if (table) tablesToProcess.push(table);
    }
    tablesToProcess.forEach(processGradeTable);
    initGradeClickHandlers();
}

function initGradeClickHandlers() {
    if (!window.location.href.startsWith(SABIS_DERS_URL_PREFIX)) return;
    const gradeSpansQuery = ".card-body .text-right > span:first-child, #icerik .card-body table.table td.text-right > span:first-child";
    document.querySelectorAll(gradeSpansQuery).forEach(gradeSpan => {
        if (gradeSpan.dataset.handlerAttached) return;
        const parentTd = gradeSpan.closest("td");
        if (!parentTd || parentTd.classList.contains('font-weight-bold')) return;
        const row = parentTd.closest("tr");
        const labelCellInRow = row?.querySelector("td:nth-child(2)");
        if (labelCellInRow && (labelCellInRow.textContent.includes("Başarı Notu") || labelCellInRow.textContent.includes("Ortalama"))) return;
        gradeSpan.style.cursor = "pointer";
        gradeSpan.dataset.handlerAttached = "true";
        const currentGradeText = getPrimaryTextContent(gradeSpan).split(" ")[0];
        const gradeValue = getGradeValue(currentGradeText);
        if (gradeValue === null && currentGradeText !== "-") {
            const subScoreSpan = gradeSpan.querySelector("span[data-calculated-score='sub']");
            gradeSpan.textContent = "-";
            if (subScoreSpan) gradeSpan.appendChild(subScoreSpan);
        }
        gradeSpan.addEventListener("click", function handleClick() {
            const originalTextOnClick = getPrimaryTextContent(gradeSpan).split(" ")[0];
            const promptDefault = getGradeValue(originalTextOnClick) !== null ? getGradeValue(originalTextOnClick) : "";
            const newGradePrompt = prompt("Yeni notunuzu girin (0-100):", promptDefault);
            if (newGradePrompt === null) return;
            gradeSpan.querySelector("span[data-calculated-score='sub']")?.remove();
            if (newGradePrompt.trim() === "") {
                gradeSpan.textContent = "-";
            } else {
                const gradeNumber = parseInt(newGradePrompt);
                if (isNaN(gradeNumber) || gradeNumber < 0 || gradeNumber > 100) {
                    alert("Geçerli bir not giriniz! (0-100)");
                    gradeSpan.textContent = originalTextOnClick;
                    return;
                }
                gradeSpan.textContent = gradeNumber.toString();
            }
            const courseCardBody = gradeSpan.closest(".card-body:not(#icerik .card-body)");
            if (courseCardBody) {
                const letterGradeElement = courseCardBody.querySelector("td.text-right.font-weight-bold > span:first-child");
                if (letterGradeElement) {
                    const avgSpan = letterGradeElement.querySelector("#notOrtalama");
                    letterGradeElement.textContent = '';
                    if (avgSpan) letterGradeElement.appendChild(avgSpan);
                }
            }
            chrome.storage.local.get([STORAGE_KEYS.CALCULATE], data => {
                if (data[STORAGE_KEYS.CALCULATE]) {
                    const tableToReprocess = gradeSpan.closest("table");
                    if (tableToReprocess) processGradeTable(tableToReprocess);
                }
            });
        });
    });
}

function getGradeValue(text) {
    const gradeText = text.trim().toUpperCase().replace(",", ".");
    const specialZeroGrades = ["GR", "YT", "YZ", "MU", "E", "EKSİK", "YETERSİZ", "MUAF"];
    if (specialZeroGrades.includes(gradeText)) return 0;
    const numericValue = parseFloat(gradeText);
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) return numericValue;
    return null;
}

function runOrClearGradeLogic(calculateEnabled) {
    if (!window.location.href.startsWith(SABIS_DERS_URL_PREFIX)) return;
    if (calculateEnabled) {
        enableCalculateGrade();
    } else {
        document.querySelectorAll("span#notOrtalama[data-calculated-score='true'], span[data-calculated-score='sub']").forEach(span => span.remove());
        document.querySelectorAll(".card-body table tbody tr, #icerik table tbody tr").forEach(row => {
            const labelCell = row.querySelector("td:nth-child(2)");
            if (labelCell?.textContent.trim() === "Ortalama" && labelCell.classList.contains("font-weight-bold")) row.remove();
        });
        initGradeClickHandlers();
    }
}

function applyInitialSettings(settings) {
    manageTheme("red", "red.css", !!settings[STORAGE_KEYS.RED_MODE]);
    manageTheme("dark", "dark.css", !!settings[STORAGE_KEYS.DARK_MODE]);
    if (settings[STORAGE_KEYS.STEALTH]) enableStealthMode();
    runOrClearGradeLogic(!!settings[STORAGE_KEYS.CALCULATE]);
}

chrome.storage.local.get(Object.values(STORAGE_KEYS), (settings) => {
    if (chrome.runtime.lastError) return;
    applyInitialSettings(settings);
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes[STORAGE_KEYS.RED_MODE] !== undefined) manageTheme("red", "red.css", !!changes[STORAGE_KEYS.RED_MODE].newValue);
        if (changes[STORAGE_KEYS.DARK_MODE] !== undefined) manageTheme("dark", "dark.css", !!changes[STORAGE_KEYS.DARK_MODE].newValue);
        if (changes[STORAGE_KEYS.CALCULATE] !== undefined) runOrClearGradeLogic(!!changes[STORAGE_KEYS.CALCULATE].newValue);
        if (changes[STORAGE_KEYS.DOWNLOAD_ALL] !== undefined) {
            if (changes[STORAGE_KEYS.DOWNLOAD_ALL].newValue) {
                if (window.location.hash === '#Dokuman') injectDownloadAllButton();
            } else {
                removeDownloadAllButton();
            }
        }
        if (changes[STORAGE_KEYS.CHECK_QUESTIONS] !== undefined) {
            if (changes[STORAGE_KEYS.CHECK_QUESTIONS].newValue) {
                startQuestionCheckObserver();
            } else {
                stopQuestionCheckObserver();
            }
        }
        if (changes[STORAGE_KEYS.AUTO_SURVEY] !== undefined) {
            if (changes[STORAGE_KEYS.AUTO_SURVEY].newValue) {
                startAutoSurveyObserver();
            } else {
                stopAutoSurveyObserver();
            }
        }
    }
});

function injectDownloadAllButton() {
    if (document.getElementById('sauconfig-download-all-btn')) return;
    chrome.storage.local.get([STORAGE_KEYS.DOWNLOAD_ALL], data => {
        if (!data[STORAGE_KEYS.DOWNLOAD_ALL]) {
            removeDownloadAllButton();
            return;
        }
        if (document.getElementById('sauconfig-download-all-btn')) return;
    const cardBody = document.querySelector('#icerik .card-body') || document.querySelector('.card-body');
    if (!cardBody) return;
    const tableResponsive = cardBody.querySelector('.table-responsive');
    if (!tableResponsive) return;
    const table = tableResponsive.querySelector('table');
    if (!table) return;
    const downloadLinks = table.querySelectorAll('a.btn.btn-info[download]');
    if (downloadLinks.length === 0) return;
    downloadLinks.forEach(link => link.style.paddingLeft = '14px');

    const defaultText = `<i class="fa fa-download" style="margin-right: 6px;"></i> Tümünü İndir (${downloadLinks.length} dosya)`;

    const btn = document.createElement('button');
    btn.id = 'sauconfig-download-all-btn';
    btn.className = 'btn btn-info';
    btn.innerHTML = defaultText;
    btn.style.cssText = 'font-weight: 600; padding: 5px 12px; font-size: 12px; margin-top: 12px; float: right;';

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.style.cursor = 'not-allowed';
        const links = Array.from(downloadLinks);
        let completed = 0;

        for (const link of links) {
            btn.innerHTML = `<i class="fa fa-download" style="margin-right: 6px;"></i> İndiriliyor: ${completed + 1} / ${links.length}`;
            try {
                const a = document.createElement('a');
                a.href = link.href;
                a.download = '';
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } catch (e) {
                console.error('İndirme hatası:', e);
            }
            completed++;
            if (completed < links.length) await new Promise(r => setTimeout(r, 500));
        }

        btn.innerHTML = `<i class="fa fa-check" style="margin-right: 6px;"></i> Tamamlandı! (${links.length} dosya)`;
        setTimeout(() => {
            btn.innerHTML = defaultText;
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }, 3000);
    });

    cardBody.appendChild(btn);
    });
}

function removeDownloadAllButton() {
    const btn = document.getElementById('sauconfig-download-all-btn');
    if (btn) btn.remove();
}

function highlightQuestionResults() {
    document.querySelectorAll(".swal2-html-container span").forEach(span => {
        if (span.dataset.sauconfigChecked) return;
        const text = span.textContent;
        
        if (text.includes("Puan:") || text.includes("Soru:")) {
            const parts = text.split(":");
            if (parts.length >= 2) {
                const label = parts[0].trim().toUpperCase();
                const value = parts[1].trim();
                let borderColor, leftBg, rightBg, labelColor;

                if (text.includes("Puan:")) {
                    const isZero = text.includes("Puan: 0");
                    borderColor = isZero ? "#5d0d0d" : "#145a2b";
                    leftBg = isZero ? "#830000" : "#1a7a3a";
                    rightBg = isZero ? "#3d0404" : "#0a2e15";
                    labelColor = isZero ? "#f5c6c6" : "#c6f5d6";
                } else {
                    borderColor = "rgb(49, 49, 49)";
                    leftBg = "rgb(35, 35, 35)";
                    rightBg = "rgb(15, 15, 15)";
                    labelColor = "#b0b0b0";
                }

                span.innerHTML = `
                    <span style="background: ${leftBg}; color: ${labelColor}; padding: 4px 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; border-right: 2px solid ${borderColor}; display: flex; align-items: center; justify-content: center;">${label}</span>
                    <span style="background: ${rightBg}; color: white; padding: 4px 14px; font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; min-width: 40px;">${value}</span>
                `;
                span.style.cssText = `
                    display: inline-flex !important;
                    align-items: stretch !important;
                    border: 2px solid ${borderColor} !important;
                    border-radius: 0 !important;
                    padding: 0 !important;
                    margin: 4px 6px !important;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.2) !important;
                    vertical-align: middle !important;
                `;
                span.dataset.sauconfigChecked = 'true';
            }
        }
    });
}

let questionCheckObserver = null;

function startQuestionCheckObserver() {
    if (questionCheckObserver) return;
    highlightQuestionResults();
    questionCheckObserver = new MutationObserver(() => {
        highlightQuestionResults();
    });
    questionCheckObserver.observe(document.body, { childList: true, subtree: true });
}

function stopQuestionCheckObserver() {
    if (questionCheckObserver) {
        questionCheckObserver.disconnect();
        questionCheckObserver = null;
    }
}

chrome.storage.local.get([STORAGE_KEYS.CHECK_QUESTIONS], data => {
    if (!chrome.runtime.lastError && data[STORAGE_KEYS.CHECK_QUESTIONS]) {
        startQuestionCheckObserver();
    }
});

function tryFillSurvey() {
    const radioButtons = document.querySelectorAll("input[type='radio'][value='4']");
    if (radioButtons.length > 0) {
        let anyChanged = false;
        radioButtons.forEach(r => {
            if (!r.checked) {
                r.checked = true;
                r.dispatchEvent(new Event('change', { bubbles: true }));
                anyChanged = true;
            }
        });
        if (anyChanged) {
            console.log("SABİS Config: Anket otomatik dolduruldu.");
        }
    }
}

let autoSurveyObserver = null;

function startAutoSurveyObserver() {
    if (autoSurveyObserver) return;
    tryFillSurvey();
    autoSurveyObserver = new MutationObserver(() => {
        tryFillSurvey();
    });
    autoSurveyObserver.observe(document.body, { childList: true, subtree: true });
}

function stopAutoSurveyObserver() {
    if (autoSurveyObserver) {
        autoSurveyObserver.disconnect();
        autoSurveyObserver = null;
    }
}

chrome.storage.local.get([STORAGE_KEYS.AUTO_SURVEY], data => {
    if (!chrome.runtime.lastError && data[STORAGE_KEYS.AUTO_SURVEY]) {
        startAutoSurveyObserver();
    }
});

if (window.location.pathname.startsWith("/Ders/Grup/")) {
    const targetNode = document.getElementById('icerik');
    if (targetNode) {
        const observer = new MutationObserver(mutations => {
            if (window.location.hash === '#Dokuman') {
                setTimeout(injectDownloadAllButton, 500);
            }
            if (window.location.hash !== '#Not') return;
            const tableAdded = mutations.some(m => m.type === 'childList' && Array.from(m.addedNodes).some(n => n.nodeType === Node.ELEMENT_NODE && (n.querySelector("table.table") || n.classList?.contains("table"))));
            if (tableAdded) {
                setTimeout(() => {
                    chrome.storage.local.get([STORAGE_KEYS.CALCULATE], data => {
                        if (!chrome.runtime.lastError && data[STORAGE_KEYS.CALCULATE]) runOrClearGradeLogic(!!data[STORAGE_KEYS.CALCULATE]);
                    });
                }, 500);
            }
        });
        observer.observe(targetNode, { childList: true, subtree: true });
    }
    if (window.location.hash === '#Dokuman') {
        setTimeout(injectDownloadAllButton, 1000);
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case "recalculateGradesAfterChange":
            chrome.storage.local.get([STORAGE_KEYS.CALCULATE], data => {
                if (!chrome.runtime.lastError && data[STORAGE_KEYS.CALCULATE]) enableCalculateGrade();
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
            sendResponse({ status: "unknown_action" });
            break;
    }
    return true;
});