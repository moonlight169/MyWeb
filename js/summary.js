'use strict';
/* หน้าเคลียร์เงิน — ยอดของแต่ละคน + ใครโอนให้ใคร + QR พร้อมเพย์ + ติ๊กว่าโอนแล้ว */

renderShell('summary.html');

const openQr = new Set();

function render() {
  const box = $('#settleBox');
  if (!state.members.length || !state.expenses.length) {
    $('#optBadge').hidden = true;
    box.innerHTML = `<div class="panel empty"><div class="ico">${icon('settle', 26)}</div>
      <strong>ยังไม่มีอะไรให้เคลียร์</strong>เพิ่มสมาชิกและค่าใช้จ่ายก่อน แล้วระบบจะคำนวณให้อัตโนมัติ<br>
      ${state.members.length ? `<button class="primary-btn" data-add-exp>${icon('plus', 18)} เพิ่มค่าใช้จ่าย</button>`
        : `<a class="primary-btn" href="members.html">${icon('users', 18)} ไปเพิ่มสมาชิก</a>`}</div>`;
    return;
  }
  const c = compute(state);
  const left = c.transfers.filter(t => !t.done).length;
  $('#optBadge').hidden = !c.transfers.length;
  $('#optBadge').innerHTML = `${icon('sparkle', 16)} แผนที่เหมาะที่สุด`;

  box.innerHTML = `<div class="settle-layout">
    <div class="panel transfer-panel">
      <div class="panel-head">
        <div><h2>รายการที่ต้องโอน</h2><p>${c.transfers.length
          ? (left ? `ทั้งหมด ${c.transfers.length} รายการ · เหลืออีก ${left} รายการ แล้วทุกคนจะหายค้าง` : 'โอนครบทุกรายการแล้ว 🎉')
          : 'ยอดของทุกคนลงตัวพอดี'}</p></div>
      </div>
      ${c.transfers.length ? transferCardsHtml(state, c, { interactive: true, showQr: t => openQr.has(t.key) })
        : `<div class="done-card"><div class="ico">${icon('check', 26)}</div><strong>ไม่มีใครต้องโอนเพิ่ม</strong></div>`}
    </div>
    <div class="settle-side">
      <div class="panel">
        <div class="panel-head"><div><h2>ยอดของแต่ละคน</h2><p>จ่ายไป − ส่วนที่ใช้จริง = ยอดสุทธิ</p></div></div>
        ${state.members.map(m => {
          const p = c.per[m.id];
          return miniBalanceHtml(m, p.net, `จ่าย ${fmt(p.paid)} · ใช้ ${fmt(p.share)}`);
        }).join('')}
      </div>
      <div class="panel qr-card">
        <span class="promptpay-pill">${icon('qr', 15)} พร้อมเพย์</span>
        <h2>สแกนเพื่อชำระเงิน</h2>
        <p>กด “แสดงคิวอาร์” ที่รายการโอน ระบบจะสร้างคิวอาร์พร้อมยอดเงินให้อัตโนมัติ</p>
        <div class="qr-box muted">${qrSvg('PROMPTPAY')}<span>PromptPay</span></div>
        <small>รองรับทุกแอปธนาคารในประเทศไทย</small>
      </div>
      <div class="safe-card">${icon('check', 18)}<div>
        <strong>ตรวจสอบยอดก่อนโอน</strong>
        <p>ชื่อและเลขพร้อมเพย์เป็นข้อมูลที่สมาชิกกรอกเอง กรุณาตรวจสอบชื่อผู้รับในแอปธนาคารทุกครั้ง</p>
      </div></div>
    </div>
  </div>`;
}

$('#settleBox').addEventListener('click', async e => {
  const qr = e.target.closest('[data-qr]');
  if (qr) { openQr.has(qr.dataset.qr) ? openQr.delete(qr.dataset.qr) : openQr.add(qr.dataset.qr); render(); return; }
  const paid = e.target.closest('[data-paid]');
  if (paid) {
    togglePaid(paid.dataset.paid, Number(paid.dataset.amt));
    openQr.delete(paid.dataset.paid);
    render();
    toast(state.paid[paid.dataset.paid] ? 'บันทึกว่าโอนแล้ว' : 'ยกเลิกสถานะโอนแล้ว');
    return;
  }
  const cp = e.target.closest('[data-copy-pp]');
  if (cp) toast((await copyText(cp.dataset.copyPp)) ? `คัดลอกพร้อมเพย์ ${ppFormat(cp.dataset.copyPp)} แล้ว` : 'คัดลอกไม่สำเร็จ');
});

window.onStateChange = render;
render();
