(function () {
  const UI = window.CLIMT_UI;
  const CFG = window.CLIMT_CONFIG;

  const SLIDES = [
    {
      icon: 'images/logo.png',
      eyebrow: 'Climt Cosmetics',
      title: 'Добро пожаловать<br><em>в Climt · Play</em>',
      text: '14 дней, 14 продуктов, 14 промокодов. Игровое событие бренда: узнай философию Climt, наполни свою виртуальную косметичку и получи скидки на покупки на climtcosmetics.com.',
    },
    {
      icon: 'images/products/tint.png',
      eyebrow: 'Как это работает',
      title: 'Один день –<br><em>один продукт</em>',
      text: 'Каждый календарный день открывается новая категория. Пропустишь день – не беда: догнать можно в течение 3 дней. Если не вернуться дольше – день сгорает.',
    },
    {
      icon: 'images/products/mascara.png',
      eyebrow: 'Шаг 1',
      title: 'Отгадай<br><em>категорию</em>',
      text: 'Начни с короткой головоломки – угадай название категории продукта по буквам. Подсказки описывают сам продукт и его особенности, а проиграть нельзя: можно только выиграть.',
    },
    {
      icon: 'images/products/serum.png',
      eyebrow: 'Шаг 2',
      title: 'Собери нужное<br><em>количество продукта</em>',
      text: 'На игровом поле объединяй соседние продукты в ряды. Цель дня – собрать конкретное количество именно того продукта, который задан в задании.',
    },
    {
      icon: 'images/products/highlighter.png',
      eyebrow: 'Шаг 3',
      title: 'Наполни<br><em>косметичку</em>',
      text: 'Каждый пройденный день добавляет продукт в твою косметичку и приносит персональный промокод. Промокод действует 3 дня – успей использовать.',
    },
    {
      icon: 'images/products/blush.png',
      eyebrow: 'Шаг 4',
      title: 'Выбери<br><em>маркетплейс</em>',
      text: 'При первом промокоде выбери, где тебе удобнее покупать – Wildberries или Ozon. Выбор фиксируется на всё событие, изменить потом нельзя.',
    },
    {
      icon: 'images/products/lip-balm.png',
      eyebrow: 'Финал',
      title: 'Собери все 14 –<br><em>получи набор</em>',
      text: 'Пройди все 14 дней и получи персональный набор Climt со скидкой 30% и бесплатной доставкой. Плюс – эксклюзивный промокод на новинку.',
    },
  ];

  let idx = 0;

  function shouldShow() {
    try { return localStorage.getItem(CFG.onboardingKey) !== 'done'; }
    catch (e) { return true; }
  }

  function markShown() {
    try { localStorage.setItem(CFG.onboardingKey, 'done'); } catch (e) {}
  }

  function reset() {
    try { localStorage.removeItem(CFG.onboardingKey); } catch (e) {}
  }

  function renderSlide() {
    const slide = SLIDES[idx];
    const el = document.getElementById('obSlide');
    const iconHtml = slide.icon
      ? `<img src="${slide.icon}" alt="" onerror="this.style.display='none'">`
      : '';

    el.innerHTML = `
      <div class="ob-icon">${iconHtml}</div>
      <div class="ob-eyebrow">${slide.eyebrow || ''}</div>
      <div class="ob-title">${slide.title}</div>
      <div class="ob-text">${slide.text}</div>
    `;

    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';

    const dots = document.getElementById('obDots');
    dots.innerHTML = SLIDES.map((_, i) =>
      `<div class="ob-dot${i === idx ? ' active' : ''}"></div>`
    ).join('');

    const nextBtn = document.getElementById('obNext');
    nextBtn.textContent = idx === SLIDES.length - 1 ? 'Начать' : 'Дальше';
  }

  function next() {
    if (idx < SLIDES.length - 1) {
      idx++;
      renderSlide();
    } else finish();
  }

  function finish() {
    markShown();
    window.CLIMT_HOME.render();
  }

  function show() {
    idx = 0;
    renderSlide();
    document.getElementById('obNext').onclick = next;
    document.getElementById('obSkip').onclick = finish;
    UI.show('onboard');
  }

  window.CLIMT_ONBOARDING = { shouldShow, show, reset };
})();