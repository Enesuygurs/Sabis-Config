document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEYS = {
        RED_MODE: "redmode_state",
        CALCULATE: "calculate_state",
        STEALTH: "stealth_state",
        DARK_MODE: "darkmode_state",
        DOWNLOAD_ALL: "downloadall_state",
        CHECK_QUESTIONS: "checkquestions_state",
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
        mainContent: document.getElementById("mainContent"),
        settingsContent: document.getElementById("settingsContent"),
        headerLogo: document.getElementById("headerLogo"),
        headerTitle: document.getElementById("headerTitle"),
        openSettingsBtn: document.getElementById("openSettingsBtn"),
        backToMainBtn: document.getElementById("backToMainBtnHeader"),
        refreshBtn: document.getElementById("refreshStudentInfo"),
        loadBalanceBtn: document.getElementById("loadBalanceBtn"),
        examScheduleBtn: document.getElementById("goToExamSchedule"),
        toggleFoodMenuBtn: document.getElementById("toggleFoodMenuTypeBtn"),
        changeGradesBtn: document.getElementById("changeGrades"),
        autoFillSurveyBtn: document.getElementById("autoFillSurvey"),
    };

    const TOGGLES = {
        theme: { id: "themeCheckbox", key: STORAGE_KEYS.RED_MODE, action: "toggleRedTheme" },
        darkTheme: { id: "themeDarkCheckbox", key: STORAGE_KEYS.DARK_MODE, action: "toggleDarkTheme" },
        stealth: { id: "stealthCheckbox", key: STORAGE_KEYS.STEALTH, reload: true },
        calculate: { id: "calculateCheckbox", key: STORAGE_KEYS.CALCULATE, reload: false },
        downloadAll: { id: "downloadAllCheckbox", key: STORAGE_KEYS.DOWNLOAD_ALL, reload: false },
        checkQuestions: { id: "checkQuestionsCheckbox", key: STORAGE_KEYS.CHECK_QUESTIONS, reload: false }
    };

    let preferredMenuType = 'normal';
    const AVATAR_PATH = '../../assets/images/avatar.png';

    const switchView = (showSettings) => {
        ELEMENTS.mainContent.classList.toggle("hidden", showSettings);
        ELEMENTS.settingsContent.classList.toggle("hidden", !showSettings);
        ELEMENTS.headerLogo.classList.toggle("hidden", showSettings);
        ELEMENTS.openSettingsBtn.classList.toggle("hidden", showSettings);
        ELEMENTS.backToMainBtn.classList.toggle("hidden", !showSettings);
        ELEMENTS.headerTitle.textContent = showSettings ? "Ayarlar & İşlemler" : "SABİS Config";
    };

    const setText = (element, text, prefix = '') => {
        if (element) {
            element.textContent = text ? `${prefix}${text}` : `${prefix}-`;
        }
    };

    const displayLoadingState = () => {
        setText(ELEMENTS.studentName, 'Yükleniyor...');
        setText(ELEMENTS.studentDepartment, 'Yükleniyor...');
        setText(ELEMENTS.studentNumber, 'Yükleniyor...');
        setText(ELEMENTS.studentGNO, 'Yükleniyor...', 'GNO: ');
        setText(ELEMENTS.studentBalance, 'Yükleniyor...');
        if (ELEMENTS.studentPhoto) ELEMENTS.studentPhoto.src = AVATAR_PATH;
        setText(ELEMENTS.foodMenuTitle, 'Bugünün Menüsü Yükleniyor...');
        if (ELEMENTS.foodMenuList) ELEMENTS.foodMenuList.innerHTML = '<li class="placeholder">Yükleniyor...</li>';
    };

    const renderFoodMenu = (foodMenuData, type) => {
        if (!ELEMENTS.foodMenuTitle || !ELEMENTS.foodMenuList) return;

        const defaultErrorMsg = "Menü bilgisi alınamadı.";
        const menuData = foodMenuData || { hasMenu: false };
        let menuToDisplay = [];
        let menuTypeLabel = "Genel";

        if (type === 'diet' && menuData.dietMenu?.length > 0) {
            menuToDisplay = menuData.dietMenu;
            menuTypeLabel = "Diyet";
        } else {
            menuToDisplay = menuData.normalMenu || [];
        }

        const menuDate = menuData.dateLabel || new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
        setText(ELEMENTS.foodMenuTitle, `${menuDate.replace("Menüsü", "").trim()} ${menuTypeLabel} Menüsü`);
        ELEMENTS.foodMenuList.innerHTML = "";

        if (menuData.hasMenu && menuToDisplay.length > 0) {
            menuToDisplay.forEach(item => {
                if (item.name) {
                    const li = document.createElement("li");
                    li.textContent = item.name;
                    if (item.calorie && item.calorie !== "0") {
                        const calorieSpan = document.createElement("span");
                        calorieSpan.className = "food-calorie";
                        calorieSpan.textContent = `(${item.calorie} kcal)`;
                        li.appendChild(calorieSpan);
                    }
                    ELEMENTS.foodMenuList.appendChild(li);
                }
            });
            if (ELEMENTS.foodMenuList.children.length === 0) {
                ELEMENTS.foodMenuList.innerHTML = `<li class="placeholder">Bu menü tipi için bugün yemek yok.</li>`;
            }
        } else {
            ELEMENTS.foodMenuList.innerHTML = `<li class="placeholder">${menuData.normalMenu?.[0]?.name || defaultErrorMsg}</li>`;
        }
    };

    const updatePopupUI = (data = {}) => {
        const { profile, gno, balance, foodMenu } = data;
        
        if (profile) {
            setText(ELEMENTS.studentName, profile.name);
            const departmentText = profile.department?.split('PR.')[0].trim() || '-';
            setText(ELEMENTS.studentDepartment, departmentText);
            setText(ELEMENTS.studentNumber, profile.number);
            ELEMENTS.studentPhoto.src = profile.imageUrl || AVATAR_PATH;
            ELEMENTS.studentPhoto.onerror = () => { ELEMENTS.studentPhoto.src = AVATAR_PATH; };
        }

        const isLoggedOut = profile?.name === "Giriş Yapılmamış";
        setText(ELEMENTS.studentGNO, isLoggedOut ? '-' : gno, 'GNO: ');
        setText(ELEMENTS.studentBalance, isLoggedOut ? '-' : balance);
        renderFoodMenu(foodMenu, preferredMenuType);
    };

    const loadAndDisplayData = async () => {
        displayLoadingState();
        try {
            const storedData = await chrome.storage.local.get(Object.values(STORAGE_KEYS));
            preferredMenuType = storedData[STORAGE_KEYS.PREFERRED_MENU_TYPE] || 'normal';
            updatePopupUI({
                profile: storedData[STORAGE_KEYS.STUDENT_PROFILE],
                gno: storedData[STORAGE_KEYS.STUDENT_GNO],
                balance: storedData[STORAGE_KEYS.STUDENT_BALANCE],
                foodMenu: storedData[STORAGE_KEYS.FOOD_MENU]
            });

            const response = await chrome.runtime.sendMessage({ action: "fetchStudentData" });
            if (response?.status === "completed" && response.data) {
                updatePopupUI(response.data);
            }
        } catch (error) {
            console.error("Failed to load or fetch data:", error);
            updatePopupUI();
        }
    };

    const navigateSabisTabOrNew = (url) => {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            if (tab?.url?.startsWith("https://obs.sabis.sakarya.edu.tr/")) {
                chrome.tabs.update(tab.id, { url });
            } else {
                chrome.tabs.create({ url });
            }
            window.close();
        });
    };
    
    const executeOnSabisTab = (func, args) => {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            if (tab?.url?.startsWith("https://obs.sabis.sakarya.edu.tr/")) {
                chrome.scripting.executeScript({ target: { tabId: tab.id }, func, args });
            } else {
                alert("Bu işlem sadece SABİS OBS sayfalarında çalışır.");
            }
        });
    };

    const setupEventListeners = () => {
        ELEMENTS.openSettingsBtn?.addEventListener("click", () => switchView(true));
        ELEMENTS.backToMainBtn?.addEventListener("click", () => switchView(false));
        ELEMENTS.refreshBtn?.addEventListener("click", loadAndDisplayData);
        ELEMENTS.loadBalanceBtn?.addEventListener("click", () => navigateSabisTabOrNew("https://obs.sabis.sakarya.edu.tr/Kart/Bakiye"));
        ELEMENTS.examScheduleBtn?.addEventListener("click", () => navigateSabisTabOrNew("https://obs.sabis.sakarya.edu.tr/Sinav/Takvim"));

        ELEMENTS.toggleFoodMenuBtn?.addEventListener("click", async () => {
            preferredMenuType = (preferredMenuType === 'normal') ? 'diet' : 'normal';
            await chrome.storage.local.set({ [STORAGE_KEYS.PREFERRED_MENU_TYPE]: preferredMenuType });
            const { [STORAGE_KEYS.FOOD_MENU]: foodMenu } = await chrome.storage.local.get(STORAGE_KEYS.FOOD_MENU);
            renderFoodMenu(foodMenu, preferredMenuType);
        });

        ELEMENTS.changeGradesBtn?.addEventListener("click", () => {
            const input = prompt("Tüm notları değiştirmek için bir sayı girin (0-100):", "70");
            if (input === null) return;
            const number = parseInt(input);
            if (isNaN(number) || number < 0 || number > 100) {
                alert("Geçerli bir sayı girmelisiniz.");
                return;
            }
            executeOnSabisTab((num) => {
                document.querySelectorAll(".card-body table td:nth-child(4) > span:first-child, .card-body table td:nth-child(3) > span:first-child").forEach(span => {
                    if (span.closest('td').classList.contains('font-weight-bold')) return;
                    let textNode = Array.from(span.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
                    if (textNode) textNode.textContent = num.toString();
                    else span.textContent = num.toString();
                });
                chrome.runtime.sendMessage({ action: "recalculateGradesAfterChange" });
            }, [number]);
        });
        
        ELEMENTS.autoFillSurveyBtn?.addEventListener("click", () => {
            executeOnSabisTab(() => {
                document.querySelectorAll("input[type='radio'][value='4']").forEach(r => {
                    r.checked = true;
                    r.dispatchEvent(new Event('change', { bubbles: true }));
                });
            });
        });


        Object.values(TOGGLES).forEach(toggle => {
            const checkbox = document.getElementById(toggle.id);
            if (!checkbox) return;

            chrome.storage.local.get(toggle.key, data => { checkbox.checked = !!data[toggle.key]; });

            checkbox.addEventListener("change", () => {
                const isChecked = checkbox.checked;
                chrome.storage.local.set({ [toggle.key]: isChecked });

                chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                    if (tab?.url?.startsWith("https://obs.sabis.sakarya.edu.tr/") || tab?.url?.startsWith("https://menu.sabis.sakarya.edu.tr/")) {
                        if (toggle.reload) {
                            chrome.tabs.reload(tab.id);
                        } else if (toggle.action) {
                            chrome.tabs.sendMessage(tab.id, { action: toggle.action, state: isChecked }).catch(e => console.error(e));
                        }
                    }
                });
            });
        });
    };

    const init = () => {
        setupEventListeners();
        switchView(false);
        loadAndDisplayData();
    };

    init();
});