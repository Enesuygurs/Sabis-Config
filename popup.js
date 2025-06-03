document.addEventListener("DOMContentLoaded", function () {
    const STORAGE_KEYS = {
        REDMODE: "redmode_state",
        CALCULATE: "calculate_state",
        STEALTH: "stealth_state",
        DARKMODE: "darkmode_state",
        STUDENT_PROFILE: "studentProfile",
        STUDENT_GNO: "studentGNO",
        STUDENT_BALANCE: "studentBalance",
        FOOD_MENU: "foodMenu",
        PREFERRED_MENU_TYPE: "preferredMenuType"
    };

    const ELEMENTS = {
        studentPhoto: document.getElementById("studentPhoto"),
        studentName: document.getElementById("studentName"),
        studentDepartment: document.getElementById("studentDepartment"),
        studentNumber: document.getElementById("studentNumber"),
        studentGNO: document.getElementById("studentGNO"),
        studentBalance: document.getElementById("studentBalance"),
        foodMenuTitle: document.getElementById("foodMenuTitle"),
        foodMenuList: document.getElementById("foodMenuList"),
        
        refreshStudentInfoBtn: document.getElementById("refreshStudentInfo"),
        loadBalanceBtn: document.getElementById("loadBalanceBtn"),
        
        mainContent: document.getElementById("mainContent"),
        settingsContent: document.getElementById("settingsContent"),
        openSettingsBtn: document.getElementById("openSettingsBtn"),
        
        headerLogo: document.getElementById("headerLogo"),
        headerTitle: document.getElementById("headerTitle"),
        backToMainBtnHeader: document.getElementById("backToMainBtnHeader"),

        changeGradesBtn: document.getElementById("changeGrades"),
        autoFillSurveyBtn: document.getElementById("autoFillSurvey"),
        goToExamScheduleBtn: document.getElementById("goToExamSchedule"),
        checkQuestionsBtn: document.getElementById("checkQuestions"),
        
        themeCheckbox: document.getElementById("themeCheckbox"),
        themeDarkCheckbox: document.getElementById("themeDarkCheckbox"),
        stealthCheckbox: document.getElementById("stealthCheckbox"),
        calculateCheckbox: document.getElementById("calculateCheckbox"),
        toggleFoodMenuTypeBtn: document.getElementById("toggleFoodMenuTypeBtn")
    };
     Object.keys(ELEMENTS).forEach(key => {
        if (!ELEMENTS[key]) {
            console.warn(`Element bulunamadı (ID: ${key})`); // Hata yerine uyarı
        }
    });
function $(id) { return document.getElementById(id); } // Basit bir yardımcı
      let currentPreferredMenuType = 'normal';

    function showMainContent() {
        console.log("showMainContent çağrıldı");
        if (ELEMENTS.mainContent) ELEMENTS.mainContent.classList.remove("hidden");
        if (ELEMENTS.settingsContent) ELEMENTS.settingsContent.classList.add("hidden");

        if (ELEMENTS.headerLogo) ELEMENTS.headerLogo.classList.remove("hidden");
        if (ELEMENTS.headerTitle) ELEMENTS.headerTitle.textContent = "SABİS Config";
        if (ELEMENTS.backToMainBtnHeader) ELEMENTS.backToMainBtnHeader.classList.add("hidden");
        if (ELEMENTS.openSettingsBtn) ELEMENTS.openSettingsBtn.classList.remove("hidden");
    }

    function showSettingsContent() {
        console.log("showSettingsContent çağrıldı");
        if (ELEMENTS.mainContent) ELEMENTS.mainContent.classList.add("hidden");
        if (ELEMENTS.settingsContent) ELEMENTS.settingsContent.classList.remove("hidden");

        if (ELEMENTS.headerLogo) ELEMENTS.headerLogo.classList.add("hidden");
        if (ELEMENTS.headerTitle) ELEMENTS.headerTitle.textContent = "Ayarlar & İşlemler";
        if (ELEMENTS.backToMainBtnHeader) ELEMENTS.backToMainBtnHeader.classList.remove("hidden");
        if (ELEMENTS.openSettingsBtn) ELEMENTS.openSettingsBtn.classList.add("hidden");
    }
    function setTextContent(element, text, prefix = '') {
        if (element) element.textContent = text ? `${prefix}${text}` : (prefix ? `${prefix}N/A` : 'N/A');
    }
    
    function setProfileField(element, value, defaultValue = 'N/A') {
        if (element) element.textContent = value || defaultValue;
    }

     function displayLoadingState() {
        setProfileField(ELEMENTS.studentName, 'Yükleniyor...');
        setProfileField(ELEMENTS.studentDepartment, 'Yükleniyor...');
        setProfileField(ELEMENTS.studentNumber, 'Yükleniyor...');
        setTextContent(ELEMENTS.studentGNO, 'Yükleniyor...', 'GNO: ');
        setTextContent(ELEMENTS.studentBalance, 'Yükleniyor...', 'Bakiye: ');
        if (ELEMENTS.studentPhoto) ELEMENTS.studentPhoto.src = 'images/avatar.png';
        if (ELEMENTS.foodMenuTitle) setTextContent(ELEMENTS.foodMenuTitle, 'Bugünün Menüsü Yükleniyor...');
        if (ELEMENTS.foodMenuList) ELEMENTS.foodMenuList.innerHTML = '<li class="placeholder">Yükleniyor...</li>';
    }

    if (ELEMENTS.openSettingsBtn) {
        ELEMENTS.openSettingsBtn.addEventListener("click", showSettingsContent);
    }
    if (ELEMENTS.backToMainBtnHeader) {
        ELEMENTS.backToMainBtnHeader.addEventListener("click", showMainContent);
    }

   // popup.js

// ... (STORAGE_KEYS, ELEMENTS, currentPreferredMenuType, setTextContent, setProfileField, displayLoadingState aynı) ...

    function renderFoodMenu(foodMenuData, preferredType) {
        console.log("renderFoodMenu çağrıldı. Tercih:", preferredType, "Gelen Data:", foodMenuData);
        if (!ELEMENTS.foodMenuTitle || !ELEMENTS.foodMenuList) {
            console.error("Yemek menüsü başlık veya liste elementi bulunamadı!");
            return;
        }
        
        const defaultErrorMsg = "Menü bilgisi alınamadı.";
        const loadingMsg = "Yükleniyor...";
        
        if (foodMenuData) {
            let menuToDisplay = [];
            let menuTypeLabel = "Genel"; // Varsayılan

            if (preferredType === 'diet' && foodMenuData.dietMenu && foodMenuData.dietMenu.length > 0) {
                menuToDisplay = foodMenuData.dietMenu;
                menuTypeLabel = "Diyet";
            } else if (foodMenuData.normalMenu && foodMenuData.normalMenu.length > 0) {
                menuToDisplay = foodMenuData.normalMenu;
                // menuTypeLabel zaten "Genel"
                if (preferredType === 'diet') {
                    // console.log("Diyet menüsü istendi ancak boş, normal menü gösteriliyor.");
                }
            } else if (foodMenuData.dietMenu && foodMenuData.dietMenu.length > 0) { 
                menuToDisplay = foodMenuData.dietMenu;
                menuTypeLabel = "Diyet";
            }

            let menuDatePart;
            // foodMenuData.dateLabel'ı kontrol et, eğer BG'den formatlı geliyorsa onu kullan,
            // yoksa veya hatalıysa bugünün tarihini formatla.
            // BG'deki updateStudentData'da zaten formatlı tarih ekliyorduk dateLabel'a.
            if (foodMenuData.dateLabel && 
                !foodMenuData.dateLabel.includes("Hata") && 
                !foodMenuData.dateLabel.includes("Yükleniyor") &&
                !foodMenuData.dateLabel.includes("bekleniyor") &&
                !foodMenuData.dateLabel.includes("alınamadı")) {
                
                // Gelen dateLabel'dan gün ismini (Salı, Çarşamba vb.) çıkaralım.
                // Örnek: "3 Haziran Salı Menüsü" -> "3 Haziran Menüsü"
                // Veya "Bugün - 3 Haziran Salı - Genel Menü" -> "Bugün - 3 Haziran - Genel Menü"
                let labelParts = foodMenuData.dateLabel.split(" ");
                // Haftanın günlerini içeren bir liste
                const daysOfWeek = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
                // Gün ismini filtrele
                labelParts = labelParts.filter(part => !daysOfWeek.includes(part));
                menuDatePart = labelParts.join(" ").replace("Menüsü", "").trim(); // "Menüsü" kelimesini de çıkaralım, sonda ekleyeceğiz
                 // Eğer "Bugün - Tarih - Tip" formatı varsa ve tip çıkmışsa
                if (menuDatePart.endsWith(" - Genel") || menuDatePart.endsWith(" - Diyet")) {
                    menuDatePart = menuDatePart.substring(0, menuDatePart.lastIndexOf(" - ")).trim();
                }


            } else { 
                const today = new Date();
                // Sadece gün ve ay istiyoruz, yıl ve gün ismi olmadan.
                const options = { day: 'numeric', month: 'long' }; // YENİ FORMAT
                menuDatePart = today.toLocaleDateString('tr-TR', options);
            }
            
            setTextContent(ELEMENTS.foodMenuTitle, `${menuDatePart} ${menuTypeLabel} Menüsü`);
            ELEMENTS.foodMenuList.innerHTML = ""; 

            if (foodMenuData.hasMenu && menuToDisplay.length > 0) {
                menuToDisplay.forEach(item => {
                    if (item.name && !item.name.includes("bekleniyor") && !item.name.includes("alınamadı")) {
                        const listItem = document.createElement("li");
                        listItem.textContent = item.name;
                        if (item.calorie && item.calorie !== "N/A" && item.calorie !== "0") {
                            const calorieSpan = document.createElement("span");
                            calorieSpan.className = "food-calorie";
                            calorieSpan.textContent = `(${item.calorie} kcal)`;
                            listItem.appendChild(calorieSpan);
                        }
                        ELEMENTS.foodMenuList.appendChild(listItem);
                    }
                });
                if (ELEMENTS.foodMenuList.children.length === 0) {
                    ELEMENTS.foodMenuList.innerHTML = `<li class="placeholder">Bu menü tipi için bugün yemek yok.</li>`;
                }
            } else if (foodMenuData.normalMenu && foodMenuData.normalMenu.length > 0 && foodMenuData.normalMenu[0].name) {
                ELEMENTS.foodMenuList.innerHTML = `<li class="placeholder">${foodMenuData.normalMenu[0].name}</li>`;
                 setTextContent(ELEMENTS.foodMenuTitle, foodMenuData.dateLabel || "Menü Bilgisi"); 
            } else { 
                ELEMENTS.foodMenuList.innerHTML = `<li class="placeholder">${defaultErrorMsg}</li>`;
                setTextContent(ELEMENTS.foodMenuTitle, menuDatePart ? `${menuDatePart} ${menuTypeLabel} Menüsü` : "Menü Bilgisi Yok");
            }
        } else { 
            setTextContent(ELEMENTS.foodMenuTitle, "Yemek Menüsü");
            ELEMENTS.foodMenuList.innerHTML = `<li class="placeholder">${loadingMsg}</li>`;
        }
    }

    // ... (updatePopupWithData, loadAndDisplayStudentInfo ve diğer fonksiyonlar aynı) ...
    // loadAndDisplayStudentInfo içinde currentPreferredMenuType ve updatePopupWithData çağrısı doğru.
    // toggleFoodMenuTypeBtn listener'ı da doğru.

      function updatePopupWithData(profile, gno, balance, foodMenu) { 
        console.log("Popup updatePopupWithData - foodMenu:", JSON.stringify(foodMenu, null, 2));// YENİ: foodMenu parametresi
        // ... (profil, gno, bakiye gösterme aynı) ...
        if (profile) {
            setProfileField(ELEMENTS.studentName, profile.name);
            let departmentText = profile.department || 'N/A';
            if (departmentText !== 'N/A') {
                const prIndex = departmentText.indexOf('PR');
                if (prIndex !== -1) departmentText = departmentText.substring(0, prIndex).trim();
            }
            setProfileField(ELEMENTS.studentDepartment, departmentText);
            setProfileField(ELEMENTS.studentNumber, profile.number);
            if (ELEMENTS.studentPhoto) {
                ELEMENTS.studentPhoto.src = (profile.imageUrl && profile.imageUrl !== 'images/avatar.png') ? profile.imageUrl : 'images/avatar.png';
                ELEMENTS.studentPhoto.onerror = function() { this.src = 'images/avatar.png'; };
            }
        } else { /* ... hata durumu ... */
            setProfileField(ELEMENTS.studentName, 'Bilgi Yok');
            setProfileField(ELEMENTS.studentDepartment, 'Veri çekilemedi');
            setProfileField(ELEMENTS.studentNumber, '-');
            if (ELEMENTS.studentPhoto) ELEMENTS.studentPhoto.src = 'images/avatar.png';
        }

        setTextContent(ELEMENTS.studentGNO, (profile?.name === "Giriş Yapılmamış" ? '-' : gno), 'GNO: ');
        setTextContent(ELEMENTS.studentBalance, (profile?.name === "Giriş Yapılmamış" ? '-' : balance));
    // YEMEK MENÜSÜNÜ GÖSTERME
        if (ELEMENTS.foodMenuTitle && ELEMENTS.foodMenuList) {
            const defaultErrorMsg = "Menü bilgisi alınamadı.";
            const loadingMsg = "Yükleniyor...";
            
            if (foodMenu) {
                // Tarih etiketi BG'den formatlanmış geliyor olmalı
                setTextContent(ELEMENTS.foodMenuTitle, foodMenu.dateLabel || "Bugünün Menüsü");
                ELEMENTS.foodMenuList.innerHTML = ""; 

                let menuToDisplay = foodMenu.normalMenu;
                // Eğer normal menü boşsa ve diyet menüsü varsa ve içinde yemek varsa onu göster
                if ((!menuToDisplay || menuToDisplay.length === 0) && foodMenu.dietMenu && foodMenu.dietMenu.length > 0) {
                    menuToDisplay = foodMenu.dietMenu;
                    // Başlığı Diyet Menüsü olarak güncelle (eğer zaten belirtilmemişse)
                    if (ELEMENTS.foodMenuTitle.textContent && !ELEMENTS.foodMenuTitle.textContent.includes("Diyet")) {
                        ELEMENTS.foodMenuTitle.textContent = ELEMENTS.foodMenuTitle.textContent.replace("Menüsü", "Diyet Menüsü");
                    }
                }

                if (foodMenu.hasMenu && menuToDisplay && menuToDisplay.length > 0) {
                    menuToDisplay.forEach(item => {
                        if (item.name && !item.name.includes("bekleniyor") && !item.name.includes("alınamadı")) { // Geçerli bir yemek adı varsa
                            const listItem = document.createElement("li");
                            listItem.textContent = item.name;
                            if (item.calorie && item.calorie !== "N/A" && item.calorie !== "0") {
                                const calorieSpan = document.createElement("span");
                                calorieSpan.className = "food-calorie";
                                calorieSpan.textContent = `(${item.calorie} kcal)`;
                                listItem.appendChild(calorieSpan);
                            }
                            ELEMENTS.foodMenuList.appendChild(listItem);
                        }
                    });
                    // Eğer forEach sonrası liste hala boşsa (geçerli yemek adı bulunamadıysa)
                    if (ELEMENTS.foodMenuList.children.length === 0) {
                        ELEMENTS.foodMenuList.innerHTML = `<li class="placeholder">${foodMenu.normalMenu?.[0]?.name || defaultErrorMsg}</li>`;
                    }
                } else if (foodMenu.normalMenu && foodMenu.normalMenu.length > 0 && foodMenu.normalMenu[0].name) {
                    // hasMenu false ama bir mesaj var (örn: "Menü bulunamadı")
                    ELEMENTS.foodMenuList.innerHTML = `<li class="placeholder">${foodMenu.normalMenu[0].name}</li>`;
                }
                 else { // hasMenu false ve normalMenu da boş veya tanımsız
                    ELEMENTS.foodMenuList.innerHTML = `<li class="placeholder">${defaultErrorMsg}</li>`;
                }
            } else { // foodMenu objesi hiç gelmemişse
                setTextContent(ELEMENTS.foodMenuTitle, "Yemek Menüsü");
                ELEMENTS.foodMenuList.innerHTML = `<li class="placeholder">${loadingMsg}</li>`;
            }
        }
        console.log("updatePopupWithData içinde currentPreferredMenuType:", currentPreferredMenuType); // LOG 2
        renderFoodMenu(foodMenu, currentPreferredMenuType);
    }

  function loadAndDisplayStudentInfo() {
        displayLoadingState();
        chrome.storage.local.get(Object.values(STORAGE_KEYS), (storedData) => {
            if (chrome.runtime.lastError) { 
                updatePopupWithData(
                    {name: "Hata", department:"Hata", number:"-", imageUrl: 'images/avatar.png'}, 
                    "Hata", 
                    "Hata", 
                    {dateLabel:"Hata", normalMenu:[{name:"Yüklenemedi", calorie:""}], hasMenu:false }
                ); 
                return; 
            }
            currentPreferredMenuType = storedData[STORAGE_KEYS.PREFERRED_MENU_TYPE] || 'normal'; // Kayıtlı tercihi yükle
             console.log("loadAndDisplay: Depodan okunan tercih:", currentPreferredMenuType); // LOG 3
            updatePopupWithData(
                storedData[STORAGE_KEYS.STUDENT_PROFILE], 
                storedData[STORAGE_KEYS.STUDENT_GNO], 
                storedData[STORAGE_KEYS.STUDENT_BALANCE],
                storedData[STORAGE_KEYS.FOOD_MENU] // Önbellekten yemek menüsünü de yükle
            );
            
            chrome.runtime.sendMessage({ action: "fetchStudentData" }, (response) => {
                if (chrome.runtime.lastError) {
                    if (!Object.values(storedData).some(v => v && (typeof v !== 'object' || Object.keys(v).length > 0))) { // Eğer hiçbir önbelleklenmiş veri yoksa
                        updatePopupWithData(
                            {name: "Hata", department:"Hata", number:"-", imageUrl: 'images/avatar.png'}, 
                            "Hata", 
                            "Hata",
                            {dateLabel:"Hata", normalMenu:[{name:"Yüklenemedi", calorie:""}], hasMenu:false }
                        );
                    }
                    return;
                }

                if (response?.status === "completed" && response.data) {
                    updatePopupWithData(response.data.profile, response.data.gno, response.data.balance, response.data.foodMenu);
                } else if (response?.status === "error" && !Object.values(storedData).some(v => v && (typeof v !== 'object' || Object.keys(v).length > 0))) {
                     updatePopupWithData(
                        {name: "Veri Alınamadı", department:"-", number:"-", imageUrl: 'images/avatar.png'}, 
                        "N/A", 
                        "N/A",
                        {dateLabel:"Veri Alınamadı", normalMenu:[{name:"Yüklenemedi", calorie:""}], hasMenu:false }
                    );
                } else if (response?.data?.profile?.name === "Giriş Yapılmamış"){
                     updatePopupWithData(response.data.profile, response.data.gno, response.data.balance, response.data.foodMenu);
                } else if (!Object.values(storedData).some(v => v && (typeof v !== 'object' || Object.keys(v).length > 0))) {
                    updatePopupWithData(null, null, null, null);
                }
            });
        });
    }

    if (ELEMENTS.refreshStudentInfoBtn) {
        ELEMENTS.refreshStudentInfoBtn.addEventListener("click", loadAndDisplayStudentInfo);
    }

    if (ELEMENTS.loadBalanceBtn) {
        ELEMENTS.loadBalanceBtn.addEventListener("click", () => {
            const amounts = ["30", "50", "100", "200", "500"];
            const selectedAmount = prompt(`Yüklenecek tutarı seçin veya girin (${amounts.join(', ')} TL):`, "50");
            if (selectedAmount !== null) {
                const amount = parseInt(selectedAmount);
                if (!isNaN(amount) && amount > 0) {
                    // Formu POST etmek yerine, kullanıcıyı miktar seçilmiş şekilde sayfaya yönlendirmek daha basit olabilir
                    // ancak SABİS'in yükleme mekanizması POST gerektiriyorsa bu çalışmaz.
                    // Şimdilik sadece bakiye sayfasına yönlendirelim. Gerçek yükleme için
                    // SABİS'in form yapısını ve CSRF token'ını taklit etmek gerekir ki bu da risklidir.
                    // En güvenli yol, kullanıcıyı ilgili sayfaya yönlendirmek.
                    // Eğer doğrudan yükleme linki varsa (GET ile miktar parametresi alan), o kullanılabilir.
                    // https://obs.sabis.sakarya.edu.tr/Kart/Yukle adresi POST bekliyor.
                    // Bu yüzden şimdilik sadece bakiye sayfasına yönlendirelim.
                    navigateSabisTabOrNew("https://obs.sabis.sakarya.edu.tr/Kart/Bakiye");
                    // Alternatif: Kullanıcıyı doğrudan bir miktar seçiliymiş gibi yönlendirmeye çalışmak (eğer URL destekliyorsa)
                    // chrome.tabs.create({ url: `https://obs.sabis.sakarya.edu.tr/Kart/Bakiye?yuklenecekTutar=${amount}` }); // Bu URL'nin çalıştığı varsayılmıyor
                } else {
                    alert("Geçerli bir tutar giriniz.");
                }
            }
        });
    }

    function executeScriptOnActiveSabisTab(scriptFunc, args) {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            if (tab?.id && tab.url?.startsWith("https://obs.sabis.sakarya.edu.tr/") && !tab.url.startsWith("chrome://")) {
                chrome.scripting.executeScript({ target: { tabId: tab.id }, func: scriptFunc, args: args });
            }
        });
    }
    
    function navigateSabisTabOrNew(url) {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            if (tab?.id && tab.url?.startsWith("https://obs.sabis.sakarya.edu.tr/")) {
                chrome.tabs.update(tab.id, { url });
            } else {
                chrome.tabs.create({ url });
            }
            window.close();
        });
    }

    if (ELEMENTS.refreshStudentInfoBtn) {
        ELEMENTS.refreshStudentInfoBtn.addEventListener("click", loadAndDisplayStudentInfo);
    }

    if (ELEMENTS.loadBalanceBtn) {
        ELEMENTS.loadBalanceBtn.addEventListener("click", () => navigateSabisTabOrNew("https://obs.sabis.sakarya.edu.tr/Kart/Bakiye"));
    }

    if (ELEMENTS.goToExamScheduleBtn) {
        ELEMENTS.goToExamScheduleBtn.addEventListener("click", () => navigateSabisTabOrNew("https://obs.sabis.sakarya.edu.tr/Sinav/Takvim"));
    }

    if (ELEMENTS.changeGradesBtn) {
        ELEMENTS.changeGradesBtn.addEventListener("click", () => {
            const userInput = prompt("Lütfen 0 ile 100 arasında bir sayı girin:");
            const userNumber = parseInt(userInput);
            if (isNaN(userNumber) || userNumber < 0 || userNumber > 100) {
                alert("Geçerli bir sayı giriniz! (0-100)");
                return;
            }
            executeScriptOnActiveSabisTab((num) => {
                document.querySelectorAll(".text-right > span:first-child").forEach(el => {
                    let mainTxtNode = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
                    const gradeTxt = mainTxtNode ? mainTxtNode.textContent.trim().split(" ")[0] : el.textContent.trim();
                    const isValidTarget = !isNaN(parseInt(gradeTxt)) || gradeTxt === "-" || gradeTxt.toLowerCase() === "not";
                    if (mainTxtNode && isValidTarget) mainTxtNode.textContent = `${num} `;
                    else if (!el.querySelector("span[data-calculated-score='sub']") && isValidTarget) el.textContent = num;
                });
                document.querySelectorAll(".text-right.font-weight-bold span").forEach(el => {
                    el.textContent = ""; el.style.setProperty("color", "green", "important");
                });
                if (typeof enableCalculateGrade === "function") enableCalculateGrade();
                else chrome.runtime.sendMessage({ action: "recalculateGradesAfterChange" }); // chrome.tabs.sendMessage to tab.id
            }, [userNumber]);
        });
    }

    if (ELEMENTS.checkQuestionsBtn) {
        ELEMENTS.checkQuestionsBtn.addEventListener("click", () => {
            executeScriptOnActiveSabisTab(() => {
                const container = document.querySelector(".swal2-html-container > div");
                if (container) {
                    container.querySelectorAll("span").forEach(span => {
                        const text = span.textContent;
                        if (text.includes("Puan:")) {
                            const isZero = text.includes("Puan: 0");
                            Object.assign(span.style, { background: (isZero ? "#830000" : "green"), color: "white", border: `2px solid ${isZero ? "#5d0d0d" : "#0d5f0d"}` });
                            ["background", "color", "border"].forEach(prop => span.style.setProperty(prop, span.style[prop], "important"));
                        } else if (text.includes("Soru:")) {
                            Object.assign(span.style, { background: "", color: "", border: "" });
                        }
                    });
                }
            });
        });
    }

    if (ELEMENTS.autoFillSurveyBtn) {
        ELEMENTS.autoFillSurveyBtn.addEventListener("click", () => {
            executeScriptOnActiveSabisTab(() => {
                document.querySelectorAll("table tbody tr input[type='radio'][value='4']").forEach(input => input.checked = true);
                document.querySelectorAll("input[type='radio'][name*='A']").forEach(radio => radio.checked = true);
            });
        });
    }
   // YEMEK MENÜSÜ TİPİ DEĞİŞTİRME BUTONU
    if (ELEMENTS.toggleFoodMenuTypeBtn) {
        console.log("toggleFoodMenuTypeBtn için listener ekleniyor. Element:", ELEMENTS.toggleFoodMenuTypeBtn); // LOG A
        ELEMENTS.toggleFoodMenuTypeBtn.addEventListener("click", () => {
            console.log("toggleFoodMenuTypeBtn tıklandı! Event listener içi."); // LOG B
            console.log("Tıklama öncesi currentPreferredMenuType:", currentPreferredMenuType); // LOG C

            currentPreferredMenuType = (currentPreferredMenuType === 'normal') ? 'diet' : 'normal';
            console.log("Tıklama sonrası YENİ currentPreferredMenuType:", currentPreferredMenuType); // LOG D
            
            chrome.storage.local.set({ [STORAGE_KEYS.PREFERRED_MENU_TYPE]: currentPreferredMenuType }, () => {
                if(chrome.runtime.lastError) {
                    console.error("Tercih kaydedilirken hata:", chrome.runtime.lastError.message);
                } else {
                    console.log("Tercih başarıyla kaydedildi:", currentPreferredMenuType); // LOG E
                }
            });
            
            // Depodan foodMenu verisini çek ve yeniden render et
            chrome.storage.local.get(STORAGE_KEYS.FOOD_MENU, (data) => {
                if (chrome.runtime.lastError) {
                    console.error("Menü verisi toggle sırasında depodan okunurken hata:", chrome.runtime.lastError.message);
                    return;
                }
                console.log("Toggle sonrası depodan okunan foodMenu:", data ? data[STORAGE_KEYS.FOOD_MENU] : 'veri yok'); // LOG F
                if (data && data[STORAGE_KEYS.FOOD_MENU]) {
                    renderFoodMenu(data[STORAGE_KEYS.FOOD_MENU], currentPreferredMenuType);
                } else {
                    console.warn("Toggle sonrası render için foodMenu depoda bulunamadı veya boş.");
                     // Belki varsayılan bir menü göstermek veya hata mesajı vermek
                    renderFoodMenu({ 
                        dateLabel: ELEMENTS.foodMenuTitle ? ELEMENTS.foodMenuTitle.textContent : "Menü", 
                        normalMenu: [], 
                        dietMenu: [], 
                        hasMenu: false 
                    }, currentPreferredMenuType);
                }
            });
        });
    } else {
        console.error("toggleFoodMenuTypeBtn elementi DOM'da bulunamadı!");
    }



    function setupToggle(checkboxId, storageKey, messageAction, reloadPageOnChange = false) {
        const checkboxElement = document.getElementById(checkboxId);
        if (!checkboxElement) return;
        chrome.storage.local.get(storageKey, data => checkboxElement.checked = !!data[storageKey]);
        checkboxElement.addEventListener("change", () => {
            const isChecked = checkboxElement.checked;
            chrome.storage.local.set({ [storageKey]: isChecked });
            if (messageAction || reloadPageOnChange) {
                chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                    if (tab?.id && tab.url?.includes("sakarya.edu.tr") && !tab.url.startsWith("chrome://")) {
                        if (reloadPageOnChange) {
                            if (checkboxId === "calculateCheckbox" && !tab.url.includes("/Ders")) return;
                            chrome.tabs.reload(tab.id);
                        } else if (messageAction) {
                            chrome.tabs.sendMessage(tab.id, { action: messageAction, state: isChecked });
                        }
                    }
                });
            }
        });
    }

    setupToggle("themeCheckbox", STORAGE_KEYS.REDMODE, "toggleRedTheme");
    setupToggle("themeDarkCheckbox", STORAGE_KEYS.DARKMODE, "toggleDarkTheme");
    setupToggle("stealthCheckbox", STORAGE_KEYS.STEALTH, null, true);
    setupToggle("calculateCheckbox", STORAGE_KEYS.CALCULATE, null, false); // Artık false
showMainContent();
    loadAndDisplayStudentInfo(); // DOMContentLoaded sonunda tekrar çağırarak son durumu al
});