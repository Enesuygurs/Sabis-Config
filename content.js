// content.js

const THEME_LINK_ID_PREFIX = "sauconfig-theme-";

const STORAGE_KEYS = {
    REDMODE: "redmode_state",
    DARKMODE: "darkmode_state",
    STEALTH: "stealth_state",
    CALCULATE: "calculate_state"
};

function manageTheme(themeName, cssFileName, enable) {
    const themeId = THEME_LINK_ID_PREFIX + themeName;
    const existingLinkElement = document.getElementById(themeId);

    if (enable) {
        if (!existingLinkElement) {
            const link = document.createElement("link");
            link.id = themeId;
            link.rel = "stylesheet";
            link.type = "text/css";
            // CSS dosyalarınız kök dizindeyse:
            link.href = chrome.runtime.getURL(cssFileName);
            // Eğer 'css' adında bir alt klasördeyseler:
            // link.href = chrome.runtime.getURL(`css/${cssFileName}`); 
            document.head.appendChild(link);
        }
    } else {
        if (existingLinkElement) {
            existingLinkElement.remove();
        }
    }
}

function enableStealthMode() {
    document.querySelectorAll(".symbol-label img, .symbol.symbol-35.symbol-light-success img")
        .forEach(img => {
            img.style.display = "none";
            const parent = img.parentElement;
            if (parent) {
                Object.assign(parent.style, {
                    backgroundImage: "url('https://attic.sh/prxqzg7nk65j2ccjjyogebflzb4q')",
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
        ".font-weight-bold.text-dark-50.font-size-sm.pb-6": "Stealth Mode ON",
        ".text-dark-50.font-weight-bolder.font-size-base.d-none.d-md-inline.mr-3": "Anonymous"
    };
    for (const selector in selectorsAndText) {
        document.querySelectorAll(selector).forEach(el => {
            el.style.setProperty("color", "#b9b9b9", "important");
            el.style.setProperty("font-weight", "bold", "important");
            el.innerText = selectorsAndText[selector];
        });
    }
    document.querySelectorAll(".card-body .pb-5 .pt-1, .navi-spacer-x-0")
        .forEach(el => el.style.display = "none");
    document.querySelectorAll("*").forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle) {
            const backgroundImage = computedStyle.getPropertyValue("background-image");
            if (backgroundImage.includes("data:image/svg+xml")) {
                try {
                    const decodedSvg = decodeURIComponent(backgroundImage.substring(backgroundImage.indexOf(',') + 1, backgroundImage.length - 2));
                    if (decodedSvg.includes("<text")) {
                        const updatedSvg = decodedSvg.replace(/<text[^>]*>.*?<\/text>/g, (match) => {
                            return match.replace(/>(.*?)</, ">Stealth Mode ON<");
                        });
                        element.style.setProperty("background-image", `url("data:image/svg+xml,${encodeURIComponent(updatedSvg)}")`, "important");
                    }
                } catch (e) { /* no-op */ }
            }
        }
    });
}

function formatGradeNumber(number) {
    let formatted = number.toFixed(10).replace(/\.?0+$/, "");
    if (!formatted.includes(".")) formatted += ".00";
    else if (formatted.split(".")[1].length === 1) formatted += "0";
    return formatted;
}

function getPrimaryTextContent(element) {
    let text = "";
    if (element) {
        Array.from(element.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) text += node.textContent.trim();
        });
    }
    return text.trim();
}

function runGradeLogic(calculate) {
    if (!window.location.href.startsWith("https://obs.sabis.sakarya.edu.tr/Ders")) return;
    if (calculate) {
        enableCalculateGrade();
    } else {
        initGradeClickHandlers();
    }
}

