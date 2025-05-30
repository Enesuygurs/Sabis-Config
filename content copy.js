// Tarayıcı depolamasından kaydedilen tema ayarlarını al ve uygula
chrome.storage.local.get(["redmode_state", "darkmode_state", "stealth_state", "calculate_state"], function (data) {
  if (data.redmode_state) {
    enableRedTheme();
  }
  if (data.darkmode_state) {
    enableDarkTheme();
  }
  if (data.stealth_state) {
    enableStealthMode();
  }
  if (data.calculate_state) {
    enableCalculateGrade();
  }
});

function enableRedTheme() {
  if (!document.getElementById("redmode")) {
    let style = document.createElement("style");
    style.id = "redmode";
    newRule = `
    .aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover .menu-heading .menu-text, 
    .aside-menu .menu-nav > .menu-item:not(.menu-item-parent):not(.menu-item-open):not(.menu-item-here):not(.menu-item-active):hover .menu-link .menu-text { color: #df1212 !important; } 
    .text-right { text-align: right !important; color: #4d4d4d !important;} 
    `;
    style.innerHTML = newRule;
    document.head.appendChild(style);
  }
}

function enableDarkTheme() {
  if (!document.getElementById("darkmode")) {
    let style = document.createElement("style");
    style.id = "darkmode";
    newDarkRule = `
    .text-right { text-align: right !important; color: white !important;} 
    `;
    style.innerHTML = newDarkRule;
    document.head.appendChild(style);
  }
}

function enableStealthMode() {
  document.querySelectorAll(".symbol-label img").forEach((imgElement) => {
    imgElement.style.display = "none"; // Fotoğrafı görünmez yap
    imgElement.parentElement.style.backgroundImage = "url('https://attic.sh/prxqzg7nk65j2ccjjyogebflzb4q')";
  });

  document.querySelectorAll(".symbol.symbol-35.symbol-light-success img").forEach((imgElement) => {
    imgElement.style.display = "none"; // Fotoğrafı görünmez yap
    let parent = imgElement.parentElement;
    Object.assign(parent.style, {
      backgroundColor: "#d7d7d7",
      backgroundImage: "url('https://attic.sh/prxqzg7nk65j2ccjjyogebflzb4q')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      width: "35px",
      height: "35px",
      borderRadius: "50%",
    });
  });

  document.querySelectorAll(".card-title.font-weight-bolder.text-dark-75.text-hover-primary.font-size-h4.m-0.pt-7.pb-1").forEach((element) => {
    element.style.setProperty("color", "#b9b9b9", "important");
    element.style.setProperty("font-weight", "bold", "important");
    element.innerText = "Anonymous";
  });

  document.querySelectorAll(".font-weight-bold.text-dark-50.font-size-sm.pb-6").forEach((element) => {
    element.style.setProperty("color", "#b9b9b9", "important");
    element.style.setProperty("font-weight", "bold", "important");
    element.innerText = "Stealth Mode ON";
  });
  document.querySelectorAll(".text-dark-50.font-weight-bolder.font-size-base.d-none.d-md-inline.mr-3").forEach((element) => {
    element.style.setProperty("color", "#b9b9b9", "important");
    element.style.setProperty("font-weight", "bold", "important");
    element.innerText = "Anonymous";
  });
  document.querySelectorAll(".card-body .pb-5 .pt-1, .navi-spacer-x-0").forEach((descElement) => {
    descElement.style.display = "none";
  });

  // SVG tabanlı arka plan metinlerini değiştir
  document.querySelectorAll("*").forEach((element) => {
    const backgroundImage = window.getComputedStyle(element).getPropertyValue("background-image");
    if (backgroundImage.includes("data:image/svg+xml")) {
      const updatedBackgroundImage = backgroundImage.replace(/<text[^>]*>(.*?)<\/text>/).replace(/>(.*?)</, ">Stealth Mode ON<");
      element.style.setProperty("background-image", updatedBackgroundImage, "important");
    }
  });
}

