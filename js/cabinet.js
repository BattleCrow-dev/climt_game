(function () {
  const UI = window.CLIMT_UI;
  const State = window.CLIMT_STATE;
  const CFG = window.CLIMT_CONFIG;
  const Products = window.CLIMT_PRODUCTS;

  function render() {
    const grid = document.getElementById('cabGrid');
    grid.innerHTML = '';

    // Собираем только пройденные дни — в порядке дней
    const completedProducts = [];
    Products.forEach(p => {
      if (State.get().completed[p.day]) completedProducts.push(p);
    });

    const done = completedProducts.length;

    // Рендерим пройденные слоты
    completedProducts.forEach(p => {
      const promoActive = State.isPromoActive(p.day);
      const slot = document.createElement('div');
      slot.className = 'cab-slot filled' + (promoActive ? '' : ' expired');

      slot.innerHTML = `
        <img class="slot-img" src="${p.image}" alt="" onerror="this.style.visibility='hidden'">
        <div class="slot-day">${p.word}</div>
        <div class="slot-check">${promoActive ? '✓' : '⌛'}</div>
      `;
      slot.title = promoActive
        ? 'Открыть: ' + p.name
        : 'Промокод истёк, но продукт остался в косметичке';

      slot.onclick = () => {
        window.CLIMT_PRODUCT_VIEW.render(p, {
          mode: 'detail',
          promo: State.getPromo(p.day),
          onBack: () => render(),
        });
      };

      grid.appendChild(slot);
    });

    // Финальный слот — всегда в конце
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
    } else {
      finalSlot.title = 'Собери все 14 продуктов';
    }
    grid.appendChild(finalSlot);

    // Заголовок
    const titleEl = document.getElementById('cabTitle');
    titleEl.innerHTML = `${done} <span>/ ${CFG.eventDays}</span>`;

    const subEl = document.getElementById('cabSub');
    if (done === 0) subEl.textContent = 'Пока пусто — начни с первого дня';
    else if (done === CFG.eventDays) subEl.textContent = 'Коллекция собрана';
    else {
      const left = CFG.eventDays - done;
      subEl.textContent = `Ещё ${left} ${UI.plural(left, ['продукт','продукта','продуктов'])}`;
    }

    document.getElementById('cabProgressFill').style.width = (done / CFG.eventDays * 100) + '%';

    renderFooter(done, isComplete);

    UI.show('cab', { onBack: () => window.CLIMT_HOME.render() });
  }

  function renderFooter(done, isComplete) {
    const foot = document.getElementById('cabFoot');

    if (done === 0) {
      foot.innerHTML = `
        <div class="cab-final">
          <div class="cab-final-star muted">★</div>
          <div class="cab-final-content">
            <div class="cab-final-title muted">Финальный набор</div>
            <div class="cab-final-desc">Пройди все ${CFG.eventDays} дней и получи персональный набор Climt со скидкой 30%</div>
          </div>
        </div>
      `;
      return;
    }

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
            <div class="cab-final-desc">Скидка 30% после всех ${CFG.eventDays} дней. Осталось ${left}.</div>
          </div>
        </div>
      `;
    }
  }

  window.CLIMT_CABINET = { render };
})();