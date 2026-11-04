'use strict';

/* =========================================================
   หารด้วย — โค้ดที่ทุกหน้าใช้ร่วมกัน
   เงินเก็บเป็น "สตางค์" (จำนวนเต็ม) เพื่อเลี่ยงปัญหาทศนิยม
   ข้อมูลเก็บใน localStorage ของเบราว์เซอร์
   ========================================================= */

const KEY = 'harkan-v1';
const CATS = {
  food: '🍜 อาหาร', stay: '🏨 ที่พัก', travel: '🚗 เดินทาง',
  fun: '🎡 กิจกรรม', shop: '🛍️ ช็อปปิ้ง', other: '📦 อื่นๆ',
};
const PAGES = [
  ['index.html', '🏠', 'หน้าแรก'],
  ['members.html', '👥', 'สมาชิก'],
  ['expenses.html', '🧾', 'ค่าใช้จ่าย'],
  ['summary.html', '🧮', 'คำนวณ'],
  ['report.html', '📄', 'รายงาน'],
];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = c => '฿' + (c / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const toCents = v => Math.round(parseFloat(v) * 100);
const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const thDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '';
const hue = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const catEmoji = k => (CATS[k] || CATS.other).split(' ')[0];
const initial = n => esc([...(n || '?')][0]);
const avatar = m => `<div class="avatar" style="--h:${hue(m.name)}">${initial(m.name)}</div>`;

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

/* เปิดหลายแท็บพร้อมกัน → ข้อมูลอัปเดตตามกัน */
window.addEventListener('storage', e => {
  if (e.key !== KEY) return;
  state = load();
  refreshShell();
  if (typeof window.onStateChange === 'function') window.onStateChange();
});

/* =========================================================
   คำนวณ
   ========================================================= */
function compute(st) {
  const per = {};
  st.members.forEach(m => (per[m.id] = { paid: 0, share: 0, items: [] }));
  let total = 0;

  st.expenses.forEach(e => {
    const among = e.among.filter(id => per[id]);
    if (!among.length || !per[e.payer]) return;
    total += e.amount;
    per[e.payer].paid += e.amount;
    // หารเท่ากัน เศษสตางค์ปัดให้คนแรก ๆ คนละ 1 สตางค์
    const base = Math.floor(e.amount / among.length);
    let rem = e.amount - base * among.length;
    among.forEach(id => {
      const s = base + (rem-- > 0 ? 1 : 0);
      per[id].share += s;
      per[id].items.push({ title: e.title, cat: e.cat, amount: s });
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
  transfers.forEach(t => (t.done = paidMap[t.from + '>' + t.to] === t.amount));
  return { per, total, transfers };
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
  if (typeof qrcode !== 'function') return '<div class="qr-fail">โหลดตัวสร้าง QR ไม่ได้ — ตรวจสอบอินเทอร์เน็ตแล้วรีเฟรช</div>';
  const q = qrcode(0, 'M');
  q.addData(text);
  q.make();
  return q.createSvgTag(4, 2);
}

/* =========================================================
   ชิ้นส่วน HTML ที่ใช้หลายหน้า
   ========================================================= */
function statsHtml(st, c) {
  const n = st.members.length || 1;
  return `<div class="stats">
    <div class="stat"><div class="k">ค่าใช้จ่ายทั้งหมด</div><div class="v">${fmt(c.total)}</div></div>
    <div class="stat"><div class="k">จำนวนรายการ</div><div class="v">${st.expenses.length}</div></div>
    <div class="stat"><div class="k">เฉลี่ยต่อคน</div><div class="v">${fmt(Math.round(c.total / n))}</div></div>
  </div>`;
}
function netLabel(n) {
  if (n > 0) return `<span class="pos">ได้คืน ${fmt(n)}</span>`;
  if (n < 0) return `<span class="neg">ต้องจ่าย ${fmt(-n)}</span>`;
  return `<span class="sub">เคลียร์แล้ว</span>`;
}
function peopleHtml(st, c) {
  return `<div class="people">` + st.members.map(m => {
    const p = c.per[m.id];
    return `<div class="person">
      <div class="head">${avatar(m)}<b>${esc(m.name)}</b></div>
      <div class="kv"><span class="sub">จ่ายไปแล้ว</span><span>${fmt(p.paid)}</span></div>
      <div class="kv"><span class="sub">ส่วนที่ใช้จริง</span><span>${fmt(p.share)}</span></div>
      <div class="kv net"><span>ยอดสุทธิ</span>${netLabel(p.net)}</div>
      ${p.items.length ? `<details><summary>ดู ${p.items.length} รายการที่ร่วมหาร</summary><ul>
        ${p.items.map(i => `<li><span>${catEmoji(i.cat)} ${esc(i.title)}</span><span>${fmt(i.amount)}</span></li>`).join('')}
      </ul></details>` : ''}
    </div>`;
  }).join('') + `</div>`;
}
/* interactive = แสดงปุ่ม "โอนแล้ว" ให้กดได้ */
function transfersHtml(st, c, interactive) {
  if (!c.transfers.length) return `<div class="card done">✅ ไม่มีใครต้องโอนเพิ่ม</div>`;
  const left = c.transfers.filter(t => !t.done).length;
  return `<p class="sub">${left ? `เหลือต้องโอนอีก ${left} จาก ${c.transfers.length} รายการ` : '🎉 โอนครบทุกรายการแล้ว'}</p>
  <div class="transfers">` + c.transfers.map(t => {
    const to = memberOf(st, t.to);
    const payload = to && to.pp ? ppPayload(to.pp, t.amount) : null;
    const key = t.from + '>' + t.to;
    return `<div class="tcard ${t.done ? 'is-done' : ''}">
      <div class="tline"><b>${esc(nameOf(st, t.from))}</b><span class="arrow">→ โอนให้ →</span><b>${esc(nameOf(st, t.to))}</b></div>
      <div class="tamt">${fmt(t.amount)}</div>
      ${t.done ? `<div class="paid-badge">✓ โอนแล้ว</div>` : payload
        ? `<div class="pp"><div class="pp-head">PromptPay · สแกนจ่าย</div>${qrSvg(payload)}
             <div class="sub">${esc(to.name)} · ${esc(ppFormat(to.pp))}<br>ยอด ${fmt(t.amount)}</div></div>`
        : `<div class="noqr">${esc(nameOf(st, t.to))} ยังไม่ได้ใส่เบอร์พร้อมเพย์${interactive ? '<br><a href="members.html">เพิ่มที่หน้าสมาชิก</a>' : ''}</div>`}
      ${interactive ? `<button class="btn sm toggle-paid" data-paid="${esc(key)}" data-amt="${t.amount}">
        ${t.done ? '↩︎ ยกเลิก "โอนแล้ว"' : '☑️ ทำเครื่องหมายว่าโอนแล้ว'}</button>` : ''}
    </div>`;
  }).join('') + `</div>`;
}
function togglePaid(key, amount) {
  if (state.paid[key] === amount) delete state.paid[key];
  else state.paid[key] = amount;
  save();
}

function reportHtml(st) {
  if (!st.members.length) return `<div class="empty">ยังไม่มีข้อมูลสำหรับสร้างรายงาน</div>`;
  const c = compute(st);
  const created = new Date(st.at || Date.now()).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  const rows = st.members.map(m => {
    const p = c.per[m.id];
    return `<tr><td>${esc(m.name)}</td><td class="n">${fmt(p.paid)}</td><td class="n">${fmt(p.share)}</td><td class="n">${netLabel(p.net)}</td></tr>`;
  }).join('');
  const exps = [...st.expenses].sort((a, b) => (a.date || '').localeCompare(b.date || '')).map(e => `
    <tr><td>${thDate(e.date)}</td><td>${catEmoji(e.cat)} ${esc(e.title)}</td><td>${esc(nameOf(st, e.payer))}</td>
    <td>${e.among.length === st.members.length ? 'ทุกคน' : e.among.map(id => esc(nameOf(st, id))).join(', ')}</td>
    <td class="n">${fmt(e.amount)}</td></tr>`).join('');

  return `<article class="report">
    <header>
      <div class="eyebrow">สรุปค่าใช้จ่ายทริป</div>
      <h1>${esc(st.trip || 'ทริปของเรา')}</h1>
      <div class="sub">อัปเดต ${created} · ${st.members.length} คน · ${st.expenses.length} รายการ</div>
    </header>
    ${statsHtml(st, c)}
    <h3>ใครใช้เท่าไหร่</h3>
    <div class="table-wrap"><table>
      <thead><tr><th>ชื่อ</th><th class="n">จ่ายไปแล้ว</th><th class="n">ส่วนที่ใช้จริง</th><th class="n">ยอดสุทธิ</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td>รวม</td><td class="n">${fmt(c.total)}</td><td class="n">${fmt(c.total)}</td><td></td></tr></tfoot>
    </table></div>
    <h3>ใครต้องโอนให้ใคร</h3>
    ${transfersHtml(st, c, false)}
    <h3>รายการค่าใช้จ่ายทั้งหมด</h3>
    ${st.expenses.length ? `<div class="table-wrap"><table>
      <thead><tr><th>วันที่</th><th>รายการ</th><th>คนจ่าย</th><th>หารกับ</th><th class="n">จำนวน</th></tr></thead>
      <tbody>${exps}</tbody>
    </table></div>` : '<p class="sub">ยังไม่มีรายการ</p>'}
  </article>`;
}

/* =========================================================
   ลิงก์รายงาน — เก็บข้อมูลทั้งหมดไว้ใน URL (view.html#r=...)
   บีบอัดด้วย deflate ถ้าเบราว์เซอร์รองรับ ไม่ต้องมี server/database
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
async function buildShareLink() {
  const code = await encodeState({ ...state, at: Date.now() });
  return new URL('view.html', location.href).href.split('#')[0] + '#r=' + code;
}

/* =========================================================
   โครงหน้า (header + เมนู) ใส่ให้ทุกหน้าอัตโนมัติ
   ========================================================= */
function renderShell(active, opts = {}) {
  const el = document.createElement('header');
  el.className = 'top no-print';
  el.innerHTML = `
    <div class="wrap top-in">
      <a class="brand" href="index.html"><span class="logo">฿</span><span class="brand-t">หารด้วย</span></a>
      <input id="tripName" class="trip-name" maxlength="60" placeholder="ตั้งชื่อทริป" aria-label="ชื่อทริป" ${opts.readOnly ? 'readonly' : ''}>
    </div>
    ${opts.noNav ? '' : `<nav class="wrap nav">${PAGES.map(([href, icon, label]) =>
      `<a href="${href}" class="${href === active ? 'active' : ''}">${icon} <span>${label}</span>
       ${href === 'members.html' ? '<i class="badge" id="cntM"></i>' : ''}${href === 'expenses.html' ? '<i class="badge" id="cntE"></i>' : ''}</a>`).join('')}</nav>`}`;
  document.body.prepend(el);

  const t = document.createElement('div');
  t.id = 'toast'; t.className = 'toast'; t.hidden = true;
  t.setAttribute('role', 'status');
  document.body.append(t);

  if (!opts.readOnly) {
    $('#tripName').addEventListener('input', e => { state.trip = e.target.value; save(); });
  }
  refreshShell();
}
function refreshShell() {
  const tn = $('#tripName');
  if (tn && !tn.readOnly && document.activeElement !== tn) tn.value = state.trip;
  if ($('#cntM')) $('#cntM').textContent = state.members.length || '';
  if ($('#cntE')) $('#cntE').textContent = state.expenses.length || '';
}
/* ปุ่มไปขั้นตอนถัดไป ท้ายหน้า */
function stepNav(prev, next) {
  const p = PAGES.find(x => x[0] === prev), n = PAGES.find(x => x[0] === next);
  return `<div class="step-nav no-print">
    ${p ? `<a class="btn ghost" href="${p[0]}">← ${p[2]}</a>` : '<span></span>'}
    ${n ? `<a class="btn primary" href="${n[0]}">ถัดไป: ${n[2]} →</a>` : ''}
  </div>`;
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2600);
}

/* ข้อมูลตัวอย่าง */
function demoState() {
  const [a, b, c, d] = ['มิว', 'บอส', 'แพร', 'ต้น'].map(n => ({ id: uid(), name: n, pp: '' }));
  a.pp = '0812345678'; b.pp = '0898765432';
  const d0 = today();
  const all = [a.id, b.id, c.id, d.id];
  return {
    trip: 'เชียงใหม่ 3 วัน 2 คืน',
    members: [a, b, c, d],
    paid: {},
    expenses: [
      { id: uid(), title: 'ที่พัก 2 คืน', amount: 480000, cat: 'stay', payer: a.id, among: all, date: d0 },
      { id: uid(), title: 'เช่ารถ + น้ำมัน', amount: 210000, cat: 'travel', payer: b.id, among: all, date: d0 },
      { id: uid(), title: 'ข้าวซอย มื้อเที่ยง', amount: 36000, cat: 'food', payer: c.id, among: all, date: d0 },
      { id: uid(), title: 'คาเฟ่', amount: 54000, cat: 'food', payer: a.id, among: [a.id, c.id], date: d0 },
      { id: uid(), title: 'บัตรเข้าชมดอยอินทนนท์', amount: 120000, cat: 'fun', payer: d.id, among: [b.id, c.id, d.id], date: d0 },
    ],
  };
}
