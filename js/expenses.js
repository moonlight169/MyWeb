'use strict';
/* หน้าค่าใช้จ่าย — รายการทั้งหมด (เพิ่ม/แก้ไขผ่าน modal ใน common.js) */

renderShell('expenses.html');

let filter = 'all';

function render() {
  const box = $('#expBox');
  if (!state.members.length) {
    box.innerHTML = `<div class="panel empty"><div class="ico">${icon('users', 26)}</div>
      <strong>ต้องมีสมาชิกก่อน</strong>เพิ่มเพื่อนร่วมทริป แล้วค่อยบันทึกค่าใช้จ่าย<br>
      <a class="primary-btn" href="members.html">${icon('users', 18)} ไปเพิ่มสมาชิก</a></div>`;
    return;
  }
  if (!state.expenses.length) {
    box.innerHTML = `<div class="panel empty"><div class="ico">${icon('receipt', 26)}</div>
      <strong>ยังไม่มีค่าใช้จ่าย</strong>บันทึกรายการแรก เช่น ค่าที่พัก ค่าน้ำมัน ค่าอาหาร<br>
      <button class="primary-btn" data-add-exp>${icon('plus', 18)} เพิ่มค่าใช้จ่าย</button></div>`;
    return;
  }
  const c = compute(state);
  const usedCats = [...new Set(state.expenses.map(e => e.cat))];
  if (filter !== 'all' && !usedCats.includes(filter)) filter = 'all';
  const list = [...state.expenses]
    .filter(e => filter === 'all' || e.cat === filter)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const shown = list.reduce((s, e) => s + e.amount, 0);

  box.innerHTML = `<div class="panel wide-panel">
    <div class="stat-strip">
      <div><span>ยอดรวมทั้งหมด</span><strong>${fmt(c.total)}</strong></div>
      <div><span>จำนวนรายการ</span><strong>${state.expenses.length} รายการ</strong></div>
      <div><span>เฉลี่ยต่อคน</span><strong>${fmt(Math.round(c.total / state.members.length))}</strong></div>
    </div>
    <div class="panel-head">
      <div><h2>รายการค่าใช้จ่าย</h2><p>${filter === 'all' ? 'แตะที่เมนูเพื่อแก้ไขข้อมูลและคำนวณยอดใหม่' : `${list.length} รายการ รวม ${fmt(shown)}`}</p></div>
      <select class="filter-select" id="catFilter" aria-label="กรองตามหมวด">
        <option value="all">ทุกหมวด</option>
        ${usedCats.map(k => `<option value="${k}" ${filter === k ? 'selected' : ''}>${catOf(k).label}</option>`).join('')}
      </select>
    </div>
    <div>${list.map(e => expenseRowHtml(state, e, { edit: true })).join('')}</div>
  </div>`;
}

$('#expBox').addEventListener('change', e => {
  if (e.target.id === 'catFilter') { filter = e.target.value; render(); }
});

window.onStateChange = render;
render();
