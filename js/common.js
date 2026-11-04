'use strict';

/* =========================================================
   หารด้วย — โค้ดที่ทุกหน้าใช้ร่วมกัน
   เงินเก็บเป็น "สตางค์" (จำนวนเต็ม) เพื่อเลี่ยงปัญหาทศนิยม
   ข้อมูลเก็บใน localStorage ของเบราว์เซอร์
   ========================================================= */

const KEY = 'harkan-v1';
const APP_NAME = 'หารด้วย';
const CATS = {
  stay:   { label: 'ที่พัก',    bg: '#eae4ff', icon: 'home' },
  food:   { label: 'อาหาร',    bg: '#fff0df', icon: 'receipt' },
  travel: { label: 'เดินทาง',  bg: '#dff4ff', icon: 'plane' },
  fun:    { label: 'กิจกรรม',  bg: '#ddf7eb', icon: 'sparkle' },
  shop:   { label: 'ช็อปปิ้ง', bg: '#ffe6ee', icon: 'bag' },
  other:  { label: 'อื่นๆ',     bg: '#eef2f1', icon: 'wallet' },
};
const PALETTE = ['#7557d8', '#ec8c54', '#ef6b8e', '#397ec7', '#1f9e74', '#c9932b', '#0e9bb5', '#b5509d', '#5b6ee1', '#d0573f'];
const PAGES = [
  ['index.html', 'home', 'ภาพรวม'],
  ['members.html', 'users', 'สมาชิก'],
  ['expenses.html', 'receipt', 'ค่าใช้จ่าย'],
  ['summary.html', 'settle', 'เคลียร์เงิน'],
  ['report.html', 'report', 'รายงาน'],
];

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = c => '฿' + (c / 100).toLocaleString('th-TH', { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 });
const toCents = v => Math.round(parseFloat(v) * 100);
const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const thDate = (d, opt = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('th-TH', opt) : '';
const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/* ---------- icons (ชุดเดียวกับดีไซน์ Figma) ---------- */
const ICONS = {
  home: '<path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.5V21h13V9.5M9 21v-7h6v7"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  settle: '<path d="M20 7H5M8 3 4 7l4 4M4 17h15M16 13l4 4-4 4"/>',
  report: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 13h6M9 17h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  wallet: '<path d="M4 6h15a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h13"/><path d="M16 12h5v4h-5a2 2 0 0 1 0-4Z"/>',
  arrowUp: '<path d="m18 15-6-6-6 6"/><path d="M12 9v12"/>',
  arrowDown: '<path d="m6 9 6 6 6-6"/><path d="M12 3v12"/>',
  more: '<circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1-1"/>',
  qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2M20 14h1"/>',
  plane: '<path d="M22 2 9.5 14.5"/><path d="m22 2-7 20-4-9-9-4Z"/>',
  sparkle: '<path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5ZM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7Z"/>',
  bag: '<path d="M6 7h12l1 14H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  printer: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2"/><rect x="6" y="14" width="12" height="7"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
};
const icon = (name, size = 20) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

/* ---------- avatar & category ---------- */
const colorOf = m => m.color || PALETTE[hash(m.id) % PALETTE.length];
const initialOf = n => (String(n || '?').replace(/^[เแโใไ]/, '')[0] || '?');
const avatar = (m, px = 40) => {
  const c = colorOf(m);
  return `<div class="avatar" style="width:${px}px;height:${px}px;font-size:${Math.round(px * .36)}px;background:${c}1f;color:${c}">${esc(initialOf(m.name))}</div>`;
};
const catOf = k => CATS[k] || CATS.other;
const expenseIcon = (k, size = 20) => `<div class="expense-icon" style="background:${catOf(k).bg}">${icon(catOf(k).icon, size)}</div>`;

/* ---------- state ---------- */
function blank() { return { trip: 'ทริปของเรา', members: [], expenses: [], paid: {} }; }
function normalize(s) {
  if (!s || !Array.isArray(s.members) || !Array.isArray(s.expenses)) return null;
  if (!s.paid || typeof s.paid !== 'object') s.paid = {};
  if (typeof s.trip !== 'string') s.trip = 'ทริปของเรา';
  return s;
}
function load() {
  try { return normalize(JSON.parse(localStorage.getItem(KEY))) || blank(); }
  catch (e) { return blank(); }
}
let state = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { toast('บันทึกข้อมูลไม่ได้ — เบราว์เซอร์อาจปิดการเก็บข้อมูลไว้'); }
  refreshShell();
}
const memberOf = (st, id) => st.members.find(m => m.id === id);
const nameOf = (st, id) => (memberOf(st, id) || { name: '?' }).name;
const changed = () => { if (typeof window.onStateChange === 'function') window.onStateChange(); };

