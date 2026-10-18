/* =========================================================
   SWIFT — SCRIPT ÚNICO (catálogo, busca, carrinho, ANGUS)
   ========================================================= */

/* ========= Helpers ========= */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const BRL = v => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));

/** tenta múltiplas URLs; se falhar, usa um fallback visível */
function setImgSrc(imgEl, urls) {
  const list = (Array.isArray(urls) ? urls : [urls]).slice();
  const FALLBACK =
    'https://images.unsplash.com/photo-1615937691194-97dbd3b05b5b?q=80&w=1200&auto=format&fit=crop';
  function tryNext() {
    if (!list.length) { imgEl.onerror = null; imgEl.src = FALLBACK; return; }
    const src = list.shift();
    imgEl.onerror = tryNext;
    imgEl.src = src;
  }
  tryNext();
}

/* ========= Catálogo ========= */
const IMG = (f) => `css/IMAGES/${f}`;

const PRODUCTS = [
  { id: 1,  cat: 'Bovinos',          name: 'Picanha Bovina 1kg',    price: 59.90, img: [IMG('picinha.png'), IMG('picanha.png')] },
  { id: 2,  cat: 'Cortes Especiais', name: 'Ancho 500g',            price: 49.90, img: IMG('ancho.png') },
  { id: 3,  cat: 'Suínos',           name: 'Costelinha Suína 1kg',  price: 29.90, img: IMG('costelinha.png') },
  { id: 4,  cat: 'Aves',             name: 'Coxa e Sobrecoxa 1kg',  price: 14.90, img: IMG('kitcompleto.png') },
  { id: 5,  cat: 'Pescados',         name: 'Salmão em Postas 500g', price: 39.90, img: IMG('salmaoempostas.png') },
  { id: 6,  cat: 'Churrasco',        name: 'Kit Básico (p/ 4)',     price: 149.90, img: IMG('kitbasico.png') },
  { id: 7,  cat: '100% Vegetal',     name: 'Burger Vegetal 2un',    price: 19.90, img: IMG('burgervegetal.png') },
  { id: 8,  cat: 'Bebidas',          name: 'Cerveja Heineken 350ml',price: 4.99,  img: IMG('kitcomcerveja.png') },
  { id: 9,  cat: 'Bebidas',          name: 'Refrigerante Cola 2L',  price: 9.90,  img: IMG('cocacola.png') },
  { id:10,  cat: 'Bebidas',          name: 'Água Mineral 1,5L',     price: 4.90,  img: IMG('aguamineral.png') },
  { id:11,  cat: 'Bebidas',          name: 'Suco de Laranja 1L',    price: 8.90,  img: IMG('sucolaranja.png') },
  { id:12,  cat: 'Doces',            name: 'Sorvete Chocolate 1L',  price: 24.90, img: IMG('sorvete_chocolate.png') },
];
window.PRODUCTS = PRODUCTS;

const CATEGORIES = [
  'Todas','Bovinos','Aves','Pescados','Suínos','Churrasco',
  'Cortes Especiais','100% Vegetal','Bebidas','Doces'
];

/* ========= Home: categorias + grade ========= */
function renderCats(active = 'Todas') {
  const wrap = $('.cats'); if (!wrap) return;
  wrap.innerHTML = '';
  CATEGORIES.forEach((c) => {
    const b = document.createElement('button'); b.textContent = c;
    if (c === active) b.classList.add('active');
    b.onclick = () => { renderCats(c); renderGrid(c); };
    wrap.appendChild(b);
  });
}

function renderGrid(filter = 'Todas', term = '') {
  const container = $('#produtos'); if (!container) return; // só na home
  const grid = $('.grid'); if (!grid) return;

  let list = PRODUCTS.slice();
  if (filter !== 'Todas') list = list.filter((p) => p.cat === filter);
  if (term) {
    const q = term.toLowerCase();
    list = list.filter(p => (p.name + ' ' + p.cat).toLowerCase().includes(q));
  }

  grid.innerHTML = '';
  list.forEach((p) => {
    const card  = document.createElement('article'); card.className = 'card';
    const imgw  = document.createElement('div');     imgw.className = 'imgwrap';
    const img   = document.createElement('img');     setImgSrc(img, p.img);
    imgw.appendChild(img);

    const meta  = document.createElement('div'); meta.className = 'meta';
    meta.innerHTML = `
      <span class="badge">${p.cat}</span>
      <h3>${p.name}</h3>
      <div class="price">${BRL(p.price)}</div>
    `;

    const buy = document.createElement('div'); buy.className = 'buy';
    const btn = document.createElement('button'); btn.className = 'btn btn-primary'; btn.textContent = 'COMPRAR';
    btn.onclick = () => addToCart(p);
    buy.appendChild(btn);

    card.append(imgw, meta, buy);
    grid.appendChild(card);
  });

  if (!list.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = `Nada encontrado para ${term}.`;
    grid.appendChild(empty);
  }
}

