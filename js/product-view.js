/**
 * Единый рендер карточки продукта.
 * Режим reward — после победы, с праздником и анимацией в косметичку.
 * Режим detail — обычный просмотр из косметички.
 */
(function () {
  const UI = window.CLIMT_UI;
  const State = window.CLIMT_STATE;
  const Products = window.CLIMT_PRODUCTS;

  function render(product, options) {
    options = options || {};
    const mode = options.mode || 'detail';
    const promo = options.promo || null;
    const onBack = options.onBack || (() => window.CLIMT_CABINET.render());

    const el = document.getElementById('productBody');
    const pairProducts = (product.pairWithDays || [])
      .map(d => Products.find(p => p.day === d))
      .filter(Boolean);

    const officialUrl = product.officialUrl || 'https://climtcosmetics.com';

    el.innerHTML = `
      ${mode === 'reward' ? `
        <div class="pv-celebrate">
          <div class="pv-celebrate-badge">День ${product.day} пройден</div>
        </div>
      ` : ''}

      <div class="pv-hero">
        <div class="pv-img-wrap">
          <img class="pv-img" src="${product.image}" alt="${product.name}" onerror="this.style.visibility='hidden'">
        </div>
        <div class="pv-cat">${product.word} · День ${product.day}</div>
        <h1 class="pv-name">${product.name}</h1>
        <p class="pv-desc">${product.desc}</p>
      </div>

      ${promo ? `
        <div class="pv-promo">
          <div class="pv-promo-label">Твой промокод</div>
          <div class="promo" id="pvPromoBox">
            <div id="pvPromoText">${promo}</div>
            <small>нажми, чтобы скопировать</small>
            <div class="copied">Скопировано</div>
          </div>
          <div class="pv-promo-hint">Работает при заказе на climtcosmetics.com</div>
        </div>
      ` : ''}

      <div class="pv-facts">
        <div class="pv-fact">
          <div class="pv-fact-label">Объём</div>
          <div class="pv-fact-value">${product.facts.volume}</div>
        </div>
        <div class="pv-fact">
          <div class="pv-fact-label">Финиш</div>
          <div class="pv-fact-value">${product.facts.finish}</div>
        </div>
        <div class="pv-fact">
          <div class="pv-fact-label">Эффект</div>
          <div class="pv-fact-value">${product.facts.effect}</div>
        </div>
        <div class="pv-fact">
          <div class="pv-fact-label">Стойкость</div>
          <div class="pv-fact-value">${product.facts.longevity}</div>
        </div>
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
          <ul class="pv-tips">
            ${product.tips.map(t => `<li>${t}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${pairProducts.length ? `
        <div class="pv-section">
          <div class="pv-section-label">Идеально сочетается</div>
          <div class="pv-pair">
            ${pairProducts.map(p => `
              <div class="pv-pair-item" data-pair-day="${p.day}">
                <div class="pv-pair-img-wrap">
                  <img class="pv-pair-img" src="${p.image}" alt="" onerror="this.style.visibility='hidden'">
                </div>
                <div class="pv-pair-name">${p.word}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="pv-section">
        <div class="pv-section-label">Купить</div>

        <a class="pv-buy-official" href="${officialUrl}" target="_blank" rel="noopener">
          <div class="pv-buy-official-head">
            <div class="pv-buy-official-brand">CLIMT</div>
            <div class="pv-buy-official-tag">Официальный сайт</div>
          </div>
          <div class="pv-buy-official-action">
            <span>Купить на climtcosmetics.com</span>
            <span class="pv-buy-official-arrow">→</span>
          </div>
          ${promo ? `<div class="pv-buy-official-promo">Промокод <code>${promo}</code> действует при оформлении</div>` : ''}
        </a>

        <div class="pv-marketplaces">
          <div class="pv-marketplaces-label">Также в продаже</div>
          <div class="pv-marketplaces-list">
            ${product.shops.map(s => `
              <a class="pv-marketplace" href="${s.url}" target="_blank" rel="noopener">
                <span class="pv-marketplace-name">${s.name}</span>
                <span class="pv-marketplace-art">${s.art}</span>
              </a>
            `).join('')}
          </div>
        </div>
      </div>

      ${mode === 'reward' ? `
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

      <div class="pv-actions">
        ${mode === 'reward' ? `
          <button class="btn accent" id="pvCab">Открыть косметичку</button>
          <button class="btn ghost" id="pvNext">К карте дней</button>
        ` : `
          <button class="btn accent" id="pvBack">К косметичке</button>
          ${promo ? '<button class="btn ghost" id="pvCopy">Скопировать промокод</button>' : ''}
        `}
      </div>
    `;

    // Копирование промокода по клику на плашку
    if (promo) {
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

    // Переход по «сочетается с»
    el.querySelectorAll('[data-pair-day]').forEach(node => {
      node.onclick = () => {
        const day = parseInt(node.dataset.pairDay, 10);
        const pairProduct = Products.find(p => p.day === day);
        const pairPromo = State.getPromo(day);
        render(pairProduct, {
          mode: 'detail',
          promo: pairPromo,
          onBack: () => window.CLIMT_CABINET.render(),
        });
      };
    });

    // Кнопки
    if (mode === 'reward') {
      document.getElementById('pvCab').onclick = () => window.CLIMT_CABINET.render();
      document.getElementById('pvNext').onclick = () => window.CLIMT_DAYS.render();
    } else {
      document.getElementById('pvBack').onclick = () => window.CLIMT_CABINET.render();
      const copyBtn = document.getElementById('pvCopy');
      if (copyBtn && promo) {
        copyBtn.onclick = () => {
          UI.copyText(promo).then(() => UI.toast('Промокод скопирован'));
        };
      }
    }

    UI.show('product', { onBack: onBack });
  }

  window.CLIMT_PRODUCT_VIEW = { render };
})();