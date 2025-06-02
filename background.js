const STUDENT_PROFILE_URL = "https://obs.sabis.sakarya.edu.tr/";
const TRANSCRIPT_URL = "https://obs.sabis.sakarya.edu.tr/Transkript";
const CARD_BALANCE_URL = "https://obs.sabis.sakarya.edu.tr/Kart/Bakiye";
const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';
const OFFSCREEN_DOCUMENT_URL = chrome.runtime.getURL('offscreen.html');

let creatingOffscreen; // Offscreen doküman oluşturma Promise'ını tutar
async function hasOffscreenDocument() {
    if (typeof chrome.runtime.getContexts === 'function') {
        const existingContexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT'],
            documentUrls: [OFFSCREEN_DOCUMENT_URL]
        });
        return existingContexts.length > 0;
    }
    console.warn("chrome.runtime.getContexts API'si bulunamadı.");
    return false; 
}

async function setupOffscreenDocument() {
    if (await hasOffscreenDocument()) {
        return;
    }
    if (creatingOffscreen) {
        await creatingOffscreen;
    } else {
        console.log("Offscreen dokümanı oluşturuluyor:", OFFSCREEN_DOCUMENT_URL);
        creatingOffscreen = chrome.offscreen.createDocument({
            url: OFFSCREEN_DOCUMENT_URL,
            reasons: [chrome.offscreen.Reason.DOM_PARSER],
            justification: 'SABİS sayfalarından veri parse etmek.',
        });
        try {
            await creatingOffscreen;
        } catch (error) {
            console.error("Offscreen dokümanı oluşturma hatası:", error);
            if (error.message.includes("Only a single offscreen document may be created")) {
                 console.warn("Zaten bir offscreen dokümanı mevcut olabilir.");
            } else {
                throw error;
            }
        } finally {
            creatingOffscreen = null;
        }
    }
}
async function fetchAndParseViaOffscreen(url, parseAction) {
    await setupOffscreenDocument(); // Her zaman önce setup'ı çağır
    try {
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) {
            console.error(`Sayfa alınamadı ${url}: ${response.status} ${response.statusText}`);
            if (parseAction === "parseHtmlForGNO" || parseAction === "parseHtmlForBalance") return 'N/A';
            return null;
        }
        const htmlText = await response.text();
        const result = await chrome.runtime.sendMessage({
            action: parseAction,
            htmlContent: htmlText
        });
        return result;
    } catch (error) {
        console.error(`Sayfa çekme/offscreen parse etme hatası ${url}:`, error);
        if (parseAction === "parseHtmlForGNO" || parseAction === "parseHtmlForBalance") return 'N/A';
        return null;
    }
}
async function closeOffscreenDocument() {
    // Belirli bir süre sonra veya iş bittikten sonra kapatılabilir.
    // Şimdilik manuel kapatmıyoruz, Chrome yönetebilir.
    // Ya da her işlemden sonra:
    // await chrome.offscreen.closeDocument();
}


async function fetchAndParseHTML(url) {
    try {
        const response = await fetch(url, { credentials: 'include' }); // Çerezleri dahil et
        if (!response.ok) {
            console.error(`Sayfa alınamadı ${url}: ${response.status} ${response.statusText}`);
            return null;
        }
        const htmlText = await response.text();
        const parser = new DOMParser();
        return parser.parseFromString(htmlText, "text/html");
    } catch (error) {
        console.error(`Sayfa çekme/parse etme hatası ${url}:`, error);
        return null;
    }
}

function extractStudentInfoFromDOM(doc) {
    if (!doc) return null;

    const nameFromTopbar = doc.querySelector('.topbar .text-dark-50.font-weight-bolder.d-none.d-md-inline.mr-3');
    const nameFromProfileCard = doc.querySelector('#kt_profile_aside .card-title.font-weight-bolder');
    
    let studentName = "";
    if (nameFromProfileCard && nameFromProfileCard.textContent.trim()) {
        studentName = nameFromProfileCard.textContent.trim();
    } else if (nameFromTopbar && nameFromTopbar.textContent.trim()) {
        studentName = nameFromTopbar.textContent.trim().replace(/\s\s+/g, ' ');
    }

    const studentNumberEl = doc.querySelector('#kt_profile_aside .font-weight-bold.text-dark-50.font-size-sm.pb-6');
    const studentNumber = studentNumberEl ? studentNumberEl.textContent.trim() : 'N/A';

    const profileImageEl = doc.querySelector('#kt_profile_aside .symbol-label img');
    // Fotoğraf URL'si tam değilse (örn: /Fotograf/xyz) başına HOST_URL ekle
    let profileImageUrl = profileImageEl ? profileImageEl.getAttribute('src') : 'images/icon48.png';
    if (profileImageUrl && profileImageUrl.startsWith('/')) {
        profileImageUrl = new URL(profileImageUrl, STUDENT_PROFILE_URL).href;
    }


    const departmentLines = doc.querySelectorAll('#kt_profile_aside .pt-1 .d-flex.align-items-center.pb-1 .text-dark-65.font-weight-bold');
    let department = "";
    if (departmentLines.length >= 2) {
        if (departmentLines.length >=3 && departmentLines[2].textContent.includes("PR.")) {
           department = departmentLines[2].textContent.trim();
        } else if (departmentLines.length >=2) {
           department = departmentLines[1].textContent.trim();
        }
   }

    return {
        name: studentName || 'N/A',
        number: studentNumber,
        department: department || 'N/A',
        imageUrl: profileImageUrl || 'images/icon48.png'
    };
}

