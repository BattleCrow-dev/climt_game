(function () {
  const UI = window.CLIMT_UI;
  const State = window.CLIMT_STATE;
  const CFG = window.CLIMT_CONFIG;
  const Products = window.CLIMT_PRODUCTS;

  function render() {
    const grid = document.getElementById('cabGrid');
    grid.innerHTML = '';

    let done = 0;
    let missed = 0;

    Products.forEach(p => {
      const completed = !!State.get().completed[p.day];
      const isMissed = State.isDayMissed(p.day);
      const promoActive = completed && State.isPromoActive(p.day);

      if (completed) done++;
      if (isMissed) missed++;

      const slot = document.createElement('div');

      if (completed && promoActive) {
        // Активный промокод
        slot.className = 'cab-slot filled';
        slot.innerHTML = `
          <img class="slot-img" src="${p.image}" alt="" onerror="this.style.visibility='hidden'">
          <div class="slot-day">${p.word}</div>
          <div class="slot-check">✓</div>
        `;
        slot.title = 'Открыть: ' + p.name;
        slot.onclick = () => openProduct(p);
      } else if (completed && !promoActive) {
        // Промокод истёк, но продукт остался
        slot.className = 'cab-slot filled expired';
        slot.innerHTML = `
          <img class="slot-img" src="${p.image}" alt="" onerror="this.style.visibility='hidden'">
          <div class="slot-day">${p.word}</div>
          <div class="slot-check">⌛</div>
        `;
        slot.title = 'Промокод истёк, но продукт сохранён в косметичке';
        slot.onclick = () => openProduct(p);
      } else if (isMissed) {
        // Пропущенный день — продукт потерян
        slot.className = 'cab-slot missed';
        slot.innerHTML = `
          <img class="slot-img" src="${p.image}" alt="" onerror="this.style.visibility='hidden'">
          <div class="slot-day">${p.word}</div>
          <div class="slot-mark-cross">✕</div>
        `;
        slot.title = 'День ' + p.day + ' пропущен — продукт не получен';
      } else {
        // Пустая ячейка — день ещё не открыт или не пройден
        slot.className = 'cab-slot empty';
        slot.innerHTML = `<div class="slot-num">${p.day}</div>`;
        slot.title = 'День ' + p.day;
      }

      grid.appendChild(slot);
    });

    const titleEl = document.getElementById('cabTitle');
    titleEl.innerHTML = `${done} <span>/ ${CFG.eventDays}</span>`;

    const subEl = document.getElementById('cabSub');
    if (done === 0 && missed === 0) {
      subEl.textContent = 'Пока пусто — начни с первого дня';
    } else if (done === CFG.eventDays) {
      subEl.textContent = 'Коллекция собрана';
    } else {
      const left = CFG.eventDays - done;
      let text = `Ещё ${left} ${UI.plural(left, ['продукт','продукта','продуктов'])}`;
      if (missed > 0) {
        text += ` · ${missed} ${UI.plural(missed, ['потерян','потеряно','потеряно'])}`;
      }
      subEl.textContent = text;
    }

    document.getElementById('cabProgressFill').style.width =
      (done / CFG.eventDays * 100) + '%';

    renderFooter(done);

    UI.show('cab', { onBack: () => window.CLIMT_HOME.render() });
  }

  function openProduct(p) {
    window.CLIMT_PRODUCT_VIEW.render(p, {
      mode: 'detail',
      promo: State.getPromo(p.day),
      onBack: () => render(),
    });
  }

  function renderFooter(done) {
    const foot = document.getElementById('cabFoot');
    const isComplete = done === CFG.eventDays;

    if (isComplete && State.isFinalRewardActive()) {
      const u = State.getFinalRewardUnlockedAt();
      const exp = new Date(u);
      exp.setDate(exp.getDate() + CFG.finalRewardWindowDays);
      const daysLeft = Math.ceil((exp - new Date()) / (24 * 3600 * 1000));

      foot.innerHTML = `
        <div class="cab-final active">
          <div class="cab-final-star">★</div>
          <div class="cab-final-content">
            <div class="cab-final-title">Финальный набор</div>
            <div class="cab-final-desc">Скидка 30% + бесплатная доставка на climtcosmetics.com</div>
            <div class="cab-final-code" id="cabFinalCode">
              <code>${CFG.finalRewardCode}</code>
              <span>копировать</span>
            </div>
            <div class="cab-final-valid">Действует ${daysLeft} ${UI.plural(daysLeft, ['день','дня','дней'])}</div>
          </div>
        </div>
      `;
      document.getElementById('cabFinalCode').onclick = () => {
        UI.copyText(CFG.finalRewardCode).then(() => UI.toast('Финальный промокод скопирован'));
      };
    } else if (isComplete) {
      foot.innerHTML = `
        <div class="cab-final">
          <div class="cab-final-star muted">★</div>
          <div class="cab-final-content">
            <div class="cab-final-title muted">Финальный набор</div>
            <div class="cab-final-desc">Срок действия промокода истёк</div>
          </div>
        </div>
      `;
    } else {
      const left = CFG.eventDays - done;
      foot.innerHTML = `
        <div class="cab-final">
          <div class="cab-final-star muted">★</div>
          <div class="cab-final-content">
            <div class="cab-final-title muted">Финальный набор</div>
            <div class="cab-final-desc">Скидка 30% на climtcosmetics.com после всех ${CFG.eventDays} дней. Осталось ${left}.</div>
          </div>
        </div>
      `;
    }
  }

  window.CLIMT_CABINET = { render };
})();