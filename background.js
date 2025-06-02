const STUDENT_PROFILE_URL = "https://obs.sabis.sakarya.edu.tr/";
const TRANSCRIPT_URL = "https://obs.sabis.sakarya.edu.tr/Transkript";
const CARD_BALANCE_URL = "https://obs.sabis.sakarya.edu.tr/Kart/Bakiye";
const OFFSCREEN_DOCUMENT_URL = chrome.runtime.getURL('offscreen.html');

let creatingOffscreenPromise = null;

async function hasOffscreenDocument() {
    if (typeof chrome.runtime.getContexts === 'function') {
        const contexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT'],
            documentUrls: [OFFSCREEN_DOCUMENT_URL]
        });
        return contexts.length > 0;
    }
    return false; // Fallback for older browsers or if API is unavailable
}

async function setupOffscreenDocument() {
    if (await hasOffscreenDocument()) return;
    if (creatingOffscreenPromise) return creatingOffscreenPromise;

    creatingOffscreenPromise = chrome.offscreen.createDocument({
        url: OFFSCREEN_DOCUMENT_URL,
        reasons: [chrome.offscreen.Reason.DOM_PARSER],
        justification: 'SABİS sayfalarından veri parse etmek.',
    });
    try {
        await creatingOffscreenPromise;
    } catch (error) {
        if (!error.message.includes("Only a single offscreen document may be created")) {
            throw error;
        }
    } finally {
        creatingOffscreenPromise = null;
    }
}

async function fetchAndParseViaOffscreen(url, parseAction) {
    await setupOffscreenDocument();
    try {
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) {
            return (parseAction === "parseHtmlForGNO" || parseAction === "parseHtmlForBalance") ? 'N/A' : null;
        }
        const htmlText = await response.text();
        return await chrome.runtime.sendMessage({ action: parseAction, htmlContent: htmlText });
    } catch (error) {
        return (parseAction === "parseHtmlForGNO" || parseAction === "parseHtmlForBalance") ? 'N/A' : null;
    }
}

async function fetchDataAndStore(storageKey, url, parseAction, defaultValue) {
    let data = defaultValue;
    try {
        data = await fetchAndParseViaOffscreen(url, parseAction);
        const dataToStore = (data && (typeof data !== 'string' || data !== 'N/A') && (typeof data === 'object' ? (data.name !== 'N/A' || data.number !== 'N/A') : true)) ? data : defaultValue;
        
        if (storageKey === 'studentProfile' && data && data.name === 'N/A' && data.number === 'N/A') {
             const { studentProfile: oldProfile } = await chrome.storage.local.get('studentProfile');
             if (oldProfile && oldProfile.name && oldProfile.name !== 'N/A') { // Sadece eski geçerli veri varsa "Giriş Yapılmamış" yap
                await chrome.storage.local.set({ [storageKey]: { name: "Giriş Yapılmamış", number: "N/A", department: "N/A", imageUrl: 'images/avatar.png' } });
                return { name: "Giriş Yapılmamış", number: "N/A", department: "N/A", imageUrl: 'images/avatar.png' };
             }
        }
        await chrome.storage.local.set({ [storageKey]: dataToStore });
        return dataToStore; // Return the data that was actually stored or attempted to be stored
    } catch (e) {
        // In case of an error during fetch/parse or storage, return the default value
        // and ensure the default is stored if nothing valid was fetched.
        await chrome.storage.local.set({ [storageKey]: defaultValue });
        return defaultValue;
    }
}


async function updateStudentData() {
    const profileDefault = { name: 'N/A', number: 'N/A', department: 'N/A', imageUrl: 'images/avatar.png' };
    const gnoDefault = 'N/A';
    const balanceDefault = 'N/A';

    const [profileData, gnoData, balanceData] = await Promise.all([
        fetchDataAndStore('studentProfile', STUDENT_PROFILE_URL, "parseHtmlForProfile", profileDefault),
        fetchDataAndStore('studentGNO', TRANSCRIPT_URL, "parseHtmlForGNO", gnoDefault),
        fetchDataAndStore('studentBalance', CARD_BALANCE_URL, "parseHtmlForBalance", balanceDefault)
    ]);
    
    return { profile: profileData, gno: gnoData, balance: balanceData };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchStudentData") {
        updateStudentData()
            .then(data => sendResponse({ status: "completed", data }))
            .catch(error => sendResponse({ status: "error", message: error.toString() }));
        return true; // Indicates asynchronous response
    }
    // Bu action'lar popup.js tarafından gönderilmiyorsa kaldırılabilir.
    if (request.action === "calculateGrades") calculateGrades();
    else if (request.action === "removeCalculatedGrades") removeCalculatedGrades();
});


