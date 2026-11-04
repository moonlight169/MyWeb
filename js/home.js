'use strict';
/* หน้าภาพรวม (Dashboard) */

renderShell('index.html');

function onboardingHtml() {
  const nM = state.members.length, nE = state.expenses.length;
  const steps = [
    ['members.html', 'เพิ่มสมาชิก', nM ? `มี ${nM} คนแล้ว` : 'ใส่ชื่อเพื่อนร่วมทริป และเบอร์พร้อมเพย์', nM >= 2],
    ['expenses.html', 'บันทึกค่าใช้จ่าย', nE ? `${nE} รายการ` : 'ใครจ่ายอะไรไป หารกับใครบ้าง', nE > 0],
    ['summary.html', 'เคลียร์เงิน', 'ระบบคำนวณว่าใครต้องโอนให้ใคร พร้อม QR พร้อมเพย์', false],
    ['report.html', 'ส่งรายงานให้เพื่อน', 'คัดลอกลิงก์ / ส่งทาง LINE ให้ทุกคนสแกนจ่าย', false],
  ];
  return `<section class="page-heading">
      <div><span class="eyebrow">เริ่มต้นใช้งาน</span><h1>หารค่าเที่ยวกับเพื่อน<br><span>จบในไม่กี่ขั้นตอน</span></h1>
      <p>เพิ่มเพื่อน บันทึกค่าใช้จ่าย แล้วระบบจะคำนวณให้ว่าใครต้องโอนให้ใครเท่าไหร่</p></div>
      ${nM ? `<button class="primary-btn hide-m" data-add-exp>${icon('plus', 19)} เพิ่มค่าใช้จ่าย</button>`
           : `<a class="primary-btn" href="members.html">${icon('users', 19)} เพิ่มสมาชิก</a>`}
    </section>
    <section class="panel"><div class="steps">${steps.map(([href, t, d, done], i) => `
      <a class="step-row ${done ? 'done' : ''}" href="${href}">
        <span class="num">${done ? icon('check', 18) : i + 1}</span>
        <div><strong>${t}</strong><small>${d}</small></div>${icon('chevron', 18)}
      </a>`).join('')}</div></section>`;
}

function dashboardHtml() {
  const c = compute(state);
  const n = state.members.length;
  const left = c.transfers.filter(t => !t.done).length;
  const allAmt = c.pendingAmount + c.doneAmount;
  const pct = allAmt ? Math.round(c.doneAmount / allAmt * 100) : 100;
  const recent = [...state.expenses].reverse().slice(0, 4);
  const range = dateRange(state);

  return `<section class="page-heading">
      <div>
        <span class="eyebrow">ภาพรวมทริป</span>
        <h1>${esc(state.trip || 'ทริปของเรา')}</h1>
        <p>${range ? `${icon('calendar', 16)} ${range} <i></i>` : ''} สมาชิก ${n} คน</p>
      </div>
      <button class="primary-btn hide-m" data-add-exp>${icon('plus', 19)} เพิ่มค่าใช้จ่าย</button>
    </section>

    <section class="summary-grid">
      <div class="total-card">
        <div class="summary-label"><span>${icon('wallet', 18)}</span>ค่าใช้จ่ายทั้งหมด</div>
        <strong>${fmt(c.total)}</strong>
        <p>เฉลี่ย ${fmt(Math.round(c.total / n))} ต่อคน</p>
        <div class="member-stack">${state.members.slice(0, 5).map(m => avatar(m, 32)).join('')}<span>${n}</span></div>
      </div>
      <div class="balance-card ${left ? 'owe' : ''}">
        <div class="summary-label"><span>${icon(left ? 'arrowUp' : 'check', 18)}</span>ยอดที่ต้องเคลียร์</div>
        <strong>${left ? `เหลือโอนอีก ${left} รายการ` : 'ทุกคนเคลียร์ครบแล้ว 🎉'}</strong>
        <b>${fmt(c.pendingAmount)}</b>
        <a href="summary.html">ดูว่าใครต้องโอนให้ใคร ${icon('chevron', 15)}</a>
      </div>
      <div class="status-card">
        <div class="summary-label"><span>${icon('users', 18)}</span>สถานะกลุ่ม</div>
        <div class="status-scroll">${state.members.map(m => miniBalanceHtml(m, c.per[m.id].net)).join('')}</div>
      </div>
    </section>

    <section class="lower-grid">
      <div class="panel">
        <div class="panel-head">
          <div><h2>ค่าใช้จ่ายล่าสุด</h2><p>รายการที่เพิ่มล่าสุดในทริปนี้</p></div>
          <a class="text-btn" href="expenses.html">ดูทั้งหมด ${icon('chevron', 15)}</a>
        </div>
        <div>${recent.map(e => expenseRowHtml(state, e, { edit: true })).join('')}</div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <div><h2>ความคืบหน้าการเคลียร์</h2><p>จากยอดที่ต้องโอนทั้งหมด</p></div>
          <span class="live-badge">คำนวณแล้ว</span>
        </div>
        <div class="donut-wrap">
          <div class="donut" style="--p:${pct}%"><div><strong>${pct}%</strong><small>โอนแล้ว</small></div></div>
          <div class="legend">
            <p><i style="background:#34b786"></i>โอนแล้ว <b>${fmt(c.doneAmount)}</b></p>
            <p><i style="background:#d9ece5"></i>ยังค้างอยู่ <b>${fmt(c.pendingAmount)}</b></p>
          </div>
        </div>
        <a class="outline-btn block" href="summary.html">ไปที่หน้าเคลียร์เงิน ${icon('settle', 17)}</a>
      </div>
    </section>`;
}

function render() {
  $('#dash').innerHTML = state.members.length && state.expenses.length ? dashboardHtml() : onboardingHtml();
}

/* จัดการข้อมูล */
let pending = null;
function ask(kind) {
  pending = kind;
  $('#resetMsg').textContent = kind === 'reset'
    ? 'ลบสมาชิกและค่าใช้จ่ายทั้งหมดจริงไหม? ย้อนกลับไม่ได้'
    : 'ข้อมูลทริปปัจจุบันจะถูกแทนที่ด้วยข้อมูลตัวอย่าง ตกลงไหม?';
  $('#resetConfirm').hidden = false;
}
$('#demoBtn').addEventListener('click', () => {
  if (state.members.length || state.expenses.length) return ask('demo');
  state = demoState(); save(); render();
  toast('โหลดข้อมูลตัวอย่างแล้ว');
});
$('#resetBtn').addEventListener('click', () => ask('reset'));
$('#resetNo').addEventListener('click', () => { $('#resetConfirm').hidden = true; });
$('#resetYes').addEventListener('click', () => {
  state = pending === 'demo' ? demoState() : blank();
  save(); render();
  $('#resetConfirm').hidden = true;
  toast(pending === 'demo' ? 'โหลดข้อมูลตัวอย่างแล้ว' : 'ล้างข้อมูลแล้ว เริ่มทริปใหม่ได้เลย');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

window.onStateChange = render;
render();
