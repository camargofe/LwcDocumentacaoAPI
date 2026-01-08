// app.js - módulo principal (ES module)
// Mantém a funcionalidade original com melhorias: debounce, observer throttle, a11y, copy toast.
// Coloque-o junto do index.html

const SWAGGER_URL = "https://camargofe.github.io/LwcDocumentacaoAPI/pix.yaml";

// Utilities
const $qsa = (s, scope = document) => Array.from((scope || document).querySelectorAll(s));
const $qs = (s, scope = document) => (scope || document).querySelector(s);

function debounce(fn, wait = 180) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

function showToast(msg, ms = 2200) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 260);
  }, ms);
}

// Wait for Swagger UI to render
function waitForSwaggerReady(timeout = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function check() {
      if ($qsa('.opblock-summary').length > 0 || $qsa('#swagger-ui h2').length > 0) return resolve();
      if (Date.now() - start > timeout) return reject(new Error('Swagger UI did not render in time'));
      requestAnimationFrame(check);
    })();
  });
}

/* --- removeZeroCounts: agora alvo específico (.count) --- */
function removeZeroCounts() {
  const menu = document.getElementById('sidebar-menu');
  if (!menu) return;
  menu.querySelectorAll('.count').forEach(el => {
    if ((el.textContent || '').trim() === '0') el.remove();
  });
}

