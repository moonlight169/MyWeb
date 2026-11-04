'use strict';
/* 4–5. หน้ารายงาน + ส่งลิงก์ */

renderShell('report.html');
$('#stepNav').innerHTML = stepNav('summary.html', null);

async function render() {
  const ready = state.members.length && state.expenses.length;
  $('#shareCard').hidden = !ready;
  if (!ready) {
    $('#reportBox').innerHTML = `<div class="empty">ยังไม่มีข้อมูลพอสำหรับสร้างรายงาน<br>
      <a class="btn primary" href="${state.members.length ? 'expenses.html' : 'members.html'}">
      ${state.members.length ? 'ไปบันทึกค่าใช้จ่าย' : 'ไปเพิ่มสมาชิก'}</a></div>`;
    return;
  }
  $('#reportBox').innerHTML = reportHtml({ ...state, at: Date.now() });

  const link = await buildShareLink();
  $('#shareLink').value = link;
  $('#openView').href = link;
  $('#lineShare').href = 'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(link);
  $('#nativeShare').hidden = !navigator.share;

  const local = location.protocol === 'file:' || ['localhost', '127.0.0.1'].includes(location.hostname);
  $('#shareHint').innerHTML = local
    ? '⚠️ ตอนนี้เปิดเว็บจากเครื่องตัวเอง ลิงก์จะเปิดได้เฉพาะเครื่องนี้ — ต้องเอาเว็บขึ้นออนไลน์ก่อน (ดู README.md) เพื่อนถึงจะเปิดได้'
    : `ข้อมูลทั้งหมดอยู่ในลิงก์ (${Math.round(link.length / 100) / 10}k ตัวอักษร) เพื่อนกดเปิดก็เห็นรายงานพร้อม QR ทันที — ถ้าแก้ข้อมูลภายหลัง ต้องส่งลิงก์ใหม่`;
}

$('#copyBtn').addEventListener('click', async () => {
  const v = $('#shareLink').value;
  try { await navigator.clipboard.writeText(v); }
  catch (e) { $('#shareLink').select(); document.execCommand('copy'); }
  toast('คัดลอกลิงก์แล้ว ✓ วางส่งในแชทได้เลย');
});
$('#printBtn').addEventListener('click', () => window.print());
$('#nativeShare').addEventListener('click', () => {
  navigator.share({
    title: `สรุปค่าใช้จ่าย ${state.trip}`,
    text: `สรุปค่าใช้จ่ายทริป "${state.trip}" ใครต้องโอนเท่าไหร่ สแกน QR ได้เลย 👇`,
    url: $('#shareLink').value,
  }).catch(() => {});
});

window.onStateChange = render;
render();