/* ========= Busca global (header) ========= */
function hookSearch() {
  const input = $('#search-input') || $('input[placeholder*="Buscar"]');
  const clear = $('[data-search-clear]');
  if (!input) return;

  function go(term) {
    if (!term) return;
    localStorage.setItem('SWIFT_SEARCH', term);
    if (!$('#produtos')) location.assign('./home.html#produtos');
    else renderGrid($('.cats .active')?.textContent || 'Todas', term);
  }
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(input.value.trim()); });
  if (clear) clear.addEventListener('click', () => { input.value = ''; renderGrid($('.cats .active')?.textContent || 'Todas', ''); });

  const saved = localStorage.getItem('SWIFT_SEARCH') || '';
  if (saved && $('#produtos')) {
    localStorage.removeItem('SWIFT_SEARCH');
    input.value = saved;
    renderGrid('Todas', saved);
  }
}

/* ========= Carrinho ========= */
function getCart() { return JSON.parse(localStorage.getItem('SWIFT_CART') || '[]'); }
function setCart(c)  { localStorage.setItem('SWIFT_CART', JSON.stringify(c)); }

function setCartBadge() {
  const badge = $('#cart-badge') || $('[data-cart-badge]');
  if (!badge) return;
  const cart = getCart();
  const q = cart.reduce((s, i) => s + i.qty, 0);
  badge.textContent = q;
}

function addToCart(prod) {
  const cart = getCart();
  const i = cart.findIndex((x) => x.id === prod.id);
  const firstImg = Array.isArray(prod.img) ? prod.img[0] : prod.img;
  if (i > -1) cart[i].qty += 1;
  else cart.push({ id: prod.id, name: prod.name, price: prod.price, qty: 1, img: firstImg });
  setCart(cart);
  showToast('✅ Produto adicionado ao carrinho!');
  setCartBadge();
  if ($('#cart-list')) renderCart();
}

function renderCart() {
  const list = $('#cart-list'); if (!list) return;
  const cart = getCart(); list.innerHTML = '';
  if (!cart.length) {
    list.innerHTML = `<div class="empty">Seu carrinho está vazio. <a href="home.html#produtos" class="btn btn-primary" style="display:inline-block;margin-left:6px;">Ver ofertas</a></div>`;
    const subEl = $('#subtotal'); if (subEl) subEl.textContent = '0,00';
    return;
  }
  let subtotal = 0;
  cart.forEach((item) => {
    subtotal += item.price * item.qty;
    const row = document.createElement('div'); row.className = 'cart-row';
    row.innerHTML = `
      <img src="${item.img}" alt="">
      <div>
        <div style="font-weight:900">${item.name}</div>
        <div class="muted">${BRL(item.price)}</div>
      </div>
      <div class="qty">
        <button data-act="dec">−</button><b>${item.qty}</b><button data-act="inc">+</button>
      </div>
      <div class="line-right">${BRL(item.price * item.qty)}</div>
      <div class="line-right"><button data-act="rm" class="btn">Remover</button></div>
    `;
    row.querySelector('[data-act="dec"]').onclick = () => { if (item.qty > 1) { item.qty--; save(); } };
    row.querySelector('[data-act="inc"]').onclick = () => { item.qty++; save(); };
    row.querySelector('[data-act="rm"]').onclick = () => { const c = getCart().filter((x) => x.id !== item.id); setCart(c); setCartBadge(); renderCart(); };
    function save() { const c = getCart(); const ix = c.findIndex((x) => x.id === item.id); c[ix] = item; setCart(c); setCartBadge(); renderCart(); }
    list.appendChild(row);
  });
  const subEl = $('#subtotal'); if (subEl) subEl.textContent = subtotal.toFixed(2).replace('.', ',');
}