function enableCalculateGrade() {
    if (!window.location.href.startsWith("https://obs.sabis.sakarya.edu.tr/Ders")) return;
    let tablesToProcess = [];
    const urlPath = new URL(window.location.href).pathname;

    if (urlPath === "/Ders" || /^\/Ders\/\d{4}\/\d{1}$/.test(urlPath)) {
        document.querySelectorAll(".card-body").forEach(cardBody => {
            const table = cardBody.querySelector("table");
            if (table) tablesToProcess.push(table);
        });
    } else if (urlPath.startsWith("/Ders/Grup/")) {
        const table = document.querySelector("#icerik div.card > div.card-body > table.table");
        if (table) tablesToProcess.push(table);
    }

    if (tablesToProcess.length === 0) {
        initGradeClickHandlers();
        return;
    }

    tablesToProcess.forEach(table => {
        const tbody = table.querySelector("tbody");
        if (!tbody) return;

        Array.from(tbody.querySelectorAll("tr"))
            .filter(row => row.querySelector("td:nth-child(2)")?.textContent.trim() === "Ortalama")
            .forEach(row => row.remove());
        tbody.querySelectorAll("span#notOrtalama[data-calculated-score='true'], span[data-calculated-score='sub']")
            .forEach(span => span.remove());

        const currentRows = tbody.querySelectorAll("tr");
        let toplamPuan = 0;
        let butunlemeVar = false;

        currentRows.forEach(row => {
            const oranCell = row.querySelector("td:nth-child(1)");
            const notCellParentTd = row.querySelector("td:nth-child(4)") || row.querySelector("td:nth-child(3)");
            const notCellSpan = notCellParentTd?.querySelector("span:first-child");
            const calismaTipiCell = row.querySelector("td:nth-child(2)");

            if (!oranCell || !notCellSpan || !calismaTipiCell) return;
            if (calismaTipiCell.textContent.includes("Bütünleme")) butunlemeVar = true;

            const oranText = oranCell.textContent.trim().replace(",", ".");
            const notTextContent = getPrimaryTextContent(notCellSpan).split(" ")[0].replace(",", ".");

            if (!isNaN(parseFloat(oranText)) && parseFloat(oranText) > 0 &&
                notTextContent && notTextContent !== "-" && !isNaN(parseFloat(notTextContent)) && parseFloat(notTextContent) >= 0) {
                const oran = parseFloat(oranText);
                const not = parseFloat(notTextContent);
                const hesaplananPuan = (oran * not) / 100;
                toplamPuan += hesaplananPuan;
                const sonucElementi = document.createElement("span");
                sonucElementi.style.cssText = "color: rgb(52, 52, 52); font-size: 0.9em;";
                sonucElementi.textContent = ` (${formatGradeNumber(hesaplananPuan)})`;
                sonucElementi.setAttribute("data-calculated-score", "sub");
                notCellSpan.appendChild(sonucElementi);
            }
        });

        if (butunlemeVar) {
            currentRows.forEach(row => {
                const calismaTipiCell = row.querySelector("td:nth-child(2)");
                if (calismaTipiCell?.textContent.includes("Final")) {
                    const oranCell = row.querySelector("td:nth-child(1)");
                    const notCellParentTd = row.querySelector("td:nth-child(4)") || row.querySelector("td:nth-child(3)");
                    const notCellSpan = notCellParentTd?.querySelector("span:first-child");
                    if (oranCell && notCellSpan) {
                        const oranText = oranCell.textContent.trim().replace(",", ".");
                        const notTextContent = getPrimaryTextContent(notCellSpan).split(" ")[0].replace(",", ".");
                        if (!isNaN(parseFloat(oranText)) && notTextContent && notTextContent !== "-" && !isNaN(parseFloat(notTextContent)) && parseFloat(notTextContent) >= 0) {
                            toplamPuan -= (parseFloat(oranText) * parseFloat(notTextContent)) / 100;
                        }
                    }
                }
            });
        }

        const formattedTotal = formatGradeNumber(toplamPuan);
        const basariNotuRow = Array.from(currentRows).find(row => row.querySelector("td:nth-child(2)")?.textContent.includes("Başarı Notu"));

        if (basariNotuRow) {
            const basariNotuCellSpan = basariNotuRow.querySelector("td:nth-child(3) span:first-child");
            if (basariNotuCellSpan) {
                const harfNotu = getPrimaryTextContent(basariNotuCellSpan).match(/^[A-ZÇĞİÖŞÜ]{1,2}(?![a-z])/)?.[0] || "";
                const renkler = { FF: "#df1212", FD: "#df1212", DD: "blue", DC: "blue", DZ: "orange", GR: "orange" };
                basariNotuCellSpan.style.color = renkler[harfNotu] || "green";
                const toplamPuanElementi = document.createElement("span");
                toplamPuanElementi.style.color = "#000";
                toplamPuanElementi.textContent = ` (${formattedTotal})`;
                toplamPuanElementi.setAttribute("data-calculated-score", "true");
                toplamPuanElementi.id = "notOrtalama";
                basariNotuCellSpan.appendChild(toplamPuanElementi);
            }
        } else {
            const newAverageRow = document.createElement("tr");
            const isDetailPage = !!table.closest("#icerik");
            newAverageRow.innerHTML = `<td></td><td class="font-weight-bold">Ortalama</td>${isDetailPage ? '<td></td>' : ''}<td class="text-right font-weight-bold"><span id="notOrtalama" data-calculated-score="true" style="color: #000">${formattedTotal}</span></td>`;
            let referenceNode = Array.from(tbody.querySelectorAll("tr")).find(r =>
                ["Anket", "Bütünleme Başvurusu", "İş Sağlığı ve Güvenliği", "Devam Durumu"]
                .some(text => r.querySelector("td:nth-child(2)")?.textContent.includes(text) || (r.querySelector("td:nth-child(3)") || r.querySelector("td:nth-child(4)"))?.textContent.includes(text))
            );
            tbody.insertBefore(newAverageRow, referenceNode || null);
        }
    });
    initGradeClickHandlers();
}

