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

    let currentPreferredMenuType = 'normal';

    function showMainContent() {
        ELEMENTS.mainContent?.classList.remove("hidden");
        ELEMENTS.settingsContent?.classList.add("hidden");
        ELEMENTS.headerLogo?.classList.remove("hidden");
        if (ELEMENTS.headerTitle) ELEMENTS.headerTitle.textContent = "SABİS Config";
        ELEMENTS.backToMainBtnHeader?.classList.add("hidden");
        ELEMENTS.openSettingsBtn?.classList.remove("hidden");
    }

    function showSettingsContent() {
        ELEMENTS.mainContent?.classList.add("hidden");
        ELEMENTS.settingsContent?.classList.remove("hidden");
        ELEMENTS.headerLogo?.classList.add("hidden");
        if (ELEMENTS.headerTitle) ELEMENTS.headerTitle.textContent = "Ayarlar & İşlemler";
        ELEMENTS.backToMainBtnHeader?.classList.remove("hidden");
        ELEMENTS.openSettingsBtn?.classList.add("hidden");
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
        setTextContent(ELEMENTS.studentBalance, 'Yükleniyor...'); // Prefix'i renderFoodMenu'da ele alalım
        if (ELEMENTS.studentPhoto) ELEMENTS.studentPhoto.src = '../../assets/images/avatar.png';
        setTextContent(ELEMENTS.foodMenuTitle, 'Bugünün Menüsü Yükleniyor...');
        if (ELEMENTS.foodMenuList) ELEMENTS.foodMenuList.innerHTML = '<li class="placeholder">Yükleniyor...</li>';
    }

    ELEMENTS.openSettingsBtn?.addEventListener("click", showSettingsContent);
    ELEMENTS.backToMainBtnHeader?.addEventListener("click", showMainContent);

    function renderFoodMenu(foodMenuData, preferredType) {
        if (!ELEMENTS.foodMenuTitle || !ELEMENTS.foodMenuList) return;

        const defaultErrorMsg = "Menü bilgisi alınamadı.";
        const loadingMsg = "Yükleniyor...";

        if (foodMenuData) {
            let menuToDisplay = [];
            let menuTypeLabel = "Genel";

            if (preferredType === 'diet' && foodMenuData.dietMenu?.length > 0) {
                menuToDisplay = foodMenuData.dietMenu;
                menuTypeLabel = "Diyet";
            } else if (foodMenuData.normalMenu?.length > 0) {
                menuToDisplay = foodMenuData.normalMenu;
            } else if (foodMenuData.dietMenu?.length > 0) {
                menuToDisplay = foodMenuData.dietMenu;
                menuTypeLabel = "Diyet";
            }

            let menuDatePart;
            const daysOfWeek = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
            if (foodMenuData.dateLabel && !["Hata", "Yükleniyor", "bekleniyor", "alınamadı"].some(term => foodMenuData.dateLabel.includes(term))) {
                let labelParts = foodMenuData.dateLabel.split(" ").filter(part => !daysOfWeek.includes(part));
                menuDatePart = labelParts.join(" ").replace("Menüsü", "").trim();
                if (menuDatePart.endsWith(" - Genel") || menuDatePart.endsWith(" - Diyet")) {
                    menuDatePart = menuDatePart.substring(0, menuDatePart.lastIndexOf(" - ")).trim();
                }
            } else {
                menuDatePart = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
            }

            setTextContent(ELEMENTS.foodMenuTitle, `${menuDatePart} ${menuTypeLabel} Menüsü`);
            ELEMENTS.foodMenuList.innerHTML = "";

            if (foodMenuData.hasMenu && menuToDisplay.length > 0) {
                menuToDisplay.forEach(item => {
                    if (item.name && !["bekleniyor", "alınamadı"].some(term => item.name.includes(term))) {
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
            } else if (foodMenuData.normalMenu?.[0]?.name) {
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

    function updatePopupWithData(profile, gno, balance, foodMenu) {
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
                ELEMENTS.studentPhoto.src = (profile.imageUrl && profile.imageUrl !== '../../assets/images/avatar.png') ? profile.imageUrl : '../../assets/images/avatar.png';
                ELEMENTS.studentPhoto.onerror = function() { this.src = '../../assets/images/avatar.png'; };
            }
        } else {
            setProfileField(ELEMENTS.studentName, 'Bilgi Yok');
            setProfileField(ELEMENTS.studentDepartment, 'Veri çekilemedi');
            setProfileField(ELEMENTS.studentNumber, '-');
            if (ELEMENTS.studentPhoto) ELEMENTS.studentPhoto.src = '../../assets/images/avatar.png';
        }

        setTextContent(ELEMENTS.studentGNO, (profile?.name === "Giriş Yapılmamış" ? '-' : gno), 'GNO: ');
        setTextContent(ELEMENTS.studentBalance, (profile?.name === "Giriş Yapılmamış" ? '-' : balance));
        renderFoodMenu(foodMenu, currentPreferredMenuType);
    }

    function loadAndDisplayStudentInfo() {
        displayLoadingState();
        chrome.storage.local.get(Object.values(STORAGE_KEYS), (storedData) => {
            const defaultErrorProfile = { name: "Hata", department: "Hata", number: "-", imageUrl: '../../assets/images/avatar.png' };
            const defaultErrorFoodMenu = { dateLabel: "Hata", normalMenu: [{ name: "Yüklenemedi", calorie: "" }], hasMenu: false };

            if (chrome.runtime.lastError) {
                updatePopupWithData(defaultErrorProfile, "Hata", "Hata", defaultErrorFoodMenu);
                return;
            }

            currentPreferredMenuType = storedData[STORAGE_KEYS.PREFERRED_MENU_TYPE] || 'normal';
            updatePopupWithData(
                storedData[STORAGE_KEYS.STUDENT_PROFILE],
                storedData[STORAGE_KEYS.STUDENT_GNO],
                storedData[STORAGE_KEYS.STUDENT_BALANCE],
                storedData[STORAGE_KEYS.FOOD_MENU]
            );

            chrome.runtime.sendMessage({ action: "fetchStudentData" }, (response) => {
                const noCachedData = !Object.values(storedData).some(v => v && (typeof v !== 'object' || Object.keys(v).length > 0));
                if (chrome.runtime.lastError) {
                    if (noCachedData) updatePopupWithData(defaultErrorProfile, "Hata", "Hata", defaultErrorFoodMenu);
                    return;
                }

                if (response?.status === "completed" && response.data) {
                    updatePopupWithData(response.data.profile, response.data.gno, response.data.balance, response.data.foodMenu);
                } else if (response?.status === "error" && noCachedData) {
                    updatePopupWithData(
                        { name: "Veri Alınamadı", department: "-", number: "-", imageUrl: '../../assets/images/avatar.png' },
                        "N/A", "N/A",
                        { dateLabel: "Veri Alınamadı", normalMenu: [{ name: "Yüklenemedi", calorie: "" }], hasMenu: false }
                    );
                } else if (response?.data?.profile?.name === "Giriş Yapılmamış") {
                    updatePopupWithData(response.data.profile, response.data.gno, response.data.balance, response.data.foodMenu);
                } else if (noCachedData && (!response || !response.data)) { // Hiçbir veri yoksa ve response da boşsa
                    updatePopupWithData(null, null, null, null);
                }
            });
        });
    }

    ELEMENTS.refreshStudentInfoBtn?.addEventListener("click", loadAndDisplayStudentInfo);

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

    ELEMENTS.loadBalanceBtn?.addEventListener("click", () => {
        navigateSabisTabOrNew("https://obs.sabis.sakarya.edu.tr/Kart/Bakiye");
        }
    );

    ELEMENTS.goToExamScheduleBtn?.addEventListener("click", () => navigateSabisTabOrNew("https://obs.sabis.sakarya.edu.tr/Sinav/Takvim"));

    function executeScriptOnActiveSabisTab(scriptFunc, args) {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            if (tab?.id && tab.url?.includes("sakarya.edu.tr") && !tab.url?.startsWith("chrome://")) {
                 if (!tab.url.startsWith("https://obs.sabis.sakarya.edu.tr/")) {
                     // Belki kullanıcıyı OBS'ye yönlendirmek veya bir uyarı vermek iyi olabilir.
                     // Şimdilik, script sadece OBS üzerinde çalışacak şekilde bırakalım.
                     // Ya da bir uyarı gösterilebilir: alert("Bu işlem sadece SABİS OBS sayfalarında çalışır.");
                     return;
                 }
                chrome.scripting.executeScript({ target: { tabId: tab.id }, func: scriptFunc, args: args });
            } else {
                alert("Bu işlemi gerçekleştirmek için aktif bir SABİS sekmesi bulunmalıdır.");
            }
        });
    }


    ELEMENTS.changeGradesBtn?.addEventListener("click", () => {
        const userInput = prompt("Lütfen 0 ile 100 arasında bir sayı girin:", "70");
        if (userInput === null) return;
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
                else if (!el.querySelector("span[data-calculated-score='sub']") && isValidTarget) el.textContent = num.toString();
            });
            document.querySelectorAll(".text-right.font-weight-bold span").forEach(el => {
                el.textContent = "";
                el.style.setProperty("color", "green", "important");
            });
            if (typeof enableCalculateGrade === "function") enableCalculateGrade();
            else chrome.runtime.sendMessage({ action: "recalculateGradesAfterChange" });
        }, [userNumber]);
    });

    ELEMENTS.checkQuestionsBtn?.addEventListener("click", () => {
        executeScriptOnActiveSabisTab(() => {
            const container = document.querySelector(".swal2-html-container > div");
            if (container) {
                container.querySelectorAll("span").forEach(span => {
                    const text = span.textContent;
                    if (text.includes("Puan:")) {
                        const isZero = text.includes("Puan: 0");
                        Object.assign(span.style, {
                            background: (isZero ? "#830000" : "green"),
                            color: "white",
                            border: `2px solid ${isZero ? "#5d0d0d" : "#0d5f0d"}`
                        });
                        ["background", "color", "border"].forEach(prop => span.style.setProperty(prop, span.style[prop], "important"));
                    } else if (text.includes("Soru:")) {
                        Object.assign(span.style, { background: "", color: "", border: "" });
                    }
                });
            }
        });
    });

    ELEMENTS.autoFillSurveyBtn?.addEventListener("click", () => {
        executeScriptOnActiveSabisTab(() => {
            document.querySelectorAll("table tbody tr input[type='radio'][value='4']").forEach(input => input.checked = true);
            document.querySelectorAll("input[type='radio'][name*='A']").forEach(radio => radio.checked = true);
        });
    });

    ELEMENTS.toggleFoodMenuTypeBtn?.addEventListener("click", () => {
        currentPreferredMenuType = (currentPreferredMenuType === 'normal') ? 'diet' : 'normal';
        chrome.storage.local.set({ [STORAGE_KEYS.PREFERRED_MENU_TYPE]: currentPreferredMenuType }, () => {
            if (chrome.runtime.lastError) { /* Hata yönetimi */ }
        });
        chrome.storage.local.get(STORAGE_KEYS.FOOD_MENU, (data) => {
            if (chrome.runtime.lastError || !data?.[STORAGE_KEYS.FOOD_MENU]) {
                renderFoodMenu({
                    dateLabel: ELEMENTS.foodMenuTitle?.textContent || "Menü",
                    normalMenu: [], dietMenu: [], hasMenu: false
                }, currentPreferredMenuType);
                return;
            }
            renderFoodMenu(data[STORAGE_KEYS.FOOD_MENU], currentPreferredMenuType);
        });
    });

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
                            chrome.tabs.sendMessage(tab.id, { action: messageAction, state: isChecked }).catch(e => { /* Mesaj gönderme hatası*/ });
                        }
                    }
                });
            }
        });
    }

    setupToggle("themeCheckbox", STORAGE_KEYS.REDMODE, "toggleRedTheme");
    setupToggle("themeDarkCheckbox", STORAGE_KEYS.DARKMODE, "toggleDarkTheme");
    setupToggle("stealthCheckbox", STORAGE_KEYS.STEALTH, null, true);
    setupToggle("calculateCheckbox", STORAGE_KEYS.CALCULATE, null, false);

    showMainContent();
    loadAndDisplayStudentInfo();
});