function showToast(msg) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1600);
}

/* ========= Rastreio (30s demo) ========= */
function bootTrack() {
  const title  = $('#trackTitle');
  const status = $('#trackStatus');
  const etaEl  = $('#trackEta');
  const bar    = $('#trackBar');
  const cupom  = $('#trackCupom');
  if (!etaEl || !bar || !title || !status) return;

  title.textContent  = 'Pedido #10328';
  status.textContent = 'Em rota';
  bar.style.width = '10%';

  const endTs = Date.now() + 30_000;
  const timer = setInterval(() => {
    const left = Math.max(0, endTs - Date.now());
    const mm = String(Math.floor(left / 60000)).padStart(2, '0');
    const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
    etaEl.textContent = `${mm}:${ss}`;
    const pct = 10 + (1 - left / 30_000) * 90;
    bar.style.width = `${Math.min(100, Math.max(10, pct))}%`;
    if (left <= 0) {
      clearInterval(timer);
      status.textContent = 'Aguardando na portaria';
      if (cupom) cupom.textContent = 'Atrasou? Cupom liberado: SWIFT-ATRASO-10';
    }
  }, 1000);
}

/* ========= Endereço (mapa) ========= */
function bootMap() {
  const map = $('#map'); if (!map) return;
  map.innerHTML = `
    <iframe style="width:100%;height:100%;border:0"
      src="https://www.openstreetmap.org/export/embed.html?bbox=-46.72%2C-23.72%2C-46.42%2C-23.45&layer=mapnik&marker=-23.55%2C-46.62">
    </iframe>`;
}

/* ========= Abas (Minha Conta) ========= */
function bootTabs() {
  const tabs = $$('.tab'); if (!tabs.length) return;
  tabs.forEach((t) => {
    t.onclick = () => {
      tabs.forEach((x) => x.classList.remove('active')); t.classList.add('active');
      $$('.panel').forEach((p) => (p.style.display = 'none'));
      const panel = $('#tab-' + t.dataset.tab); if (panel) panel.style.display = 'block';
    };
  });
}

/* ========= Cadastro do Clube ========= */
function bootClubeCadastro() {
  const form = $('#formClube');
  const toast = $('#toast');
  if (!form) return;
  const KEY = 'SWIFT_CLUBE_MEMBERS';
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rec = Object.fromEntries(new FormData(form).entries());
    rec.createdAt = new Date().toISOString();
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    list.push(rec);
    localStorage.setItem(KEY, JSON.stringify(list));
    localStorage.setItem('SWIFT_CLUBE_ACTIVE', '1');
    if (rec.nome) localStorage.setItem('SWIFT_CLUBE_NAME', rec.nome);
    if (toast) { toast.style.display = 'flex'; }
    form.reset();
  });
  if (toast) toast.addEventListener('click', (e) => { if (e.target === toast) toast.style.display = 'none'; });
}

/* ========= Normalização de links ========= */
(function sanitizeLinks(){
  document.querySelectorAll('a[href]').forEach(a=>{
    const href = a.getAttribute('href') || '';
    const txt  = (a.textContent || '').toLowerCase();
    if (/rastrei(?:o|mento)\.html$/i.test(href) || /\/rastreio\.html$/i.test(href)) {
      if (href !== './rastreio.html') a.setAttribute('href','./rastreio.html');
    }
    if (/fazer parte|assinar|cadastro/.test(txt) || /clube-?cadastro/i.test(href)) {
      a.setAttribute('href','./clube-cadastro.html');
    }
    if (/super\s*kits/.test(txt) || /superkits/i.test(href)) {
      a.setAttribute('href','./superkits.html');
    }
  });
})();

/* ========= Loader de parciais (header/footer) ========= */
document.addEventListener('DOMContentLoaded', async () => {
  const slots = document.querySelectorAll('[data-include]');
  if (!slots.length) { initAfterLayout(); return; }

  await Promise.all(
    Array.from(slots).map(async (el) => {
      const url = el.getAttribute('data-include');
      const html = await fetch(url, { cache: 'no-store' }).then((r) => r.text());
      const tmp = document.createElement('div'); tmp.innerHTML = html.trim();
      const frag = document.createDocumentFragment();
      Array.from(tmp.childNodes).forEach((n) => frag.appendChild(n));
      el.replaceWith(frag);
    })
  );

  initAfterLayout();
});