function initGradeClickHandlers() {
    if (!window.location.href.startsWith("https://obs.sabis.sakarya.edu.tr/Ders")) return;
    const notGirisSpanlari = Array.from(document.querySelectorAll(".card-body .text-right > span:first-child, #icerik .card-body table.table td.text-right > span:first-child"))
        .filter(span => {
            const parentTd = span.closest("td");
            if (!parentTd || parentTd.classList.contains('font-weight-bold')) return false;
            const row = parentTd.closest("tr");
            const labelCellInRow = row?.querySelector("td:nth-child(2)");
            return !(labelCellInRow && (labelCellInRow.textContent.includes("Başarı Notu") || labelCellInRow.textContent.includes("Ortalama")));
        });

    notGirisSpanlari.forEach(notElement => {
        const newElement = notElement.cloneNode(true);
        notElement.parentNode.replaceChild(newElement, notElement);
        notElement = newElement;
        notElement.style.cursor = "pointer";
        const currentGradeText = getPrimaryTextContent(notElement);

        if (!currentGradeText || (currentGradeText !== "-" && isNaN(parseFloat(currentGradeText.split(" ")[0])))) {
            if (currentGradeText !== "-") {
                notElement.textContent = "-";
                Array.from(notElement.querySelectorAll("span[data-calculated-score='sub']")).forEach(s => s.remove());
            }
            notElement.style.fontWeight = "bold";
        } else if (currentGradeText !== "-") {
            notElement.style.fontWeight = "";
        }

        notElement.addEventListener("click", function handleClick() {
            const originalTextForPrompt = getPrimaryTextContent(notElement).split(" ")[0];
            const promptDefaultValue = (originalTextForPrompt !== "-" && !isNaN(parseInt(originalTextForPrompt))) ? parseInt(originalTextForPrompt) : "";
            const yeniNotPrompt = prompt("Yeni notunuzu girin (0-100):", promptDefaultValue);

            if (yeniNotPrompt === null) return;
            Array.from(notElement.querySelectorAll("span[data-calculated-score='sub']")).forEach(s => s.remove());

            if (yeniNotPrompt.trim() === "") {
                notElement.textContent = "-";
                notElement.style.fontWeight = "bold";
            } else {
                const notSayisi = parseInt(yeniNotPrompt);
                if (isNaN(notSayisi) || notSayisi < 0 || notSayisi > 100) {
                    alert("Geçerli bir not giriniz! (0-100)");
                    return;
                }
                notElement.textContent = notSayisi.toString();
                notElement.style.fontWeight = "";
            }

            const dersCardElementi = notElement.closest(".card-body:not(#icerik .card-body)");
            if (dersCardElementi) {
                const harfNotuElement = dersCardElementi.querySelector("td.text-right.font-weight-bold > span:first-child");
                if (harfNotuElement) {
                    const harfNotuTextContent = getPrimaryTextContent(harfNotuElement);
                    const harfNotuMatch = harfNotuTextContent.match(/^[A-ZÇĞİÖŞÜ]{1,2}(?![a-z])/);
                    if (harfNotuMatch) {
                        const textNodeVal = harfNotuTextContent.replace(harfNotuMatch[0], "").trim();
                        const avgSpan = harfNotuElement.querySelector("#notOrtalama");
                        harfNotuElement.innerHTML = '';
                        if (textNodeVal || !avgSpan) harfNotuElement.appendChild(document.createTextNode(textNodeVal));
                        if (avgSpan) harfNotuElement.appendChild(avgSpan);
                    }
                }
            }
            chrome.storage.local.get([STORAGE_KEYS.CALCULATE], data => {
                if (data[STORAGE_KEYS.CALCULATE]) enableCalculateGrade();
            });
        });
    });
}

