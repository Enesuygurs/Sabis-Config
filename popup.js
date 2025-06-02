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

    const studentPhotoEl = document.getElementById("studentPhoto");
    const studentNameEl = document.getElementById("studentName");
    const studentDepartmentEl = document.getElementById("studentDepartment");
    const studentNumberEl = document.getElementById("studentNumber");
    const studentGNOEl = document.getElementById("studentGNO");
    const studentBalanceEl = document.getElementById("studentBalance");
    const refreshStudentInfoBtn = document.getElementById("refreshStudentInfo");
    const loadBalanceBtn = document.getElementById("loadBalanceBtn");
    const changeGradesBtn = document.getElementById("changeGrades");
    const autoFillSurveyBtn = document.getElementById("autoFillSurvey");
    const goToExamScheduleBtn = document.getElementById("goToExamSchedule");
    const checkQuestionsBtn = document.getElementById("checkQuestions");

    function displayLoadingState() {
        if (studentNameEl) studentNameEl.textContent = 'Yükleniyor...';
        if (studentDepartmentEl) studentDepartmentEl.textContent = 'Yükleniyor...';
        if (studentNumberEl) studentNumberEl.textContent = 'Yükleniyor...';
        if (studentGNOEl) studentGNOEl.textContent = 'GNO: Yükleniyor...';
        if (studentBalanceEl) studentBalanceEl.textContent = 'Yükleniyor...';
        if (studentPhotoEl) studentPhotoEl.src = 'images/icon48.png';
    }

    function updatePopupWithData(profile, gno, balance) {
        if (profile) {
            if (studentNameEl) studentNameEl.textContent = profile.name || 'N/A';
            if (studentDepartmentEl) {
                let departmentText = profile.department || 'N/A';
                if (departmentText !== 'N/A') {
                    const prIndex = departmentText.indexOf('PR');
                    if (prIndex !== -1) {
                        departmentText = departmentText.substring(0, prIndex).trim();
                    }
                }
                studentDepartmentEl.textContent = departmentText;
            }
            if (studentNumberEl) studentNumberEl.textContent = profile.number || 'N/A';
            if (studentPhotoEl) {
                studentPhotoEl.src = (profile.imageUrl && profile.imageUrl !== 'images/icon48.png') ? profile.imageUrl : 'images/icon48.png';
                studentPhotoEl.onerror = function() { this.src = 'images/icon48.png'; };
            }
        } else {
            if (studentNameEl) studentNameEl.textContent = 'Bilgi Yok';
            if (studentDepartmentEl) studentDepartmentEl.textContent = 'Veri çekilemedi';
            if (studentNumberEl) studentNumberEl.textContent = '-';
            if (studentPhotoEl) studentPhotoEl.src = 'images/icon48.png';
        }

        if (studentGNOEl) {
            if (gno && gno !== 'N/A') {
                studentGNOEl.textContent = `GNO: ${gno}`;
            } else if (profile && profile.name === "Giriş Yapılmamış") {
                 studentGNOEl.textContent = 'GNO: -';
            } else {
                studentGNOEl.textContent = 'GNO: N/A';
            }
        }

        if (studentBalanceEl) {
            if (balance && balance !== 'N/A' && !(profile && profile.name === "Giriş Yapılmamış")) {
                studentBalanceEl.textContent = balance;
            } else if (profile && profile.name === "Giriş Yapılmamış") {
                studentBalanceEl.textContent = '-';
            } else {
                studentBalanceEl.textContent = 'N/A';
            }
        }
    }

    function loadAndDisplayStudentInfo() {
        displayLoadingState();
        chrome.storage.local.get([STORAGE_KEYS.STUDENT_PROFILE, STORAGE_KEYS.STUDENT_GNO, STORAGE_KEYS.STUDENT_BALANCE], function (storedData) {
            if (chrome.runtime.lastError) { updatePopupWithData({name: "Hata", department:"Hata", number:"-", imageUrl: 'images/icon48.png'}, "Hata", "Hata"); return; }
            
            updatePopupWithData(storedData[STORAGE_KEYS.STUDENT_PROFILE], storedData[STORAGE_KEYS.STUDENT_GNO], storedData[STORAGE_KEYS.STUDENT_BALANCE]);
            
            chrome.runtime.sendMessage({ action: "fetchStudentData" }, (response) => {
                if (chrome.runtime.lastError) {
                    if (!storedData[STORAGE_KEYS.STUDENT_PROFILE] && !storedData[STORAGE_KEYS.STUDENT_GNO] && !storedData[STORAGE_KEYS.STUDENT_BALANCE]) {
                        updatePopupWithData({name: "Hata", department:"Hata", number:"-", imageUrl: 'images/icon48.png'}, "Hata", "Hata");
                    }
                    return;
                }
                if (response && response.status === "completed" && response.data) {
                    updatePopupWithData(response.data.profile, response.data.gno, response.data.balance);
                } else if (response && response.status === "error") {
                     if (!storedData[STORAGE_KEYS.STUDENT_PROFILE] && !storedData[STORAGE_KEYS.STUDENT_GNO] && !storedData[STORAGE_KEYS.STUDENT_BALANCE]) { 
                        updatePopupWithData({name: "Veri Alınamadı", department:"-", number:"-", imageUrl: 'images/icon48.png'}, "N/A", "N/A");
                    }
                } else if (response?.data?.profile?.name === "Giriş Yapılmamış"){
                    updatePopupWithData(response.data.profile, response.data.gno, response.data.balance);
                } else if (!storedData[STORAGE_KEYS.STUDENT_PROFILE] && !storedData[STORAGE_KEYS.STUDENT_GNO] && !storedData[STORAGE_KEYS.STUDENT_BALANCE]) {
                    updatePopupWithData(null, null, null);
                }
            });
        });
    }

    loadAndDisplayStudentInfo();

    if(refreshStudentInfoBtn) {
        refreshStudentInfoBtn.addEventListener("click", () => {
            displayLoadingState(); 
            chrome.runtime.sendMessage({ action: "fetchStudentData" }, (response) => {
                if (chrome.runtime.lastError) {
                    updatePopupWithData({name: "Hata", department:"Hata", number:"-", imageUrl: 'images/icon48.png'}, "Hata", "Hata");
                    return;
                }
                if (response && response.status === "completed" && response.data) {
                    updatePopupWithData(response.data.profile, response.data.gno, response.data.balance);
                } else if (response && response.status === "error") {
                    updatePopupWithData({name: "Yenilenemedi", department:"-", number:"-", imageUrl: 'images/icon48.png'}, "-", "-");
                } else if (response?.data?.profile?.name === "Giriş Yapılmamış"){
                    updatePopupWithData(response.data.profile, response.data.gno, response.data.balance);
                } else {
                    updatePopupWithData({name: "Veri Yok", department:"Veri Yok", number:"-", imageUrl: 'images/icon48.png'}, "N/A", "N/A");
                }
            });
        });
    }

    if (loadBalanceBtn) {
        loadBalanceBtn.addEventListener("click", () => {
            const cardBalancePageUrl = "https://obs.sabis.sakarya.edu.tr/Kart/Bakiye";
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                const currentTab = tabs[0];
                if (currentTab?.id && currentTab.url?.startsWith("https://obs.sabis.sakarya.edu.tr/")) {
                    chrome.tabs.update(currentTab.id, { url: cardBalancePageUrl });
                } else {
                    chrome.tabs.create({ url: cardBalancePageUrl });
                }
                window.close();
            });
        });
    }

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
                if (!tab?.id || tab.url?.startsWith("chrome://")) return;
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    args: [userNumber],
                    func: (num) => { 
                        document.querySelectorAll(".text-right > span:first-child").forEach(el => {
                            let mainTxtNode = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
                            if(mainTxtNode){
                               const gradeTxt = mainTxtNode.textContent.trim().split(" ")[0];
                               if (!isNaN(parseInt(gradeTxt)) || gradeTxt === "-" || gradeTxt.toLowerCase() === "not") mainTxtNode.textContent = `${num} `;
                            } else if (!el.querySelector("span[data-calculated-score='sub']")) {
                                if (!isNaN(parseInt(el.textContent.trim())) || el.textContent.trim() === "-" || el.textContent.trim().toLowerCase() === "not") el.textContent = num;
                            }
                        });
                        document.querySelectorAll(".text-right.font-weight-bold span").forEach(el => {
                            el.textContent = ""; el.style.setProperty("color", "green", "important"); 
                        });
                        if (typeof enableCalculateGrade === "function") enableCalculateGrade();
                        else chrome.tabs.sendMessage(tab.id, {action: "recalculateGradesAfterChange"});
                    }
                });
            });
        });
    }

    if (goToExamScheduleBtn) {
        goToExamScheduleBtn.addEventListener("click", () => {
            const examUrl = "https://obs.sabis.sakarya.edu.tr/Sinav/Takvim";
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                const tab = tabs[0];
                if (tab?.id && tab.url?.startsWith("https://obs.sabis.sakarya.edu.tr/")) chrome.tabs.update(tab.id, { url: examUrl });
                else chrome.tabs.create({ url: examUrl });
                window.close();
            });
        });
    }

    if (checkQuestionsBtn) {
        checkQuestionsBtn.addEventListener("click", () => {
            chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                if (!tab?.id || tab.url?.startsWith("chrome://")) return;
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                        const container = document.querySelector(".swal2-html-container > div");
                        if (container) {
                            container.querySelectorAll("span").forEach(span => {
                                const text = span.textContent;
                                if (text.includes("Puan:")) {
                                    const isZero = text.includes("Puan: 0");
                                    Object.assign(span.style, { background: (isZero ? "#830000" : "green"), color: "white", border: `2px solid ${isZero ? "#5d0d0d" : "#0d5f0d"}`});
                                    ["background", "color", "border"].forEach(prop => span.style.setProperty(prop, span.style[prop], "important"));
                                } else if (text.includes("Soru:")) {
                                    Object.assign(span.style, { background: "", color: "", border: "" });
                                }
                            });
                        }
                    }
                });
            });
        });
    }

    if (autoFillSurveyBtn) {
        autoFillSurveyBtn.addEventListener("click", () => {
            chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                if (!tab?.id || tab.url?.startsWith("chrome://")) return;
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                        document.querySelectorAll("table tbody tr").forEach(row => {
                            row.querySelectorAll('input[type="radio"][value="4"]').forEach(input => input.checked = true);
                        });
                        document.querySelectorAll('input[type="radio"][name*="A"]').forEach(radio => radio.checked = true);
                    }
                });
            });
        });
    }
    
     function setupToggle(checkboxId, storageKey, actionOnToggle, reloadPageOnChange = false) {
        const checkboxElement = document.getElementById(checkboxId); // ID ile al
        if (!checkboxElement) return;

        chrome.storage.local.get(storageKey, function (data) {
            checkboxElement.checked = !!data[storageKey];
        });

        checkboxElement.addEventListener("change", () => {
            const isChecked = checkboxElement.checked;
            chrome.storage.local.set({ [storageKey]: isChecked });

            if (actionOnToggle || reloadPageOnChange) {
                chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                    if (tab?.id && tab.url && !tab.url.startsWith("chrome://") && tab.url.includes("sakarya.edu.tr")) {
                        if (reloadPageOnChange) {
                            if (checkboxId === "calculateCheckbox" && !tab.url.includes("/Ders")) return;
                            chrome.tabs.reload(tab.id);
                        } else if (actionOnToggle) {
                            chrome.tabs.sendMessage(tab.id, { action: actionOnToggle, state: isChecked });
                        }
                    }
                });
            }
        });
    }

    setupToggle("themeCheckbox", STORAGE_KEYS.REDMODE, "toggleRedTheme", false);
    setupToggle("themeDarkCheckbox", STORAGE_KEYS.DARKMODE, "toggleDarkTheme", false);
    setupToggle("stealthCheckbox", STORAGE_KEYS.STEALTH, null, true);
    setupToggle("calculateCheckbox", STORAGE_KEYS.CALCULATE, null, true);
});