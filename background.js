chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "calculateGrades") calculateGrades();
  else if (message.action === "removeCalculatedGrades") removeCalculatedGrades();
});

function calculateGrades() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    const targetUrl = "https://obs.sabis.sakarya.edu.tr/Ders";

    if (currentTab.url.startsWith(targetUrl)) {
      chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        function: () => {
          const cardBodies = document.querySelectorAll(".card-body");

          function formatDecimal(number) {
            let formatted = number.toFixed(10).replace(/\.?0+$/, "");
            if (!formatted.includes(".")) {
              formatted += ".00";
            } else if (formatted.split(".")[1].length === 1) {
              formatted += "0";
            }
            return formatted;
          }

          cardBodies.forEach((cardBody) => {
            const rows = cardBody.querySelectorAll("tbody tr");

            let toplamPuan = 0;
            let butunlemeVar = false;

            rows.forEach((row) => {
              const oranCell = row.querySelector("td:nth-child(1)");
              const notCell = row.querySelector("td:nth-child(3) span");
              const calismaTipi = row.querySelector("td:nth-child(2)").textContent;

              if (calismaTipi.includes("Bütünleme")) {
                butunlemeVar = true;
              }

              if (oranCell && notCell && !isNaN(parseFloat(oranCell.textContent)) && !isNaN(parseFloat(notCell.textContent))) {
                const oran = parseFloat(oranCell.innerText.replace(",", "."));
                const not = parseFloat(notCell.innerText.replace(",", "."));
                const hesaplananPuan = (oran * not) / 100;
                toplamPuan += hesaplananPuan;

                const existingSpan = notCell.querySelector("[data-calculated-score]");
                if (!existingSpan) {
                  const sonucElementi = document.createElement("span");
                  sonucElementi.style.color = "#343434";
                  sonucElementi.textContent = ` (${formatDecimal(hesaplananPuan)})`;
                  sonucElementi.setAttribute("data-calculated-score", "true");
                  notCell.appendChild(sonucElementi);
                }
              }
            });

            if (butunlemeVar) {
              rows.forEach((row) => {
                const calismaTipi = row.querySelector("td:nth-child(2)").textContent;
                if (calismaTipi.includes("Final")) {
                  const oranCell = row.querySelector("td:nth-child(1)");
                  const notCell = row.querySelector("td:nth-child(3) span");

                  if (oranCell && notCell && !isNaN(parseFloat(oranCell.textContent)) && !isNaN(parseFloat(notCell.textContent))) {
                    const oran = parseFloat(oranCell.innerText.replace(",", "."));
                    const not = parseFloat(notCell.innerText.replace(",", "."));
                    const hesaplananPuan = (oran * not) / 100;
                    toplamPuan -= hesaplananPuan;
                  }
                }
              });
            }

            const basariNotuRow = Array.from(rows).find((row) => row.querySelector("td:nth-child(2)").textContent.includes("Başarı Notu"));
            if (basariNotuRow) {
              const basariNotuCell = basariNotuRow.querySelector("td:nth-child(3) span");
              const harfNotu = basariNotuCell.textContent.trim().split(" ")[0];

              const renkler = {
                FF: "#df1212",
                FD: "#df1212",
                DD: "blue",
                DC: "blue",
                DZ: "orange",
                GR: "orange",
              };
              basariNotuCell.style.color = renkler[harfNotu] || "green";

              const toplamPuanElementi = document.createElement("span");
              toplamPuanElementi.style.color = "#000";
              toplamPuanElementi.textContent = ` (${formatDecimal(toplamPuan)})`;
              toplamPuanElementi.setAttribute("data-calculated-score", "true");
              toplamPuanElementi.setAttribute("id", "notOrtalama");
              basariNotuCell.appendChild(toplamPuanElementi);
            } else {
              const newAverageRow = document.createElement("tr");
              newAverageRow.innerHTML = `
                <td></td>
                <td class="font-weight-bold">Ortalama</td>
                <td class="text-right font-weight-bold">
                  <span id="notOrtalama" data-calculated-score="true" style="color: #000">${formatDecimal(toplamPuan)}</span>
                </td>
              `;
              cardBody.querySelector("tbody").appendChild(newAverageRow);
            }
          });
        },
      });
    }
  });
}

function removeCalculatedGrades() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: () => {
        const cardBodies = document.querySelectorAll(".card-body");

        cardBodies.forEach((cardBody) => {
          const rows = cardBody.querySelectorAll("tbody tr");

          rows.forEach((row) => {
            const notCell = row.querySelector("td:nth-child(3) span");
            const existingSpan = notCell.querySelector("[data-calculated-score]");
            if (existingSpan) {
              existingSpan.remove(); // Remove calculated score for regular rows
            }
          });

          const basariNotuRow = Array.from(rows).find((row) => row.querySelector("td:nth-child(2)").textContent.includes("Başarı Notu"));
          if (basariNotuRow) {
            const basariNotuCell = basariNotuRow.querySelector("td:nth-child(3) span");
            const existingBasariNotuSpan = basariNotuCell.querySelector("[data-calculated-score]");
            if (existingBasariNotuSpan) {
              existingBasariNotuSpan.remove(); // Remove total score under Başarı Notu
            }
          }

          // Remove the "Ortalama" row if it exists
          const averageRow = Array.from(rows).find((row) => {
            const labelCell = row.querySelector("td:nth-child(2)");
            return labelCell && labelCell.textContent.trim() === "Ortalama";
          });
          if (averageRow) {
            averageRow.remove(); // Remove the entire row for "Ortalama"
          }
        });
      },
    });
  });
}