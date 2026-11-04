'use strict';
/* 3. หน้าคำนวณ — ยอดแต่ละคน + ใครต้องโอนให้ใคร + ติ๊กว่าโอนแล้ว */

renderShell('summary.html');
$('#stepNav').innerHTML = stepNav('expenses.html', 'report.html');

function render() {
  const box = $('#summaryBox');
  if (!state.members.length || !state.expenses.length) {
    box.innerHTML = `<div class="empty">เพิ่มสมาชิกและค่าใช้จ่ายก่อน แล้วระบบจะคำนวณให้อัตโนมัติ<br>
      <a class="btn primary" href="${state.members.length ? 'expenses.html' : 'members.html'}">
      ${state.members.length ? 'ไปบันทึกค่าใช้จ่าย' : 'ไปเพิ่มสมาชิก'}</a></div>`;
    return;
  }
  const c = compute(state);
  box.innerHTML = statsHtml(state, c)
    + `<h3>ยอดของแต่ละคน</h3>` + peopleHtml(state, c)
    + `<h3>ใครต้องโอนให้ใคร (${c.transfers.length} รายการ)</h3>` + transfersHtml(state, c, true);
}

$('#summaryBox').addEventListener('click', e => {
  const b = e.target.closest('[data-paid]');
  if (!b) return;
  togglePaid(b.dataset.paid, Number(b.dataset.amt));
  render();
});

window.onStateChange = render;
render();
