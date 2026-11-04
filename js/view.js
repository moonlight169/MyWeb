'use strict';
/* หน้าที่เพื่อนเปิดจากลิงก์ (view.html#r=...) — ดูอย่างเดียว */

renderShell('view.html', { readOnly: true, noNav: true });

let shared = null;

async function render() {
  const h = location.hash;
  if (!h.startsWith('#r=')) {
    $('#sharedReport').innerHTML = `<div class="empty">ไม่พบข้อมูลรายงานในลิงก์นี้<br><a class="btn primary" href="index.html">ไปหน้าแรก</a></div>`;
    return;
  }
  try {
    shared = await decodeState(h.slice(3));
  } catch (e) {
    $('#sharedReport').innerHTML = `<div class="empty">ลิงก์รายงานไม่ถูกต้องหรือไม่ครบ — ลองให้เพื่อนส่งลิงก์ใหม่อีกครั้ง<br>
      <span class="sub">(บางแอปแชทตัดลิงก์ยาว ๆ ให้คัดลอกทั้งลิงก์)</span></div>`;
    return;
  }
  $('#tripName').value = shared.trip || '';
  document.title = `สรุปค่าใช้จ่าย — ${shared.trip || 'ทริป'}`;
  $('#viewBanner').hidden = false;
  $('#sharedReport').innerHTML = reportHtml(shared);
}

$('#importBtn').addEventListener('click', () => {
  if (state.members.length || state.expenses.length) { $('#importConfirm').hidden = false; return; }
  doImport();
});
$('#importNo').addEventListener('click', () => { $('#importConfirm').hidden = true; });
$('#importYes').addEventListener('click', doImport);

function doImport() {
  const { at, ...rest } = shared;
  state = normalize(rest);
  save();
  location.href = 'summary.html';
}

window.addEventListener('hashchange', render);
render();
