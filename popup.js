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

    const EL = {
        changeGradesBtn: document.getElementById("changeGrades"),
        stealthCheckbox: document.getElementById("stealthCheckbox"),
        calculateCheckbox: document.getElementById("calculateCheckbox"),
        themeDarkCheckbox: document.getElementById("themeDarkCheckbox"),
        themeCheckbox: document.getElementById("themeCheckbox"),
        checkQuestionsBtn: document.getElementById("checkQuestions"),
        goToExamScheduleBtn: document.getElementById("goToExamSchedule"),
        autoFillSurveyBtn: document.getElementById("autoFillSurvey"),
        studentBalanceEl: document.getElementById("studentBalance"),
        studentPhotoEl: document.getElementById("studentPhoto"),
        studentNameEl: document.getElementById("studentName"),
        studentDepartmentEl: document.getElementById("studentDepartment"),
        studentNumberEl: document.getElementById("studentNumber"),
        studentGNOEl: document.getElementById("studentGNO"),
        refreshStudentInfoBtn: document.getElementById("refreshStudentInfo"),
        loadBalanceBtn: document.getElementById("loadBalanceBtn")
    };

    function displayLoadingState() {
        if (EL.studentNameEl) EL.studentNameEl.textContent = 'Yükleniyor...';
        if (EL.studentDepartmentEl) EL.studentDepartmentEl.textContent = 'Yükleniyor...';
        if (EL.studentNumberEl) EL.studentNumberEl.textContent = 'Yükleniyor...';
        if (EL.studentGNOEl) EL.studentGNOEl.textContent = 'GNO: Yükleniyor...';
        if (EL.studentBalanceEl) EL.studentBalanceEl.textContent = 'Yükleniyor...';
        if (EL.studentPhotoEl) EL.studentPhotoEl.src = 'images/icon48.png';
    }

    function updatePopupWithData(profile, gno, balance) {
        if (profile) {
            if (EL.studentNameEl) EL.studentNameEl.textContent = profile.name || 'N/A';
            if (EL.studentDepartmentEl) {
                let departmentText = profile.department || 'N/A';
                if (departmentText !== 'N/A') {
                    const prIndex = departmentText.indexOf('PR');
                    if (prIndex !== -1) {
                        departmentText = departmentText.substring(0, prIndex).trim();
                    }
                }
                EL.studentDepartmentEl.textContent = departmentText;
            }
            if (EL.studentNumberEl) EL.studentNumberEl.textContent = profile.number || 'N/A';
            if (EL.studentPhotoEl) {
                EL.studentPhotoEl.src = (profile.imageUrl && profile.imageUrl !== 'images/icon48.png') ? profile.imageUrl : 'images/icon48.png';
                EL.studentPhotoEl.onerror = function() { this.src = 'images/icon48.png'; };
            }
        } else {
            if (EL.studentNameEl) EL.studentNameEl.textContent = 'Bilgi Yok';
            if (EL.studentDepartmentEl) EL.studentDepartmentEl.textContent = 'Veri çekilemedi';
            if (EL.studentNumberEl) EL.studentNumberEl.textContent = '-';
            if (EL.studentPhotoEl) EL.studentPhotoEl.src = 'images/icon48.png';
        }

        if (EL.studentGNOEl) {
            if (gno && gno !== 'N/A') {
                EL.studentGNOEl.textContent = `GNO: ${gno}`;
            } else if (profile && profile.name === "Giriş Yapılmamış") {
                 EL.studentGNOEl.textContent = 'GNO: -';
            } else {
                EL.studentGNOEl.textContent = 'GNO: N/A';
            }
        }

        if (EL.studentBalanceEl) {
            if (balance && balance !== 'N/A' && !(profile && profile.name === "Giriş Yapılmamış")) {
                EL.studentBalanceEl.textContent = balance;
            } else if (profile && profile.name === "Giriş Yapılmamış") {
                EL.studentBalanceEl.textContent = '-';
            } else {
                EL.studentBalanceEl.textContent = 'N/A';
            }
        }
    }

    function loadAndDisplayStudentInfo() {
        displayLoadingState();
        chrome.storage.local.get([STORAGE_KEYS.STUDENT_PROFILE, STORAGE_KEYS.STUDENT_GNO, STORAGE_KEYS.STUDENT_BALANCE], function (storedData) {
            if (chrome.runtime.lastError) return;
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
                } else if (response && response.data && response.data.profile && response.data.profile.name === "Giriş Yapılmamış"){
                    updatePopupWithData(response.data.profile, response.data.gno, response.data.balance);
                } else if (!storedData[STORAGE_KEYS.STUDENT_PROFILE] && !storedData[STORAGE_KEYS.STUDENT_GNO] && !storedData[STORAGE_KEYS.STUDENT_BALANCE]) {
                    updatePopupWithData(null, null, null);
                }
            });
        });
    }

    loadAndDisplayStudentInfo();

    if(EL.refreshStudentInfoBtn) {
        EL.refreshStudentInfoBtn.addEventListener("click", () => {
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
                } else if (response && response.data && response.data.profile && response.data.profile.name === "Giriş Yapılmamış"){
                    updatePopupWithData(response.data.profile, response.data.gno, response.data.balance);
                } else {
                    updatePopupWithData({name: "Veri Yok", department:"Veri Yok", number:"-", imageUrl: 'images/icon48.png'}, "N/A", "N/A");
                }
            });
        });
    }

    if (EL.loadBalanceBtn) {
        EL.loadBalanceBtn.addEventListener("click", () => {
            const cardBalancePageUrl = "https://obs.sabis.sakarya.edu.tr/Kart/Bakiye";
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                const currentTab = tabs[0];
                if (currentTab && currentTab.id && currentTab.url && currentTab.url.startsWith("https://obs.sabis.sakarya.edu.tr/")) {
                    chrome.tabs.update(currentTab.id, { url: cardBalancePageUrl });
                } else {
                    chrome.tabs.create({ url: cardBalancePageUrl });
                }
                window.close();
            });
        });
    }

    if (EL.changeGradesBtn) {
        EL.changeGradesBtn.addEventListener("click", () => {
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
                    func: (userNum) => { 
                        document.querySelectorAll(".text-right > span:first-child").forEach((element) => {
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
                                   mainTextNode.textContent = userNum.toString() + " ";
                               }
                            } else if (!element.querySelector("span[data-calculated-score='sub']")) {
                                if (!isNaN(parseInt(element.textContent.trim())) || element.textContent.trim() === "-" || element.textContent.trim().toLowerCase() === "not") {
                                   element.textContent = userNum;
                                }
                            }
                        });
                        document.querySelectorAll(".text-right.font-weight-bold span").forEach((element) => {
                            element.textContent = ""; 
                            element.style.setProperty("color", "green", "important"); 
                        });
                        if (typeof enableCalculateGrade === "function") {
                            enableCalculateGrade();
                        } else {
                            chrome.tabs.sendMessage(tab.id, {action: "recalculateGradesAfterChange"});
                        }
                    },
                });
            });
        });
    }

    if (EL.goToExamScheduleBtn) {
        EL.goToExamScheduleBtn.addEventListener("click", () => {
            const examScheduleUrl = "https://obs.sabis.sakarya.edu.tr/Sinav/Takvim";
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                const currentTab = tabs[0];
                if (currentTab && currentTab.id && currentTab.url && currentTab.url.startsWith("https://obs.sabis.sakarya.edu.tr/")) {
                    chrome.tabs.update(currentTab.id, { url: examScheduleUrl });
                } else {
                    chrome.tabs.create({ url: examScheduleUrl });
                }
                window.close();
            });
        });
    }

    if (EL.checkQuestionsBtn) {
        EL.checkQuestionsBtn.addEventListener("click", () => {
            chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                if (!tab?.id || !tab.url || tab.url.startsWith("chrome://")) return;
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                        const container = document.querySelector(".swal2-html-container > div");
                        if (container) {
                            container.querySelectorAll("span").forEach(spanElement => {
                                const text = spanElement.textContent;
                                if (text.includes("Puan:")) {
                                    const isZero = text.includes("Puan: 0");
                                    spanElement.style.setProperty("background", isZero ? "#830000" : "green", "important");
                                    spanElement.style.setProperty("color", "white", "important");
                                    spanElement.style.setProperty("border", `2px solid ${isZero ? "#5d0d0d" : "#0d5f0d"}`, "important");
                                } else if (text.includes("Soru:")) {
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

    if (EL.autoFillSurveyBtn) {
        EL.autoFillSurveyBtn.addEventListener("click", () => {
            chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                if (!tab?.id || !tab.url || tab.url.startsWith("chrome://")) return;
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
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
    
    function setupToggle(checkboxId, storageKey, reloadOnChange = true, removeFunc) {
        const checkbox = EL[checkboxId];
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
                        if (removeFunc && !isChecked) {
                            removeFunc(tab.id);
                        } else {
                            if (checkboxId === "calculateCheckbox" && !tab.url.includes("/Ders")) {
                                return;
                            }
                            chrome.tabs.reload(tab.id);
                        }
                    }
                });
            }
        });
    }

    const removeTheme = (tabId) => chrome.scripting.executeScript({ target: { tabId }, func: () => document.getElementById("redmode")?.remove() });
    const removeDarkTheme = (tabId) => chrome.scripting.executeScript({ target: { tabId }, func: () => document.getElementById("darkmode")?.remove() });

    setupToggle("stealthCheckbox", STORAGE_KEYS.STEALTH);
    setupToggle("calculateCheckbox", STORAGE_KEYS.CALCULATE);
    setupToggle("themeCheckbox", STORAGE_KEYS.REDMODE, true, removeTheme);
    setupToggle("themeDarkCheckbox", STORAGE_KEYS.DARKMODE, true, removeDarkTheme);
});