const SABIS_URL = "https://obs.sabis.sakarya.edu.tr/";

const parsers = {
    parseHtmlForProfile: (doc) => {
        const nameFromTopbar = doc.querySelector('.topbar .d-md-inline.mr-3');
        const nameFromProfileCard = doc.querySelector('#kt_profile_aside .card-title');
        const studentName = nameFromProfileCard?.textContent.trim() || nameFromTopbar?.textContent.trim().replace(/\s\s+/g, ' ') || null;

        const studentNumberEl = doc.querySelector('#kt_profile_aside .font-weight-bold.text-dark-50');
        const studentNumber = studentNumberEl?.textContent.trim() || null;

        const profileImageEl = doc.querySelector('#kt_profile_aside .symbol-label img');
        let imageUrl = profileImageEl?.getAttribute('src') || null;
        if (imageUrl?.startsWith('/')) {
            imageUrl = new URL(imageUrl, SABIS_URL).href;
        }

        const departmentLines = doc.querySelectorAll('#kt_profile_aside .d-flex.align-items-center.pb-1 .text-dark-65');
        let department = null;
        if (departmentLines.length > 1) {
            department = departmentLines[1].textContent.trim();
        }

        return {
            name: studentName,
            number: studentNumber,
            department: department,
            imageUrl: imageUrl
        };
    },

    parseHtmlForGNO: (doc) => {
        const tables = doc.querySelectorAll('.card-body table.table-condensed');
        if (tables.length === 0) return null;

        const lastTable = tables[tables.length - 1];
        const gnoRow = Array.from(lastTable.querySelectorAll('tfoot tr')).find(row =>
            row.firstElementChild?.textContent.trim().startsWith('Genel:')
        );

        return gnoRow?.lastElementChild?.textContent.trim() || null;
    },

    parseHtmlForBalance: (doc) => {
        const strongs = doc.querySelectorAll('.card-body strong');
        for (const strong of strongs) {
            if (strong.textContent.trim() === "Kalan Bakiye:") {
                return strong.nextElementSibling?.textContent.trim() || null;
            }
        }
        return null;
    },

    parseFoodMenuAPIResponse: (doc) => {
        const menuData = {
            normalMenu: [],
            dietMenu: [],
            hasMenu: false,
            dateLabel: doc.querySelector('.card-header .card-title')?.textContent.trim()
        };

        const processItems = (selector, menuArray) => {
            doc.querySelectorAll(`${selector} li.list-group-item`).forEach(item => {
                const nameFull = item.textContent.trim();
                const calorieMatch = nameFull.match(/\s-\s*(\d+)\s*kcal|\<small\>.*?(\d+)\s*kcal.*?\<\/small\>/i);
                
                let name = nameFull.split(/ <small>| - \d/)[0].trim();
                let calorie = calorieMatch ? (calorieMatch[1] || calorieMatch[2] || "0") : "0";

                if (name) menuArray.push({ name, calorie });
            });
            if (menuArray.length > 0) menuData.hasMenu = true;
        };

        processItems(".normalmenu, #normalMenuCarousel", menuData.normalMenu);
        processItems(".diyetmenu", menuData.dietMenu);

        if (!menuData.hasMenu) {
            const message = doc.body.textContent.trim();
            if (message && (message.includes("bulunmamaktadır") || message.includes("yoktur"))) {
                menuData.normalMenu.push({ name: message, calorie: "" });
            } else if (message.length < 200) {
                 menuData.normalMenu.push({ name: "Menü verisi işlenemedi.", calorie: "" });
            }
        }
        return menuData;
    }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { action, htmlContent } = request;

    if (parsers[action]) {
        if (!htmlContent) {
            sendResponse(null);
            return;
        }
        const domParser = new DOMParser();
        const doc = domParser.parseFromString(htmlContent, "text/html");
        const result = parsers[action](doc);
        sendResponse(result);
    }
    return true;
});