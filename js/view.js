'use strict';
/* หน้าที่เพื่อนเปิดจากลิงก์ (view.html#r=...&p=...) — ดูอย่างเดียว */

renderShell('view.html', { noNav: true });

let shared = null;
let sel = 'all';

function draw() {
  $('#sharedReport').innerHTML = reportHtml(shared, sel, { readOnly: true });
  const c = compute(shared);
  const tb = $('#transferBox');
  const mine = sel === 'all' ? c : { ...c, transfers: c.transfers.filter(t => t.from === sel || t.to === sel) };
  tb.hidden = !mine.transfers.length;
  tb.innerHTML = `<div class="panel-head"><div><h2>${sel === 'all' ? 'ใครต้องโอนให้ใคร' : `รายการโอนของ${esc(nameOf(shared, sel))}`}</h2>
      <p>สแกน QR ด้วยแอปธนาคาร ยอดเงินใส่ไว้ให้แล้ว</p></div></div>
    ${transferCardsHtml(shared, mine, { showQr: () => true })}`;
}

async function load() {
  const m = location.hash.match(/^#r=([^&]+)(?:&p=([\w-]+))?/);
  if (!m) {
    $('#sharedReport').innerHTML = `<div class="panel empty"><div class="ico">${icon('link', 26)}</div>
      <strong>ไม่พบข้อมูลรายงานในลิงก์นี้</strong><br><a class="primary-btn" href="index.html">ไปหน้าแรก</a></div>`;
    return;
  }
  try {
    shared = await decodeState(m[1]);
  } catch (e) {
    $('#sharedReport').innerHTML = `<div class="panel empty"><div class="ico">${icon('close', 26)}</div>
      <strong>ลิงก์รายงานไม่ถูกต้องหรือไม่ครบ</strong>ลองให้เพื่อนส่งลิงก์ใหม่ (บางแอปแชทตัดลิงก์ยาว ๆ ให้คัดลอกทั้งลิงก์)</div>`;
    return;
  }
  sel = m[2] && memberOf(shared, m[2]) ? m[2] : 'all';
  document.title = `สรุปค่าใช้จ่าย — ${shared.trip || 'ทริป'}`;
  $('#viewBanner').hidden = false;
  draw();
}

$('#sharedReport').addEventListener('click', e => {
  const tab = e.target.closest('[data-sel]');
  if (tab) { sel = tab.dataset.sel; draw(); }
});
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

window.addEventListener('hashchange', load);
load();
