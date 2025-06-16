const SABIS_DERS_URL_PREFIX = "https://obs.sabis.sakarya.edu.tr/Ders";
const THEME_LINK_ID_PREFIX = "sauconfig-theme-";

const STORAGE_KEYS = {
    RED_MODE: "redmode_state",
    DARK_MODE: "darkmode_state",
    STEALTH: "stealth_state",
    CALCULATE: "calculate_state"
};

const manageTheme = (themeName, isEnabled) => {
    const themeId = THEME_LINK_ID_PREFIX + themeName;
    const existingLink = document.getElementById(themeId);

    if (isEnabled && !existingLink) {
        const link = document.createElement("link");
        link.id = themeId;
        link.rel = "stylesheet";
        link.href = chrome.runtime.getURL(`assets/themes/${themeName}.css`);
        document.head.appendChild(link);
    } else if (!isEnabled && existingLink) {
        existingLink.remove();
    }
};

const enableStealthMode = () => {
    const avatarUrl = chrome.runtime.getURL("assets/images/avatar.png");

    document.querySelectorAll(".symbol-label img, .symbol.symbol-35 img").forEach(img => {
        img.style.display = "none";
        const parent = img.parentElement;
        if (parent) {
            parent.style.backgroundImage = `url('${avatarUrl}')`;
            parent.style.backgroundSize = "cover";
            parent.style.backgroundPosition = "center";
            if (parent.classList.contains('symbol-35')) {
                parent.style.cssText += `background-color: #d7d7d7; width: 35px; height: 35px; border-radius: 50%;`;
            }
        }
    });

    const stealthMap = {
        ".card-title.font-weight-bolder": "Anonymous",
        ".font-weight-bold.text-dark-50.font-size-sm": "Sabis Config",
        ".text-dark-50.font-weight-bolder.d-md-inline": "Anonymous"
    };
    for (const selector in stealthMap) {
        document.querySelectorAll(selector).forEach(el => {
            el.innerText = stealthMap[selector];
            el.style.color = "#898989 !important";
        });
    }

    document.querySelectorAll(".navi-footer").forEach(footer => {
        Array.from(footer.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && /^[gGbB]\d+$/.test(node.textContent.trim())) {
                node.textContent = "";
            }
        });
    });

    document.querySelectorAll(".card-body .pb-5 .pt-1").forEach(el => el.style.display = "none");
};

const formatGradeNumber = (number) => {
    let formatted = Number(number).toFixed(2);
    if (formatted.endsWith('.00')) {
        return formatted;
    }
    return Number(formatted).toString();
};

const getPrimaryTextContent = (element) => {
    return Array.from(element?.childNodes || [])
        .find(node => node.nodeType === Node.TEXT_NODE)?.textContent.trim() || "";
};

const getGradeValue = (text) => {
    const gradeText = text.trim().toUpperCase().replace(",", ".");
    const specialZeroGrades = ["GR", "YT", "YZ", "MU", "E", "EKSİK", "YETERLİ", "YETERSİZ", "MUAF"];
    if (specialZeroGrades.includes(gradeText)) {
        return 0;
    }
    const numericValue = parseFloat(gradeText);
    return !isNaN(numericValue) && numericValue >= 0 ? numericValue : null;
};

const processGradeTable = (table) => {
    const tbody = table.querySelector("tbody");
    if (!tbody) return;

    tbody.querySelectorAll("tr.calculated-average-row, span[data-calculated-score='sub']").forEach(el => el.remove());

    const rows = Array.from(tbody.querySelectorAll("tr"));
    let totalPoints = 0;
    const hasMakeupExam = rows.some(row => row.textContent.includes("Bütünleme"));

    rows.forEach(row => {
        const oranCell = row.cells[0];
        const typeCell = row.cells[1];
        const gradeCell = row.cells[row.cells.length - 1];
        const gradeSpan = gradeCell?.querySelector("span:first-child");

        if (!oranCell || !typeCell || !gradeSpan) return;
        if (hasMakeupExam && typeCell.textContent.includes("Final")) return;

        const oran = parseFloat(oranCell.textContent.replace(",", "."));
        const not = getGradeValue(getPrimaryTextContent(gradeSpan));

        if (oran > 0 && not !== null) {
            const point = (oran * not) / 100;
            totalPoints += point;

            const subScore = document.createElement("span");
            subScore.dataset.calculatedScore = "sub";
            subScore.style.cssText = "color: rgb(52, 52, 52); font-size: 0.9em;";
            subScore.textContent = (not === 0 && isNaN(parseFloat(getPrimaryTextContent(gradeSpan)))) ? ` (0)` : ` (${formatGradeNumber(point)})`;
            gradeSpan.appendChild(subScore);
        }
    });

    const formattedTotal = formatGradeNumber(totalPoints);
    const successGradeRow = rows.find(row => row.textContent.includes("Başarı Notu"));

    if (successGradeRow) {
        const successGradeSpan = successGradeRow.cells[2]?.querySelector("span:first-child");
        if (successGradeSpan) {
            successGradeSpan.querySelector("#notOrtalama")?.remove();
            const totalPointsEl = document.createElement("span");
            totalPointsEl.id = "notOrtalama";
            totalPointsEl.textContent = ` (${formattedTotal})`;
            successGradeSpan.appendChild(totalPointsEl);
        }
    } else {
        const avgRow = document.createElement("tr");
        avgRow.className = "calculated-average-row";
        const isDetailPage = !!table.closest("#icerik");
        avgRow.innerHTML = `<td></td><td class="font-weight-bold">Ortalama</td>${isDetailPage ? '<td></td>' : ''}<td class="text-right font-weight-bold">${formattedTotal}</td>`;
        tbody.appendChild(avgRow);
    }
};

