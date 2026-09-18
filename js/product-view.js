(function () {
  const UI = window.CLIMT_UI;
  const State = window.CLIMT_STATE;
  const CFG = window.CLIMT_CONFIG;
  const Products = window.CLIMT_PRODUCTS;

  function generatePromoCode(product, marketplace) {
    const mp = (marketplace || 'XX').toUpperCase();
    const base = product.word.replace(/[^А-ЯЁ]/g, '');
    const map = { 'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'E','Ж':'ZH','З':'Z','И':'I','Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R','С':'S','Т':'T','У':'U','Ф':'F','Х':'H','Ц':'TS','Ч':'CH','Ш':'SH','Щ':'SCH','Ъ':'','Ы':'Y','Ь':'','Э':'E','Ю':'YU','Я':'YA' };
    const latin = base.split('').map(ch => map[ch] || ch).join('');
    return `CLIMT-${mp}-${latin}-${CFG.discountPerDay}`;
  }

  function render(product, options) {
    options = options || {};
    const mode = options.mode || 'detail';
    const pendingReward = options.pendingReward || false;
    const onBack = options.onBack || (() => window.CLIMT_CABINET.render());

    const el = document.getElementById('productBody');
    const marketplace = State.getMarketplace();
    const isReward = mode === 'reward';
    const needPicker = isReward && !marketplace && pendingReward;

    let promo = options.promo || null;
    const alreadyCompleted = !!State.get().completed[product.day];

    // Если это reward-экран, маркетплейс уже выбран, но промокод ещё не сгенерирован —
    // генерируем его и помечаем день как пройденный
    if (isReward && !needPicker && marketplace && !alreadyCompleted) {
      const code = generatePromoCode(product, marketplace);
      const expiresAt = Date.now() + CFG.promoDurationDays * 24 * 60 * 60 * 1000;
      State.completeDay(product.day, code, expiresAt);
      promo = code;
    }

    const promoActive = promo && State.isPromoActive(product.day);
    const promoExpired = promo && !State.isPromoActive(product.day);

    let topBlock = '';
    if (isReward && !needPicker) {
      topBlock = `
        <div class="pv-celebrate">
          <div class="pv-celebrate-badge">День ${product.day} пройден</div>
        </div>
      `;
    }

    let promoBlock = '';
    if (needPicker) {
      promoBlock = `
        <div class="pv-marketplace-picker">
          <div class="pv-mp-eyebrow">Выбери маркетплейс</div>
          <div class="pv-mp-title">Где тебе удобнее покупать?</div>
          <div class="pv-mp-sub">Выбор фиксируется для всех промокодов события – изменить потом нельзя.</div>
          <div class="pv-mp-options">
            <button class="pv-mp-btn" data-mp="wb">
              <div class="pv-mp-logo">WB</div>
              <div class="pv-mp-name">Wildberries</div>
            </button>
            <button class="pv-mp-btn" data-mp="ozon">
              <div class="pv-mp-logo">OZ</div>
              <div class="pv-mp-name">Ozon</div>
            </button>
          </div>
        </div>
      `;
    } else if (promo && !promoExpired) {
      const mpName = marketplace === 'wb' ? 'Wildberries' : (marketplace === 'ozon' ? 'Ozon' : '');
      promoBlock = `
        <div class="pv-promo">
          <div class="pv-promo-label">Твой промокод${mpName ? ' для ' + mpName : ''}</div>
          <div class="promo" id="pvPromoBox">
            <div id="pvPromoText">${promo}</div>
            <small>нажми, чтобы скопировать</small>
            <div class="copied">Скопировано</div>
          </div>
          <div class="pv-promo-hint">Работает 3 дня</div>
        </div>
      `;
    } else if (promoExpired) {
      promoBlock = `
        <div class="pv-promo-expired">
          <div class="pv-promo-expired-label">Промокод истёк</div>
          <div class="pv-promo-expired-text">Срок действия этого промокода закончился</div>
        </div>
      `;
    }

    const showDetails = !needPicker;

    el.innerHTML = `
      ${topBlock}

      <div class="pv-hero">
        <div class="pv-img-wrap">
          <img class="pv-img" src="${product.image}" alt="${product.name}" onerror="this.style.visibility='hidden'">
        </div>
        <div class="pv-cat">${product.word} · День ${product.day}</div>
        <h1 class="pv-name">${product.name}</h1>
        <p class="pv-desc">${product.desc}</p>
      </div>

      ${promoBlock}

      ${showDetails ? `
        <div class="pv-facts">
          <div class="pv-fact"><div class="pv-fact-label">Объём</div><div class="pv-fact-value">${product.facts.volume}</div></div>
          <div class="pv-fact"><div class="pv-fact-label">Финиш</div><div class="pv-fact-value">${product.facts.finish}</div></div>
          <div class="pv-fact"><div class="pv-fact-label">Эффект</div><div class="pv-fact-value">${product.facts.effect}</div></div>
          <div class="pv-fact"><div class="pv-fact-label">Стойкость</div><div class="pv-fact-value">${product.facts.longevity}</div></div>
        </div>

        ${product.story ? `
          <div class="pv-section">
            <div class="pv-section-label">История</div>
            <p class="pv-section-text">${product.story}</p>
          </div>
        ` : ''}

        <div class="pv-section">
          <div class="pv-section-label">Состав</div>
          <p class="pv-section-text">${product.ingredients}</p>
        </div>

        <div class="pv-section">
          <div class="pv-section-label">Как использовать</div>
          <p class="pv-section-text">${product.usage}</p>
        </div>

        ${product.variants && product.variants.length ? `
          <div class="pv-section">
            <div class="pv-section-label">Оттенки</div>
            <div class="pv-variants">
              ${product.variants.map((v, i) => `<span${i === 0 ? ' class="active"' : ''}>${v}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${product.tips && product.tips.length ? `
          <div class="pv-section">
            <div class="pv-section-label">Советы</div>
            <ul class="pv-tips">${product.tips.map(t => `<li>${t}</li>`).join('')}</ul>
          </div>
        ` : ''}

        <div class="pv-section">
          <div class="pv-section-label">Купить</div>
          ${renderMarketplaces(product, marketplace)}
        </div>

        ${isReward ? `
          <div class="pv-bag-reveal">
            <div class="pv-bag-stage">
              <div class="pv-bag-mini"></div>
              <div class="pv-bag-flying">
                <img src="${product.image}" alt="" onerror="this.style.display='none'">
              </div>
            </div>
            <div class="pv-bag-caption">Добавлено в косметичку: <strong>${product.name}</strong></div>
          </div>
        ` : ''}
      ` : ''}

      <div class="pv-actions">
        ${isReward && !needPicker ? `
          <button class="btn accent" id="pvCab">Открыть косметичку</button>
          <button class="btn ghost" id="pvNext">К карте дней</button>
        ` : (!isReward ? `
          <button class="btn accent" id="pvBack">К косметичке</button>
          ${promo && promoActive ? '<button class="btn ghost" id="pvCopy">Скопировать промокод</button>' : ''}
        ` : '')}
      </div>
    `;

    // ---- Обработчики ----

    if (needPicker) {
      el.querySelectorAll('.pv-mp-btn').forEach(btn => {
        btn.onclick = () => {
          const mp = btn.dataset.mp;
          if (!State.setMarketplace(mp)) {
            UI.toast('Маркетплейс уже выбран');
            return;
          }
          const code = generatePromoCode(product, mp);
          const expiresAt = Date.now() + CFG.promoDurationDays * 24 * 60 * 60 * 1000;
          State.completeDay(product.day, code, expiresAt);
          render(product, {
            mode: 'reward',
            promo: code,
            onBack: onBack,
          });
        };
      });
    }

    if (promo && promoActive) {
      const box = document.getElementById('pvPromoBox');
      if (box) {
        box.onclick = () => {
          UI.copyText(promo).then(() => {
            box.classList.add('copied');
            setTimeout(() => box.classList.remove('copied'), 1300);
          });
        };
      }
    }

    if (isReward && !needPicker) {
      const cabBtn = document.getElementById('pvCab');
      const nextBtn = document.getElementById('pvNext');
      if (cabBtn) cabBtn.onclick = () => window.CLIMT_CABINET.render();
      if (nextBtn) nextBtn.onclick = () => window.CLIMT_DAYS.render();
    } else if (!isReward) {
      const backBtn = document.getElementById('pvBack');
      if (backBtn) backBtn.onclick = () => window.CLIMT_CABINET.render();
      const copyBtn = document.getElementById('pvCopy');
      if (copyBtn && promo) {
        copyBtn.onclick = () => {
          UI.copyText(promo).then(() => UI.toast('Промокод скопирован'));
        };
      }
    }

    UI.show('product', { onBack: onBack });
  }

  function renderMarketplaces(product, marketplace) {
    if (!marketplace) {
      return `<div class="pv-marketplace-missing">Выбери маркетплейс, чтобы увидеть артикул</div>`;
    }

    const targetName = marketplace === 'wb' ? 'Wildberries' : 'Ozon';
    const shop = product.shops.find(s => s.name === targetName);

    if (!shop) {
      return `<div class="pv-marketplace-missing">Артикул для ${targetName} появится позже</div>`;
    }

    return `
      <div class="pv-marketplaces">
        <div class="pv-marketplaces-list" style="grid-template-columns:1fr">
          <a class="pv-marketplace" href="${shop.url}" target="_blank" rel="noopener">
            <span class="pv-marketplace-name">${shop.name}</span>
            <span class="pv-marketplace-art">${shop.art}</span>
          </a>
        </div>
      </div>
    `;
  }

  window.CLIMT_PRODUCT_VIEW = { render, generatePromoCode };
})();