/* เปิดหลายแท็บพร้อมกัน → ข้อมูลอัปเดตตามกัน */
window.addEventListener('storage', e => {
  if (e.key !== KEY) return;
  state = load();
  refreshShell();
  changed();
});

/* =========================================================
   คำนวณ
   ========================================================= */
/* แบ่งยอดของรายการหนึ่ง → { memberId: สตางค์ } */
function splitOf(e, valid) {
  const among = e.among.filter(id => !valid || valid.has(id));
  const out = {};
  if (!among.length) return out;
  if (e.shares) {
    among.forEach(id => (out[id] = e.shares[id] || 0));
    return out;
  }
  const base = Math.floor(e.amount / among.length);
  let rem = e.amount - base * among.length;   // เศษสตางค์ปัดให้คนแรก ๆ คนละ 1 สตางค์
  among.forEach(id => (out[id] = base + (rem-- > 0 ? 1 : 0)));
  return out;
}

function compute(st) {
  const per = {};
  const valid = new Set(st.members.map(m => m.id));
  st.members.forEach(m => (per[m.id] = { paid: 0, share: 0, items: [] }));
  let total = 0;

  st.expenses.forEach(e => {
    if (!per[e.payer]) return;
    const split = splitOf(e, valid);
    if (!Object.keys(split).length) return;
    total += e.amount;
    per[e.payer].paid += e.amount;
    Object.entries(split).forEach(([id, s]) => {
      per[id].share += s;
      per[id].items.push({ e, amount: s });
    });
  });
  st.members.forEach(m => (per[m.id].net = per[m.id].paid - per[m.id].share));

  // จับคู่คนที่ต้องจ่าย ↔ คนที่ต้องได้คืน ให้โอนน้อยครั้งที่สุด
  const cred = [], debt = [];
  st.members.forEach(m => {
    const n = per[m.id].net;
    if (n > 0) cred.push({ id: m.id, v: n });
    else if (n < 0) debt.push({ id: m.id, v: -n });
  });
  cred.sort((a, b) => b.v - a.v);
  debt.sort((a, b) => b.v - a.v);
  const transfers = [];
  let i = 0, j = 0;
  while (i < debt.length && j < cred.length) {
    const x = Math.min(debt[i].v, cred[j].v);
    if (x > 0) transfers.push({ from: debt[i].id, to: cred[j].id, amount: x });
    debt[i].v -= x; cred[j].v -= x;
    if (!debt[i].v) i++;
    if (!cred[j].v) j++;
  }
  const paidMap = st.paid || {};
  transfers.forEach(t => {
    t.key = t.from + '>' + t.to;
    t.done = paidMap[t.key] === t.amount;
  });
  const pending = transfers.filter(t => !t.done);
  return {
    per, total, transfers,
    pendingAmount: pending.reduce((s, t) => s + t.amount, 0),
    doneAmount: transfers.filter(t => t.done).reduce((s, t) => s + t.amount, 0),
  };
}
function togglePaid(key, amount) {
  if (state.paid[key] === amount) delete state.paid[key];
  else state.paid[key] = amount;
  save();
}
function dateRange(st) {
  const ds = st.expenses.map(e => e.date).filter(Boolean).sort();
  if (!ds.length) return '';
  if (ds[0] === ds[ds.length - 1]) return thDate(ds[0], { day: 'numeric', month: 'long', year: 'numeric' });
  return `${thDate(ds[0], { day: 'numeric', month: 'short' })} – ${thDate(ds[ds.length - 1], { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

/* =========================================================
   PromptPay QR (มาตรฐาน EMVCo / Thai QR Payment)
   ========================================================= */
function ppNormalize(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.length === 10 && d[0] === '0') return { type: '01', val: ('0000000000000' + '66' + d.slice(1)).slice(-13) }; // มือถือ
  if (d.length === 13) return { type: '02', val: d };  // เลขบัตรประชาชน / เลขผู้เสียภาษี
  if (d.length === 15) return { type: '03', val: d };  // e-Wallet ID
  return null;
}
function ppFormat(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 13) return `${d[0]}-${d.slice(1, 5)}-${d.slice(5, 10)}-${d.slice(10, 12)}-${d[12]}`;
  return d;
}
const tlv = (id, v) => id + String(v.length).padStart(2, '0') + v;
function crc16(s) {
  let c = 0xFFFF;
  for (let i = 0; i < s.length; i++) {
    c ^= s.charCodeAt(i) << 8;
    for (let k = 0; k < 8; k++) c = (c & 0x8000) ? ((c << 1) ^ 0x1021) : (c << 1);
    c &= 0xFFFF;
  }
  return c.toString(16).toUpperCase().padStart(4, '0');
}
function ppPayload(raw, cents) {
  const n = ppNormalize(raw);
  if (!n) return null;
  const p = tlv('00', '01')
    + tlv('01', cents ? '12' : '11')
    + tlv('29', tlv('00', 'A000000677010111') + tlv(n.type, n.val))
    + tlv('53', '764')
    + (cents ? tlv('54', (cents / 100).toFixed(2)) : '')
    + tlv('58', 'TH')
    + '6304';
  return p + crc16(p);
}
function qrSvg(text) {
  if (typeof qrcode !== 'function') return '<div class="no-pp">โหลดตัวสร้าง QR ไม่ได้ — ลองรีเฟรชหน้า</div>';
  const q = qrcode(0, 'M');
  q.addData(text);
  q.make();
  return q.createSvgTag(4, 1);
}

/* =========================================================
   ชิ้นส่วน HTML ที่ใช้หลายหน้า
   ========================================================= */
function expenseRowHtml(st, e, opts = {}) {
  const n = e.among.length;
  return `<div class="expense-row">
    ${expenseIcon(e.cat)}
    <div class="expense-main">
      <strong>${esc(e.title)}</strong>
      <small>${e.date ? thDate(e.date) + ' · ' : ''}${esc(nameOf(st, e.payer))}เป็นคนจ่าย</small>
    </div>
    <div class="expense-amount">
      <strong>${fmt(e.amount)}</strong>
      <small>${e.shares ? 'หารไม่เท่ากัน' : n === st.members.length ? `หารทุกคน (${n})` : `หาร ${n} คน`}</small>
    </div>
    ${opts.edit ? `<button class="more-btn" data-edit-exp="${e.id}" aria-label="แก้ไข ${esc(e.title)}">${icon('more', 18)}</button>` : ''}
  </div>`;
}

function netText(n) {
  if (n > 0) return { cls: 'positive', label: 'จะได้รับ', val: '+' + fmt(n) };
  if (n < 0) return { cls: '', label: 'ต้องจ่าย', val: '−' + fmt(-n) };
  return { cls: 'zero', label: 'เคลียร์แล้ว', val: fmt(0) };
}
function miniBalanceHtml(m, net, sub) {
  const t = netText(net);
  return `<div class="mini-balance">${avatar(m, 34)}
    <div><strong>${esc(m.name)}</strong><small>${sub || t.label}</small></div>
    <b class="${t.cls}">${t.val}</b></div>`;
}

/* การ์ดรายการโอน — interactive = ปุ่มคัดลอก/QR/โอนแล้ว, showQr = ฟังก์ชันบอกว่าเปิด QR ไหม */
function transferCardsHtml(st, c, { interactive = false, showQr = () => false } = {}) {
  return `<div class="transfer-list">` + c.transfers.map((t, i) => {
    const from = memberOf(st, t.from), to = memberOf(st, t.to);
    const payload = to && to.pp ? ppPayload(to.pp, t.amount) : null;
    const qrOpen = !t.done && showQr(t);
    return `<div class="transfer-card ${t.done ? 'is-done' : ''}">
      <span class="step">${t.done ? icon('check', 12) : i + 1}</span>
      <div class="transfer-people">
        <span class="tp">${avatar(from)}<div><strong>${esc(from.name)}</strong><small>โอนให้</small></div></span>
        ${icon('chevron', 18)}
        <span class="tp">${avatar(to)}<div><strong>${esc(to.name)}</strong><small>${to.pp ? 'พร้อมเพย์ ' + esc(ppFormat(to.pp)) : '<span class="warn-text">ยังไม่ใส่พร้อมเพย์</span>'}</small></div></span>
      </div>
      <strong class="transfer-amount">${fmt(t.amount)}</strong>
      ${interactive ? `<div class="transfer-actions">
          ${to.pp ? `<button data-copy-pp="${esc(to.pp)}">${icon('copy', 15)} คัดลอกพร้อมเพย์</button>` : ''}
          ${!t.done ? `<button class="qr-btn" data-qr="${t.key}">${icon('qr', 16)} ${qrOpen ? 'ซ่อนคิวอาร์' : 'แสดงคิวอาร์'}</button>` : ''}
          <button class="done-btn ${t.done ? 'on' : ''}" data-paid="${t.key}" data-amt="${t.amount}">${icon('check', 15)} ${t.done ? 'โอนแล้ว' : 'ทำเครื่องหมายว่าโอนแล้ว'}</button>
        </div>`
        : t.done ? `<div class="transfer-actions"><span class="paid-tag">${icon('check', 13)} โอนแล้ว</span></div>` : ''}
      ${qrOpen ? (payload
        ? `<div class="inline-qr"><div class="qr-box">${qrSvg(payload)}<span>PromptPay</span></div>
            <div><strong>พร้อมเพย์ของ${esc(to.name)}</strong><span>ยอดชำระ ${fmt(t.amount)}</span><small>สแกนด้วยแอปธนาคารใดก็ได้</small></div></div>`
        : `<div class="no-pp">${esc(to.name)} ยังไม่ได้ใส่เบอร์พร้อมเพย์ — ${interactive ? '<a class="text-btn" href="members.html">เพิ่มที่หน้าสมาชิก</a>' : 'ติดต่อขอเลขบัญชีจากเพื่อนโดยตรง'}</div>`) : ''}
    </div>`;
  }).join('') + `</div>`;
}

/* รายงาน (ใช้ทั้งหน้า report และหน้า view ที่เพื่อนเปิด) — sel = 'all' หรือ member id */
function reportHtml(st, sel, { readOnly = false } = {}) {
  const c = compute(st);
  const n = st.members.length || 1;
  const tabs = `<div class="people-tabs" role="tablist">
    <button class="${sel === 'all' ? 'active' : ''}" data-sel="all" role="tab"><span class="trip-ico">${icon('plane', 16)}</span><span>ทั้งทริป</span></button>
    ${st.members.map(m => `<button class="${sel === m.id ? 'active' : ''}" data-sel="${m.id}" role="tab">${avatar(m, 32)}<span>${esc(m.name)}</span></button>`).join('')}
  </div>`;

  const shareBlock = who => readOnly ? '' : `
    <button class="share-btn" data-share-link="${who}">${icon('link', 19)} คัดลอกลิงก์ส่งให้${who === 'all' ? 'เพื่อน' : esc(nameOf(st, who))}</button>
    <div class="hero-actions">
      <a class="line-share" data-line="${who}" target="_blank" rel="noopener" href="#">${icon('chat', 16)} ส่งทาง LINE</a>
      <button data-print>${icon('printer', 16)} พิมพ์ / PDF</button>
    </div>
    <p class="privacy-note">ลิงก์นี้เปิดดูได้โดยไม่ต้องเข้าสู่ระบบ และไม่สามารถแก้ไขข้อมูลได้</p>`;

  let hero, detail;
  if (sel === 'all' || !memberOf(st, sel)) {
    const left = c.transfers.filter(t => !t.done).length;
    hero = `<div class="report-hero">
      <div class="report-person">
        <div class="avatar" style="width:48px;height:48px;background:rgba(255,255,255,.1);color:#72d9b4">${icon('plane', 22)}</div>
        <div><small>รายงานทริป</small><h2>${esc(st.trip || 'ทริปของเรา')}</h2></div>
        <span class="verified">${icon('check', 14)} คำนวณล่าสุด</span>
      </div>
      <div class="report-numbers">
        <div><span>ค่าใช้จ่ายทั้งหมด</span><strong>${fmt(c.total)}</strong></div>
        <div><span>เฉลี่ยต่อคน (${st.members.length} คน)</span><strong>${fmt(Math.round(c.total / n))}</strong></div>
        <div class="${left ? 'orange' : 'green'}"><span>${left ? `ต้องโอนอีก ${left} รายการ` : 'เคลียร์ครบแล้ว'}</span><strong>${fmt(c.pendingAmount)}</strong></div>
      </div>
      ${shareBlock('all')}
    </div>`;
    detail = `<div class="panel report-detail">
      <div class="panel-head"><div><h2>ใครใช้เท่าไหร่</h2><p>จ่ายไปเท่าไหร่ ใช้จริงเท่าไหร่ ยอดสุทธิ</p></div></div>
      ${st.members.map(m => {
        const p = c.per[m.id], t = netText(p.net);
        return `<div class="report-expense">${avatar(m)}
          <div><strong>${esc(m.name)}</strong><small>จ่ายไป ${fmt(p.paid)} · ใช้จริง ${fmt(p.share)}</small></div>
          <b class="${t.cls === 'positive' ? 'pos-text' : t.cls === 'zero' ? '' : 'neg-text'}">${t.val}<small>${t.label}</small></b></div>`;
      }).join('')}
    </div>`;
  } else {
    const m = memberOf(st, sel), p = c.per[sel], t = netText(p.net);
    const mine = c.transfers.filter(x => x.from === sel || x.to === sel);
    hero = `<div class="report-hero">
      <div class="report-person">${avatar(m, 48)}
        <div><small>รายงานของ</small><h2>${esc(m.name)}</h2></div>
        <span class="verified">${icon('check', 14)} คำนวณล่าสุด</span>
      </div>
      <div class="report-numbers">
        <div><span>จ่ายไปทั้งหมด</span><strong>${fmt(p.paid)}</strong></div>
        <div><span>ส่วนที่ต้องรับผิดชอบ</span><strong>${fmt(p.share)}</strong></div>
        <div class="${p.net >= 0 ? 'green' : 'orange'}"><span>${p.net > 0 ? 'จะได้รับคืน' : p.net < 0 ? 'ต้องจ่ายเพิ่ม' : 'เคลียร์แล้ว'}</span><strong>${fmt(Math.abs(p.net))}</strong></div>
      </div>
      ${mine.length ? `<p class="privacy-note" style="margin:-8px 0 14px;font-size:12.5px;color:#cfe3dc">${mine.map(x => x.from === sel
        ? `โอนให้ ${esc(nameOf(st, x.to))} ${fmt(x.amount)}${x.done ? ' ✓' : ''}`
        : `รับจาก ${esc(nameOf(st, x.from))} ${fmt(x.amount)}${x.done ? ' ✓' : ''}`).join(' · ')}</p>` : ''}
      ${shareBlock(sel)}
    </div>`;
    detail = `<div class="panel report-detail">
      <div class="panel-head"><div><h2>รายละเอียดค่าใช้จ่าย</h2><p>${p.items.length} รายการที่เกี่ยวข้อง</p></div></div>
      ${p.items.length ? p.items.map(({ e, amount }) => `<div class="report-expense">${expenseIcon(e.cat)}
          <div><strong>${esc(e.title)}</strong><small>${e.date ? thDate(e.date) + ' · ' : ''}ยอดรวม ${fmt(e.amount)} · ${esc(nameOf(st, e.payer))}จ่าย</small></div>
          <b>${fmt(amount)}<small>ส่วนของ${esc(m.name)}</small></b>
          ${readOnly ? '' : `<button class="more-btn" data-edit-exp="${e.id}" aria-label="แก้ไข">${icon('edit', 16)}</button>`}</div>`).join('')
        : '<div class="empty">ไม่มีรายการที่เกี่ยวข้อง</div>'}
    </div>`;
  }
  return tabs + `<section class="report-grid">${hero}${detail}</section>`;
}

/* =========================================================
   ลิงก์รายงาน — เก็บข้อมูลทั้งหมดไว้ใน URL (view.html#r=...)
   ========================================================= */
const b64u = bytes => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64u = str => {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, c => c.charCodeAt(0));
};
async function encodeState(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  if (window.CompressionStream) {
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
      return 'z' + b64u(new Uint8Array(await new Response(stream).arrayBuffer()));
    } catch (e) { /* ใช้แบบไม่บีบอัด */ }
  }
  return 'j' + b64u(bytes);
}
async function decodeState(code) {
  let bytes = unb64u(code.slice(1));
  if (code[0] === 'z') {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  }
  const st = normalize(JSON.parse(new TextDecoder().decode(bytes)));
  if (!st) throw new Error('bad data');
  return st;
}
async function buildShareLink(person) {
  const code = await encodeState({ ...state, at: Date.now() });
  return new URL('view.html', location.href).href.split('#')[0] + '#r=' + code + (person && person !== 'all' ? '&p=' + person : '');
}
const lineUrl = link => 'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(link);
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.append(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove();
    return ok;
  }
}
async function copyReportLink(person) {
  if (!state.members.length || !state.expenses.length) return toast('ยังไม่มีข้อมูลพอสำหรับรายงาน');
  const link = await buildShareLink(person);
  const who = person && person !== 'all' ? `ของ${nameOf(state, person)}` : '';
  toast((await copyText(link)) ? `คัดลอกลิงก์รายงาน${who}แล้ว` : 'คัดลอกไม่สำเร็จ');
}

/* =========================================================
   โครงหน้า: sidebar + topbar + เมนูมือถือ (ใส่ให้ทุกหน้าอัตโนมัติ)
   ========================================================= */
function renderShell(active, opts = {}) {
  const content = $('.content');
  const shell = document.createElement('div');
  shell.className = 'app-shell' + (opts.noNav ? ' no-sidebar' : '');
  const brand = sz => `<span class="brand-mark">${icon('settle', sz)}</span>`;

  shell.innerHTML = `
    ${opts.noNav ? '' : `<aside class="sidebar">
      <a class="brand" href="index.html">${brand(23)}<span>${APP_NAME}</span></a>
      <label class="trip-switcher" title="แก้ชื่อทริป">
        <div class="trip-thumb">${icon('plane', 19)}</div>
        <div><small>ทริปปัจจุบัน</small><input id="tripName" class="trip-input" maxlength="60" placeholder="ตั้งชื่อทริป" aria-label="ชื่อทริป"></div>
        ${icon('edit', 15)}
      </label>
      <nav class="nav-list">${PAGES.map(([href, ic, label]) =>
        `<a href="${href}" class="${href === active ? 'active' : ''}" ${href === active ? 'aria-current="page"' : ''}>${icon(ic, 20)}<span>${label}</span>
         ${href === 'members.html' ? '<b id="cntM"></b>' : ''}${href === 'expenses.html' ? '<b id="cntE"></b>' : ''}</a>`).join('')}</nav>
      <div class="sidebar-bottom">
        <div class="tip-card">
          ${icon('sparkle', 18)}
          <strong>ส่งสรุปให้เพื่อน</strong>
          <p>ลิงก์รายงานพร้อม QR พร้อมเพย์ ส่งในกลุ่มแชทแล้วสแกนจ่ายได้เลย</p>
          <button data-copy-report>คัดลอกลิงก์รายงาน</button>
        </div>
        <div class="profile-row">
          <div class="store-icon">${icon('database', 18)}</div>
          <div><strong>ข้อมูลในเครื่องนี้</strong><small>บันทึกอัตโนมัติ</small></div>
          <a href="index.html#manage" title="จัดการข้อมูล" aria-label="จัดการข้อมูล">${icon('more', 18)}</a>
        </div>
      </div>
    </aside>`}
    <main class="main">
      <header class="topbar no-print">
        <a class="mobile-brand" href="index.html">${brand(19)}<strong>${APP_NAME}</strong></a>
        <div class="breadcrumb"><span>ทริปของฉัน</span>${icon('chevron', 14)}<strong id="crumbTrip"></strong></div>
        <div class="top-actions">
          ${opts.noNav
            ? `<a class="outline-btn" href="index.html">${icon('plus', 17)} สร้างทริปของฉัน</a>`
            : `<button class="icon-btn" data-copy-report title="คัดลอกลิงก์รายงาน" aria-label="คัดลอกลิงก์รายงาน">${icon('link', 20)}</button>`}
        </div>
      </header>
    </main>
    ${opts.noNav ? '' : `<nav class="mobile-nav">${PAGES.map(([href, ic, label]) =>
      `<a href="${href}" class="${href === active ? 'active' : ''}">${icon(ic, 21)}<span>${label}</span></a>`).join('')}</nav>
      <button class="mobile-add" data-add-exp aria-label="เพิ่มค่าใช้จ่าย">${icon('plus', 24)}</button>`}`;

  content.parentNode.insertBefore(shell, content);
  $('.main', shell).append(content);

  const tn = $('#tripName');
  if (tn) tn.addEventListener('input', e => { state.trip = e.target.value; save(); changed(); });
  if (opts.crumb) $('#crumbTrip').textContent = opts.crumb;
  refreshShell();

  // ปุ่มที่ใช้ร่วมกันทุกหน้า
  document.addEventListener('click', e => {
    if (e.target.closest('[data-add-exp]')) openExpenseModal();
    else if (e.target.closest('[data-copy-report]')) copyReportLink('all');
    const ed = e.target.closest('[data-edit-exp]');
    if (ed) openExpenseModal(ed.dataset.editExp);
  });
  if (location.hash === '#add' && !opts.noNav) {
    history.replaceState(null, '', location.pathname);
    setTimeout(() => openExpenseModal(), 50);
  }
}
function refreshShell() {
  const tn = $('#tripName');
  if (tn && document.activeElement !== tn) tn.value = state.trip;
  const crumb = $('#crumbTrip');
  if (crumb && tn) crumb.textContent = state.trip || 'ทริปของเรา';
  if ($('#cntM')) $('#cntM').textContent = state.members.length || '';
  if ($('#cntE')) $('#cntE').textContent = state.expenses.length || '';
}

/* ---------- toast ---------- */
let toastTimer;
function toast(msg, action) {
  let t = $('#toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status');
    document.body.append(t);
  }
  t.hidden = false;
  t.innerHTML = `<span>${icon('check', 16)}</span><div>${esc(msg)}</div>`;
  if (action) {
    const b = document.createElement('button');
    b.textContent = action.label;
    b.onclick = () => { t.hidden = true; action.run(); };
    t.append(b);
  }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), action ? 5000 : 2600);
}

/* =========================================================
   Modal เพิ่ม / แก้ไขค่าใช้จ่าย (ตามดีไซน์ Figma)
   ========================================================= */
function openExpenseModal(id) {
  if (!state.members.length) {
    toast('เพิ่มสมาชิกก่อน แล้วค่อยบันทึกค่าใช้จ่าย');
    if (!location.pathname.endsWith('members.html')) setTimeout(() => (location.href = 'members.html'), 900);
    return;
  }
  if ($('.modal-backdrop')) return;
  const ex = id ? state.expenses.find(x => x.id === id) : null;
  if (id && !ex) return;
  const m = {
    cat: ex ? ex.cat : 'food',
    split: ex && ex.shares ? 'unequal' : 'equal',
    among: new Set(ex ? ex.among : state.members.map(x => x.id)),
    shares: {},
  };
  if (ex && ex.shares) Object.entries(ex.shares).forEach(([k, v]) => (m.shares[k] = (v / 100).toString()));

  const back = document.createElement('div');
  back.className = 'modal-backdrop';
  back.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="xHead">
    <div class="modal-head">
      <div><span class="eyebrow">${ex ? 'ปรับข้อมูลและคำนวณใหม่' : 'บันทึกรายการใหม่'}</span><h2 id="xHead">${ex ? 'แก้ไขค่าใช้จ่าย' : 'เพิ่มค่าใช้จ่าย'}</h2></div>
      <button data-x aria-label="ปิด">${icon('close', 21)}</button>
    </div>
    <div class="form-grid">
      <label class="full"><span>ชื่อรายการ</span><input id="xTitle" maxlength="60" placeholder="เช่น อาหารเย็นร้านป้าสวย" autocomplete="off" value="${esc(ex ? ex.title : '')}"></label>
      <label><span>จำนวนเงิน (บาท)</span><div class="money-input"><b>฿</b><input id="xAmount" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00" value="${ex ? ex.amount / 100 : ''}"></div></label>
      <label><span>วันที่</span><input id="xDate" type="date" value="${ex ? ex.date || '' : today()}"></label>
      <label class="full"><span>คนจ่ายเงิน</span><select id="xPayer">${state.members.map(p =>
        `<option value="${p.id}" ${ex && ex.payer === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
    </div>
    <div class="form-section"><span class="field-label">หมวดหมู่</span><div class="cat-picker" id="xCats"></div></div>
    <div class="form-section"><span class="field-label">วิธีหาร</span>
      <div class="split-toggle">
        <button type="button" data-split="equal"><span>${icon('users', 18)}</span><div><strong>หารเท่ากัน</strong><small>เฉลี่ยให้ทุกคน</small></div></button>
        <button type="button" data-split="unequal"><span>${icon('settle', 18)}</span><div><strong>หารไม่เท่ากัน</strong><small>ระบุยอดแต่ละคน</small></div></button>
      </div>
    </div>
    <div class="form-section">
      <div class="field-label between"><span>หารกับใครบ้าง · <small id="xCount"></small></span><button type="button" class="text-btn" id="xAll">เลือกทั้งหมด</button></div>
      <div class="participant-list" id="xPeople"></div>
      <div id="xCheck"></div>
    </div>
    ${ex ? `<div class="audit-note">${icon('sparkle', 17)}<p><strong>ระบบจะคำนวณทั้งทริปใหม่อัตโนมัติ</strong><br>ยอดคงเหลือและรายการเคลียร์เงินของทุกคนจะอัปเดตทันที</p></div>` : ''}
    <div class="modal-actions">
      ${ex ? `<button type="button" class="del-btn" id="xDel">${icon('trash', 17)} ลบ</button>` : ''}
      <button type="button" class="cancel-btn" data-x>ยกเลิก</button>
      <button type="button" class="primary-btn" id="xSave">${ex ? 'บันทึกและคำนวณใหม่' : 'เพิ่มค่าใช้จ่าย'}</button>
    </div>
  </div>`;
  document.body.append(back);
  document.body.style.overflow = 'hidden';
  const q = s => $(s, back);
  const amount = () => toCents(q('#xAmount').value) || 0;
  const shareSum = () => [...m.among].reduce((s, id) => s + (toCents(m.shares[id]) || 0), 0);

  function drawCats() {
    q('#xCats').innerHTML = Object.entries(CATS).map(([k, v]) =>
      `<button type="button" data-cat="${k}" class="${m.cat === k ? 'active' : ''}">${expenseIcon(k, 15)}${v.label}</button>`).join('');
  }
  function drawSplit() { $$('[data-split]', back).forEach(b => b.classList.toggle('active', b.dataset.split === m.split)); }
  function drawPeople() {
    const n = m.among.size, amt = amount();
    q('#xPeople').innerHTML = state.members.map(p => {
      const on = m.among.has(p.id);
      const right = m.split === 'equal'
        ? `<span>${on && n ? fmt(Math.round(amt / n)) : '–'}</span>`
        : `<input data-share="${p.id}" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0" value="${esc(m.shares[p.id] || '')}" aria-label="ยอดของ ${esc(p.name)}">`;
      return `<div class="participant ${on ? 'selected' : ''}" data-p="${p.id}">
        <span class="checkbox">${on ? icon('check', 14) : ''}</span>${avatar(p, 32)}<strong>${esc(p.name)}</strong>${right}</div>`;
    }).join('');
    q('#xCount').textContent = `${n} คน`;
    drawCheck();
  }
  function drawCheck() {
    const amt = amount();
    if (m.split === 'unequal') {
      const sum = shareSum(), diff = amt - sum;
      q('#xCheck').innerHTML = `<div class="share-check ${diff === 0 && amt ? 'ok' : ''}">
        <span>รวมที่ระบุ ${fmt(sum)}</span>
        <span>${diff === 0 ? (amt ? 'ยอดตรงกันแล้ว ✓' : 'ใส่จำนวนเงินก่อน') : diff > 0 ? `เหลืออีก ${fmt(diff)}` : `เกินมา ${fmt(-diff)}`}</span></div>`;
    } else q('#xCheck').innerHTML = '';
    const ok = q('#xTitle').value.trim() && amt > 0 && m.among.size > 0 && (m.split === 'equal' || shareSum() === amt);
    q('#xSave').disabled = !ok;
  }
  function close() {
    back.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e) { if (e.key === 'Escape') close(); }
  document.addEventListener('keydown', onKey);

  back.addEventListener('mousedown', e => { if (e.target === back) close(); });
  back.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-x]')) return close();
    const cat = t.closest('[data-cat]');
    if (cat) { m.cat = cat.dataset.cat; drawCats(); return; }
    const sp = t.closest('[data-split]');
    if (sp) { m.split = sp.dataset.split; drawSplit(); drawPeople(); return; }
    if (t.closest('#xAll')) {
      if (m.among.size === state.members.length) m.among.clear();
      else state.members.forEach(p => m.among.add(p.id));
      drawPeople(); return;
    }
    const row = t.closest('.participant');
    if (row && !t.matches('input')) {
      const pid = row.dataset.p;
      m.among.has(pid) ? m.among.delete(pid) : m.among.add(pid);
      drawPeople(); return;
    }
    if (t.closest('#xDel')) {
      const removed = ex;
      state.expenses = state.expenses.filter(x => x.id !== ex.id);
      save(); close(); changed();
      toast(`ลบ "${removed.title}" แล้ว`, { label: 'เลิกทำ', run: () => { state.expenses.push(removed); save(); changed(); toast('กู้คืนรายการแล้ว'); } });
      return;
    }
    if (t.closest('#xSave') && !q('#xSave').disabled) {
      const ids = state.members.map(p => p.id).filter(pid => m.among.has(pid));
      const data = {
        id: ex ? ex.id : uid(),
        title: q('#xTitle').value.trim(),
        amount: amount(),
        payer: q('#xPayer').value,
        among: ids,
        cat: m.cat,
        date: q('#xDate').value,
      };
      if (m.split === 'unequal') data.shares = Object.fromEntries(ids.map(pid => [pid, toCents(m.shares[pid]) || 0]));
      if (ex) state.expenses = state.expenses.map(x => (x.id === ex.id ? data : x));
      else state.expenses.push(data);
      save(); close(); changed();
      toast(ex ? 'แก้ไขและคำนวณยอดใหม่แล้ว' : `เพิ่ม "${data.title}" ${fmt(data.amount)} เรียบร้อย`);
    }
  });
  back.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'xAmount') { m.split === 'equal' ? drawPeople() : drawCheck(); }
    else if (t.dataset.share) {
      m.shares[t.dataset.share] = t.value;
      if (t.value && !m.among.has(t.dataset.share)) {
        m.among.add(t.dataset.share);
        const row = t.closest('.participant');
        row.classList.add('selected');
        row.querySelector('.checkbox').innerHTML = icon('check', 14);
        q('#xCount').textContent = `${m.among.size} คน`;
      }
      drawCheck();
    } else drawCheck();
  });

  drawCats(); drawSplit(); drawPeople();
  setTimeout(() => q('#xTitle').focus(), 30);
}

