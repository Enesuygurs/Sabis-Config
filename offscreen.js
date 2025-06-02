function extractStudentInfoFromDOM(docText) {
    if (!docText) return null;
    const parser = new DOMParser();
    const doc = parser.parseFromString(docText, "text/html");
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
    let profileImageUrl = profileImageEl ? profileImageEl.getAttribute('src') : 'images/avatar.png';
    if (profileImageUrl && profileImageUrl.startsWith('/')) {
        profileImageUrl = new URL(profileImageUrl, "https://obs.sabis.sakarya.edu.tr/").href;
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
        imageUrl: profileImageUrl || 'images/avatar.png'
    };
}

function extractGNOFromDOM(docText) {
    if (!docText) return 'N/A';
    const parser = new DOMParser();
    const doc = parser.parseFromString(docText, "text/html");
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

function extractBalanceFromDOM(docText) {
    if (!docText) return 'N/A';
    const parser = new DOMParser();
    const doc = parser.parseFromString(docText, "text/html");
    const strongElements = doc.querySelectorAll('.card-body strong');
    let balance = 'N/A';
    strongElements.forEach(strong => {
        if (strong.textContent.trim() === "Kalan Bakiye:") {
            const balanceSpan = strong.nextElementSibling;
            if (balanceSpan && balanceSpan.tagName === 'SPAN') {
                balance = balanceSpan.textContent.trim();
            }
        }
    });
    return balance;
}

// offscreen.js

// ... (extractStudentInfoFromDOM, extractGNOFromDOM, extractBalanceFromDOM fonksiyonları aynı) ...

// offscreen.js

function extractFoodMenuFromDOM(docText) {
    if (!docText) {
        console.error("Offscreen: extractFoodMenuFromDOM - docText boş geldi.");
        return { dateLabel: "HTML alınamadı", normalMenu: [], dietMenu: [], hasMenu: false };
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(docText, "text/html");
    // console.log("Offscreen: Parse edilen doküman başlığı:", doc.title); // Dokümanın doğru parse edildiğini kontrol et

    const menuData = {
        dateLabel: "", // Başlangıçta boş bırakalım
        normalMenu: [],
        dietMenu: [],
        hasMenu: false
    };

    const currentMonthLabelEl = doc.querySelector("#currentMonthLabel");
    if (currentMonthLabelEl) {
        menuData.dateLabel = currentMonthLabelEl.textContent.trim();
        // console.log("Offscreen: Tarih etiketi bulundu:", menuData.dateLabel);
    } else {
        console.warn("Offscreen: #currentMonthLabel bulunamadı.");
        menuData.dateLabel = "Tarih bilgisi yok"; // Bulunamadığını belirt
    }

    const activeCarouselItem = doc.querySelector(".carousel-item.active");
    if (activeCarouselItem) {
        // console.log("Offscreen: Aktif karusel öğesi bulundu.");
        const normalMenuContainer = activeCarouselItem.querySelector(".normalmenu .list-group"); // .normalmenu bir div, içindeki ul.list-group
        if (normalMenuContainer) {
            // console.log("Offscreen: Normal menü konteyneri bulundu.");
            const items = normalMenuContainer.querySelectorAll("li.list-group-item");
            if (items.length > 0) {
                menuData.hasMenu = true;
                items.forEach(item => {
                    const foodNameFull = item.textContent.trim();
                    const foodName = foodNameFull.split(" <small")[0]; // Kalori kısmını ayır
                    const calorieSmall = item.querySelector("small");
                    const calorieText = calorieSmall ? calorieSmall.textContent.trim().replace("- ", "").replace(" kcal", "") : "0"; // Kalori yoksa 0 varsayalım
                    menuData.normalMenu.push({ name: foodName, calorie: calorieText });
                });
                // console.log("Offscreen: Normal menü öğeleri:", menuData.normalMenu);
            } else {
                // console.warn("Offscreen: Normal menü konteyneri içinde li.list-group-item bulunamadı.");
            }
        } else {
            // console.warn("Offscreen: .normalmenu .list-group bulunamadı.");
        }

        // Diyet menüsü için de benzer loglar eklenebilir (opsiyonel)
        // const dietMenuContainer = activeCarouselItem.querySelector(".diyetmenu .list-group");
        // if (dietMenuContainer && dietMenuContainer.offsetParent !== null) { ... }

    } else {
        console.warn("Offscreen: .carousel-item.active bulunamadı.");
    }
    
    if (menuData.normalMenu.length === 0 && menuData.dietMenu.length === 0) {
        menuData.hasMenu = false;
        // console.log("Offscreen: Hiçbir menü öğesi bulunamadı, hasMenu false olarak ayarlandı.");
        const noMenuMessageEl = activeCarouselItem?.querySelector(".card-body > p, .card-body > div > p, .card-body > .text-center > p, .card-body div[style*='text-align:center'] p");
        if (noMenuMessageEl) {
            // console.log("Offscreen: 'Menü yok' mesajı bulundu:", noMenuMessageEl.textContent.trim());
            menuData.normalMenu.push({ name: noMenuMessageEl.textContent.trim(), calorie: "" });
            if (!menuData.dateLabel || menuData.dateLabel === "Tarih bilgisi yok") { // Eğer tarih etiketi hala boşsa, mesajın başlığından almayı dene
                 const cardHeader = activeCarouselItem?.closest('.card')?.querySelector('.card-header button#currentMonthLabel'); // Daha genel bir başlık arayışı
                 if(cardHeader) menuData.dateLabel = cardHeader.textContent.trim();
            }
        } else if (menuData.dateLabel === "Tarih bilgisi yok") {
             menuData.dateLabel = "Yemek menüsü alınamadı"; // Daha genel bir hata
        }
    }

    // En son loglamayı koruyalım
    console.log("Offscreen extractFoodMenuFromDOM FINAL result:", JSON.stringify(menuData, null, 2));
    return menuData;
}

// ... (diğer offscreen.js kodları aynı)
const FOOD_MENU_URL_CONTENT = "https://menu.sabis.sakarya.edu.tr/";

function extractAndStoreFoodMenu() {
    if (!window.location.href.startsWith(FOOD_MENU_URL_CONTENT)) {
        return;
    }

    // Menü içeriğinin yüklenmesini beklemek için bir strateji
    // Basit bir timeout veya MutationObserver kullanılabilir.
    // Şimdilik, ana menü konteynerinin varlığını birkaç kez kontrol edelim.
    let attempts = 0;
    const maxAttempts = 10; // 5 saniye boyunca (500ms * 10)
    const interval = 500; // ms

    function tryExtractMenu() {
        attempts++;
        const menuData = {
            dateLabel: "Menü bilgisi bekleniyor...",
            normalMenu: [],
            dietMenu: [],
            hasMenu: false
        };

        const currentMonthLabelEl = document.querySelector("#currentMonthLabel");
        if (currentMonthLabelEl) {
            menuData.dateLabel = currentMonthLabelEl.textContent.trim();
        } else {
            // console.warn("ContentJS: Menu - #currentMonthLabel bulunamadı.");
        }

        const activeCarouselItem = document.querySelector(".carousel-item.active");
        if (activeCarouselItem) {
            const normalMenuContainer = activeCarouselItem.querySelector(".normalmenu .list-group");
            if (normalMenuContainer && normalMenuContainer.querySelectorAll("li.list-group-item").length > 0) {
                menuData.hasMenu = true;
                normalMenuContainer.querySelectorAll("li.list-group-item").forEach(item => {
                    const foodName = item.textContent.trim().split(" <small")[0];
                    const calorieSmall = item.querySelector("small");
                    const calorieText = calorieSmall ? calorieSmall.textContent.trim().replace("- ", "").replace(" kcal", "") : "0";
                    menuData.normalMenu.push({ name: foodName, calorie: calorieText });
                });
            }

            const dietMenuContainer = activeCarouselItem.querySelector(".diyetmenu .list-group");
             if (dietMenuContainer && dietMenuContainer.offsetParent !== null && dietMenuContainer.querySelectorAll("li.list-group-item").length > 0) {
                // Eğer normal menü boşsa ve diyet menüsü varsa, diyet menüsünü de al
                // Ya da her ikisini de alıp popup'ta seçenek sunulabilir. Şimdilik sadece normali alıyoruz.
                // Eğer sadece diyet menüsü varsa ve normal boşsa, bunu da hasMenu true yapar.
                if (!menuData.hasMenu && dietMenuContainer.querySelectorAll("li.list-group-item").length > 0) {
                    menuData.hasMenu = true; 
                }
                dietMenuContainer.querySelectorAll("li.list-group-item").forEach(item => {
                    const foodName = item.textContent.trim().split(" <small")[0];
                    const calorieSmall = item.querySelector("small");
                    const calorieText = calorieSmall ? calorieSmall.textContent.trim().replace("- ", "").replace(" kcal", "") : "0";
                    menuData.dietMenu.push({ name: foodName, calorie: calorieText });
                });
            }
        } else if (attempts >= maxAttempts) {
            // console.warn("ContentJS: Menu - .carousel-item.active bulunamadı (max deneme).");
        }
        
        if (menuData.normalMenu.length === 0 && menuData.dietMenu.length === 0 && activeCarouselItem) {
             menuData.hasMenu = false; // Tekrar false yap, belki sadece başlık vardı
            const noMenuMessageEl = activeCarouselItem.querySelector(".card-body > p, .card-body > div > p, .card-body > .text-center > p, .card-body div[style*='text-align:center'] p");
            if (noMenuMessageEl) {
                menuData.normalMenu.push({ name: noMenuMessageEl.textContent.trim(), calorie: "" });
            }
        }


        if (menuData.hasMenu || (attempts >= maxAttempts && menuData.normalMenu.length > 0 && menuData.normalMenu[0].name !== "Menü bilgisi bekleniyor...")) {
            // console.log("ContentJS: Yemek menüsü parse edildi:", menuData);
            chrome.storage.local.set({ [STORAGE_KEYS.FOOD_MENU]: menuData }, () => {
                if (chrome.runtime.lastError) {
                    console.error("ContentJS: Yemek menüsü depolama hatası:", chrome.runtime.lastError.message);
                } else {
                    // console.log("ContentJS: Yemek menüsü başarıyla depolandı.");
                }
            });
        } else if (attempts < maxAttempts) {
            setTimeout(tryExtractMenu, interval);
        } else {
            // console.warn("ContentJS: Yemek menüsü max denemeye ulaşıldı, veri alınamadı.");
             chrome.storage.local.set({ [STORAGE_KEYS.FOOD_MENU]: { dateLabel: "Menü alınamadı (sayfayı yenileyin)", normalMenu: [], dietMenu: [], hasMenu: false } });
        }
    }

    // İlk denemeyi biraz gecikmeyle başlat, sayfanın JS'inin çalışması için
    setTimeout(tryExtractMenu, 1000); 
}

// ... (applyInitialSettings içinde ve storage.onChanged içinde FOOD_MENU için bir şey yapmaya gerek yok,
// çünkü bu sadece menü sayfasında çalışacak)

// Sayfa yüklendiğinde doğru sayfada mıyız kontrol et
if (window.location.href.startsWith(FOOD_MENU_URL_CONTENT)) {
    // DOM hazır olduğunda veya biraz bekledikten sonra çalıştır
    if (document.readyState === "complete" || document.readyState === "interactive") {
        extractAndStoreFoodMenu();
    } else {
        document.addEventListener("DOMContentLoaded", extractAndStoreFoodMenu);
    }
}

// offscreen.js

// ... (extractStudentInfoFromDOM, extractGNOFromDOM, extractBalanceFromDOM fonksiyonları aynı) ...

function extractFoodMenuFromAPIResponse(htmlText) {
    if (!htmlText) return { dateLabel: "API yanıtı boş", normalMenu: [], dietMenu: [], hasMenu: false };
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");

    const menuData = {
        // dateLabel: "", // Tarih bilgisi artık background.js'den payload ile gönderilen olacak.
                       // API yanıtında tarih etiketi varsa onu da alabiliriz ama BG'den gelen daha güvenilir.
        normalMenu: [],
        dietMenu: [], 
        hasMenu: false
    };

    // API yanıtındaki HTML'in yapısına göre seçiciler:
    // Verdiğin yanıtta ".carousel-item.active" içindeki ".normalmenu" ve ".diyetmenu" yapısı var gibi.
    // Eğer API doğrudan sadece yemek listesini (örn: sadece <ul><li>...</li></ul>) dönüyorsa,
    // seçicileri ona göre basitleştirmek gerekir.
    // Konsol çıktısındaki HTML'e göre güncelleyelim:
    
    // Normal menü
    const normalMenuContainer = doc.querySelector(".normalmenu .list-group, #normalMenuCarousel .list-group"); // İki olası seçici
    if (normalMenuContainer) {
        normalMenuContainer.querySelectorAll("li.list-group-item").forEach(item => {
            menuData.hasMenu = true; // En az bir menü bulundu
            const foodNameFull = item.textContent.trim();
            let foodName = foodNameFull.split(" <small")[0]; // Kalori kısmını ayır
            const calorieSmall = item.querySelector("small");
            let calorieText = "0";

            if (calorieSmall) {
                calorieText = calorieSmall.textContent.trim().replace(/-/g, "").replace("kcal", "").trim();
            } else {
                // Alternatif kalori bulma (eğer <small> yoksa)
                const calorieMatch = foodNameFull.match(/\s-\s*(\d+)\s*kcal/i);
                if (calorieMatch && calorieMatch[1]) {
                    calorieText = calorieMatch[1];
                    foodName = foodNameFull.substring(0, foodNameFull.indexOf(calorieMatch[0])).trim(); // Kaloriyi isimden çıkar
                }
            }
            menuData.normalMenu.push({ name: foodName.trim(), calorie: calorieText });
        });
    }

    // Diyet menüsü (eğer varsa ve farklı bir class ile ayrılmışsa)
    const dietMenuContainer = doc.querySelector(".diyetmenu .list-group");
    if (dietMenuContainer && dietMenuContainer.offsetParent !== null) { // Sadece görünürse al
        dietMenuContainer.querySelectorAll("li.list-group-item").forEach(item => {
            menuData.hasMenu = true; // En az bir menü bulundu
            const foodNameFull = item.textContent.trim();
            let foodName = foodNameFull.split(" <small")[0];
            const calorieSmall = item.querySelector("small");
            let calorieText = "0";

            if (calorieSmall) {
                calorieText = calorieSmall.textContent.trim().replace(/-/g, "").replace("kcal", "").trim();
            } else {
                const calorieMatch = foodNameFull.match(/\s-\s*(\d+)\s*kcal/i);
                if (calorieMatch && calorieMatch[1]) {
                    calorieText = calorieMatch[1];
                    foodName = foodNameFull.substring(0, foodNameFull.indexOf(calorieMatch[0])).trim();
                }
            }
            menuData.dietMenu.push({ name: foodName.trim(), calorie: calorieText });
        });
    }

    if (!menuData.hasMenu && doc.body) {
        // API yanıtında menü yoksa, body içindeki bir mesajı ara
        const message = doc.body.textContent.trim();
        if (message && (message.includes("bulunmamaktadır") || message.includes("yoktur") || message.length < 100)) { // Kısa mesajlar genellikle hata/bilgi mesajıdır
            menuData.normalMenu.push({ name: message, calorie: "" });
        } else if (htmlText.trim() === "" || htmlText.trim() === "[]" || htmlText.trim() === "{}") {
            menuData.normalMenu.push({ name: "Menü bulunamadı (Boş API yanıtı)", calorie: "" });
        } else {
            // console.warn("Offscreen (API): Menü öğesi parse edilemedi, ancak yanıt boş değil. Dönen HTML:", htmlText.substring(0,300));
            menuData.normalMenu.push({ name: "Menü verisi işlenemedi.", calorie: "" });
        }
    }
    
    // dateLabel'ı burada set etmeye gerek yok, background.js'den gelen payload'daki tarih bilgisi kullanılacak.
    // console.log("Offscreen extractFoodMenuFromAPIResponse result:", JSON.stringify(menuData, null, 2));
    return menuData;
}


chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === "parseHtmlForProfile") {
        sendResponse(extractStudentInfoFromDOM(request.htmlContent));
    } else if (request.action === "parseHtmlForGNO") {
        sendResponse(extractGNOFromDOM(request.htmlContent));
    } else if (request.action === "parseHtmlForBalance") {
        sendResponse(extractBalanceFromDOM(request.htmlContent));
    } else if (request.action === "parseFoodMenuAPIResponse") { 
        sendResponse(extractFoodMenuFromAPIResponse(request.htmlContent));
    }
    return true; 
});