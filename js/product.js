/**
 * Карточка товара: описание, факты, оттенки, магазины.
 */
(function () {
  const UI = window.CLIMT_UI;

  let currentProduct = null;

  function render(product) {
    currentProduct = product;
    const el = document.getElementById('scr-card');

    el.innerHTML = `
      <div class="pcard">
        <div class="pcard-head">
          <div class="pcard-icon">${product.icon}</div>
          <div class="pcard-meta">
            <div class="cat">День ${product.day} · ${product.word}</div>
            <h2>${product.name}</h2>
          </div>
        </div>
        <p class="pcard-desc">${product.desc}</p>

        <div class="pcard-facts">
          <div class="fact">
            <div class="fact-label">Объём</div>
            <div class="fact-value">${product.facts.volume}</div>
          </div>
          <div class="fact">
            <div class="fact-label">Финиш</div>
            <div class="fact-value">${product.facts.finish}</div>
          </div>
          <div class="fact">
            <div class="fact-label">Эффект</div>
            <div class="fact-value">${product.facts.effect}</div>
          </div>
          <div class="fact">
            <div class="fact-label">Стойкость</div>
            <div class="fact-value">${product.facts.longevity}</div>
          </div>
        </div>

        <div class="fact" style="margin-bottom:14px">
          <div class="fact-label">Состав</div>
          <div class="fact-value" style="font-size:12.5px">${product.ingredients}</div>
        </div>

        <div class="fact" style="margin-bottom:18px">
          <div class="fact-label">Как использовать</div>
          <div class="fact-value" style="font-size:12.5px; line-height:1.5">${product.usage}</div>
        </div>

        <div class="fact-label" style="margin-bottom:8px">Оттенки</div>
        <div class="pcard-variants">
          ${product.variants.map((v, i) => `<span${i === 0 ? ' class="active"' : ''}>${v}</span>`).join('')}
        </div>

        <div class="fact-label" style="margin-bottom:8px">Купить</div>
        <div class="shops">
          ${product.shops.map(s => `
            <a class="shop" href="${s.url}" target="_blank" rel="noopener">
              <div>
                <div>${s.name}</div>
                <div class="art">арт. ${s.art}</div>
              </div>
              <div class="arrow">→</div>
            </a>`).join('')}
        </div>
      </div>

      <button class="btn accent" id="cardNext">Перейти к мини-игре</button>
      <button class="btn ghost" id="cardBack">Назад к карте</button>
    `;

    document.getElementById('cardNext').onclick = () => {
      UI.show('m3', { onBack: () => render(product) });
      // Двойной rAF гарантирует, что layout уже посчитан
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.CLIMT_MATCH3.init(product);
      }));
    };
    document.getElementById('cardBack').onclick = () => window.CLIMT_DAYS.render();

    UI.show('card', { onBack: () => window.CLIMT_HANGMAN.init(product) });
  }

  window.CLIMT_PRODUCT = { render };
})();