/* ---------- ข้อมูลตัวอย่าง ---------- */
function demoState() {
  const names = ['มิว', 'บอส', 'แพร', 'ต้น'];
  const [a, b, c, d] = names.map((n, i) => ({ id: uid(), name: n, pp: '', color: PALETTE[i] }));
  a.pp = '0812345678'; b.pp = '0898765432'; c.pp = '0641835000';
  const day = k => { const x = new Date(); x.setDate(x.getDate() - k); return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  const all = [a.id, b.id, c.id, d.id];
  return {
    trip: 'เชียงใหม่กับเพื่อน',
    members: [a, b, c, d],
    paid: {},
    expenses: [
      { id: uid(), title: 'ที่พัก 2 คืน', amount: 640000, cat: 'stay', payer: a.id, among: all, date: day(2) },
      { id: uid(), title: 'เช่ารถ + น้ำมัน', amount: 210000, cat: 'travel', payer: b.id, among: all, date: day(2) },
      { id: uid(), title: 'ข้าวซอยมื้อเที่ยง', amount: 36000, cat: 'food', payer: c.id, among: all, date: day(1) },
      { id: uid(), title: 'คาเฟ่ดอยสุเทพ', amount: 76000, cat: 'food', payer: d.id, among: [a.id, c.id, d.id], date: day(1) },
      { id: uid(), title: 'บัตรเข้าชมอุทยาน', amount: 120000, cat: 'fun', payer: a.id, among: all, date: day(0) },
      { id: uid(), title: 'ของฝากถนนคนเดิน', amount: 90000, cat: 'shop', payer: c.id, among: [b.id, c.id, d.id], date: day(0),
        shares: { [b.id]: 20000, [c.id]: 50000, [d.id]: 20000 } },
    ],
  };
}
