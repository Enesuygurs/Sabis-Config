document.addEventListener("DOMContentLoaded", function () {
    const STORAGE_KEY_REDMODE = "redmode_state"; // Sabit isimleri daha açıklayıcı yaptım
    const STORAGE_KEY_CALCULATE = "calculate_state";
    const STORAGE_KEY_STEALTH = "stealth_state";
    const STORAGE_KEY_DARKMODE = "darkmode_state";
    const STORAGE_KEY_STUDENT_PROFILE = "studentProfile";
    const STORAGE_KEY_STUDENT_GNO = "studentGNO";

    const changeGradesBtn = document.getElementById("changeGrades");
    const stealthCheckbox = document.getElementById("stealthCheckbox");
    const calculateCheckbox = document.getElementById("calculateCheckbox");
    const themeDarkCheckbox = document.getElementById("themeDarkCheckbox");
    const themeCheckbox = document.getElementById("themeCheckbox");
    const checkQuestionsBtn = document.getElementById("checkQuestions");
    const autoFillSurveyBtn = document.getElementById("autoFillSurvey");

    // Öğrenci Bilgi Kartı Elementleri
    const studentPhotoEl = document.getElementById("studentPhoto");
    const studentNameEl = document.getElementById("studentName");
    const studentDepartmentEl = document.getElementById("studentDepartment");
    const studentNumberEl = document.getElementById("studentNumber");
    const studentGNOEl = document.getElementById("studentGNO");
    const refreshStudentInfoBtn = document.getElementById("refreshStudentInfo");

    function loadStudentInfo() {
        studentNameEl.textContent = 'Yükleniyor...';
        studentDepartmentEl.textContent = 'Yükleniyor...';
        studentNumberEl.textContent = 'Öğrenci No: Yükleniyor...';
        studentGNOEl.textContent = 'GNO: Yükleniyor...';
        studentPhotoEl.src = 'images/icon48.png'; // Varsayılan

        chrome.storage.local.get([STORAGE_KEY_STUDENT_PROFILE, STORAGE_KEY_STUDENT_GNO], function (data) {
            if (chrome.runtime.lastError) {
                console.error("Depodan öğrenci bilgileri okunurken hata:", chrome.runtime.lastError.message);
                studentNameEl.textContent = 'Hata oluştu';
                return;
            }

            const profile = data[STORAGE_KEY_STUDENT_PROFILE];
            const gno = data[STORAGE_KEY_STUDENT_GNO];

            if (profile) {
                studentNameEl.textContent = profile.name || 'N/A';
                studentDepartmentEl.textContent = profile.department || 'N/A';
                studentNumberEl.textContent = `Öğrenci No: ${profile.number || 'N/A'}`;
                if (profile.imageUrl && profile.imageUrl !== 'images/icon48.png') { // Sadece geçerli bir URL varsa değiştir
                    studentPhotoEl.src = profile.imageUrl;
                } else {
                    studentPhotoEl.src = 'images/icon48.png'; // Varsayılan
                }
                 studentPhotoEl.onerror = function() { // Resim yüklenemezse varsayılana dön
                    this.src = 'images/icon48.png';
                };
            } else {
                studentNameEl.textContent = 'Bilgi Yok';
                studentDepartmentEl.textContent = 'Ana sayfayı ziyaret edin';
                studentNumberEl.textContent = 'Öğrenci No: -';
            }

            if (gno) {
                studentGNOEl.textContent = `GNO: ${gno}`;
            } else {
                studentGNOEl.textContent = 'GNO: Transkripti ziyaret edin';
            }
        });
    }

    // Popup açıldığında öğrenci bilgilerini yükle
    loadStudentInfo();

    // Yenileme Butonu
    if(refreshStudentInfoBtn) {
        refreshStudentInfoBtn.addEventListener("click", () => {
            // Aktif SABİS sekmelerinde content script'i tetikle (veya sadece ana sayfa ve transkript için)
            // Bu, content script'lerin veriyi tekrar çekip depolamasını sağlar.
            // Ardından loadStudentInfo'yu çağırarak popup'ı güncelleriz.
            
            studentNameEl.textContent = 'Yenileniyor...'; // Kullanıcıya geri bildirim
            // Bir timeout ile verinin çekilmesi için zaman tanıyalım
            // Gerçekte, content script'ten mesaj alıp sonra güncellemek daha doğru olurdu.

            chrome.tabs.query({ url: "*://*.sakarya.edu.tr/*" }, function (tabs) {
                tabs.forEach(tab => {
                    if (tab.url.includes("sabis.sakarya.edu.tr")) { // Sadece SABİS sekmeleri
                        // Hangi scriptin hangi sayfada çalışacağını content.js zaten biliyor.
                        // Bu yüzden sadece sayfayı yeniden yüklemesini isteyebiliriz ya da
                        // content script'e özel bir mesaj gönderebiliriz.
                        // Şimdilik basitçe, content script'in bir sonraki yüklemede veriyi alacağını varsayıyoruz.
                        // Daha gelişmiş bir yöntem:
                        chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            function: () => {
                                // content.js içindeki scrapeAndStoreStudentInfo ve scrapeAndStoreGNO'nun
                                // tekrar çalışmasını tetikleyecek bir mantık.
                                // Örn: Bu fonksiyonları doğrudan çağırabiliriz (eğer globale tanımlıysa)
                                // veya sayfayı yeniden yükleyebiliriz.
                                // Şimdilik en basit yol, content script'in sayfa yüklemesinde çalışmasına güvenmek.
                                // Daha iyi bir çözüm için background script üzerinden mesajlaşma gerekebilir.
                                if (typeof scrapeAndStoreStudentInfo === 'function' && (window.location.pathname === '/' || window.location.pathname === '/Home/Index' || document.querySelector('#kt_profile_aside'))) {
                                     scrapeAndStoreStudentInfo();
                                }
                                if (typeof scrapeAndStoreGNO === 'function' && window.location.href.includes("/Transkript")) {
                                     scrapeAndStoreGNO();
                                }
                            }
                        }).then(() => {
                            console.log("Veri çekme fonksiyonları tetiklendi (eğer sayfalar açıksa).");
                        }).catch(err => console.error("Script çalıştırma hatası:", err));
                    }
                });
            });

            // Kısa bir gecikmeyle bilgileri tekrar yükle (verilerin depoya yazılması için zaman tanımak adına)
            setTimeout(loadStudentInfo, 1500); // 1.5 saniye sonra
        });
    }


    // Change Grades
    if (changeGradesBtn) {
        changeGradesBtn.addEventListener("click", () => {
            // ... (mevcut changeGrades kodu) ...
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
                    function: (userNum) => { // Argüman adını değiştirdim karışmaması için
                        const textRightElements = document.querySelectorAll(".text-right > span");
                        textRightElements.forEach((element) => {
                            let number = parseInt(element.textContent.trim());
                            if (!isNaN(number)) {
                                element.textContent = userNum;
                            }
                        });

                        const textRightElementss = document.querySelectorAll(".text-right.font-weight-bold span");
                        textRightElementss.forEach((element) => {
                            element.textContent = ""; // Harf notunu sil
                            element.style.setProperty("color", "green", "important"); // Opsiyonel: Renk
                        });
                    },
                });
            });
        });
    }

    // Check Questions
    if (checkQuestionsBtn) {
        checkQuestionsBtn.addEventListener("click", () => {
            // ... (mevcut checkQuestions kodu) ...
            chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                if (!tab?.url || tab.url.startsWith("chrome://") || !tab.id) return;

                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: () => {
                        document.querySelectorAll(".swal2-html-container > div > span").forEach((element) => {
                            const text = element.textContent;
                            const isZero = text.includes("Puan: 0");
                            element.style.setProperty("background", isZero ? "#830000" : "green", "important");
                            element.style.setProperty("color", "white", "important");
                            element.style.setProperty("border", `2px solid ${isZero ? "#5d0d0d" : "green"}`, "important");
                        });
                    },
                });
            });
        });
    }

    // Auto Fill Survey
    if (autoFillSurveyBtn) {
        autoFillSurveyBtn.addEventListener("click", () => {
            // ... (mevcut autoFillSurvey kodu) ...
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
    // Stealth Mode
    if (stealthCheckbox) {
        chrome.storage.local.get(STORAGE_KEY_STEALTH, function (data) {
            stealthCheckbox.checked = !!data[STORAGE_KEY_STEALTH];
        });
        stealthCheckbox.addEventListener("change", () => {
            chrome.storage.local.set({ [STORAGE_KEY_STEALTH]: stealthCheckbox.checked });
            chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                if (tab?.id && !tab.url.startsWith("chrome://")) {
                    chrome.tabs.reload(tab.id);
                }
            });
        });
    }

    // Calculate Grades
    if (calculateCheckbox) {
        chrome.storage.local.get(STORAGE_KEY_CALCULATE, function (data) {
            calculateCheckbox.checked = !!data[STORAGE_KEY_CALCULATE];
        });
        calculateCheckbox.addEventListener("change", function () {
            const isChecked = calculateCheckbox.checked;
            chrome.storage.local.set({ [STORAGE_KEY_CALCULATE]: isChecked });
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                const currentTab = tabs[0];
                if (!currentTab || !currentTab.id || !currentTab.url) return;
                const targetUrl = "https://obs.sabis.sakarya.edu.tr/Ders";
                if (!currentTab.url.startsWith(targetUrl)) return;

                // Mesajı background.js'e göndermek yerine doğrudan content script'i tetikle
                // veya content script'in storage değişikliğini dinlemesini sağla.
                // Şimdilik, sayfanın yenilenmesiyle content script'in tekrar çalışacağını varsayabiliriz
                // veya content script'e mesaj göndererek anında güncelleme yapabiliriz.
                // En basit yol, content script'in depolama değişikliğini dinlemesi veya sayfanın yenilenmesi.
                // calculate_state değiştiğinde /Ders sayfasındaysak sayfayı yenileyelim.
                chrome.tabs.reload(currentTab.id);
            });
        });
    }
    
    // Red Theme
    if (themeCheckbox) {
        chrome.storage.local.get(STORAGE_KEY_REDMODE, function (data) {
            themeCheckbox.checked = !!data[STORAGE_KEY_REDMODE];
        });
        themeCheckbox.addEventListener("change", () => {
            const isChecked = themeCheckbox.checked;
            chrome.storage.local.set({ [STORAGE_KEY_REDMODE]: isChecked });
            chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                if (tab?.id && !tab.url.startsWith("chrome://")) {
                    isChecked ? chrome.tabs.reload(tab.id) : removeTheme(tab.id);
                }
            });
        });
    }
    function removeTheme(tabId) {
        chrome.scripting.executeScript({
            target: { tabId },
            function: () => document.getElementById("redmode")?.remove(),
        });
    }

    // Dark Theme
    if (themeDarkCheckbox) {
        chrome.storage.local.get(STORAGE_KEY_DARKMODE, function (data) {
            themeDarkCheckbox.checked = !!data[STORAGE_KEY_DARKMODE];
        });
        themeDarkCheckbox.addEventListener("change", () => {
            const isChecked = themeDarkCheckbox.checked;
            chrome.storage.local.set({ [STORAGE_KEY_DARKMODE]: isChecked });
            chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                if (tab?.id && !tab.url.startsWith("chrome://")) {
                    isChecked ? chrome.tabs.reload(tab.id) : removeDarkTheme(tab.id);
                }
            });
        });
    }
    function removeDarkTheme(tabId) {
        chrome.scripting.executeScript({
            target: { tabId },
            function: () => document.getElementById("darkmode")?.remove(),
        });
    }
});