const initGradeClickHandlers = () => {
    if (!window.location.href.startsWith(SABIS_DERS_URL_PREFIX)) return;

    const gradeSpansQuery = ".card-body table td:not(.font-weight-bold) > span:first-child, #icerik table td:not(.font-weight-bold) > span:first-child";
    document.querySelectorAll(gradeSpansQuery).forEach(span => {
        if (span.dataset.handlerAttached) return;

        const row = span.closest("tr");
        if (row?.textContent.includes("Başarı Notu") || row?.textContent.includes("Ortalama")) return;

        span.style.cursor = "pointer";
        span.dataset.handlerAttached = "true";

        const originalText = getPrimaryTextContent(span);
        if (getGradeValue(originalText) === null && originalText !== "-") {
            const subScoreSpan = span.querySelector("span[data-calculated-score='sub']");
            span.textContent = "-";
            if (subScoreSpan) span.appendChild(subScoreSpan);
        }

        span.addEventListener("click", () => {
            const currentText = getPrimaryTextContent(span);
            const currentValue = getGradeValue(currentText);
            const newGrade = prompt("Yeni notunuzu girin (0-100):", currentValue !== null ? currentValue : "");
            
            if (newGrade === null) return;

            span.querySelector("span[data-calculated-score='sub']")?.remove();

            if (newGrade.trim() === "") {
                span.textContent = "-";
            } else {
                const gradeNum = parseInt(newGrade);
                if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
                    alert("Geçerli bir not giriniz (0-100).");
                    span.textContent = currentText;
                    return;
                }
                span.textContent = gradeNum.toString();
            }
            
            const table = span.closest("table");
            if (table) processGradeTable(table);
        });
    });
};

const runOrClearGradeLogic = (calculateEnabled) => {
    if (!window.location.href.startsWith(SABIS_DERS_URL_PREFIX)) return;
    
    if (calculateEnabled) {
        document.querySelectorAll(".card-body table, #icerik table").forEach(processGradeTable);
        initGradeClickHandlers();
    } else {
        document.querySelectorAll("tr.calculated-average-row, span[data-calculated-score]").forEach(el => el.remove());
    }
};

const applyInitialSettings = (settings) => {
    manageTheme("red", !!settings[STORAGE_KEYS.RED_MODE]);
    manageTheme("dark", !!settings[STORAGE_KEYS.DARK_MODE]);
    if (settings[STORAGE_KEYS.STEALTH]) {
        enableStealthMode();
    }
    runOrClearGradeLogic(!!settings[STORAGE_KEYS.CALCULATE]);
};

const handleStorageChange = (changes) => {
    if (changes[STORAGE_KEYS.RED_MODE] !== undefined) {
        manageTheme("red", !!changes[STORAGE_KEYS.RED_MODE].newValue);
    }
    if (changes[STORAGE_KEYS.DARK_MODE] !== undefined) {
        manageTheme("dark", !!changes[STORAGE_KEYS.DARK_MODE].newValue);
    }
    if (changes[STORAGE_KEYS.CALCULATE] !== undefined) {
        runOrClearGradeLogic(!!changes[STORAGE_KEYS.CALCULATE].newValue);
    }
};

const handleMessage = (request, sender, sendResponse) => {
    switch (request.action) {
        case "recalculateGradesAfterChange":
            runOrClearGradeLogic(true);
            sendResponse({ status: "recalculated" });
            break;
        case "toggleRedTheme":
            manageTheme("red", request.state);
            sendResponse({ status: "red_theme_toggled" });
            break;
        case "toggleDarkTheme":
            manageTheme("dark", request.state);
            sendResponse({ status: "dark_theme_toggled" });
            break;
    }
    return true;
};

const observeGradePageChanges = () => {
    const targetNode = document.getElementById('icerik');
    if (targetNode) {
        const observer = new MutationObserver(() => {
            if (window.location.hash === '#Not') {
                setTimeout(() => runOrClearGradeLogic(true), 300);
            }
        });
        observer.observe(targetNode, { childList: true, subtree: true });
    }
};

chrome.storage.local.get(Object.values(STORAGE_KEYS), (settings) => {
    if (chrome.runtime.lastError) return;
    applyInitialSettings(settings);
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') handleStorageChange(changes);
});

chrome.runtime.onMessage.addListener(handleMessage);

if (window.location.pathname.startsWith("/Ders/Grup/")) {
    observeGradePageChanges();
}