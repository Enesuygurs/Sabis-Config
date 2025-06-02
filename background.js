const STUDENT_PROFILE_URL = "https://obs.sabis.sakarya.edu.tr/";
const TRANSCRIPT_URL = "https://obs.sabis.sakarya.edu.tr/Transkript";
const CARD_BALANCE_URL = "https://obs.sabis.sakarya.edu.tr/Kart/Bakiye";
const OFFSCREEN_DOCUMENT_URL = chrome.runtime.getURL('offscreen.html');

let creatingOffscreen;

async function hasOffscreenDocument() {
    if (typeof chrome.runtime.getContexts === 'function') {
        const existingContexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT'],
            documentUrls: [OFFSCREEN_DOCUMENT_URL]
        });
        return existingContexts.length > 0;
    }
    return false;
}

async function setupOffscreenDocument() {
    if (await hasOffscreenDocument()) {
        return;
    }
    if (creatingOffscreen) {
        await creatingOffscreen;
    } else {
        creatingOffscreen = chrome.offscreen.createDocument({
            url: OFFSCREEN_DOCUMENT_URL,
            reasons: [chrome.offscreen.Reason.DOM_PARSER],
            justification: 'SABİS sayfalarından veri parse etmek.',
        });
        try {
            await creatingOffscreen;
        } catch (error) {
            if (!error.message.includes("Only a single offscreen document may be created")) {
                throw error;
            }
        } finally {
            creatingOffscreen = null;
        }
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
        return await chrome.runtime.sendMessage({
            action: parseAction,
            htmlContent: htmlText
        });
    } catch (error) {
        return (parseAction === "parseHtmlForGNO" || parseAction === "parseHtmlForBalance") ? 'N/A' : null;
    }
}

async function updateStudentData() {
    let profileData = null;
    let gnoData = 'N/A';
    let balanceData = 'N/A';

    try {
        profileData = await fetchAndParseViaOffscreen(STUDENT_PROFILE_URL, "parseHtmlForProfile");
        if (profileData && (profileData.name !== 'N/A' || profileData.number !== 'N/A')) {
            await chrome.storage.local.set({ studentProfile: profileData });
        } else {
            const { studentProfile: oldProfile } = await chrome.storage.local.get('studentProfile');
            if (!oldProfile || !oldProfile.name || oldProfile.name === 'N/A') {
                await chrome.storage.local.set({ studentProfile: { name: 'N/A', number: 'N/A', department: 'N/A', imageUrl: 'images/icon48.png'} });
            } else if (profileData && profileData.name === 'N/A' && profileData.number === 'N/A') {
                await chrome.storage.local.set({ studentProfile: { name: "Giriş Yapılmamış", number: "N/A", department: "N/A", imageUrl: 'images/icon48.png'} });
            }
        }
    } catch (e) {
        profileData = { name: "Hata", number: "Hata", department: "Hata", imageUrl: 'images/icon48.png' };
    }

    try {
        gnoData = await fetchAndParseViaOffscreen(TRANSCRIPT_URL, "parseHtmlForGNO");
        if (gnoData && gnoData !== 'N/A') {
            await chrome.storage.local.set({ studentGNO: gnoData });
        } else {
            const { studentGNO: oldGno } = await chrome.storage.local.get('studentGNO');
            if (!oldGno || oldGno === 'N/A'){
                await chrome.storage.local.set({ studentGNO: 'N/A' });
            }
        }
    } catch (e) {
        gnoData = 'N/A';
    }

    try {
        balanceData = await fetchAndParseViaOffscreen(CARD_BALANCE_URL, "parseHtmlForBalance");
        if (balanceData && balanceData !== 'N/A') {
            await chrome.storage.local.set({ studentBalance: balanceData });
        } else {
             const { studentBalance: oldBalance } = await chrome.storage.local.get('studentBalance');
            if (!oldBalance || oldBalance === 'N/A'){
                await chrome.storage.local.set({ studentBalance: 'N/A' });
            }
        }
    } catch (e) {
        balanceData = 'N/A';
    }
    
    return { profile: profileData, gno: gnoData, balance: balanceData };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchStudentData") {
        updateStudentData().then(data => {
            sendResponse({ status: "completed", data: data });
        }).catch(error => {
            sendResponse({ status: "error", message: error.toString() });
        });
        return true;
    }
    // calculateGrades ve removeCalculatedGrades ile ilgili action'lar burada bırakıldı,
    // eğer popup.js'den bu mesajlar hala gönderiliyorsa.
    // Eğer gönderilmiyorsa, bu if blokları da kaldırılabilir.
    if (request.action === "calculateGrades") {
        calculateGrades();
        // sendResponse({status: "calculateGrades_triggered"}); // İsteğe bağlı yanıt
    } else if (request.action === "removeCalculatedGrades") {
        removeCalculatedGrades();
        // sendResponse({status: "removeCalculatedGrades_triggered"}); // İsteğe bağlı yanıt
    }
    // refreshDataInContentScript action'ı için olan listener kaldırıldı,
    // çünkü popup.js'den böyle bir mesaj gönderilmiyordu ve
    // fetchStudentData zaten veriyi arka planda çekiyor.
});

