document.addEventListener("DOMContentLoaded", function () {
    const STORAGE_KEY_REDMODE = "redmode_state";
    const STORAGE_KEY_CALCULATE = "calculate_state";
    const STORAGE_KEY_STEALTH = "stealth_state";
    const STORAGE_KEY_DARKMODE = "darkmode_state";
    // Depolama anahtarları artık background'da yönetiliyor ama popup'ta okuma için kullanılabilir.
    const STORAGE_KEY_STUDENT_PROFILE = "studentProfile";
    const STORAGE_KEY_STUDENT_GNO = "studentGNO";


    const changeGradesBtn = document.getElementById("changeGrades");
    const stealthCheckbox = document.getElementById("stealthCheckbox");
    const calculateCheckbox = document.getElementById("calculateCheckbox");
    const themeDarkCheckbox = document.getElementById("themeDarkCheckbox");
    const themeCheckbox = document.getElementById("themeCheckbox");
    const checkQuestionsBtn = document.getElementById("checkQuestions");
    const goToExamScheduleBtn = document.getElementById("goToExamSchedule");
    const autoFillSurveyBtn = document.getElementById("autoFillSurvey");

    const studentPhotoEl = document.getElementById("studentPhoto");
    const studentNameEl = document.getElementById("studentName");
    const studentDepartmentEl = document.getElementById("studentDepartment");
    const studentNumberEl = document.getElementById("studentNumber");
    const studentGNOEl = document.getElementById("studentGNO");
    const refreshStudentInfoBtn = document.getElementById("refreshStudentInfo");

    function displayLoadingState() {
        studentNameEl.textContent = 'Yükleniyor...';
        studentDepartmentEl.textContent = 'Yükleniyor...';
        studentNumberEl.textContent = 'Yükleniyor...';
        studentGNOEl.textContent = 'GNO: Yükleniyor...';
        studentPhotoEl.src = 'images/icon48.png';
    }

    function updatePopupWithData(profile, gno) {
        if (profile) {
            studentNameEl.textContent = profile.name || 'N/A';
            studentDepartmentEl.textContent = profile.department || 'N/A';
            studentNumberEl.textContent = profile.number || 'N/A';
            if (profile.imageUrl && profile.imageUrl !== 'images/icon48.png') {
                studentPhotoEl.src = profile.imageUrl;
            } else {
                studentPhotoEl.src = 'images/icon48.png';
            }
            studentPhotoEl.onerror = function() { this.src = 'images/icon48.png'; };
        } else {
            studentNameEl.textContent = 'Bilgi Yok';
            studentDepartmentEl.textContent = 'Veri çekilemedi';
            studentNumberEl.textContent = '-'; 
            studentPhotoEl.src = 'images/icon48.png';
        }

        if (gno && gno !== 'N/A') {
            studentGNOEl.textContent = `GNO: ${gno}`;
        } else if (profile && profile.name === "Giriş Yapılmamış") {
             studentGNOEl.textContent = 'GNO: -';
        }
        else {
            studentGNOEl.textContent = 'GNO: N/A';
        }
    }

    function loadAndDisplayStudentInfo() {
        displayLoadingState();
        // Önce storage'dan okumayı dene (hızlı yükleme için)
        chrome.storage.local.get([STORAGE_KEY_STUDENT_PROFILE, STORAGE_KEY_STUDENT_GNO], function (storedData) {
            if (chrome.runtime.lastError) {
                console.error("Depodan ilk okuma hatası:", chrome.runtime.lastError.message);
            }
            if (storedData.studentProfile || storedData.studentGNO) {
                console.log("Depodan önbelleklenmiş veri yüklendi.");
                updatePopupWithData(storedData.studentProfile, storedData.studentGNO);
            }
            // Her durumda veriyi arka planda tazelemeyi iste (veya sadece refresh butonuna basınca)
            // Şimdilik popup her açıldığında tazeleme isteği gönderelim
            // Daha iyi bir strateji: Belirli aralıklarla veya sadece refresh ile
            console.log("Arka plandan taze veri isteniyor...");
            chrome.runtime.sendMessage({ action: "fetchStudentData" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Veri çekme mesajı gönderilemedi:", chrome.runtime.lastError.message);
                    // Hata durumunda, eğer önbellek varsa o gösterilir, yoksa "Hata" mesajı kalır.
                    if (!storedData.studentProfile && !storedData.studentGNO) {
                        updatePopupWithData(null, null); // Hata durumunu göster
                    }
                    return;
                }
                if (response && response.status === "completed" && response.data) {
                    console.log("Arka plandan taze veri alındı:", response.data);
                    updatePopupWithData(response.data.profile, response.data.gno);
                } else if (response && response.status === "error") {
                    console.error("Arka plan veri çekme hatası:", response.message);
                     if (!storedData.studentProfile && !storedData.studentGNO) { // Sadece hiç önbellek yoksa hata göster
                        studentNameEl.textContent = "Veri Alınamadı";
                        studentDepartmentEl.textContent = "";
                        studentNumberEl.textContent = "";
                        studentGNOEl.textContent = "";
                    }
                } else {
                     // Beklenmedik yanıt veya veri yok
                     console.warn("Arka plandan beklenen veri gelmedi.", response);
                     if (!storedData.studentProfile && !storedData.studentGNO && !(response && response.data && response.data.profile && response.data.profile.name === "Giriş Yapılmamış")) {
                        // Eğer önbellek yoksa ve gelen veri de "Giriş Yapılmamış" değilse, bir sorun var demektir.
                        updatePopupWithData(null, null);
                    } else if (response && response.data && response.data.profile && response.data.profile.name === "Giriş Yapılmamış"){
                        updatePopupWithData(response.data.profile, response.data.gno);
                    }
                }
            });
        });
    }

    // Popup açıldığında öğrenci bilgilerini yükle ve tazelemeye çalış
    loadAndDisplayStudentInfo();

    if(refreshStudentInfoBtn) {
        refreshStudentInfoBtn.addEventListener("click", () => {
            displayLoadingState(); // "Yükleniyor..." göster
            chrome.runtime.sendMessage({ action: "fetchStudentData" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Yenileme mesajı gönderilemedi:", chrome.runtime.lastError.message);
                    updatePopupWithData({name: "Hata", department:"Hata", number:"-", imageUrl: 'images/icon48.png'}, null);
                    return;
                }
                if (response && response.status === "completed" && response.data) {
                    updatePopupWithData(response.data.profile, response.data.gno);
                } else if (response && response.status === "error") {
                    console.error("Yenileme sırasında arka plan hatası:", response.message);
                    studentNameEl.textContent = "Yenilenemedi";
                    studentNumberEl.textContent = "-";
                } else {
                    console.warn("Yenileme sırasında beklenen veri gelmedi.", response);
                     if (response && response.data && response.data.profile && response.data.profile.name === "Giriş Yapılmamış"){
                        updatePopupWithData(response.data.profile, response.data.gno);
                    } else {
                        updatePopupWithData({name: "Veri Yok", department:"Veri Yok", number:"-", imageUrl: 'images/icon48.png'}, null);
                    }
                }
            });
        });
    }

    // ... (Diğer buton ve toggle event listener'ları aynı kalacak, yukarıdaki popup.js'den alabilirsin) ...
    // Change Grades
    if (changeGradesBtn) {
        changeGradesBtn.addEventListener("click", () => {
            const userInput = prompt("Lütfen 0 ile 100 arasında bir sayı girin:");
            const userNumber = parseInt(userInput);

            if (isNaN(userNumber) || userNumber < 0 || userNumber > 100) {
                alert("Geçerli bir sayı giriniz! (0-100)");
                return;
            }

            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                const tab = tabs[0];
                if (!tab || !tab.id || (tab.url && tab.url.startsWith("chrome://"))) return;

                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    args: [userNumber],
                    function: (userNum) => { 
                        const textRightElements = document.querySelectorAll(".text-right > span:first-child"); // Sadece ana notu hedefle
                        textRightElements.forEach((element) => {
                            // Altında sub-score span'ı olup olmadığını kontrol et, varsa sadece text node'u değiştir
                            let mainTextNode = null;
                            for (let child of element.childNodes) {
                                if (child.nodeType === Node.TEXT_NODE && child.textContent.trim() !== "") {
                                    mainTextNode = child;
                                    break;
                                }
                            }
                            if(mainTextNode){
                               const currentGradeText = mainTextNode.textContent.trim().split(" ")[0];
                               if (!isNaN(parseInt(currentGradeText)) || currentGradeText === "-" || currentGradeText.toLowerCase() === "not") {
                                   mainTextNode.textContent = userNum.toString() + " "; // Boşluk bırak ki sub-score yapışmasın
                               }
                            } else if (!element.querySelector("span[data-calculated-score='sub']")) { // Eğer sub-score yoksa ve text node bulunamadıysa direkt ata
                                if (!isNaN(parseInt(element.textContent.trim())) || element.textContent.trim() === "-" || element.textContent.trim().toLowerCase() === "not") {
                                   element.textContent = userNum;
                                }
                            }
                        });

                        const textRightElementss = document.querySelectorAll(".text-right.font-weight-bold span");
                        textRightElementss.forEach((element) => {
                            element.textContent = ""; 
                            element.style.setProperty("color", "green", "important"); 
                        });
                         // Notlar değişti, content.js'in yeniden hesaplama yapması lazım
                        if (typeof enableCalculateGrade === "function") { // Eğer content script'te varsa
                            enableCalculateGrade();
                        } else { // Yoksa, content script'e mesaj gönder
                            chrome.tabs.sendMessage(tab.id, {action: "recalculateGradesAfterChange"});
                        }
                    },
                });
            });
        });
    }

    if (goToExamScheduleBtn) {
        goToExamScheduleBtn.addEventListener("click", () => {
            const examScheduleUrl = "https://obs.sabis.sakarya.edu.tr/Sinav/Takvim";
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                const currentTab = tabs[0];
                if (currentTab && currentTab.url && currentTab.url.startsWith("https://obs.sabis.sakarya.edu.tr/")) {
                    // Eğer zaten bir SABİS sekmesindeyse, o sekmeyi güncelle
                    chrome.tabs.update(currentTab.id, { url: examScheduleUrl });
                } else {
                    // Değilse, yeni bir sekmede aç
                    chrome.tabs.create({ url: examScheduleUrl });
                }
                window.close(); // Popup'ı kapat
            });
        });
    }

    // Check Questions
     if (checkQuestionsBtn) {
        checkQuestionsBtn.addEventListener("click", () => {
            chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                if (!tab?.url || tab.url.startsWith("chrome://") || !tab.id) return;

                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: () => {
                        // .swal2-html-container içindeki tüm span'ları seçmek yerine,
                        // her bir soru-puan satırını temsil eden div'leri veya ana konteyneri hedefleyebiliriz.
                        // Ya da daha iyisi, sadece "Puan:" içeren span'ları hedefleyelim.
                        
                        const container = document.querySelector(".swal2-html-container > div");
                        if (container) {
                            // Her bir satırı (br ile ayrılmış) veya doğrudan span'ları işleyebiliriz.
                            // Örnek HTML'de her satır bir "Soru: X - Puan: Y" şeklinde.
                            // Ve her "Soru:" ve "Puan:" ayrı span'larda.
                            // Sadece "Puan:" içeren span'ları renklendireceğiz.
                            // "Soru:" içeren span'lara dokunmayacağız.

                            const allSpans = container.querySelectorAll("span");
                            allSpans.forEach(spanElement => {
                                const text = spanElement.textContent;
                                if (text.includes("Puan:")) {
                                    // Bu bir puan span'ı, bunu renklendir.
                                    const isZero = text.includes("Puan: 0"); // Puanın 0 olup olmadığını kontrol et
                                    // "Puan: 0.0" gibi durumları da yakalamak için regex daha iyi olabilir
                                    // const isZero = /Puan:\s*0(\.0*)?/.test(text);


                                    spanElement.style.setProperty("background", isZero ? "#830000" : "green", "important");
                                    spanElement.style.setProperty("color", "white", "important");
                                    spanElement.style.setProperty("border", `2px solid ${isZero ? "#5d0d0d" : "#0d5f0d"}`, "important");
                                } else if (text.includes("Soru:")) {
                                    // Bu bir soru span'ı, buna dokunma veya varsayılan stili uygula
                                    spanElement.style.background = "";
                                    spanElement.style.color = "";
                                    spanElement.style.border = "";
                                }
                            });
                        }
                    },
                });
            });
        });
    }

    // Auto Fill Survey
    if (autoFillSurveyBtn) {
        autoFillSurveyBtn.addEventListener("click", () => {
            chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                if (!tab?.url || tab.url.startsWith("chrome://") || !tab.id) return;
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: () => {
                        document.querySelectorAll("table tbody tr").forEach((row) => {
                            row.querySelectorAll('input[type="radio"]').forEach((input) => {
                                if (input.value === "4") input.checked = true;
                            });
                        });
                        document.querySelectorAll('input[type="radio"][name*="A"]').forEach((radio) => {
                            radio.checked = true;
                        });
                    },
                });
            });
        });
    }
    
    // Toggle Butonları
    function setupToggle(checkboxId, storageKey, reloadOnChange = true, removeFunction) {
        const checkbox = document.getElementById(checkboxId);
        if (!checkbox) return;

        chrome.storage.local.get(storageKey, function (data) {
            checkbox.checked = !!data[storageKey];
        });

        checkbox.addEventListener("change", () => {
            const isChecked = checkbox.checked;
            chrome.storage.local.set({ [storageKey]: isChecked });

            if (reloadOnChange) {
                chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                    if (tab?.id && tab.url && !tab.url.startsWith("chrome://") && tab.url.includes("sakarya.edu.tr")) {
                        if (removeFunction && !isChecked) {
                            removeFunction(tab.id);
                        } else {
                            chrome.tabs.reload(tab.id);
                        }
                    }
                });
            }
        });
    }

    setupToggle("stealthCheckbox", STORAGE_KEY_STEALTH);
    setupToggle("calculateCheckbox", STORAGE_KEY_CALCULATE); // Calculate için sayfa yenileme yeterli, content.js storage'ı dinleyip kendi ayarlar
    setupToggle("themeCheckbox", STORAGE_KEY_REDMODE, true, removeTheme);
    setupToggle("themeDarkCheckbox", STORAGE_KEY_DARKMODE, true, removeDarkTheme);

    function removeTheme(tabId) { // Bu fonksiyonlar zaten vardı, tekrar tanımlamaya gerek yok ama burada kalsın
        chrome.scripting.executeScript({
            target: { tabId },
            function: () => document.getElementById("redmode")?.remove(),
        });
    }

    function removeDarkTheme(tabId) {
        chrome.scripting.executeScript({
            target: { tabId },
            function: () => document.getElementById("darkmode")?.remove(),
        });
    }
});