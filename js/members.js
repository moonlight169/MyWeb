'use strict';
/* 1. หน้าสมาชิก — เพิ่ม / แก้ไข / ลบ */

renderShell('members.html');
$('#stepNav').innerHTML = stepNav('index.html', 'expenses.html');

let editingMem = null;

function render() {
  const { per } = compute(state);
  if (!state.members.length) {
    $('#memberList').innerHTML = `<div class="empty">ยังไม่มีสมาชิก — เริ่มเพิ่มเพื่อนร่วมทริปได้เลย</div>`;
    return;
  }
  $('#memberList').innerHTML = `<div class="list-head"><span>${state.members.length} คน</span></div>` +
    state.members.map(m => `
    <div class="item ${editingMem === m.id ? 'editing' : ''}">
      ${avatar(m)}
      <div class="grow">
        <b>${esc(m.name)}</b>
        <div class="sub">${m.pp ? '💳 พร้อมเพย์ ' + esc(ppFormat(m.pp)) : '<span class="warn">ยังไม่ใส่พร้อมเพย์</span>'}</div>
      </div>
      <div class="amt">${fmt(per[m.id].share)}<div class="sub">ส่วนที่ใช้</div></div>
      <button class="icon" data-edit="${m.id}" title="แก้ไข" aria-label="แก้ไข ${esc(m.name)}">✏️</button>
      <button class="icon" data-del="${m.id}" title="ลบ" aria-label="ลบ ${esc(m.name)}">🗑️</button>
    </div>`).join('');
}

function resetForm() {
  editingMem = null;
  $('#memberForm').reset();
  $('#memFormTitle').textContent = 'เพิ่มสมาชิก';
  $('#memSubmit').textContent = 'เพิ่ม';
  $('#memCancel').hidden = true;
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
    state.members.push({ id: uid(), name, pp });
    toast(`เพิ่ม ${name} แล้ว`);
  }
  resetForm();
  save();
  render();
  $('#mName').focus();
});

$('#memCancel').addEventListener('click', () => { resetForm(); render(); });

$('#memberList').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.edit) {
    const m = memberOf(state, b.dataset.edit);
    editingMem = m.id;
    $('#mName').value = m.name;
    $('#mPP').value = m.pp || '';
    $('#memFormTitle').textContent = `แก้ไข ${m.name}`;
    $('#memSubmit').textContent = 'บันทึก';
    $('#memCancel').hidden = false;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    $('#mName').focus();
  }
  if (b.dataset.del) {
    const id = b.dataset.del;
    const used = state.expenses.filter(x => x.payer === id || x.among.includes(id)).length;
    if (used) return toast(`ลบไม่ได้ — ${nameOf(state, id)} อยู่ใน ${used} รายการค่าใช้จ่าย (ลบ/แก้รายการนั้นก่อน)`);
    const name = nameOf(state, id);
    state.members = state.members.filter(m => m.id !== id);
    if (editingMem === id) resetForm();
    save();
    render();
    toast(`ลบ ${name} แล้ว`);
  }
});

window.onStateChange = render;
render();
