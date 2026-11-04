'use strict';
/* หน้าแรก — ภาพรวมทริป + ขั้นตอนการใช้งาน */

renderShell('index.html');

function render() {
  const c = compute(state);
  const nM = state.members.length, nE = state.expenses.length;
  const left = c.transfers.filter(t => !t.done).length;

  $('#homeStats').innerHTML = nE ? statsHtml(state, c) : '';

  const steps = [
    {
      href: 'members.html', icon: '👥', title: '1. เพิ่มสมาชิก',
      desc: nM ? `มี ${nM} คน: ${state.members.slice(0, 4).map(m => esc(m.name)).join(', ')}${nM > 4 ? ' …' : ''}` : 'ใส่ชื่อเพื่อนร่วมทริป และเบอร์พร้อมเพย์',
      done: nM >= 2,
    },
    {
      href: 'expenses.html', icon: '🧾', title: '2. บันทึกค่าใช้จ่าย',
      desc: nE ? `${nE} รายการ รวม ${fmt(c.total)}` : 'ใครจ่ายอะไรไป หารกับใครบ้าง',
      done: nE > 0,
    },
    {
      href: 'summary.html', icon: '🧮', title: '3. คำนวณ',
      desc: !nE ? 'ระบบคำนวณให้อัตโนมัติ' : c.transfers.length
        ? (left ? `ต้องโอนอีก ${left} รายการ` : 'โอนครบทุกรายการแล้ว 🎉') : 'ไม่มีใครต้องโอน',
      done: nE > 0 && left === 0,
    },
    {
      href: 'report.html', icon: '📄', title: '4. รายงาน & ส่งลิงก์',
      desc: 'สรุปว่าใครใช้เท่าไหร่ ส่งลิงก์พร้อม QR พร้อมเพย์',
      done: false,
    },
  ];
  $('#steps').innerHTML = steps.map(s => `
    <a class="step ${s.done ? 'is-done' : ''}" href="${s.href}">
      <span class="step-icon">${s.done ? '✓' : s.icon}</span>
      <span class="grow"><b>${s.title}</b><span class="sub">${s.desc}</span></span>
      <span class="chev">›</span>
    </a>`).join('');
}

let pending = null;
function ask(kind) {
  pending = kind;
  $('#resetMsg').textContent = kind === 'reset'
    ? 'ลบสมาชิกและค่าใช้จ่ายทั้งหมดจริงไหม?'
    : 'ข้อมูลทริปปัจจุบันจะถูกแทนที่ด้วยข้อมูลตัวอย่าง ตกลงไหม?';
  $('#resetConfirm').hidden = false;
}
$('#demoBtn').addEventListener('click', () => {
  if (state.members.length || state.expenses.length) return ask('demo');
  state = demoState(); save(); render();
  toast('โหลดข้อมูลตัวอย่างแล้ว');
});
$('#resetBtn').addEventListener('click', () => ask('reset'));
$('#resetNo').addEventListener('click', () => { $('#resetConfirm').hidden = true; });
$('#resetYes').addEventListener('click', () => {
  state = pending === 'demo' ? demoState() : blank();
  save(); render();
  $('#resetConfirm').hidden = true;
  toast(pending === 'demo' ? 'โหลดข้อมูลตัวอย่างแล้ว' : 'ล้างข้อมูลแล้ว เริ่มทริปใหม่ได้เลย');
});

window.onStateChange = render;
render();
