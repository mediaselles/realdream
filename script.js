(function () {
  'use strict';

  const STORAGE_KEY_AGE = 'od_age_ok_site';
  const STORAGE_KEY_GENDER = 'od_gender_pref';
  const DEFAULT_OUTBOUND = 'https://www.ourdreamersai13.com/496R32N/NFC9H/?uid=141&sub3=chat';

  let config = null;
  let characterData = { women: [], men: [], trans: [] };
  let currentFilter = null;
  let selectedModalGender = 'women';

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    setupAgeGate();
    await loadData();
    renderStats();
    renderFeatures();
    renderGallery();
    setupGenderModal();
    setupGalleryControls();
    setupOutboundLinks();
  }

  /* ============================================================
     1. 18+ AGE GATE
     Fail-closed: gate is visible by default; JS clears it if confirmed.
     ============================================================ */
  function setupAgeGate() {
    const gate = document.getElementById('gate');
    if (!gate) return;

    const panel = document.getElementById('gate-panel');
    const denied = document.getElementById('gate-denied');
    const btnYes = document.getElementById('gate-yes');
    const btnNo = document.getElementById('gate-no');
    const btnRetry = document.getElementById('gate-retry');

    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY_AGE);
    } catch (e) {
      stored = null;
    }

    if (stored === 'ok') {
      gate.remove();
      document.body.classList.remove('gate-open');
      return;
    }

    document.body.classList.add('gate-open');

    if (btnYes) {
      btnYes.addEventListener('click', () => {
        try {
          localStorage.setItem(STORAGE_KEY_AGE, 'ok');
        } catch (e) {}
        document.body.classList.remove('gate-open');
        gate.style.opacity = '0';
        gate.style.transition = 'opacity 0.3s ease';
        setTimeout(() => gate.remove(), 300);
      });
    }

    if (btnNo) {
      btnNo.addEventListener('click', () => {
        if (panel) panel.hidden = true;
        if (denied) denied.hidden = false;
      });
    }

    if (btnRetry) {
      btnRetry.addEventListener('click', () => {
        if (denied) denied.hidden = true;
        if (panel) panel.hidden = false;
      });
    }
  }

  /* ============================================================
     2. DATA LOADING
     ============================================================ */
  async function loadData() {
    if (window.APP_CONFIG) config = window.APP_CONFIG;
    if (window.APP_CHARACTERS) characterData = window.APP_CHARACTERS;

    try {
      const [cfgRes, charRes] = await Promise.all([
        fetch('config.json', { cache: 'no-store' }),
        fetch('characters.json', { cache: 'no-store' })
      ]);

      if (cfgRes.ok) config = await cfgRes.json();
      if (charRes.ok) characterData = await charRes.json();
    } catch (e) {
      // Offline or file:// protocol CORS, preloaded APP_CONFIG and APP_CHARACTERS are used
    }

    if (!config) {
      config = {
        outbound: { url: DEFAULT_OUTBOUND },
        stats: { items: [] },
        features: []
      };
    }
  }

  /* ============================================================
     3. STATS STRIP
     ============================================================ */
  function renderStats() {
    const wrap = document.getElementById('lp-stats');
    if (!wrap || !config.stats || !config.stats.items) return;

    wrap.innerHTML = config.stats.items.map(s => `
      <div class="lp-stat-card">
        <div class="lp-stat-value">${escapeHtml(s.value)}</div>
        <div class="lp-stat-label">${escapeHtml(s.label)}</div>
        <div class="lp-stat-note">${escapeHtml(s.note || '')}</div>
      </div>
    `).join('');
  }

  /* ============================================================
     4. FEATURES
     ============================================================ */
  const ICONS = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    selfie: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>',
    voice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>',
    create: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>'
  };

  function renderFeatures() {
    const wrap = document.getElementById('lp-features');
    if (!wrap || !config.features) return;

    wrap.innerHTML = config.features.map(f => {
      return `
        <article class="lp-feature-card">
          <div class="lp-feature-head">
            <span class="lp-feature-num">No. ${escapeHtml(f.code)}</span>
            <div class="lp-feature-icon">${ICONS[f.icon] || ICONS.chat}</div>
          </div>
          <h3 class="lp-feature-title">${escapeHtml(f.title)}</h3>
          <div class="lp-feature-note">${escapeHtml(f.note)}</div>
          <p class="lp-feature-body">${escapeHtml(f.body)}</p>
        </article>
      `;
    }).join('');
  }

  /* ============================================================
     5. GENDER SELECTION MODAL
     Triggered when someone clicks "Chat Now" or primary CTA
     Allows choosing Women, Men, or Trans
     ============================================================ */
  function setupGenderModal() {
    const modal = document.getElementById('gender-modal');
    if (!modal) return;

    const closeBtn = document.getElementById('gender-modal-close');
    const confirmBtn = document.getElementById('gender-confirm-btn');
    const options = modal.querySelectorAll('.gender-option');

    // Preselect stored preference or default
    const stored = localStorage.getItem(STORAGE_KEY_GENDER) || 'women';
    selectGenderOption(stored);

    options.forEach(opt => {
      opt.addEventListener('click', () => {
        const val = opt.getAttribute('data-gender');
        selectGenderOption(val);
      });
    });

    function selectGenderOption(gender) {
      selectedModalGender = gender;
      options.forEach(opt => {
        const isMatch = opt.getAttribute('data-gender') === gender;
        opt.classList.toggle('selected', isMatch);
      });
    }

    // Open triggers
    document.querySelectorAll('[data-trigger-gender="true"]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openGenderModal();
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeGenderModal);
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeGenderModal();
    });

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        try {
          localStorage.setItem(STORAGE_KEY_GENDER, selectedModalGender);
        } catch (e) {}

        closeGenderModal();

        // Switch filter in gallery to matching category
        setGalleryFilter(selectedModalGender);

        // Redirect to affiliate URL
        const outbound = (config && config.outbound && config.outbound.url) || DEFAULT_OUTBOUND;
        window.open(outbound, '_blank', 'noopener,noreferrer');
      });
    }

    function openGenderModal() {
      modal.classList.add('active');
      document.body.classList.add('modal-open');
    }

    function closeGenderModal() {
      modal.classList.remove('active');
      document.body.classList.remove('modal-open');
    }

    window.openGenderModal = openGenderModal;
  }

  /* ============================================================
     6. GALLERY RENDERING & FILTERING
     Categories: All, Women, Men, Trans
     ============================================================ */
  function setupGalleryControls() {
    const tabs = document.querySelectorAll('[data-filter]');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const filter = tab.getAttribute('data-filter');
        setGalleryFilter(filter);
      });
    });
  }

  function setGalleryFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('[data-filter]').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-filter') === filter);
    });
    renderGallery();
  }

  function getAllCharacters() {
    const list = [];
    if (characterData.women) list.push(...characterData.women);
    if (characterData.men) list.push(...characterData.men);
    if (characterData.trans) list.push(...characterData.trans);
    return list;
  }

  function renderGallery() {
    const grid = document.getElementById('lp-gallery-grid');
    if (!grid) return;

    // Update count labels on tabs
    updateTabCounts();

    // If no category selected yet, don't show any models!
    if (!currentFilter) {
      grid.innerHTML = `
        <div class="gallery-empty-state">
          <div class="gallery-empty-badge">CHOOSE A CATEGORY TO REVEAL MODELS</div>
          <h3 class="gallery-empty-title">Who Would You Like to Meet?</h3>
          <p class="gallery-empty-sub">Choose a category below to reveal and browse verified AI companions:</p>
          <div class="gallery-empty-grid">
            <button type="button" class="gallery-section-card" onclick="window.setGalleryFilter('women')">
              <div class="gallery-section-avatar">👩</div>
              <div class="gallery-section-title">Women</div>
              <div class="gallery-section-count">${(characterData.women || []).length || 52} Active Models</div>
              <div class="gallery-section-cta">View Women &rarr;</div>
            </button>
            <button type="button" class="gallery-section-card" onclick="window.setGalleryFilter('men')">
              <div class="gallery-section-avatar">👨</div>
              <div class="gallery-section-title">Men</div>
              <div class="gallery-section-count">${(characterData.men || []).length || 30} Active Models</div>
              <div class="gallery-section-cta">View Men &rarr;</div>
            </button>
            <button type="button" class="gallery-section-card" onclick="window.setGalleryFilter('trans')">
              <div class="gallery-section-avatar">⚧</div>
              <div class="gallery-section-title">Trans</div>
              <div class="gallery-section-count">${(characterData.trans || []).length || 18} Active Models</div>
              <div class="gallery-section-cta">View Trans &rarr;</div>
            </button>
          </div>
        </div>
      `;
      return;
    }

    let items = characterData[currentFilter] || [];

    if (items.length === 0) {
      const catName = currentFilter === 'women' ? 'Women' : (currentFilter === 'men' ? 'Men' : 'Trans');
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; color: var(--text-secondary);">
          <p style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">No companions found in ${catName}</p>
          <button class="lp-btn lp-btn-ghost lp-btn-sm" onclick="setGalleryFilter('women')">View Women Companions</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = items.map(char => {
      const genderDisplay = char.gender === 'women' ? 'Woman' : (char.gender === 'men' ? 'Man' : 'Trans');
      const charAffiliateUrl = getCharacterAffiliateUrl(char);
      const charCreateUrl = getCharacterCreateUrl(char);
      return `
        <article class="lp-card" data-char-id="${char.id}">
          <figure class="lp-card-fig">
            <img class="lp-card-img" 
                 src="${escapeHtml(char.image)}" 
                 alt="${escapeHtml(char.name)}" 
                 loading="lazy"
                 onerror="this.onerror=null; this.src='${char.fallbackImage || ''}';">
            <div class="lp-card-scrim"></div>
            <div class="lp-card-top-badges">
              <span class="lp-badge-hot">${escapeHtml(char.badge || 'Online')}</span>
              <span class="lp-badge-gender">${genderDisplay} · ${char.age}</span>
            </div>
            <div class="lp-card-bottom">
              <div class="lp-card-header">
                <h3 class="lp-card-name">${escapeHtml(char.name)}</h3>
                <span class="lp-card-age">${char.age}</span>
              </div>
              <p class="lp-card-line">${escapeHtml(char.line || '')}</p>
              <div class="lp-card-footer">
                <span class="lp-card-tag">${escapeHtml(char.tag || 'Companion')}</span>
                <div class="lp-card-actions">
                  <a href="${escapeHtml(charAffiliateUrl)}" target="_blank" rel="noopener noreferrer" class="lp-card-chat-btn" data-char-chat="${char.id}" aria-label="Chat with ${escapeHtml(char.name)}">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span>Chat</span>
                  </a>
                  <a href="${escapeHtml(charCreateUrl)}" target="_blank" rel="noopener noreferrer" class="lp-card-create-btn" data-char-create="${char.id}" aria-label="Create with ${escapeHtml(char.name)}">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    <span>Create</span>
                  </a>
                </div>
              </div>
            </div>
          </figure>
        </article>
      `;
    }).join('');

    // Attach card click handlers with smartphone touchscroll protection
    let touchStartY = 0;
    let isDragging = false;

    grid.querySelectorAll('.lp-card').forEach(card => {
      card.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) {
          touchStartY = e.touches[0].clientY;
        }
        isDragging = false;
      }, { passive: true });

      card.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches[0]) {
          if (Math.abs(e.touches[0].clientY - touchStartY) > 10) {
            isDragging = true;
          }
        }
      }, { passive: true });

      card.addEventListener('click', () => {
        if (isDragging) return;
        const charId = card.getAttribute('data-char-id');
        openCharacterModal(charId);
      });
    });

    // Action buttons directly open affiliate links without opening preview modal
    grid.querySelectorAll('[data-char-chat], [data-char-create]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });
  }

  function getCharacterAffiliateUrl(char) {
    if (char && char.affiliateLink) return char.affiliateLink;
    if (!char) return DEFAULT_OUTBOUND;
    const genderParam = char.gender === 'women' ? 'female' : (char.gender === 'men' ? 'male' : 'trans');
    const slug = char.modelSlug || (char.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `https://www.ourdreamersai13.com/496R32N/NFC9H/?uid=141&sub1=${encodeURIComponent(slug)}&sub2=${encodeURIComponent(genderParam)}&sub3=chat&source_id=${encodeURIComponent(slug)}`;
  }

  function getCharacterCreateUrl(char) {
    if (char && char.createLink) return char.createLink;
    const createBase = (config && config.outbound && config.outbound.createUrl) || 'https://www.ourdreamersai13.com/496R32N/NFC9H/?uid=134&sub3=create';
    if (!char) return createBase;
    const genderParam = char.gender === 'women' ? 'female' : (char.gender === 'men' ? 'male' : 'trans');
    const slug = char.modelSlug || (char.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `https://www.ourdreamersai13.com/496R32N/NFC9H/?uid=134&sub1=${encodeURIComponent(genderParam)}&sub2=${encodeURIComponent(slug)}&sub3=create&source_id=${encodeURIComponent(slug)}`;
  }

  function updateTabCounts() {
    const womenCount = (characterData.women || []).length;
    const menCount = (characterData.men || []).length;
    const transCount = (characterData.trans || []).length;

    const elW = document.querySelector('[data-filter="women"] .filter-tab-count');
    const elM = document.querySelector('[data-filter="men"] .filter-tab-count');
    const elT = document.querySelector('[data-filter="trans"] .filter-tab-count');

    if (elW) elW.textContent = womenCount;
    if (elM) elM.textContent = menCount;
    if (elT) elT.textContent = transCount;
  }

  /* ============================================================
     7. CHARACTER QUICK-PREVIEW MODAL
     ============================================================ */
  function openCharacterModal(charId) {
    const all = getAllCharacters();
    const char = all.find(c => c.id === charId);
    if (!char) return;

    const modal = document.getElementById('char-modal');
    if (!modal) return;

    const img = modal.querySelector('.char-modal-img');
    const name = modal.querySelector('.char-modal-name');
    const age = modal.querySelector('.char-modal-age');
    const tag = modal.querySelector('.char-modal-tag');
    const desc = modal.querySelector('.char-modal-desc');
    const chats = modal.querySelector('.char-modal-chats');
    const likes = modal.querySelector('.char-modal-likes');
    const ctaBtn = modal.querySelector('.char-modal-cta');
    const createCtaBtn = modal.querySelector('.char-modal-create-cta');
    const closeBtn = document.getElementById('char-modal-close');

    if (img) {
      img.src = char.image;
      img.onerror = () => { img.src = char.fallbackImage || ''; };
    }
    if (name) name.textContent = char.name;
    if (age) age.textContent = `${char.gender.toUpperCase()} · ${char.age} YEARS OLD`;
    if (tag) tag.textContent = char.tag || 'AI COMPANION';
    if (desc) desc.textContent = char.description || char.line || '';
    if (chats) chats.textContent = char.chats || '400k+';
    if (likes) likes.textContent = char.likes || '900+';

    if (ctaBtn) {
      const charAffiliateUrl = getCharacterAffiliateUrl(char);
      ctaBtn.setAttribute('href', charAffiliateUrl);
      ctaBtn.setAttribute('target', '_blank');
      ctaBtn.setAttribute('rel', 'noopener noreferrer');
      ctaBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 6px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Start Chatting with ${escapeHtml(char.name)} Free &rarr;`;
      ctaBtn.onclick = null;
    }

    if (createCtaBtn) {
      const charCreateUrl = getCharacterCreateUrl(char);
      createCtaBtn.setAttribute('href', charCreateUrl);
      createCtaBtn.setAttribute('target', '_blank');
      createCtaBtn.setAttribute('rel', 'noopener noreferrer');
      createCtaBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>Create Companion like ${escapeHtml(char.name)} &rarr;`;
      createCtaBtn.onclick = null;
    }

    modal.classList.add('active');
    document.body.classList.add('modal-open');

    if (closeBtn) {
      closeBtn.onclick = () => {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
      };
    }

    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
      }
    };
  }

  function startCharacterChat(charId) {
    const all = getAllCharacters();
    const char = all.find(c => c.id === charId);
    const outbound = getCharacterAffiliateUrl(char);
    window.open(outbound, '_blank', 'noopener,noreferrer');
  }

  /* ============================================================
     8. OUTBOUND URL RESOLUTION
     ============================================================ */
  function setupOutboundLinks() {
    const base = (config.outbound && config.outbound.url) || DEFAULT_OUTBOUND;
    document.querySelectorAll('[data-outbound]').forEach(el => {
      const href = el.getAttribute('href') || '';
      if (href.startsWith('#')) return;
      el.setAttribute('href', base);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    });
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // Expose filter helper globally for buttons
  window.setGalleryFilter = setGalleryFilter;
})();
