(function () {
  const UI = window.CLIMT_UI;
  const State = window.CLIMT_STATE;
  const CFG = window.CLIMT_CONFIG;
  const Products = window.CLIMT_PRODUCTS;

  function render() {
    const grid = document.getElementById('cabGrid');
    grid.innerHTML = '';

    let done = 0;
    Products.forEach(p => {
      const filled = !!State.get().completed[p.day];
      if (filled) done++;

      const slot = document.createElement('div');
      slot.className = 'cab-slot ' + (filled ? 'filled' : 'empty');

      if (filled) {
        slot.innerHTML = `
          <img class="slot-img" src="${p.image}" alt="" onerror="this.style.visibility='hidden'">
          <div class="slot-day">${p.word}</div>
          <div class="slot-check">✓</div>
        `;
        slot.title = 'Открыть: ' + p.name;
        slot.onclick = () => {
          window.CLIMT_PRODUCT_VIEW.render(p, {
            mode: 'detail',
            promo: State.getPromo(p.day),
            onBack: () => render(),
          });
        };
      } else {
        slot.innerHTML = `<div class="slot-num">${p.day}</div>`;
      }
      grid.appendChild(slot);
    });

    // 15-й слот — финальный приз
    const isComplete = done === CFG.eventDays;
    const finalSlot = document.createElement('div');
    finalSlot.className = 'cab-slot final' + (isComplete ? '' : ' locked');
    finalSlot.innerHTML = `
      <div class="slot-star">★</div>
      <div class="slot-day">${isComplete ? 'Набор' : '—'}</div>
    `;
    if (isComplete) {
      finalSlot.title = 'Финальный промокод';
      finalSlot.onclick = () => {
        UI.copyText(CFG.finalRewardCode).then(() => UI.toast('Финальный промокод скопирован'));
      };
    }
    grid.appendChild(finalSlot);

    // Заголовок
    const titleEl = document.getElementById('cabTitle');
    titleEl.innerHTML = `${done} <span>/ ${CFG.eventDays}</span>`;

    const subEl = document.getElementById('cabSub');
    if (done === 0) subEl.textContent = 'По одному продукту каждый день';
    else if (done === CFG.eventDays) subEl.textContent = 'Коллекция собрана';
    else {
      const left = CFG.eventDays - done;
      subEl.textContent = `Ещё ${left} ${UI.plural(left, ['продукт','продукта','продуктов'])}`;
    }

    // Прогресс
    document.getElementById('cabProgressFill').style.width = (done / CFG.eventDays * 100) + '%';

    // Футер
    renderFooter(done, isComplete);

    UI.show('cab', { onBack: () => window.CLIMT_HOME.render() });
  }

  function renderFooter(done, isComplete) {
    const foot = document.getElementById('cabFoot');

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
            <div class="cab-final-desc">Скидка 30% + бесплатная доставка</div>
            <div class="cab-final-code" id="cabFinalCode">
              <code>${CFG.finalRewardCode}</code>
              <span>копировать</span>
            </div>
            <div class="cab-final-valid">Действует ${daysLeft} ${UI.plural(daysLeft, ['день','дня','дней'])} · на climtcosmetics.com</div>
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