function extractGNOFromDOM(doc) {
    if (!doc) return 'N/A';

    const allTables = doc.querySelectorAll('.card-body table.table-condensed');
    let gno = 'N/A';

    if (allTables.length > 0) {
        const lastTable = allTables[allTables.length - 1];
        const tfootRows = lastTable.querySelectorAll('tfoot tr');
        if (tfootRows.length > 0) {
            const generalAverageRow = Array.from(tfootRows).find(row => {
                const firstCell = row.querySelector('td:first-child');
                return firstCell && firstCell.textContent.trim().startsWith('Genel:');
            });
            if (generalAverageRow) {
                const gnoCell = generalAverageRow.querySelector('td:last-child');
                if (gnoCell) gno = gnoCell.textContent.trim();
            }
        }
    }
    return gno;
}

async function updateStudentData() {
    console.log("Öğrenci verileri güncelleniyor (offscreen ile)...");
    let profileData = null;
    let gnoData = 'N/A';
    let balanceData = 'N/A'; // YENİ

    // Profil bilgileri
    try {
        profileData = await fetchAndParseViaOffscreen(STUDENT_PROFILE_URL, "parseHtmlForProfile");
        if (profileData && (profileData.name !== 'N/A' || profileData.number !== 'N/A')) {
            await chrome.storage.local.set({ studentProfile: profileData });
            console.log("Profil bilgileri güncellendi:", profileData);
        } else {
            console.warn("Profil bilgileri alınamadı veya boş (offscreen).");
            const { studentProfile: oldProfile } = await chrome.storage.local.get('studentProfile');
            if (!oldProfile || !oldProfile.name || oldProfile.name === 'N/A') {
                await chrome.storage.local.set({ studentProfile: { name: 'N/A', number: 'N/A', department: 'N/A', imageUrl: 'images/icon48.png'} });
            } else if (profileData && profileData.name === 'N/A' && profileData.number === 'N/A') {
                await chrome.storage.local.set({ studentProfile: { name: "Giriş Yapılmamış", number: "N/A", department: "N/A", imageUrl: 'images/icon48.png'} });
            }
        }
    } catch (e) {
        console.error("Profil verisi işlenirken hata:", e);
        profileData = { name: "Hata", number: "Hata", department: "Hata", imageUrl: 'images/icon48.png' }; // Hata durumunda varsayılan
    }

    // GNO bilgisi
    try {
        gnoData = await fetchAndParseViaOffscreen(TRANSCRIPT_URL, "parseHtmlForGNO");
        if (gnoData && gnoData !== 'N/A') {
            await chrome.storage.local.set({ studentGNO: gnoData });
            console.log("GNO güncellendi:", gnoData);
        } else {
            console.warn("GNO bilgisi transkriptten alınamadı (offscreen).");
            const { studentGNO: oldGno } = await chrome.storage.local.get('studentGNO');
            if (!oldGno || oldGno === 'N/A'){
                await chrome.storage.local.set({ studentGNO: 'N/A' });
            }
        }
    } catch (e) {
        console.error("GNO verisi işlenirken hata:", e);
        gnoData = 'N/A';
    }

    // Kart Bakiye Bilgisi (YENİ)
    try {
        balanceData = await fetchAndParseViaOffscreen(CARD_BALANCE_URL, "parseHtmlForBalance");
        if (balanceData && balanceData !== 'N/A') {
            await chrome.storage.local.set({ studentBalance: balanceData });
            console.log("Kart bakiyesi güncellendi:", balanceData);
        } else {
            console.warn("Kart bakiyesi alınamadı (offscreen).");
             const { studentBalance: oldBalance } = await chrome.storage.local.get('studentBalance');
            if (!oldBalance || oldBalance === 'N/A'){
                await chrome.storage.local.set({ studentBalance: 'N/A' });
            }
        }
    } catch (e) {
        console.error("Bakiye verisi işlenirken hata:", e);
        balanceData = 'N/A';
    }
    
    return { profile: profileData, gno: gnoData, balance: balanceData }; // YENİ: balance eklendi
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchStudentData") {
        updateStudentData().then(data => {
            sendResponse({ status: "completed", data: data });
        }).catch(error => {
            console.error("updateStudentData ana hata yakalayıcı:", error);
            sendResponse({ status: "error", message: error.toString() });
        });
        return true;
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "refreshDataInContentScript") {
        chrome.tabs.query({ url: "*://*.sakarya.edu.tr/*" }, (tabs) => {
            tabs.forEach(tab => {
                if (tab.id && tab.url && tab.url.includes("sabis.sakarya.edu.tr")) {
                    chrome.tabs.sendMessage(tab.id, { action: "scrapeData" }, response => {
                        if (chrome.runtime.lastError) {
                            // console.warn("Content script'e mesaj gönderilemedi (belki o sekmede aktif değil):", chrome.runtime.lastError.message);
                        } else if (response && response.status === "done") {
                            // console.log("Veri content script tarafından çekildi:", tab.url);
                        }
                    });
                }
            });
        });
        sendResponse({ status: "refresh_triggered" }); // Popup'a yanıt
        return true; // Asenkron yanıt için
    }
    if (request.action === "fetchStudentData") {
        updateStudentData().then(data => {
            sendResponse({ status: "completed", data: data });
        }).catch(error => {
            console.error("updateStudentData hata:", error);
            sendResponse({ status: "error", message: error.toString() });
        });
        return true; // Asenkron yanıt için
    }
    if (message.action === "calculateGrades") calculateGrades();
  else if (message.action === "removeCalculatedGrades") removeCalculatedGrades();
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