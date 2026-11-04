'use strict';
/* 2. หน้าค่าใช้จ่าย — เพิ่ม / แก้ไข / ลบ รายการ */

renderShell('expenses.html');
$('#stepNav').innerHTML = stepNav('members.html', 'summary.html');
$('#eCat').innerHTML = Object.entries(CATS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
$('#eDate').value = today();

let editingExp = null;

function renderForm() {
  const has = state.members.length > 0;
  $('#expForm').hidden = !has;
  $('#expNeedMembers').hidden = has;

  const payer = $('#ePayer');
  const prev = payer.value;
  payer.innerHTML = state.members.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('');
  if (memberOf(state, prev)) payer.value = prev;

  // คงค่าที่ติ๊กไว้ สมาชิกใหม่ติ๊กให้อัตโนมัติ
  const known = new Set($$('#eAmong input').map(i => i.value));
  const checked = new Set($$('#eAmong input:checked').map(i => i.value));
  $('#eAmong').innerHTML = state.members.map(m => `
    <label class="chip"><input type="checkbox" value="${m.id}" ${!known.has(m.id) || checked.has(m.id) ? 'checked' : ''}>
    <span>${esc(m.name)}</span></label>`).join('');
  updatePreview();
}

function updatePreview() {
  const n = $$('#eAmong input:checked').length;
  const amt = toCents($('#eAmount').value);
  $('#eachPreview').textContent = n && amt > 0 ? `· ${n} คน คนละ ~${fmt(Math.ceil(amt / n))}` : n ? `· ${n} คน` : '';
}

function renderList() {
  if (!state.expenses.length) {
    $('#expList').innerHTML = state.members.length ? `<div class="empty">ยังไม่มีรายการค่าใช้จ่าย</div>` : '';
    return;
  }
  const total = state.expenses.reduce((s, e) => s + e.amount, 0);
  const sorted = [...state.expenses].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  $('#expList').innerHTML = `<div class="list-head"><span>${state.expenses.length} รายการ</span><b>รวม ${fmt(total)}</b></div>` +
    sorted.map(e => {
      const all = e.among.length === state.members.length;
      return `
      <div class="item ${editingExp === e.id ? 'editing' : ''}">
        <div class="cat">${catEmoji(e.cat)}</div>
        <div class="grow">
          <b>${esc(e.title)}</b>
          <div class="sub">${esc(nameOf(state, e.payer))} จ่าย · หาร${all ? 'ทุกคน' : ''} ${e.among.length} คน${e.date ? ' · ' + thDate(e.date) : ''}</div>
        </div>
        <div class="amt">${fmt(e.amount)}<div class="sub">คนละ ${fmt(Math.ceil(e.amount / e.among.length))}</div></div>
        <button class="icon" data-edit="${e.id}" title="แก้ไข" aria-label="แก้ไข ${esc(e.title)}">✏️</button>
        <button class="icon" data-del="${e.id}" title="ลบ" aria-label="ลบ ${esc(e.title)}">🗑️</button>
      </div>`;
    }).join('');
}

function render() { renderForm(); renderList(); }

function resetForm() {
  editingExp = null;
  const keepDate = $('#eDate').value || today();
  $('#eTitle').value = '';
  $('#eAmount').value = '';
  $('#eDate').value = keepDate;
  $$('#eAmong input').forEach(i => (i.checked = true));
  $('#expFormTitle').textContent = 'เพิ่มค่าใช้จ่าย';
  $('#expSubmit').textContent = 'บันทึกรายการ';
  $('#expCancel').hidden = true;
  updatePreview();
}

$('#expForm').addEventListener('submit', ev => {
  ev.preventDefault();
  const title = $('#eTitle').value.trim();
  const amount = toCents($('#eAmount').value);
  const among = $$('#eAmong input:checked').map(i => i.value);
  if (!title) return toast('ใส่ชื่อรายการ');
  if (!(amount > 0)) return toast('จำนวนเงินต้องมากกว่า 0');
  if (!among.length) return toast('เลือกคนหารอย่างน้อย 1 คน');

  const exp = {
    id: editingExp || uid(), title, amount, among,
    cat: $('#eCat').value, payer: $('#ePayer').value, date: $('#eDate').value,
  };
  if (editingExp) {
    state.expenses = state.expenses.map(e => (e.id === editingExp ? exp : e));
    toast('แก้ไขรายการแล้ว');
  } else {
    state.expenses.push(exp);
    toast(`บันทึก "${title}" ${fmt(amount)}`);
  }
  resetForm();
  save();
  renderList();
  $('#eTitle').focus();
});

$('#expCancel').addEventListener('click', () => { resetForm(); renderList(); });
$('#eAmount').addEventListener('input', updatePreview);
$('#eAmong').addEventListener('change', updatePreview);
$('#selAll').addEventListener('click', () => { $$('#eAmong input').forEach(i => (i.checked = true)); updatePreview(); });
$('#selNone').addEventListener('click', () => { $$('#eAmong input').forEach(i => (i.checked = false)); updatePreview(); });

let lastDeleted = null;
$('#expList').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.edit) {
    const x = state.expenses.find(v => v.id === b.dataset.edit);
    editingExp = x.id;
    $('#eTitle').value = x.title;
    $('#eAmount').value = (x.amount / 100).toFixed(2);
    $('#eCat').value = x.cat;
    $('#ePayer').value = x.payer;
    $('#eDate').value = x.date || '';
    $$('#eAmong input').forEach(i => (i.checked = x.among.includes(i.value)));
    $('#expFormTitle').textContent = 'แก้ไขค่าใช้จ่าย';
    $('#expSubmit').textContent = 'บันทึกการแก้ไข';
    $('#expCancel').hidden = false;
    renderList();
    updatePreview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (b.dataset.del) {
    lastDeleted = state.expenses.find(v => v.id === b.dataset.del);
    state.expenses = state.expenses.filter(v => v.id !== b.dataset.del);
    if (editingExp === b.dataset.del) resetForm();
    save();
    renderList();
    toast(`ลบ "${lastDeleted.title}" แล้ว`);
    showUndo();
  }
});

/* ปุ่มเลิกทำ หลังลบรายการ */
function showUndo() {
  const t = $('#toast');
  const u = document.createElement('button');
  u.className = 'toast-undo';
  u.textContent = 'เลิกทำ';
  u.onclick = () => {
    if (!lastDeleted) return;
    state.expenses.push(lastDeleted);
    lastDeleted = null;
    save();
    renderList();
    toast('กู้คืนรายการแล้ว');
  };
  t.append(u);
}

window.onStateChange = render;
render();