function enableCalculateGrade() {
  const targetUrl = "https://obs.sabis.sakarya.edu.tr/Ders";
  if (!window.location.href.startsWith(targetUrl)) return;
  const cardBodies = document.querySelectorAll(".card-body");

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

        // Formatlama fonksiyonu (2 basamak zorunlu, fazlası korunur)
        let formattedScore = hesaplananPuan.toFixed(10).replace(/\.?0+$/, "");
        if (!formattedScore.includes(".")) {
          formattedScore += ".00";
        } else if (formattedScore.split(".")[1].length === 1) {
          formattedScore += "0";
        }

        const existingSpan = notCell.querySelector("[data-calculated-score]");
        if (!existingSpan) {
          const sonucElementi = document.createElement("span");
          sonucElementi.style.color = "#343434";
          sonucElementi.textContent = ` (${formattedScore})`;
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

    // "Anket" yazısını içeren satır bulun ve not ortalamasını ekle
    const anketRow = Array.from(rows).find((row) => row.querySelector("td:nth-child(3)")?.textContent.includes("Anket"));
    if (anketRow) {
      const anketCell = anketRow.querySelector("td:nth-child(3)");
      const toplamPuanElementi = document.createElement("span");
      anketCell.appendChild(toplamPuanElementi);
    }

    const basariNotuRow = Array.from(rows).find((row) => row.querySelector("td:nth-child(2)").textContent.includes("Başarı Notu"));
    if (basariNotuRow) {
      const basariNotuCell = basariNotuRow.querySelector("td:nth-child(3) span");
      const harfNotu = basariNotuCell.textContent.trim().split(" ")[0];

      // Harf notuna göre renk belirleme
      const renkler = {
        FF: "#df1212",
        FD: "#df1212",
        DD: "blue",
        DC: "blue",
        DZ: "orange",
        GR: "orange",
      };
      basariNotuCell.style.color = renkler[harfNotu] || "green";

      // Ortalama puanı da aynı formatta göster
      let formattedTotal = toplamPuan.toFixed(10).replace(/\.?0+$/, "");
      if (!formattedTotal.includes(".")) {
        formattedTotal += ".00";
      } else if (formattedTotal.split(".")[1].length === 1) {
        formattedTotal += "0";
      }

      const toplamPuanElementi = document.createElement("span");
      toplamPuanElementi.style.color = "#000";
      toplamPuanElementi.textContent = ` (${formattedTotal})`;
      toplamPuanElementi.setAttribute("data-calculated-score", "true");
      toplamPuanElementi.setAttribute("id", "notOrtalama");
      basariNotuCell.appendChild(toplamPuanElementi);
    } else {
      let formattedTotal = toplamPuan.toFixed(10).replace(/\.?0+$/, "");
      if (!formattedTotal.includes(".")) {
        formattedTotal += ".00";
      } else if (formattedTotal.split(".")[1].length === 1) {
        formattedTotal += "0";
      }

      const newAverageRow = document.createElement("tr");
      newAverageRow.innerHTML = `
        <td></td>
        <td class="font-weight-bold">Ortalama</td>
        <td class="text-right font-weight-bold">
          <span id="notOrtalama" data-calculated-score="true" style="color: #000">${formattedTotal}</span>
        </td>
      `;
      cardBody.querySelector("tbody").appendChild(newAverageRow);
    }
  });
}

// Sayfa yüklendiğinde çalışacak
window.addEventListener("load", function () {
  // Tüm notları seç
  const notlar = document.querySelectorAll(".text-right > span:first-child");

  notlar.forEach((notElement) => {
    notElement.style.cursor = "pointer"; // İmleç pointer olsun

    notElement.addEventListener("click", function () {
      const mevcutNot = parseInt(notElement.textContent.trim());
      const yeniNot = prompt("Yeni notunuzu girin:", mevcutNot);

      // Kullanıcının girdiği değeri kontrol et
      const notSayisi = parseInt(yeniNot);
      if (isNaN(notSayisi) || notSayisi < 0 || notSayisi > 100) {
        alert("Geçerli bir not giriniz! (0-100)");
        return;
      }

      // Yeni notu güncelle
      notElement.textContent = yeniNot;

      // **Sadece değiştirilen dersin harf notunu sil**
      const dersElementi = notElement.closest(".card-body"); // Tıklanan dersin ana container'ı
      if (dersElementi) {
        const harfNotuElement = dersElementi.querySelector(".text-right.font-weight-bold > span:first-child");
        if (harfNotuElement) {
          harfNotuElement.innerHTML = harfNotuElement.innerHTML.replace(/^[A-Z]+/, "").trim();
        }
      }

      // **Tüm hesaplanan ortalamaları temizleme (81.00 gibi puanlar kalacak)**
      const eskiOrtalamaElementleri = document.querySelectorAll('[data-calculated-score="true"]');
      eskiOrtalamaElementleri.forEach((el) => el.remove());

      // Tüm not ortalamalarını baştan hesapla
      enableCalculateGrade();
    });
  });

  // **Harf notlarına tıklamayı engelle**
  const harfNotlari = document.querySelectorAll(".text-right.font-weight-bold > span:first-child");
  harfNotlari.forEach((harfElement) => {
    harfElement.style.pointerEvents = "none"; // Tıklamayı devre dışı bırak
  });
});
