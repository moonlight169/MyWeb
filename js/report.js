'use strict';
/* หน้ารายงาน — ทั้งทริป / รายบุคคล + ส่งลิงก์ */

renderShell('report.html');

let sel = 'all';

async function render() {
  const box = $('#reportBox');
  const tb = $('#transferBox');
  if (!state.members.length || !state.expenses.length) {
    tb.hidden = true;
    box.innerHTML = `<div class="panel empty"><div class="ico">${icon('report', 26)}</div>
      <strong>ยังไม่มีข้อมูลพอสำหรับรายงาน</strong>เพิ่มสมาชิกและค่าใช้จ่ายก่อน<br>
      ${state.members.length ? `<button class="primary-btn" data-add-exp>${icon('plus', 18)} เพิ่มค่าใช้จ่าย</button>`
        : `<a class="primary-btn" href="members.html">${icon('users', 18)} ไปเพิ่มสมาชิก</a>`}</div>`;
    return;
  }
  if (sel !== 'all' && !memberOf(state, sel)) sel = 'all';
  box.innerHTML = reportHtml(state, sel);

  const c = compute(state);
  tb.hidden = !c.transfers.length;
  tb.innerHTML = `<div class="panel-head"><div><h2>ใครต้องโอนให้ใคร</h2><p>สแกน QR และติ๊กว่าโอนแล้วได้ที่หน้าเคลียร์เงิน</p></div>
      <a class="text-btn no-print" href="summary.html">ไปหน้าเคลียร์เงิน ${icon('chevron', 15)}</a></div>
    ${transferCardsHtml(state, c)}`;

  // ลิงก์ LINE ต้องสร้างลิงก์รายงานก่อน (async)
  for (const a of $$('[data-line]')) a.href = lineUrl(await buildShareLink(a.dataset.line));
}

$('#reportBox').addEventListener('click', e => {
  const tab = e.target.closest('[data-sel]');
  if (tab) { sel = tab.dataset.sel; render(); return; }
  const share = e.target.closest('[data-share-link]');
  if (share) { copyReportLink(share.dataset.shareLink); return; }
  if (e.target.closest('[data-print]')) window.print();
});

window.onStateChange = render;
render();
