document.addEventListener("DOMContentLoaded", function () {
    const STORAGE_KEYS = {
        REDMODE: "redmode_state",
        CALCULATE: "calculate_state",
        STEALTH: "stealth_state",
        DARKMODE: "darkmode_state",
        STUDENT_PROFILE: "studentProfile",
        STUDENT_GNO: "studentGNO",
        STUDENT_BALANCE: "studentBalance"
    };

    const ELEMENTS = {
        studentPhoto: document.getElementById("studentPhoto"),
        studentName: document.getElementById("studentName"),
        studentDepartment: document.getElementById("studentDepartment"),
        studentNumber: document.getElementById("studentNumber"),
        studentGNO: document.getElementById("studentGNO"),
        studentBalance: document.getElementById("studentBalance"),
        refreshStudentInfoBtn: document.getElementById("refreshStudentInfo"),
        loadBalanceBtn: document.getElementById("loadBalanceBtn"),
        changeGradesBtn: document.getElementById("changeGrades"),
        autoFillSurveyBtn: document.getElementById("autoFillSurvey"),
        goToExamScheduleBtn: document.getElementById("goToExamSchedule"),
        checkQuestionsBtn: document.getElementById("checkQuestions"),
        themeCheckbox: document.getElementById("themeCheckbox"),
        themeDarkCheckbox: document.getElementById("themeDarkCheckbox"),
        stealthCheckbox: document.getElementById("stealthCheckbox"),
        calculateCheckbox: document.getElementById("calculateCheckbox")
    };

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
        setTextContent(ELEMENTS.studentBalance, 'Yükleniyor...');
        if (ELEMENTS.studentPhoto) ELEMENTS.studentPhoto.src = 'images/avatar.png';
    }

    function updatePopupWithData(profile, gno, balance) {
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
        } else {
            setProfileField(ELEMENTS.studentName, 'Bilgi Yok');
            setProfileField(ELEMENTS.studentDepartment, 'Veri çekilemedi');
            setProfileField(ELEMENTS.studentNumber, '-');
            if (ELEMENTS.studentPhoto) ELEMENTS.studentPhoto.src = 'images/avatar.png';
        }

        setTextContent(ELEMENTS.studentGNO, (profile?.name === "Giriş Yapılmamış" ? '-' : gno), 'GNO: ');
        setTextContent(ELEMENTS.studentBalance, (profile?.name === "Giriş Yapılmamış" ? '-' : balance));
    }

    function loadAndDisplayStudentInfo() {
        displayLoadingState();
        chrome.storage.local.get(Object.values(STORAGE_KEYS), (storedData) => {
            if (chrome.runtime.lastError) { updatePopupWithData({name: "Hata", department:"Hata", number:"-", imageUrl: 'images/avatar.png'}, "Hata", "Hata"); return; }
            updatePopupWithData(storedData[STORAGE_KEYS.STUDENT_PROFILE], storedData[STORAGE_KEYS.STUDENT_GNO], storedData[STORAGE_KEYS.STUDENT_BALANCE]);
            
            chrome.runtime.sendMessage({ action: "fetchStudentData" }, (response) => {
                if (chrome.runtime.lastError) {
                    if (!storedData[STORAGE_KEYS.STUDENT_PROFILE] && !storedData[STORAGE_KEYS.STUDENT_GNO] && !storedData[STORAGE_KEYS.STUDENT_BALANCE]) {
                        updatePopupWithData({name: "Hata", department:"Hata", number:"-", imageUrl: 'images/avatar.png'}, "Hata", "Hata");
                    }
                    return;
                }
                if (response?.status === "completed" && response.data) {
                    updatePopupWithData(response.data.profile, response.data.gno, response.data.balance);
                } else if (response?.status === "error" && !Object.values(storedData).some(v => v)) {
                    updatePopupWithData({name: "Veri Alınamadı", department:"-", number:"-", imageUrl: 'images/avatar.png'}, "N/A", "N/A");
                } else if (response?.data?.profile?.name === "Giriş Yapılmamış"){
                    updatePopupWithData(response.data.profile, response.data.gno, response.data.balance);
                } else if (!Object.values(storedData).some(v => v)) {
                    updatePopupWithData(null, null, null);
                }
            });
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

    loadAndDisplayStudentInfo(); // DOMContentLoaded sonunda tekrar çağırarak son durumu al
});