const STUDENT_PROFILE_URL = "https://obs.sabis.sakarya.edu.tr/";
const TRANSCRIPT_URL = "https://obs.sabis.sakarya.edu.tr/Transkript";
const CARD_BALANCE_URL = "https://obs.sabis.sakarya.edu.tr/Kart/Bakiye";
const FOOD_MENU_API_URL = "https://menu.sabis.sakarya.edu.tr/Home/GetirGunlukMenu";
const OFFSCREEN_DOCUMENT_URL = chrome.runtime.getURL('offscreen.html');

let creatingOffscreenPromise = null;

async function hasOffscreenDocument() {
    if (typeof chrome.runtime.getContexts === 'function') {
        const contexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT'],
            documentUrls: [OFFSCREEN_DOCUMENT_URL]
        });
        return contexts.length > 0;
    }
    return false;
}

async function setupOffscreenDocument() {
    if (await hasOffscreenDocument()) return;
    if (creatingOffscreenPromise) return creatingOffscreenPromise;

    creatingOffscreenPromise = chrome.offscreen.createDocument({
        url: OFFSCREEN_DOCUMENT_URL,
        reasons: [chrome.offscreen.Reason.DOM_PARSER],
        justification: 'SABİS sayfalarından veri parse etmek.',
    });
    try {
        await creatingOffscreenPromise;
    } catch (error) {
        if (!error.message.includes("Only a single offscreen document may be created")) {
            // Beklenmeyen bir hata ise tekrar fırlat
            throw error;
        }
        // Bilinen hata ise yut, sorun değil.
    } finally {
        creatingOffscreenPromise = null;
    }
}

async function fetchAndParseData(url, parseAction, method = 'GET', body = null) {
    await setupOffscreenDocument();
    try {
        const fetchOptions = {
            method: method,
            credentials: 'include',
            headers: {
                "accept": "text/html, */*; q=0.01",
                "accept-language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
                "x-requested-with": "XMLHttpRequest"
            }
        };

        if (method === 'POST' && body) {
            fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
            fetchOptions.body = new URLSearchParams(body).toString();
        }

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            const errorStatus = response.status;
            // parseAction'a göre varsayılan hata objesi/değeri döndür
            if (parseAction === "parseFoodMenuAPIResponse") return { dateLabel: `Hata: ${errorStatus}`, normalMenu: [], dietMenu: [], hasMenu: false };
            if (parseAction === "parseHtmlForGNO" || parseAction === "parseHtmlForBalance") return 'N/A';
            return null; // Diğer durumlar için null
        }
        const htmlText = await response.text();
        return await chrome.runtime.sendMessage({
            action: parseAction,
            htmlContent: htmlText
        });

    } catch (error) {
        // parseAction'a göre varsayılan hata objesi/değeri döndür
        if (parseAction === "parseFoodMenuAPIResponse") return { dateLabel: "API Bağlantı Hatası", normalMenu: [], dietMenu: [], hasMenu: false };
        if (parseAction === "parseHtmlForGNO" || parseAction === "parseHtmlForBalance") return 'N/A';
        return null;
    }
}

async function fetchDataAndStore(storageKey, url, parseAction, defaultValue, method = 'GET', body = null) {
    try {
        let data = await fetchAndParseData(url, parseAction, method, body);

        let dataIsValid = false;
        if (data !== null && data !== undefined) { // Hem null hem undefined kontrolü
            if (typeof data === 'string') {
                dataIsValid = data !== 'N/A';
            } else if (typeof data === 'object') {
                if (storageKey === 'studentProfile') {
                    dataIsValid = (data.name !== 'N/A' && data.name !== undefined) || (data.number !== 'N/A' && data.number !== undefined);
                } else if (storageKey === 'foodMenuData') { // storageKey foodMenuData olacak
                    dataIsValid = data.hasMenu !== undefined;
                } else {
                    dataIsValid = true; // Diğer obje türleri için genel geçerlilik
                }
            }
        }

        const dataToStore = dataIsValid ? data : defaultValue;

        if (storageKey === 'studentProfile' &&
            (dataToStore.name === 'N/A' || dataToStore.name === undefined) &&
            (dataToStore.number === 'N/A' || dataToStore.number === undefined)) {
            const { studentProfile: oldProfile } = await chrome.storage.local.get('studentProfile');
            if (oldProfile?.name && oldProfile.name !== 'N/A' && oldProfile.name !== "Giriş Yapılmamış") {
                const girişYapılmamışProfile = { name: "Giriş Yapılmamış", number: "N/A", department: "N/A", imageUrl: 'images/avatar.png' };
                await chrome.storage.local.set({ [storageKey]: girişYapılmamışProfile });
                return girişYapılmamışProfile;
            }
        }
        await chrome.storage.local.set({ [storageKey]: dataToStore });
        return dataToStore;
    } catch (e) {
        await chrome.storage.local.set({ [storageKey]: defaultValue });
        return defaultValue;
    }
}

async function updateStudentData() {
    const profileDefault = { name: 'N/A', number: 'N/A', department: 'N/A', imageUrl: 'images/avatar.png' };
    const gnoDefault = 'N/A';
    const balanceDefault = 'N/A';

    const today = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const formattedDateForMenu = today.toLocaleDateString('tr-TR', options) + " Menüsü";
    // foodMenu için varsayılan değerin artık dateLabel içermemesine dikkat, o parseAction'dan geliyor.
    // Ancak parseAction hata döndürürse, dateLabel'ı biz ekleyeceğiz.
    const foodMenuParseDefault = { normalMenu: [], dietMenu: [], hasMenu: false };


    const foodMenuPayload = {
        'year': today.getFullYear(),
        'month': today.getMonth() + 1,
        'day': today.getDate()
    };

    const [profileData, gnoData, balanceData, parsedFoodMenuData] = await Promise.all([
        fetchDataAndStore('studentProfile', STUDENT_PROFILE_URL, "parseHtmlForProfile", profileDefault, 'GET'),
        fetchDataAndStore('studentGNO', TRANSCRIPT_URL, "parseHtmlForGNO", gnoDefault, 'GET'),
        fetchDataAndStore('studentBalance', CARD_BALANCE_URL, "parseHtmlForBalance", balanceDefault, 'GET'),
        fetchDataAndStore('foodMenuData', FOOD_MENU_API_URL, "parseFoodMenuAPIResponse", foodMenuParseDefault, 'POST', foodMenuPayload)
    ]);

    const finalFoodMenuData = {
        ...parsedFoodMenuData,
        dateLabel: parsedFoodMenuData?.dateLabel?.includes("Hata") || !parsedFoodMenuData?.dateLabel ? formattedDateForMenu : parsedFoodMenuData.dateLabel
    };
    await chrome.storage.local.set({ foodMenu: finalFoodMenuData });

    return { profile: profileData, gno: gnoData, balance: balanceData, foodMenu: finalFoodMenuData };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchStudentData") {
        updateStudentData()
            .then(data => sendResponse({ status: "completed", data }))
            .catch(error => {
                sendResponse({ status: "error", message: error.toString() });
            });
        return true; // Asenkron yanıt için true döndürülmeli
    }
    // Diğer mesaj türleri için de true döndürmek iyi bir pratiktir, eğer gelecekte eklenecekse.
    return true;
});