function formatDecimalForBackground(number) { // This function seems unused in background.js now
    let formatted = Number(number).toFixed(10).replace(/\.?0+$/, "");
    if (!formatted.includes(".")) formatted += ".00";
    else if (formatted.split(".")[1].length === 1) formatted += "0";
    return formatted;
}

function executeScriptInActiveDersTab(funcToExecute) {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab?.id && tab.url?.startsWith("https://obs.sabis.sakarya.edu.tr/Ders")) {
            chrome.scripting.executeScript({ target: { tabId: tab.id }, func: funcToExecute });
        }
    });
}

function calculateGrades() {
    executeScriptInActiveDersTab(() => {
        const formatDecimalInContent = (num) => {
            let fmt = Number(num).toFixed(10).replace(/\.?0+$/, "");
            if (!fmt.includes(".")) fmt += ".00";
            else if (fmt.split(".")[1].length === 1) fmt += "0";
            return fmt;
        };
        document.querySelectorAll(".card-body").forEach(cardBody => {
            const tbody = cardBody.querySelector("tbody");
            if (!tbody) return;
            Array.from(tbody.querySelectorAll("tr")).filter(r => r.querySelector("td:nth-child(2)")?.textContent.trim() === "Ortalama").forEach(r => r.remove());
            tbody.querySelectorAll("span#notOrtalama[data-calculated-score='true'], span[data-calculated-score]").forEach(s => s.remove());

            const rows = tbody.querySelectorAll("tr");
            let totalPoints = 0;
            let hasMakeup = false;
            rows.forEach(row => {
                const oranCell = row.querySelector("td:nth-child(1)");
                const notCell = row.querySelector("td:nth-child(3) span");
                const typeCell = row.querySelector("td:nth-child(2)");
                if (!oranCell || !notCell || !typeCell) return;
                if (typeCell.textContent.includes("Bütünleme")) hasMakeup = true;
                const oran = parseFloat(oranCell.innerText.replace(",", "."));
                const not = parseFloat(notCell.innerText.replace(",", "."));
                if (!isNaN(oran) && !isNaN(not) && oran > 0) {
                    const calculated = (oran * not) / 100;
                    totalPoints += calculated;
                    const subScoreEl = document.createElement("span");
                    subScoreEl.style.color = "#343434";
                    subScoreEl.textContent = ` (${formatDecimalInContent(calculated)})`;
                    subScoreEl.setAttribute("data-calculated-score", "true");
                    notCell.appendChild(subScoreEl);
                }
            });
            if (hasMakeup) {
                rows.forEach(row => {
                    if (row.querySelector("td:nth-child(2)")?.textContent.includes("Final")) {
                        const oran = parseFloat(row.querySelector("td:nth-child(1)")?.innerText.replace(",", "."));
                        const not = parseFloat(row.querySelector("td:nth-child(3) span")?.innerText.replace(",", "."));
                        if (!isNaN(oran) && !isNaN(not)) totalPoints -= (oran * not) / 100;
                    }
                });
            }
            const successRow = Array.from(rows).find(r => r.querySelector("td:nth-child(2)")?.textContent.includes("Başarı Notu"));
            if (successRow) {
                const cell = successRow.querySelector("td:nth-child(3) span");
                if (cell) {
                    const grade = cell.textContent.trim().split(" ")[0];
                    const colors = { FF: "#df1212", FD: "#df1212", DD: "blue", DC: "blue", DZ: "orange", GR: "orange" };
                    cell.style.color = colors[grade] || "green";
                    const totalEl = document.createElement("span");
                    totalEl.style.color = "#000";
                    totalEl.textContent = ` (${formatDecimalInContent(totalPoints)})`;
                    totalEl.setAttribute("data-calculated-score", "true");
                    totalEl.id = "notOrtalama";
                    cell.appendChild(totalEl);
                }
            } else {
                const avgRow = document.createElement("tr");
                avgRow.innerHTML = `<td></td><td class="font-weight-bold">Ortalama</td><td class="text-right font-weight-bold"><span id="notOrtalama" data-calculated-score="true" style="color: #000">${formatDecimalInContent(totalPoints)}</span></td>`;
                tbody.appendChild(avgRow);
            }
        });
    });
}

function removeCalculatedGrades() {
    executeScriptInActiveDersTab(() => {
        document.querySelectorAll(".card-body").forEach(cardBody => {
            const tbody = cardBody.querySelector("tbody");
            if (!tbody) return;
            tbody.querySelectorAll("span[data-calculated-score]").forEach(s => s.remove());
            Array.from(tbody.querySelectorAll("tr")).filter(r => r.querySelector("td:nth-child(2)")?.textContent.trim() === "Ortalama").forEach(r => r.remove());
        });
    });
}