function formatDecimalForBackground(number) {
    let formatted = number.toFixed(10).replace(/\.?0+$/, "");
    if (!formatted.includes(".")) {
        formatted += ".00";
    } else if (formatted.split(".")[1].length === 1) {
        formatted += "0";
    }
    return formatted;
}

function calculateGrades() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    if (!currentTab || !currentTab.id || !currentTab.url || !currentTab.url.startsWith("https://obs.sabis.sakarya.edu.tr/Ders")) {
        return;
    }
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: () => {
            const cardBodies = document.querySelectorAll(".card-body");
            function formatDecimalInContent(number) { /* formatDecimalForBackground'ı content script'e taşıdık */
                let formatted = number.toFixed(10).replace(/\.?0+$/, "");
                if (!formatted.includes(".")) formatted += ".00";
                else if (formatted.split(".")[1].length === 1) formatted += "0";
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
                    if (calismaTipi.includes("Bütünleme")) butunlemeVar = true;
                    if (oranCell && notCell && !isNaN(parseFloat(oranCell.textContent)) && !isNaN(parseFloat(notCell.textContent))) {
                        const oran = parseFloat(oranCell.innerText.replace(",", "."));
                        const not = parseFloat(notCell.innerText.replace(",", "."));
                        const hesaplananPuan = (oran * not) / 100;
                        toplamPuan += hesaplananPuan;
                        const existingSpan = notCell.querySelector("[data-calculated-score]");
                        if (!existingSpan) {
                            const sonucElementi = document.createElement("span");
                            sonucElementi.style.color = "#343434";
                            sonucElementi.textContent = ` (${formatDecimalInContent(hesaplananPuan)})`;
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
                                toplamPuan -= (oran * not) / 100;
                            }
                        }
                    });
                }
                const basariNotuRow = Array.from(rows).find((row) => row.querySelector("td:nth-child(2)").textContent.includes("Başarı Notu"));
                if (basariNotuRow) {
                    const basariNotuCell = basariNotuRow.querySelector("td:nth-child(3) span");
                    const harfNotu = basariNotuCell.textContent.trim().split(" ")[0];
                    const renkler = { FF: "#df1212", FD: "#df1212", DD: "blue", DC: "blue", DZ: "orange", GR: "orange" };
                    basariNotuCell.style.color = renkler[harfNotu] || "green";
                    const toplamPuanElementi = document.createElement("span");
                    toplamPuanElementi.style.color = "#000";
                    toplamPuanElementi.textContent = ` (${formatDecimalInContent(toplamPuan)})`;
                    toplamPuanElementi.setAttribute("data-calculated-score", "true");
                    toplamPuanElementi.id = "notOrtalama";
                    basariNotuCell.appendChild(toplamPuanElementi);
                } else {
                    const newAverageRow = document.createElement("tr");
                    newAverageRow.innerHTML = `<td></td><td class="font-weight-bold">Ortalama</td><td class="text-right font-weight-bold"><span id="notOrtalama" data-calculated-score="true" style="color: #000">${formatDecimalInContent(toplamPuan)}</span></td>`;
                    cardBody.querySelector("tbody").appendChild(newAverageRow);
                }
            });
        }
    });
  });
}

function removeCalculatedGrades() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    if (!currentTab || !currentTab.id || !currentTab.url || !currentTab.url.startsWith("https://obs.sabis.sakarya.edu.tr/Ders")) {
        return;
    }
    chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      func: () => {
        document.querySelectorAll(".card-body").forEach((cardBody) => {
          cardBody.querySelectorAll("tbody tr").forEach((row) => {
            const notCell = row.querySelector("td:nth-child(3) span");
            if(notCell){
                const existingSpan = notCell.querySelector("[data-calculated-score]");
                if (existingSpan) existingSpan.remove();
            }
          });
          const basariNotuRow = Array.from(cardBody.querySelectorAll("tbody tr")).find((row) => row.querySelector("td:nth-child(2)")?.textContent.includes("Başarı Notu"));
          if (basariNotuRow) {
            const basariNotuCell = basariNotuRow.querySelector("td:nth-child(3) span");
            if(basariNotuCell){
                const existingBasariNotuSpan = basariNotuCell.querySelector("[data-calculated-score]");
                if (existingBasariNotuSpan) existingBasariNotuSpan.remove();
            }
          }
          const averageRow = Array.from(cardBody.querySelectorAll("tbody tr")).find((row) => row.querySelector("td:nth-child(2)")?.textContent.trim() === "Ortalama");
          if (averageRow) averageRow.remove();
        });
      }
    });
  });
}