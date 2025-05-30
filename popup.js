document.addEventListener("DOMContentLoaded", function () {
  const STORAGE_KEY = "redmode_state";
  const STORAGE_KEY_CALCULATE = "calculate_state";
  const STORAGE_KEY_STEALTH = "stealth_state";
  const STORAGE_KEY_DARKMODE = "darkmode_state";
  const changeGrades = document.getElementById("changeGrades");
  const stealthCheckbox = document.getElementById("stealthCheckbox");
  const calculateCheckbox = document.getElementById("calculateCheckbox");
  const themeDarkCheckbox = document.getElementById("themeDarkCheckbox");
  const themeCheckbox = document.getElementById("themeCheckbox");
  const checkQuestions = document.getElementById("checkQuestions");
  const autoFillSurvey = document.getElementById("autoFillSurvey");

  // Change Grades
  changeGrades.addEventListener("click", () => {
    const userInput = prompt("Lütfen 0 ile 100 arasında bir sayı girin:");
    const userNumber = parseInt(userInput);

    if (isNaN(userNumber) || userNumber < 0 || userNumber > 100) {
      alert("Geçerli bir sayı giriniz! (0-100)");
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const tab = tabs[0];
      if (tab.url && tab.url.startsWith("chrome://")) return;

      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        args: [userNumber], // Kullanıcının girdisini fonksiyona gönderiyoruz
        function: (userNumber) => {
          const textRightElements = document.querySelectorAll(".text-right > span");
          textRightElements.forEach((element) => {
            let number = parseInt(element.textContent.trim());
            if (!isNaN(number)) {
              element.textContent = userNumber; // Kullanıcının girdisi buraya yazılıyor
            }
          });

          // Eğer kullanıcı 100 girdiyse "AA" yazılsın, diğer durumlarda değiştirilmesin
          const textRightElementss = document.querySelectorAll(".text-right.font-weight-bold span");
          textRightElementss.forEach((element) => {
            element.textContent = "";
            element.style.setProperty("color", "green", "important");
          });
        },
      });
    });
  });

  // Check Questions
  checkQuestions.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.url || tab.url.startsWith("chrome://")) return;

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

  // Auto Fill Survey
  autoFillSurvey.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.url || tab.url.startsWith("chrome://")) return;

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

  // ? ---------------------------
  // ? Toggle Buttons
  // ? ---------------------------

  // Stealth Mode
  chrome.storage.local.get(STORAGE_KEY_STEALTH, function (data) {
    stealthCheckbox.checked = data[STORAGE_KEY_STEALTH];
  });

  stealthCheckbox.addEventListener("change", () => {
    chrome.storage.local.set({ [STORAGE_KEY_STEALTH]: stealthCheckbox.checked });

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.url.startsWith("chrome://")) return;
      chrome.tabs.reload(tab.id);
    });
  });

  // Calculate Grades
  chrome.storage.local.get(STORAGE_KEY_CALCULATE, function (data) {
    calculateCheckbox.checked = data[STORAGE_KEY_CALCULATE];
  });

  calculateCheckbox.addEventListener("change", function () {
    const isChecked = calculateCheckbox.checked;
    chrome.storage.local.set({ [STORAGE_KEY_CALCULATE]: isChecked });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      const targetUrl = "https://obs.sabis.sakarya.edu.tr/Ders";

      if (!currentTab.url.startsWith(targetUrl)) return;

      if (isChecked) {
        // Calculate grades if the checkbox is checked
        chrome.runtime.sendMessage({ action: "calculateGrades" });
      } else {
        // Remove calculated grades if the checkbox is unchecked
        chrome.runtime.sendMessage({ action: "removeCalculatedGrades" });
      }
    });
  });

  // Red Theme
  chrome.storage.local.get(STORAGE_KEY, function (data) {
    themeCheckbox.checked = data[STORAGE_KEY];
  });

  themeCheckbox.addEventListener("change", () => {
    const isChecked = themeCheckbox.checked;
    chrome.storage.local.set({ [STORAGE_KEY]: isChecked });

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab || tab.url.startsWith("chrome://")) return;
      isChecked ? chrome.tabs.reload(tab.id) : removeTheme(tab.id);
    });
  });

  function removeTheme(tabId) {
    chrome.scripting.executeScript({
      target: { tabId },
      function: () => document.getElementById("redmode")?.remove(),
    });
  }

  // Dark Theme
  chrome.storage.local.get(STORAGE_KEY_DARKMODE, function (data) {
    themeDarkCheckbox.checked = data[STORAGE_KEY_DARKMODE];
  });

  themeDarkCheckbox.addEventListener("change", () => {
    const isChecked = themeDarkCheckbox.checked;
    chrome.storage.local.set({ [STORAGE_KEY_DARKMODE]: isChecked });

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab || tab.url.startsWith("chrome://")) return;
      isChecked ? chrome.tabs.reload(tab.id) : removeDarkTheme(tab.id);
    });
  });

  function removeDarkTheme(tabId) {
    chrome.scripting.executeScript({
      target: { tabId },
      function: () => document.getElementById("darkmode")?.remove(),
    });
  }
});
