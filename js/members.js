'use strict';
/* หน้าสมาชิก — เพิ่ม / แก้ไข / ลบ */

renderShell('members.html');

let editingMem = null;

function render() {
  const panel = $('#memberPanel');
  if (!state.members.length) {
    panel.innerHTML = `<div class="empty"><div class="ico">${icon('users', 26)}</div>
      <strong>ยังไม่มีสมาชิก</strong>เริ่มเพิ่มเพื่อนร่วมทริปจากฟอร์มด้านบนได้เลย</div>`;
    return;
  }
  const { per } = compute(state);
  const noPP = state.members.filter(m => !m.pp).length;
  panel.innerHTML = `<div class="panel-head">
      <div><h2>สมาชิกทั้งหมด</h2><p>${state.members.length} คน${noPP ? ` · <span class="warn-text">${noPP} คนยังไม่ใส่พร้อมเพย์</span>` : ''}</p></div>
      ${state.expenses.length ? '' : `<button class="text-btn" data-add-exp>เพิ่มค่าใช้จ่ายแรก ${icon('chevron', 15)}</button>`}
    </div>
    <div>${state.members.map(m => `
      <div class="expense-row" ${editingMem === m.id ? 'style="background:#f4fbf8"' : ''}>
        ${avatar(m, 42)}
        <div class="expense-main">
          <strong>${esc(m.name)}</strong>
          <small>${m.pp ? 'พร้อมเพย์ ' + esc(ppFormat(m.pp)) : '<span class="warn-text">ยังไม่ใส่พร้อมเพย์</span>'}</small>
        </div>
        <div class="expense-amount"><strong>${fmt(per[m.id].share)}</strong><small>ส่วนที่ใช้</small></div>
        <button class="more-btn" data-edit="${m.id}" aria-label="แก้ไข ${esc(m.name)}">${icon('edit', 17)}</button>
        <button class="more-btn danger" data-del="${m.id}" aria-label="ลบ ${esc(m.name)}">${icon('trash', 17)}</button>
      </div>`).join('')}</div>`;
}

function resetForm() {
  editingMem = null;
  $('#memberForm').reset();
  $('#memFormTitle').textContent = 'เพิ่มสมาชิก';
  $('#memSubmit').innerHTML = `${icon('plus', 18)} เพิ่ม`;
  $('#memCancel').hidden = true;
}

function nextColor() {
  const used = new Set(state.members.map(m => m.color));
  return PALETTE.find(c => !used.has(c)) || PALETTE[state.members.length % PALETTE.length];
}

$('#memberForm').addEventListener('submit', ev => {
  ev.preventDefault();
  const name = $('#mName').value.trim();
  const ppRaw = $('#mPP').value.trim();
  if (!name) return;
  if (ppRaw && !ppNormalize(ppRaw)) return toast('พร้อมเพย์ต้องเป็นเบอร์มือถือ 10 หลัก หรือเลขบัตร 13 หลัก');
  if (state.members.some(m => m.name === name && m.id !== editingMem)) return toast('มีชื่อนี้อยู่แล้ว');
  const pp = ppRaw.replace(/\D/g, '');

  if (editingMem) {
    Object.assign(memberOf(state, editingMem), { name, pp });
    toast('แก้ไขสมาชิกแล้ว');
  } else {
    state.members.push({ id: uid(), name, pp, color: nextColor() });
    toast(`เพิ่ม ${name} แล้ว`);
  }
  resetForm();
  save();
  render();
  $('#mName').focus();
});

$('#memCancel').addEventListener('click', () => { resetForm(); render(); });

$('#memberPanel').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.edit) {
    const m = memberOf(state, b.dataset.edit);
    editingMem = m.id;
    $('#mName').value = m.name;
    $('#mPP').value = m.pp || '';
    $('#memFormTitle').textContent = `แก้ไข ${m.name}`;
    $('#memSubmit').innerHTML = `${icon('check', 18)} บันทึก`;
    $('#memCancel').hidden = false;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    $('#mName').focus();
  }
  if (b.dataset.del) {
    const id = b.dataset.del;
    const used = state.expenses.filter(x => x.payer === id || x.among.includes(id)).length;
    if (used) return toast(`ลบไม่ได้ — ${nameOf(state, id)} อยู่ใน ${used} รายการค่าใช้จ่าย`);
    const removed = memberOf(state, id);
    const idx = state.members.indexOf(removed);
    state.members = state.members.filter(m => m.id !== id);
    if (editingMem === id) resetForm();
    save();
    render();
    toast(`ลบ ${removed.name} แล้ว`, { label: 'เลิกทำ', run: () => { state.members.splice(idx, 0, removed); save(); render(); } });
  }
});

resetForm();
window.onStateChange = render;
render();