/* Build sidebar */
function buildSidebar() {
  const menu = document.getElementById('sidebar-menu');
  if (!menu) return;
  menu.innerHTML = '';

  // sections (h2)
  const h2s = $qsa('#swagger-ui h2');
  if (h2s.length) {
    const section = document.createElement('li');
    section.className = 'menu-section';
    section.innerHTML = `<div class="menu-heading"><div style="font-weight:700">Seções</div><div class="count">${h2s.length}</div></div>`;
    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '6px';
    h2s.forEach(h2 => {
      const text = (h2.textContent || '').trim();
      const btn = document.createElement('button');
      btn.className = 'tag-item';
      btn.type = 'button';
      btn.innerHTML = `<strong>${escapeHtml(text)}</strong>`;
      btn.addEventListener('click', () => {
        h2.scrollIntoView({ behavior: 'smooth', block: 'center' });
        Array.from(menu.querySelectorAll('.tag-item')).forEach(n => n.classList.remove('active'));
        btn.classList.add('active');
      });
      list.appendChild(btn);
    });
    section.appendChild(list);
    menu.appendChild(section);
  }

  // tags + ops
  const tags = $qsa('.opblock-tag');
  tags.forEach(tagEl => {
    const titleSpan = tagEl.querySelector('h3 span');
    if (!titleSpan) return;
    const titleText = titleSpan.textContent.trim();

    const operations = tagEl.querySelectorAll('.opblock-summary');
    const count = operations.length;

    const li = document.createElement('li');
    li.className = 'menu-section';

    const head = document.createElement('div');
    head.className = 'menu-heading';
    head.innerHTML = `<div style="font-weight:700">${escapeHtml(titleText)}</div><div class="count">${count}</div>`;
    li.appendChild(head);

    const opsContainer = document.createElement('div');
    opsContainer.className = 'ops';

    operations.forEach(op => {
      const method = op.querySelector('.opblock-summary-method')?.textContent?.trim() || '';
      const path = op.querySelector('.opblock-summary-path')?.textContent?.trim() || '';
      const btn = document.createElement('button');
      btn.className = 'op-link';
      btn.type = 'button';
      btn.innerHTML = `<div class="method-pill-left method-${method.toLowerCase()}">${escapeHtml(method)}</div>
                       <div style="display:flex;flex-direction:column;align-items:flex-start;">
                         <div style="font-size:13px;color:#0b1220;">${escapeHtml(path)}</div>
                       </div>`;

      btn.addEventListener('click', () => {
        const opblock = op.closest('.opblock');
        if (!opblock) return;
        const summary = opblock.querySelector('.opblock-summary');
        if (summary) {
          summary.scrollIntoView({ behavior: 'smooth', block: 'center' });
          summary.click();
          lastClickedOpblock = opblock;
          setTimeout(() => {
            updateRightPanel(opblock);
          }, 260);
        }
      });

      opsContainer.appendChild(btn);
    });

    li.appendChild(opsContainer);

    head.addEventListener('click', () => {
      const isActive = li.classList.contains('active');
      Array.from(menu.children).forEach(n => n.classList.remove('active'));
      if (!isActive) li.classList.add('active');
      tagEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    menu.appendChild(li);
  });

  try { removeZeroCounts(); } catch(e){/*ignore*/}
}

function wireSearch() {
  const input = document.getElementById('sidebar-search');
  if (!input) return;
  const onInput = () => {
    const q = input.value.trim().toLowerCase();
    const items = $qsa('#sidebar-menu .menu-section');
    items.forEach(item => {
      const heading = item.querySelector('.menu-heading > div')?.textContent?.toLowerCase() || '';
      const ops = Array.from(item.querySelectorAll('.op-link'));
      let anyOpMatch = false;
      ops.forEach(op => {
        const txt = op.textContent.toLowerCase();
        const match = q === '' || txt.includes(q);
        op.style.display = match ? '' : 'none';
        if (match) anyOpMatch = true;
      });
      const sectionMatch = q === '' || heading.includes(q);
      item.style.display = (sectionMatch || anyOpMatch) ? '' : 'none';
    });
  };
  input.addEventListener('input', debounce(onInput, 200));
}

let lastClickedOpblock = null;

function bindGlobalOpClicks() {
  document.addEventListener('click', (e) => {
    const summary = e.target.closest('.opblock-summary');
    if (!summary) return;
    const opblock = summary.closest('.opblock');
    if (!opblock) return;
    lastClickedOpblock = opblock;
    setTimeout(() => updateRightPanel(opblock), 200);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const summary = e.target.closest('.opblock-summary');
    if (!summary) return;
    const opblock = summary.closest('.opblock');
    if (!opblock) return;
    lastClickedOpblock = opblock;
    setTimeout(() => updateRightPanel(opblock), 200);
  });
}

function findResponsesWrapper(opblockEl) {
  if (!opblockEl) return null;
  const selectors = [
    '.responses-wrapper',
    '.responses-inner',
    '.opblock-body .responses-wrapper',
    '.opblock-body .responses-inner',
    '.opblock-body .responses',
    '.response',
    '.responses',
    '.examples-wrapper',
    '.example',
    '.opblock-description'
  ];
  for (const sel of selectors) {
    const node = opblockEl.querySelector(sel);
    if (node) return node;
  }
  const pre = opblockEl.querySelector('pre, code, .highlight');
  if (pre) {
    const wrapper = document.createElement('div');
    wrapper.className = 'responses-wrapper';
    wrapper.appendChild(pre.cloneNode(true));
    return wrapper;
  }
  return null;
}

function extractResponseExamples(opblock) {
  const examples = [];
  const responseNodes = Array.from(opblock.querySelectorAll('.responses-wrapper .response, .response'));
  for (const node of responseNodes) {
    let status = (node.querySelector('.response-col_status')?.textContent ||
                  node.querySelector('.response__status')?.textContent ||
                  node.querySelector('.response-status-code')?.textContent ||
                  node.querySelector('h4')?.textContent ||
                  '').trim();
    const m = status.match(/(\d{3})/);
    status = m ? m[1] : (status || '200');
    const pre = node.querySelector('pre, code, .microlight');
    const text = pre ? pre.innerText.trim() : null;
    if (text) examples.push({ status, contentType: 'application/json', text });
  }

  if (examples.length === 0) {
    const pres = Array.from(opblock.querySelectorAll('.responses-wrapper pre, .responses-wrapper code, pre, code'));
    pres.forEach((p, idx) => {
      const txt = p.innerText.trim();
      if (txt) examples.push({ status: (idx === 0 ? '200' : `ex${idx}`), contentType: 'application/json', text: txt });
    });
  }

  const seen = new Set();
  return examples.filter(e => {
    if (seen.has(e.status)) return false;
    seen.add(e.status);
    return true;
  });
}

function updateRightPanel(preferredOpblock) {
  const methodEl = document.getElementById('code-method');
  const pathEl = document.getElementById('code-path');
  const badgesContainer = document.getElementById('response-badges');
  const contentTypeEl = document.getElementById('response-content-type');
  const codeAreaEl = document.getElementById('response-code-area');

  badgesContainer.innerHTML = '';
  codeAreaEl.querySelector('pre code').textContent = '';

  const opblock = preferredOpblock || lastClickedOpblock || document.querySelector('.opblock.is-open');
  if (!opblock) {
    methodEl.className = 'method-pill default';
    methodEl.textContent = 'OP';
    pathEl.textContent = '';
    return;
  }

  const method = opblock.querySelector('.opblock-summary-method')?.textContent?.trim() || '';
  const path = opblock.querySelector('.opblock-summary-path')?.textContent?.trim() || '';
  methodEl.className = 'method-pill ' + (method ? method.toLowerCase() : 'default');
  methodEl.textContent = method || 'OP';
  pathEl.textContent = path || '';
  pathEl.title = path || '';

  let examples = [];
  try { examples = extractResponseExamples(opblock); } catch (e) { examples = []; }

  if (examples.length === 0) {
    contentTypeEl.textContent = 'application/json';
    codeAreaEl.querySelector('pre code').textContent = '// Nenhum exemplo de resposta encontrado.';
    return;
  }

  examples.forEach((ex, idx) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'badge';
    b.textContent = ex.status;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-pressed', idx === 0 ? 'true' : 'false');
    b.addEventListener('click', () => {
      Array.from(badgesContainer.children).forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-pressed', 'false');
      });
      b.classList.add('active');
      b.setAttribute('aria-pressed', 'true');
      contentTypeEl.textContent = ex.contentType || 'application/json';
      codeAreaEl.querySelector('pre code').textContent = ex.text || '';
      try { hljs.highlightElement(codeAreaEl.querySelector('pre code')); } catch(e) {/*ignore*/}
    });
    if (idx === 0) b.classList.add('active');
    badgesContainer.appendChild(b);
  });

  const first = examples[0];
  contentTypeEl.textContent = first.contentType || 'application/json';
  codeAreaEl.querySelector('pre code').textContent = first.text || '';
  try { hljs.highlightElement(codeAreaEl.querySelector('pre code')); } catch(e) {/*ignore*/}
}

