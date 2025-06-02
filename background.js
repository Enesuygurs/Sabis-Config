const STUDENT_PROFILE_URL = "https://obs.sabis.sakarya.edu.tr/";
const TRANSCRIPT_URL = "https://obs.sabis.sakarya.edu.tr/Transkript";
const CARD_BALANCE_URL = "https://obs.sabis.sakarya.edu.tr/Kart/Bakiye";
const OFFSCREEN_DOCUMENT_URL = chrome.runtime.getURL('offscreen.html');
const FOOD_MENU_URL = "https://menu.sabis.sakarya.edu.tr/"; // YENİ
const FOOD_MENU_API_URL = "https://menu.sabis.sakarya.edu.tr/Home/GetirGunlukMenu";
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

async function fetchViaAPIAndParseViaOffscreen(url, method = 'GET', body = null, parseAction) {
    await setupOffscreenDocument();
    try {
        const fetchOptions = {
            method: method,
            credentials: 'include',
            headers: {
                "accept": "text/html, */*; q=0.01",
                "accept-language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
                "x-requested-with": "XMLHttpRequest"
            }
        };

        if (method === 'POST' && body) {
            fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
            fetchOptions.body = new URLSearchParams(body).toString();
        }

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            console.error(`API isteği başarısız ${url}: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            // console.error("API Hata detayı:", errorText.substring(0, 500));
            if (parseAction === "parseFoodMenuAPIResponse") return { dateLabel: `Hata: ${response.status}`, normalMenu: [], dietMenu: [], hasMenu: false };
            if (parseAction === "parseHtmlForGNO" || parseAction === "parseHtmlForBalance") return 'N/A';
            return null;
        }
        const htmlText = await response.text();
        // if (url === FOOD_MENU_API_URL) console.log(`BG: ${url} için API yanıtı (ham):\n`, htmlText.substring(0, 500));

        return await chrome.runtime.sendMessage({ 
            action: parseAction, 
            htmlContent: htmlText 
        });

    } catch (error) {
        console.error(`Fetch/API parse hatası ${url}:`, error);
        if (parseAction === "parseFoodMenuAPIResponse") return { dateLabel: "API Bağlantı Hatası", normalMenu: [], dietMenu: [], hasMenu: false };
        if (parseAction === "parseHtmlForGNO" || parseAction === "parseHtmlForBalance") return 'N/A';
        return null;
    }
}
// background.js (fetchAndParseViaOffscreen içinde)
async function fetchAndParseViaOffscreen(url, parseAction) {
    await setupOffscreenDocument();
    try {
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) {
            console.error(`Sayfa alınamadı ${url}: ${response.status} ${response.statusText}`);
            return parseAction === "parseHtmlForGNO" || parseAction === "parseHtmlForBalance" || parseAction === "parseHtmlForFoodMenu" ? (parseAction === "parseHtmlForFoodMenu" ? { dateLabel: "Hata: Sayfa alınamadı", normalMenu: [], dietMenu: [], hasMenu: false } : 'N/A') : null;
        }
        const htmlText = await response.text();

        // HAM HTML'İ LOGLA (Sadece yemek menüsü için)
        if (url === FOOD_MENU_URL) {
            console.log("BG: Fetched HTML for Food Menu (RAW):", htmlText.substring(0, 5000)); // İlk 5000 karakter
        }

        const result = await chrome.runtime.sendMessage({
            action: parseAction,
            htmlContent: htmlText
        });
        return result;

    } catch (error) {
        console.error(`Sayfa çekme/offscreen parse etme hatası ${url}:`, error);
        return parseAction === "parseHtmlForGNO" || parseAction === "parseHtmlForBalance" || parseAction === "parseHtmlForFoodMenu" ? (parseAction === "parseHtmlForFoodMenu" ? { dateLabel: "Hata: Parse edilemedi", normalMenu: [], dietMenu: [], hasMenu: false } : 'N/A') : null;
    }
}

async function fetchDataAndStore(storageKey, url, parseAction, defaultValue, method = 'GET', body = null) {
    let data = defaultValue;
    try {
        data = await fetchViaAPIAndParseViaOffscreen(url, method, body, parseAction);
        
        let dataIsValid = false;
        if (data) {
            if (typeof data === 'string') dataIsValid = data !== 'N/A';
            else if (typeof data === 'object') {
                if (storageKey === 'studentProfile') dataIsValid = data.name !== 'N/A' || data.number !== 'N/A';
                else if (storageKey === 'foodMenu') dataIsValid = data.hasMenu !== undefined; // Sadece hasMenu'nun varlığını kontrol et
                else dataIsValid = true;
            }
        }
        
        const dataToStore = dataIsValid ? data : defaultValue;
        
        if (storageKey === 'studentProfile' && dataToStore.name === 'N/A' && dataToStore.number === 'N/A') {
            const { studentProfile: oldProfile } = await chrome.storage.local.get('studentProfile');
            if (oldProfile && oldProfile.name && oldProfile.name !== 'N/A' && oldProfile.name !== "Giriş Yapılmamış") {
                 await chrome.storage.local.set({ [storageKey]: { name: "Giriş Yapılmamış", number: "N/A", department: "N/A", imageUrl: 'images/avatar.png' } });
                 return { name: "Giriş Yapılmamış", number: "N/A", department: "N/A", imageUrl: 'images/avatar.png' };
            }
        }
        await chrome.storage.local.set({ [storageKey]: dataToStore });
        return dataToStore;
    } catch (e) {
        console.error(`BG: fetchDataAndStore (${storageKey}) Hata:`, e);
        await chrome.storage.local.set({ [storageKey]: defaultValue });
        return defaultValue;
    }
}
async function updateStudentData() {
    const profileDefault = { name: 'N/A', number: 'N/A', department: 'N/A', imageUrl: 'images/avatar.png' };
    const gnoDefault = 'N/A';
    const balanceDefault = 'N/A';
    const today = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const formattedDateForMenu = today.toLocaleDateString('tr-TR', options) + " Menüsü"; // Popup'ta kullanılacak başlık
    const foodMenuDefault = { dateLabel: formattedDateForMenu, normalMenu: [], dietMenu: [], hasMenu: false };


    const foodMenuPayload = {
        'year': today.getFullYear(),
        'month': today.getMonth() + 1,
        'day': today.getDate()
    };

    const [profileData, gnoData, balanceData, rawFoodMenuData] = await Promise.all([
        fetchDataAndStore('studentProfile', STUDENT_PROFILE_URL, "parseHtmlForProfile", profileDefault, 'GET'),
        fetchDataAndStore('studentGNO', TRANSCRIPT_URL, "parseHtmlForGNO", gnoDefault, 'GET'),
        fetchDataAndStore('studentBalance', CARD_BALANCE_URL, "parseHtmlForBalance", balanceDefault, 'GET'),
        // Yemek menüsü için parse edilmiş veriyi alıyoruz, ama dateLabel'ı biz ekleyeceğiz.
        fetchDataAndStore('foodMenuData', FOOD_MENU_API_URL, "parseFoodMenuAPIResponse", { normalMenu:[], dietMenu:[], hasMenu:false }, 'POST', foodMenuPayload)
    ]);
    
    // foodMenuData'ya tarihi ekle, çünkü API yanıtından gelmiyor olabilir.
    const finalFoodMenuData = {
        ...rawFoodMenuData, // parse edilmiş normalMenu, dietMenu, hasMenu
        dateLabel: formattedDateForMenu // Bizim oluşturduğumuz tarih etiketi
    };
    await chrome.storage.local.set({ foodMenu: finalFoodMenuData }); // dateLabel ile birlikte sakla
    
    // console.log("BG: Final food menu for popup:", finalFoodMenuData);
    return { profile: profileData, gno: gnoData, balance: balanceData, foodMenu: finalFoodMenuData };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchStudentData") {
        updateStudentData()
            .then(data => sendResponse({ status: "completed", data }))
            .catch(error => {
                console.error("BG: updateStudentData Hata:", error);
                sendResponse({ status: "error", message: error.toString() });
            });
        return true; 
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