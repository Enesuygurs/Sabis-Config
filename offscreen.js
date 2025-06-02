function extractStudentInfoFromDOM(docText) {
    if (!docText) return null;
    const parser = new DOMParser();
    const doc = parser.parseFromString(docText, "text/html");
    const nameFromTopbar = doc.querySelector('.topbar .text-dark-50.font-weight-bolder.d-none.d-md-inline.mr-3');
    const nameFromProfileCard = doc.querySelector('#kt_profile_aside .card-title.font-weight-bolder');
    let studentName = "";
    if (nameFromProfileCard && nameFromProfileCard.textContent.trim()) {
        studentName = nameFromProfileCard.textContent.trim();
    } else if (nameFromTopbar && nameFromTopbar.textContent.trim()) {
        studentName = nameFromTopbar.textContent.trim().replace(/\s\s+/g, ' ');
    }
    const studentNumberEl = doc.querySelector('#kt_profile_aside .font-weight-bold.text-dark-50.font-size-sm.pb-6');
    const studentNumber = studentNumberEl ? studentNumberEl.textContent.trim() : 'N/A';
    const profileImageEl = doc.querySelector('#kt_profile_aside .symbol-label img');
    let profileImageUrl = profileImageEl ? profileImageEl.getAttribute('src') : 'images/avatar.png';
    if (profileImageUrl && profileImageUrl.startsWith('/')) {
        profileImageUrl = new URL(profileImageUrl, "https://obs.sabis.sakarya.edu.tr/").href;
    }
    const departmentLines = doc.querySelectorAll('#kt_profile_aside .pt-1 .d-flex.align-items-center.pb-1 .text-dark-65.font-weight-bold');
    let department = "";
    if (departmentLines.length >= 2) {
        if (departmentLines.length >=3 && departmentLines[2].textContent.includes("PR.")) {
           department = departmentLines[2].textContent.trim();
        } else if (departmentLines.length >=2) {
           department = departmentLines[1].textContent.trim();
        }
   }
    return {
        name: studentName || 'N/A',
        number: studentNumber,
        department: department || 'N/A',
        imageUrl: profileImageUrl || 'images/avatar.png'
    };
}

function extractGNOFromDOM(docText) {
    if (!docText) return 'N/A';
    const parser = new DOMParser();
    const doc = parser.parseFromString(docText, "text/html");
    const allTables = doc.querySelectorAll('.card-body table.table-condensed');
    let gno = 'N/A';
    if (allTables.length > 0) {
        const lastTable = allTables[allTables.length - 1];
        const tfootRows = lastTable.querySelectorAll('tfoot tr');
        if (tfootRows.length > 0) {
            const generalAverageRow = Array.from(tfootRows).find(row => {
                const firstCell = row.querySelector('td:first-child');
                return firstCell && firstCell.textContent.trim().startsWith('Genel:');
            });
            if (generalAverageRow) {
                const gnoCell = generalAverageRow.querySelector('td:last-child');
                if (gnoCell) gno = gnoCell.textContent.trim();
            }
        }
    }
    return gno;
}

function extractBalanceFromDOM(docText) {
    if (!docText) return 'N/A';
    const parser = new DOMParser();
    const doc = parser.parseFromString(docText, "text/html");
    const strongElements = doc.querySelectorAll('.card-body strong');
    let balance = 'N/A';
    strongElements.forEach(strong => {
        if (strong.textContent.trim() === "Kalan Bakiye:") {
            const balanceSpan = strong.nextElementSibling;
            if (balanceSpan && balanceSpan.tagName === 'SPAN') {
                balance = balanceSpan.textContent.trim();
            }
        }
    });
    return balance;
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === "parseHtmlForProfile") {
        const profileData = extractStudentInfoFromDOM(request.htmlContent);
        sendResponse(profileData);
    } else if (request.action === "parseHtmlForGNO") {
        const gnoData = extractGNOFromDOM(request.htmlContent);
        sendResponse(gnoData);
    } else if (request.action === "parseHtmlForBalance") {
        const balanceData = extractBalanceFromDOM(request.htmlContent);
        sendResponse(balanceData);
    }
    return true;
});