/* Optimized MutationObserver with throttle via requestIdleCallback fallback */
function observeSwagger() {
  const uiRoot = document.querySelector('#swagger-ui');
  if (!uiRoot) return;
  let rebuildScheduled = false;

  const scheduleRebuild = () => {
    if (rebuildScheduled) return;
    rebuildScheduled = true;
    const work = () => {
      try { buildSidebar(); wireSearch(); removeZeroCounts(); } finally { rebuildScheduled = false; }
    };
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => work(), { timeout: 300 });
    } else {
      setTimeout(() => work(), 160);
    }
  };

  const mo = new MutationObserver(mutations => {
    let shouldRebuild = false;
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length) shouldRebuild = true;
      if (m.type === 'attributes' && m.attributeName === 'class') {
        const t = m.target;
        if (t.classList && t.classList.contains('opblock') && t.classList.contains('is-open')) {
          const preferred = lastClickedOpblock || t;
          setTimeout(() => updateRightPanel(preferred), 80);
        }
      }
    }
    if (shouldRebuild) scheduleRebuild();
  });

  mo.observe(uiRoot, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
}

/* Copy handler and expand/collapse */
function bindResponseControls() {
  const copyBtn = document.getElementById('response-copy');
  const expandBtn = document.getElementById('response-expand');
  const collapseBtn = document.getElementById('response-collapse');
  const codeArea = document.getElementById('response-code-area');

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const text = codeArea.querySelector('pre code').textContent || '';
      try {
        await navigator.clipboard.writeText(text);
        showToast('Copiado para a área de transferência');
      } catch (e) {
        // fallback: select text
        const range = document.createRange();
        range.selectNodeContents(codeArea);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        showToast('Selecione e copie manualmente (navegador não permitiu copiar).');
      }
    });
  }

  if (expandBtn) {
    expandBtn.addEventListener('click', () => {
      codeArea.style.maxHeight = 'calc(100vh - 200px)';
    });
  }

  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      codeArea.style.maxHeight = '320px';
    });
  }
}

/* Init */
async function init() {
  // Initialize Swagger UI
  const loader = document.getElementById('loader');
  const errorEl = document.getElementById('error');
  try {
    if (!window.SwaggerUIBundle) {
      throw new Error('Swagger UI bundle não encontrado (verifique o carregamento do script).');
    }

    SwaggerUIBundle({
      url: SWAGGER_URL,
      dom_id: "#swagger-ui",
      layout: "BaseLayout",
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis]
    });

    try {
      await waitForSwaggerReady();
    } catch (e) {
      console.warn('Swagger UI pode estar lento para renderizar:', e);
    } finally {
      try { buildSidebar(); } catch(e){ console.error(e); }
      try { removeZeroCounts(); } catch(e){/*ignore*/ }
      wireSearch();
      bindGlobalOpClicks();
      observeSwagger();
      bindResponseControls();
      setTimeout(() => {
        const open = document.querySelector('.opblock.is-open');
        if (open) {
          lastClickedOpblock = open;
          updateRightPanel(open);
        }
      }, 350);
    }
    if (loader) loader.style.display = 'none';
    if (errorEl) { errorEl.style.display = 'none'; errorEl.setAttribute('aria-hidden', 'true'); }
    const swaggerUi = document.getElementById('swagger-ui');
    if (swaggerUi) swaggerUi.setAttribute('aria-busy', 'false');
  } catch (err) {
    console.error('Falha ao inicializar Swagger UI:', err);
    if (loader) loader.style.display = 'none';
    if (errorEl) {
      errorEl.style.display = '';
      errorEl.setAttribute('aria-hidden', 'false');
    }
  }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
  init();
});