function initAfterLayout() {
  setCartBadge();
  if ($('#produtos')) { renderCats(); renderGrid(); }
  renderCart();
  hookSearch();
  bootTrack();
  bootMap();
  bootTabs();
  bootClubeCadastro();
  if (window.initBot) window.initBot(true); // ANGUS online
}

/* ========= Pagamento – mantém resumo atualizado se mudar o carrinho em outra aba ========= */
window.addEventListener('storage', (e) => {
  if (e.key !== 'SWIFT_CART') return;
  try {
    const cart = JSON.parse(localStorage.getItem('SWIFT_CART') || '[]');
    const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const frete = sub >= 199 ? 0 : 12.9;
    const desc  = 0;
    if ($('#r-sub')) $('#r-sub').textContent = BRL(sub);
    if ($('#r-fre')) $('#r-fre').textContent = BRL(frete);
    if ($('#r-off')) $('#r-off').textContent = '- ' + BRL(desc).replace('R$ ', '');
    if ($('#r-tot')) $('#r-tot').textContent = BRL(sub + frete - desc);
  } catch (_) {}
});

/* ========= ANGUS (mascote) — conversa guiada + confirmação ========= */
(function () {
  if (window.initBot && window.initBot.__chatv2) return;

  const BOT_KEY = 'SWIFT_BOT_HISTORY_V2';

  function saveHistory(m){ try{ localStorage.setItem(BOT_KEY, JSON.stringify(m.slice(-20))); }catch(e){} }
  function loadHistory(){ try{ return JSON.parse(localStorage.getItem(BOT_KEY)||'[]'); }catch(e){ return []; } }

  function searchProducts(term){
    if(!Array.isArray(window.PRODUCTS)) return [];
    const q = term.toLowerCase();
    return window.PRODUCTS.filter(p => (p.name+' '+p.cat).toLowerCase().includes(q)).slice(0,5);
  }

  window.initBot = function initBot(force=false){
    if (document.querySelector('.angus-fab') && !force) return;
    document.querySelectorAll('.angus-fab,.angus-panel,.angus-css').forEach(el=>el.remove());

    const css = document.createElement('style'); css.className = 'angus-css';
    css.textContent = `
      .angus-fab{position:fixed;right:24px;bottom:24px;z-index:9998;background:#e64a19;color:#fff;border:none;border-radius:999px;padding:1rem 1.15rem;font-weight:900;box-shadow:0 12px 26px rgba(0,0,0,.25);display:flex;align-items:center;gap:8px}
      .angus-fab img{width:26px;height:26px;border-radius:6px;object-fit:cover}
      .angus-panel{position:fixed;right:24px;bottom:92px;width:380px;max-width:calc(100vw - 32px);z-index:9999;display:none;background:#0f0f0f;color:#fff;border:1px solid #222;border-radius:16px;overflow:hidden;box-shadow:0 18px 48px rgba(0,0,0,.45)}
      .angus-head{display:flex;gap:10px;align-items:center;background:#151515;padding:10px 12px;font-weight:800}
      .angus-head img{width:36px;height:36px;border-radius:8px;object-fit:cover}
      .angus-body{padding:10px;display:flex;flex-direction:column;gap:10px;max-height:52vh;overflow:auto}
      .angus-msg{display:flex;gap:8px}
      .angus-msg.me{justify-content:flex-end}
      .angus-bubble{max-width:82%;padding:.6rem .75rem;border-radius:14px;line-height:1.35}
      .angus-msg.me .angus-bubble{background:#1f1f1f;border:1px solid #2a2a2a;color:#fff}
      .angus-msg.bot .angus-bubble{background:#101010;border:1px solid #262626;color:#eee}
      .angus-input{display:flex;gap:8px;padding:10px;border-top:1px solid #1e1e1e;background:#121212}
      .angus-input input{flex:1;background:#0f0f0f;border:1px solid #2a2a2a;color:#fff;border-radius:10px;padding:.6rem .75rem}
      .angus-input button{background:#e64a19;color:#fff;border:none;border-radius:10px;padding:.6rem .9rem;font-weight:800}
      .angus-suggest{display:flex;gap:6px;flex-wrap:wrap}
      .angus-suggest button{background:#161616;border:1px solid #2a2a2a;color:#ffd166;border-radius:999px;padding:.35rem .6rem;font-weight:700;cursor:pointer}
      .angus-products{display:flex;flex-direction:column;gap:8px}
      .angus-card{display:flex;gap:10px;align-items:center;background:#141414;border:1px solid #232323;border-radius:12px;padding:8px}
      .angus-card img{width:48px;height:48px;object-fit:cover;border-radius:8px}
      .angus-card .pname{font-weight:700}
      .angus-card .price{font-weight:900}
      .angus-card .act{margin-left:auto}
      .angus-min{opacity:.7;font-size:.85rem}
    `;
    document.head.appendChild(css);

    const fab = document.createElement('button');
    fab.className='angus-fab';
    fab.innerHTML = `<img src="css/IMAGES/Angusgif.gif" alt=""> <span>ANGUS — ajuda?</span>`;

    const panel = document.createElement('div'); panel.className='angus-panel';
    panel.innerHTML = `
      <div class="angus-head">
        <img src="css/IMAGES/Angusgif.gif" alt="ANGUS">
        <div>ANGUS <span style="color:#ffd166">online</span></div>
        <button class="angus-close" style="margin-left:auto;background:#222;color:#fff;border:1px solid #333;border-radius:8px;padding:.25rem .5rem">✕</button>
      </div>
      <div class="angus-body" id="angusBody"></div>
      <div class="angus-input">
        <input id="angusInput" placeholder="Pergunte por kits, clube, rastreio…">
        <button id="angusSend">Enviar</button>
      </div>
    `;
    document.body.append(fab, panel);

    const body = panel.querySelector('#angusBody');
    const input = panel.querySelector('#angusInput');
    const sendBtn = panel.querySelector('#angusSend');
    panel.querySelector('.angus-close').onclick = () => (panel.style.display = 'none');
    fab.onclick = () => (panel.style.display = panel.style.display === 'block' ? 'none' : 'block');

    function scrollBottom(){ body.scrollTop = body.scrollHeight; }
    function addMsg(role, html){
      const wrap = document.createElement('div'); wrap.className = `angus-msg ${role}`;
      const b = document.createElement('div'); b.className = 'angus-bubble'; b.innerHTML = html;
      wrap.appendChild(b); body.appendChild(wrap); scrollBottom();
      const hist = loadHistory(); hist.push({role, html}); saveHistory(hist);
      return b;
    }
    function suggest(){
      const box = document.createElement('div'); box.className = 'angus-suggest';
      [['Ver Super Kits','super kits'],['Entrar no Clube','clube'],['Rastrear Pedido','rastreio'],['Pagamento','pagamento']]
      .forEach(([label, text]) => { const btn = document.createElement('button'); btn.textContent = label; btn.onclick = () => handleSend(text); box.appendChild(btn); });
      body.appendChild(box); scrollBottom();
    }
    function confirmNav(url){
      const box = document.createElement('div'); box.style.cssText='display:flex;gap:8px;margin-top:6px';
      const go  = document.createElement('button'); go.textContent = 'Abrir agora'; go.style.cssText='background:#e64a19;border:none;color:#fff;border-radius:10px;padding:.45rem .7rem;font-weight:800;cursor:pointer';
      const stay= document.createElement('button'); stay.textContent='Ficar aqui'; stay.style.cssText='background:#1c1c1c;border:1px solid #2a2a2a;color:#ddd;border-radius:10px;padding:.45rem .7rem;font-weight:700;cursor:pointer';
      go.onclick = ()=> location.assign(url);
      stay.onclick= ()=> addMsg('bot','Tranquilo! Posso explicar outra coisa ou procurar produtos 😉');
      body.appendChild(box); box.append(go, stay); scrollBottom();
    }
    function showFoundProducts(q){
      const found = searchProducts(q);
      if(!found.length) return false;
      const c = addMsg('bot', `Encontrei alguns itens para <b>${escapeHtml(q)}</b>:`);
      const list = document.createElement('div'); list.className = 'angus-products';
      found.forEach(p=>{
        const row = document.createElement('div'); row.className='angus-card';
        const firstImg = Array.isArray(p.img) ? p.img[0] : p.img;
        row.innerHTML = `
          <img src="${firstImg}" alt="">
          <div>
            <div class="pname">${p.name}</div>
            <div class="angus-min">${p.cat || ''}</div>
            <div class="price">${BRL(p.price)}</div>
          </div>
          <div class="act">
            <button class="btn-add" style="background:#e64a19;color:#fff;border:none;border-radius:8px;padding:.35rem .6rem;font-weight:800">Adicionar</button>
          </div>
        `;
        row.querySelector('.btn-add').onclick = () => {
          if (typeof window.addToCart === 'function'){ window.addToCart(p); addMsg('bot', `✅ Adicionado: <b>${p.name}</b>.`); }
          else { addMsg('bot', `Use o carrinho para adicionar este item.`); }
        };
        list.appendChild(row);
      });
      c.appendChild(list);
      return true;
    }

    const hist = loadHistory();
    if (hist.length) hist.forEach(m => addMsg(m.role, m.html));
    else {
      addMsg('bot', `Olá, eu sou o <b>ANGUS</b> 🐮<br><span class="angus-min">Explico <b>Super Kits</b>, <b>Produtos</b>, <b>Minha Conta</b>, <b>Frete</b>/<b>Pagamento</b> e também busco itens.</span>`);
      suggest();
    }

    function handleSend(text){
      const q = (text || input.value || '').trim();
      if(!q) return;
      addMsg('me', escapeHtml(q)); input.value = '';
      const lower = q.toLowerCase();

      if (/(super\s*kits?|kits?\s+premium|cl[aá]ssico|fam[íi]lia)/i.test(lower)){
        addMsg('bot', `
          <b>Super Kits</b> são combos prontos:
          <ul style="margin:.4rem 0 0 1rem">
            <li><b>Clássico</b>: mix enxuto e preço menor.</li>
            <li><b>Família</b>: mais itens/variedade.</li>
            <li><b>Premium</b>: cortes superiores e extras.</li>
          </ul>
          Quer abrir a página dos kits?`);
        confirmNav('./superkits.html');
        return;
      }

      if (/(produto|bovinos|aves|pescados|su[ií]nos|bebidas|doces|vegetal)/i.test(lower)){
        addMsg('bot', `Temos <b>Bovinos</b>, <b>Aves</b>, <b>Pescados</b>, <b>Suínos</b>, <b>100% Vegetal</b>, <b>Bebidas</b> e <b>Doces</b>. Frete <b>grátis a partir de R$ 199</b>. Digite por ex.: "picanha", "ancho", "salmão".`);
        if(!showFoundProducts(q)) addMsg('bot','Me diga um item que eu encontro 😉');
        return;
      }

      if (/(minha\s+conta|dashboard|painel|hist[oó]rico|gastos|cashback)/i.test(lower)){
        addMsg('bot', `Em <b>Minha Conta</b> você vê gasto do mês, cashback acumulado, projeção anual e histórico com <b>rastreio</b>. Abrir agora?`);
        confirmNav('./minhaconta.html'); return;
      }

      if (/(frete|prazo|entrega)/i.test(lower)){
        addMsg('bot','Frete <b>grátis a partir de R$ 199</b> e rastreio em tempo real. Quer abrir o rastreio?');
        confirmNav('./rastreio.html'); return;
      }
      if (/(pagamento|pix|boleto|cart[aã]o)/i.test(lower)){
        addMsg('bot','Aceitamos <b>Pix</b>, <b>Boleto</b> e <b>Cartão</b>. Abrir a tela de pagamento (demo)?');
        confirmNav('./pagamento.html'); return;
      }
      if (/(rastrei|acompanhar|pedido)/i.test(lower)){
        addMsg('bot','Posso abrir a tela de rastreio 🙂'); confirmNav('./rastreio.html'); return;
      }

      if (showFoundProducts(q)) return;

      addMsg('bot','Posso explicar <b>Super Kits</b>, <b>Produtos</b>, <b>Minha Conta</b>, <b>Frete</b> e <b>Pagamento</b> — ou procurar itens por nome 😉');
      suggest();
    }

    sendBtn.onclick = () => handleSend();
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSend(); });
  };

  window.initBot.__chatv2 = true;
  document.addEventListener('DOMContentLoaded', () => window.initBot(true));
})();
