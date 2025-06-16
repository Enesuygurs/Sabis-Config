const STUDENT_PROFILE_URL = "https://obs.sabis.sakarya.edu.tr/";
const TRANSCRIPT_URL = "https://obs.sabis.sakarya.edu.tr/Transkript";
const CARD_BALANCE_URL = "https://obs.sabis.sakarya.edu.tr/Kart/Bakiye";
const FOOD_MENU_API_URL = "https://menu.sabis.sakarya.edu.tr/Home/GetirGunlukMenu";
const OFFSCREEN_DOCUMENT_URL = chrome.runtime.getURL('src/offscreen/offscreen.html');

let creatingOffscreenPromise = null;

async function hasOffscreenDocument() {
    if (chrome.runtime.getContexts) {
        const contexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT'],
            documentUrls: [OFFSCREEN_DOCUMENT_URL]
        });
        return contexts.length > 0;
    }
    return false;
}

async function setupOffscreenDocument() {
    if (await hasOffscreenDocument()) {
        return;
    }
    if (creatingOffscreenPromise) {
        return creatingOffscreenPromise;
    }

    creatingOffscreenPromise = chrome.offscreen.createDocument({
        url: OFFSCREEN_DOCUMENT_URL,
        reasons: [chrome.offscreen.Reason.DOM_PARSER],
        justification: 'SABİS sayfalarından veri parse etmek.',
    });
    try {
        await creatingOffscreenPromise;
    } catch (error) {
        if (!error.message.includes("Only a single offscreen document may be created")) {
            console.error("Offscreen document creation failed:", error);
            throw error;
        }
    } finally {
        creatingOffscreenPromise = null;
    }
}

async function fetchAndParseData(url, parseAction, options = {}) {
    const { method = 'GET', body = null } = options;
    await setupOffscreenDocument();

    try {
        const fetchOptions = {
            method,
            credentials: 'include',
            headers: {
                "accept": "text/html, */*; q=0.01",
                "x-requested-with": "XMLHttpRequest"
            }
        };

        if (method === 'POST' && body) {
            fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
            fetchOptions.body = new URLSearchParams(body).toString();
        }

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            if (parseAction === "parseFoodMenuAPIResponse") return { normalMenu: [], dietMenu: [], hasMenu: false };
            return parseAction === "parseHtmlForProfile" ? null : '-';
        }

        const htmlText = await response.text();
        return chrome.runtime.sendMessage({
            action: parseAction,
            htmlContent: htmlText
        });

    } catch (error) {
        console.error(`Fetch failed for ${url}:`, error);
        if (parseAction === "parseFoodMenuAPIResponse") return { normalMenu: [], dietMenu: [], hasMenu: false };
        return parseAction === "parseHtmlForProfile" ? null : '-';
    }
}

async function fetchDataAndStore(storageKey, url, parseAction, defaultValue, options = {}) {
    try {
        const data = await fetchAndParseData(url, parseAction, options);
        let dataToStore = data;

        if (data === null || data === undefined || (typeof data === 'string' && data === '-')) {
            dataToStore = defaultValue;
        } else if (storageKey === 'studentProfile' && (!data.name || data.name === '-')) {
            dataToStore = defaultValue;
        }

        if (storageKey === 'studentProfile' && (dataToStore.name === '-' || dataToStore.name === 'Giriş Yapılmamış')) {
            const { studentProfile: oldProfile } = await chrome.storage.local.get('studentProfile');
            if (oldProfile?.name && oldProfile.name !== '-' && oldProfile.name !== 'Giriş Yapılmamış') {
                const loggedOutProfile = { name: "Giriş Yapılmamış", number: "-", department: "-", imageUrl: 'assets/images/avatar.png' };
                await chrome.storage.local.set({ [storageKey]: loggedOutProfile });
                return loggedOutProfile;
            }
        }
        
        await chrome.storage.local.set({ [storageKey]: dataToStore });
        return dataToStore;
    } catch (e) {
        console.error(`Error in fetchDataAndStore for ${storageKey}:`, e);
        await chrome.storage.local.set({ [storageKey]: defaultValue });
        return defaultValue;
    }
}

async function updateStudentData() {
    const profileDefault = { name: '-', number: '-', department: '-', imageUrl: 'assets/images/avatar.png' };
    const gnoDefault = '-';
    const balanceDefault = '-';
    const foodMenuDefault = { normalMenu: [], dietMenu: [], hasMenu: false };

    const today = new Date();
    const foodMenuPayload = {
        'year': today.getFullYear(),
        'month': today.getMonth() + 1,
        'day': today.getDate()
    };

    const [profileData, gnoData, balanceData, foodMenuData] = await Promise.all([
        fetchDataAndStore('studentProfile', STUDENT_PROFILE_URL, "parseHtmlForProfile", profileDefault),
        fetchDataAndStore('studentGNO', TRANSCRIPT_URL, "parseHtmlForGNO", gnoDefault),
        fetchDataAndStore('studentBalance', CARD_BALANCE_URL, "parseHtmlForBalance", balanceDefault),
        fetchDataAndStore('foodMenu', FOOD_MENU_API_URL, "parseFoodMenuAPIResponse", foodMenuDefault, { method: 'POST', body: foodMenuPayload })
    ]);

    const formattedDateForMenu = today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    if (!foodMenuData.dateLabel) {
        foodMenuData.dateLabel = formattedDateForMenu;
    }
    await chrome.storage.local.set({ foodMenu: foodMenuData });

    return { profile: profileData, gno: gnoData, balance: balanceData, foodMenu: foodMenuData };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchStudentData") {
        updateStudentData()
            .then(data => sendResponse({ status: "completed", data }))
            .catch(error => {
                console.error("Failed to update student data:", error);
                sendResponse({ status: "error", message: error.toString() });
            });
        return true;
    }
    return true;
});