function handleSettings(settings) {
    manageTheme("red", "red-theme.css", settings[STORAGE_KEYS.REDMODE]);
    manageTheme("dark", "dark-theme.css", settings[STORAGE_KEYS.DARKMODE]);
    if (settings[STORAGE_KEYS.STEALTH]) {
        enableStealthMode();
    }
    runGradeLogic(settings[STORAGE_KEYS.CALCULATE]);
}

chrome.storage.local.get(Object.values(STORAGE_KEYS), (settings) => {
    if (chrome.runtime.lastError) return;
    handleSettings(settings);
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        let calculateStateChanged = false;

        if (changes[STORAGE_KEYS.REDMODE] !== undefined) {
            manageTheme("red", "red-theme.css", changes[STORAGE_KEYS.REDMODE].newValue);
        }
        if (changes[STORAGE_KEYS.DARKMODE] !== undefined) {
            manageTheme("dark", "dark-theme.css", changes[STORAGE_KEYS.DARKMODE].newValue);
        }
        if (changes[STORAGE_KEYS.STEALTH] !== undefined) {
            // Stealth modu popup.js'den sayfa yenileme ile yönetiliyor.
            // Content.js'in anında tepki vermesi için, ya enableStealthMode'un tersi çağrılmalı
            // ya da sayfa yenilenmeli (popup.js bunu zaten yapıyor).
            // Şimdilik, sayfa yenilemesine güveniyoruz, bu yüzden burada ekstra bir şey yapmıyoruz.
            // Eğer popup.js yenileme yapmıyorsa, burada window.location.reload(); çağrılabilir.
        }
        if (changes[STORAGE_KEYS.CALCULATE] !== undefined) {
            calculateStateChanged = true;
        }

        if (calculateStateChanged) {
            runGradeLogic(changes[STORAGE_KEYS.CALCULATE].newValue);
        }
    }
});

if (window.location.href.includes("/Ders/Grup/")) {
    const targetNodeToObserve = document.getElementById('icerik');
    if (targetNodeToObserve) {
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' && Array.from(mutation.addedNodes).some(node => node.nodeType === Node.ELEMENT_NODE && (node.querySelector("table.table") || node.classList?.contains("table")))) {
                    setTimeout(() => {
                        chrome.storage.local.get([STORAGE_KEYS.CALCULATE], (data) => {
                            runGradeLogic(data[STORAGE_KEYS.CALCULATE]);
                        });
                    }, 500);
                    break;
                }
            }
        });
        observer.observe(targetNodeToObserve, { childList: true, subtree: true });
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "recalculateGradesAfterChange") {
         chrome.storage.local.get([STORAGE_KEYS.CALCULATE], data => {
            if (data[STORAGE_KEYS.CALCULATE]) enableCalculateGrade();
        });
        sendResponse({status: "ok_recalculated"});
        return true;
    }
});