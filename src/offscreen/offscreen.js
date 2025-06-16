function extractStudentInfoFromDOM(docText) {
    if (!docText) return null;
    const parser = new DOMParser();
    const doc = parser.parseFromString(docText, "text/html");

    const nameFromTopbar = doc.querySelector('.topbar .d-md-inline.mr-3');
    const nameFromProfileCard = doc.querySelector('#kt_profile_aside .card-title.font-weight-bolder');
    const studentName = nameFromProfileCard?.textContent.trim() || nameFromTopbar?.textContent.trim().replace(/\s\s+/g, ' ') || '-';

    const studentNumberEl = doc.querySelector('#kt_profile_aside .font-weight-bold.text-dark-50.font-size-sm.pb-6');
    const studentNumber = studentNumberEl?.textContent.trim() || '-';

    const profileImageEl = doc.querySelector('#kt_profile_aside .symbol-label img');
    let profileImageUrl = profileImageEl?.getAttribute('src') || 'images/avatar.png';
    if (profileImageUrl.startsWith('/')) {
        profileImageUrl = new URL(profileImageUrl, "https://obs.sabis.sakarya.edu.tr/").href;
    }

    const departmentLines = doc.querySelectorAll('#kt_profile_aside .pt-1 .d-flex.align-items-center.pb-1 .text-dark-65.font-weight-bold');
    let department = '-';
    if (departmentLines.length >= 3 && departmentLines[2]?.textContent.includes("PR.")) {
        department = departmentLines[2].textContent.trim();
    } else if (departmentLines.length >= 2) {
        department = departmentLines[1]?.textContent.trim() || '-';
    }

    return {
        name: studentName,
        number: studentNumber,
        department: department,
        imageUrl: profileImageUrl
    };
}

function extractGNOFromDOM(docText) {
    if (!docText) return '-';
    const parser = new DOMParser();
    const doc = parser.parseFromString(docText, "text/html");
    const allTables = doc.querySelectorAll('.card-body table.table-condensed');
    if (allTables.length === 0) return '-';

    const lastTable = allTables[allTables.length - 1];
    const tfootRows = lastTable.querySelectorAll('tfoot tr');
    const generalAverageRow = Array.from(tfootRows).find(row =>
        row.querySelector('td:first-child')?.textContent.trim().startsWith('Genel:')
    );

    return generalAverageRow?.querySelector('td:last-child')?.textContent.trim() || '-';
}

function extractBalanceFromDOM(docText) {
    if (!docText) return '-';
    const parser = new DOMParser();
    const doc = parser.parseFromString(docText, "text/html");
    const strongElements = doc.querySelectorAll('.card-body strong');
    
    for (const strong of strongElements) {
        if (strong.textContent.trim() === "Kalan Bakiye:") {
            const balanceSpan = strong.nextElementSibling;
            if (balanceSpan?.tagName === 'SPAN') {
                return balanceSpan.textContent.trim();
            }
        }
    }
    return '-';
}

function extractFoodMenuFromAPIResponse(htmlText) {
    if (!htmlText) return { normalMenu: [], dietMenu: [], hasMenu: false };

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");

    const menuData = {
        normalMenu: [],
        dietMenu: [],
        hasMenu: false
    };

    const processMenuItems = (containerSelector, menuArray) => {
        const menuContainer = doc.querySelector(containerSelector);
        if (menuContainer) {
            menuContainer.querySelectorAll("li.list-group-item").forEach(item => {
                const foodNameFull = item.textContent.trim();
                let foodName = foodNameFull.split(" <small")[0].trim();
                const calorieSmall = item.querySelector("small");
                let calorieText = "0";

                if (calorieSmall) {
                    calorieText = calorieSmall.textContent.replace(/\D/g, '');
                } else {
                    const calorieMatch = foodNameFull.match(/\s-\s*(\d+)\s*kcal/i);
                    if (calorieMatch?.[1]) {
                        calorieText = calorieMatch[1];
                        foodName = foodNameFull.substring(0, foodNameFull.indexOf(calorieMatch[0])).trim();
                    }
                }
                if (foodName) menuArray.push({ name: foodName, calorie: calorieText });
            });
            if (menuArray.length > 0) menuData.hasMenu = true;
        }
    };

    processMenuItems(".normalmenu .list-group, #normalMenuCarousel .list-group", menuData.normalMenu);
    processMenuItems(".diyetmenu .list-group", menuData.dietMenu);

    if (!menuData.hasMenu && doc.body) {
        const message = doc.body.textContent.trim();
        if (message.includes("bulunmamaktadır") || message.includes("yoktur")) {
            menuData.normalMenu.push({ name: message, calorie: "" });
        } else if (menuData.normalMenu.length === 0 && menuData.dietMenu.length === 0) {
            if (message.length < 200) {
                menuData.normalMenu.push({ name: "Menü verisi işlenemedi.", calorie: "" });
            }
        }
    }
    return menuData;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const parsers = {
        "parseHtmlForProfile": extractStudentInfoFromDOM,
        "parseHtmlForGNO": extractGNOFromDOM,
        "parseHtmlForBalance": extractBalanceFromDOM,
        "parseFoodMenuAPIResponse": extractFoodMenuFromAPIResponse
    };
    
    if (parsers[request.action]) {
        const result = parsers[request.action](request.htmlContent);
        sendResponse(result);
    }
    
    return true;
});