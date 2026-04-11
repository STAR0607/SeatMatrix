/* ═══════════════════════════════════
   SEATMATRIX - Frontend Logic
   Sasurie College of Engineering
═══════════════════════════════════ */

let currentArrangementId = null;
let currentArrangementData = null;

// ─── PAGE NAVIGATION ─────────────────
function showPage(page) {
  // Hide all pages - let CSS handle display via .active class
  ['login', 'student-finder', 'dashboard'].forEach(p => {
    const el = document.getElementById('page-' + p);
    if (el) {
      el.classList.remove('active');
      el.style.display = '';  // clear any inline style
    }
  });

  // Show target - CSS .active rules control the display type
  const target = document.getElementById('page-' + page);
  if (target) {
    target.style.display = '';  // clear inline style first
    target.classList.add('active');
  }
}

function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(`section-${name}`);
  if (el) el.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.section === name);
  });

  // Close sidebar on mobile after navigation
  if (window.innerWidth <= 900) closeSidebar();

  if (name === 'home') loadStats();
  if (name === 'exams') loadExams();
  if (name === 'rooms') loadRooms();
  if (name === 'staff') loadStaff();
  if (name === 'students') loadStudents();
  if (name === 'colleges') loadColleges();
  if (name === 'generate') loadGenerateDropdowns();
  if (name === 'archives') loadArchives();
  if (name === 'users') loadUsers();
}

window.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash === '#search') {
    showPage('student-finder');
  }
});

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) overlay.classList.remove('active');
}

// ─── TOAST ───────────────────────────
function toast(msg, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  setTimeout(() => el.classList.remove('show'), 3000);
}

// ─── AUTH ─────────────────────────────
function setDashboardWelcome(name, role) {
  const el = document.getElementById('dashboard-welcome');
  if (!el) return;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning 🌅' : hour < 17 ? 'Good afternoon ☀️' : 'Good evening 🌙';
  el.innerHTML = `${greeting}, <strong>${name}</strong>! Here's your overview.`;
}

async function doLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');

  if (!username || !password) {
    errEl.textContent = 'Please enter username and password';
    errEl.style.display = 'block';
    return;
  }

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.success) {
      window.currentUserRole = data.role;
      window.currentUserName = data.name;
      document.getElementById('sidebar-username').textContent = data.name;
      document.getElementById('sidebar-role').textContent = data.role === 'admin' ? 'Administrator' : 'Staff';
      setDashboardWelcome(data.name, data.role);
      errEl.style.display = 'none';
      showPage('dashboard');
      showSection('home');
    } else {
      errEl.textContent = data.error || 'Invalid credentials';
      errEl.style.display = 'block';
    }
  } catch (e) {
    errEl.textContent = 'Connection error. Is the server running?';
    errEl.style.display = 'block';
  }
}

async function doLogout() {
  await fetch('/api/logout', { method: 'POST' });
  showPage('login');
}

function togglePasswordVisibility() {
  const pwdInput = document.getElementById('login-password');
  const eyeOn = document.getElementById('eye-on-svg');
  const eyeOff = document.getElementById('eye-off-svg');
  if (pwdInput.type === 'password') {
    pwdInput.type = 'text';
    if (eyeOn) eyeOn.style.display = 'block';
    if (eyeOff) eyeOff.style.display = 'none';
  } else {
    pwdInput.type = 'password';
    if (eyeOn) eyeOn.style.display = 'none';
    if (eyeOff) eyeOff.style.display = 'block';
  }
}

// Allow Enter key on login
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-password')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });

  // Always start on login page, then check session
  showPage('login');
  fetch('/api/me').then(r => {
    if (!r.ok) { showPage('login'); return null; }
    return r.json();
  }).then(data => {
    if (data && data.username) {
      window.currentUserRole = data.role || 'staff';
      window.currentUserName = data.name || data.username;
      document.getElementById('sidebar-username').textContent = data.name || data.username;
      document.getElementById('sidebar-role').textContent = data.role === 'admin' ? 'Administrator' : 'Staff';
      setDashboardWelcome(data.name || data.username, data.role);
      showPage('dashboard');
      showSection('home');
    } else {
      showPage('login');
    }
  }).catch(() => { showPage('login'); });
});

// ─── STUDENT FINDER ─────────────────
async function findSeat() {
  const query = document.getElementById('student-query').value.trim().toUpperCase();
  if (!query) { toast('Please enter your register number', 'error'); return; }
  if (query.length < 4) { toast('Please enter a valid register number', 'error'); return; }

  const container = document.getElementById('seat-results');
  container.innerHTML = '<div class="no-results"><div class="nr-icon">⏳</div><p>Searching...</p></div>';

  try {
    const res = await fetch('/api/find-seat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await res.json();

    if (res.status === 400) {
      container.innerHTML = `<div class="no-results"><div class="nr-icon">⚠️</div><p>${data.error}</p></div>`;
      return;
    }

    if (!data.length) {
      container.innerHTML = `
        <div class="no-results">
          <div class="nr-icon">🔍</div>
          <p>No seat found for register number <strong>${query}</strong></p>
          <small>Check your register number or ask your exam coordinator</small>
        </div>`;
      return;
    }

    container.innerHTML = data.map(r => `
      <div class="seat-card">
        <div class="seat-card-header">
          <div>
            <div class="seat-card-name">${r.student_name && r.student_name !== '—' ? r.student_name : r.register_number}</div>
            <div style="font-size:0.8rem;color:#999;margin-top:2px">${r.register_number} · ${r.department || ''} ${r.year ? '· Year ' + r.year : ''}</div>
          </div>
          <div class="seat-badge">Seat ${r.seat_number}</div>
        </div>

        ${r.subject ? `
        <div style="background:linear-gradient(135deg,#B71C1C,#D32F2F);color:white;border-radius:10px;padding:12px 16px;margin:12px 0;text-align:center">
          <div style="font-size:0.72rem;opacity:0.85;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Subject</div>
          <div style="font-size:1.05rem;font-weight:700;line-height:1.3">${r.subject}</div>
          ${r.subject_code ? `<div style="font-size:0.78rem;opacity:0.8;margin-top:3px">${r.subject_code}</div>` : ''}
        </div>` : ''}

        <div class="seat-card-info">
          <div class="seat-info-item">
            <div class="seat-info-label">📝 Exam</div>
            <div class="seat-info-val">${r.exam_name}</div>
          </div>
          <div class="seat-info-item">
            <div class="seat-info-label">📅 Date & Time</div>
            <div class="seat-info-val">${r.exam_date || '–'}${r.exam_time ? ' · ' + r.exam_time : ''}${r.duration ? ' · ' + r.duration : ''}</div>
          </div>
          <div class="seat-info-item">
            <div class="seat-info-label">🏫 Hall</div>
            <div class="seat-info-val">${r.room}</div>
          </div>
          <div class="seat-info-item">
            <div class="seat-info-label">📍 Seat Position</div>
            <div class="seat-info-val">${r.seat_label} (Seat No. ${r.seat_number})</div>
          </div>
          <div class="seat-info-item">
            <div class="seat-info-label">📄 Question Paper</div>
            <div class="seat-info-val">
              <span style="background:var(--red);color:white;padding:3px 14px;border-radius:20px;font-weight:700;font-size:0.95rem">Set ${r.paper_set}</span>
            </div>
          </div>
        </div>
      </div>
      
      ${r.hall_data ? (() => {
        const room = r.hall_data.room;
        if (!room) return '';
        const maxRow = room.grid_rows || Math.max(...r.hall_data.seats.map(s => s.row || 1));
        const maxCol = room.grid_cols || Math.max(...r.hall_data.seats.map(s => s.col || 1));
        
        let aislesRaw = room.aisle_after_col || [];
        if (typeof aislesRaw === 'string') {
          if (aislesRaw.startsWith('[')) { try { aislesRaw = JSON.parse(aislesRaw); } catch(e){ aislesRaw = []; } }
          else aislesRaw = aislesRaw.split(',').map(x=>parseInt(x.trim())).filter(n=>n>0);
        }
        const aisles = Array.isArray(aislesRaw) ? aislesRaw.map(Number) : [];

        const seatMap = {};
        r.hall_data.seats.forEach(s => { seatMap[`${s.row}_${s.col}`] = s; });

        let colTemplate = '';
        for (let c = 1; c <= maxCol; c++) {
          colTemplate += '64px ';
          if (aisles.includes(c)) colTemplate += '20px ';
        }

        let gridHtml = '';
        for (let r_row = 1; r_row <= maxRow; r_row++) {
          for (let c = 1; c <= maxCol; c++) {
            const s = seatMap[`${r_row}_${c}`];
            if (!s) {
              gridHtml += `<div class="vseat vsempty" style="opacity:0.3;filter:grayscale(100%)"><span style="color:#ccc">—</span></div>`;
            } else {
              const isTargetUser = s.register_number.toUpperCase() === query;
              const cls = s.paper_set === 'B' ? 'vsb' : s.paper_set === 'C' ? 'vsc' : 'vsa';
              
              if (isTargetUser) {
                gridHtml += `
                <div class="vseat ${cls}" style="transform: scale(1.15); z-index: 10; box-shadow: 0 0 15px rgba(211,47,47,0.7); border: 2px solid #D32F2F;">
                  <span class="vseat-num">${s.seat_number}</span>
                  <span class="vseat-reg" style="font-weight:800; color:#B71C1C;">YOU</span>
                  <span class="vseat-set">Set ${s.paper_set||'A'}</span>
                </div>`;
              } else {
                gridHtml += `
                <div class="vseat ${cls}" style="opacity:0.3; filter:grayscale(100%);">
                  <span class="vseat-num">${s.seat_number}</span>
                  <span class="vseat-reg">${s.register_number}</span>
                  <span class="vseat-set">Set ${s.paper_set||'A'}</span>
                </div>`;
              }
            }
            if (aisles.includes(c)) {
              gridHtml += `<div class="vaisle"></div>`;
            }
          }
        }

        return `
        <div class="visual-room-block" style="margin-top:20px; border-radius:12px; background:white; padding:20px; box-shadow:0 4px 15px rgba(0,0,0,0.05);">
          <h3 style="margin-bottom:15px; color:#1f2937; text-align:center;">Visual Seat Map Location</h3>
          <div class="visual-blackboard" style="opacity:0.8">Blackboard / Front of Hall</div>
          <div class="visual-seat-grid-wrap" style="overflow-x:auto;">
            <div class="visual-seat-grid" style="grid-template-columns:${colTemplate.trim()}; gap:5px; margin:0 auto; padding-bottom:10px;">
              ${gridHtml}
            </div>
          </div>
          <div style="text-align:center; margin-top:15px; font-size:0.85rem; color:#666;">
            Facing forwards towards the blackboard. Your seat is highlighted.
          </div>
        </div>`;
      })() : ''}
    `).join('');
  } catch (e) {
    container.innerHTML = '<div class="no-results"><div class="nr-icon">⚠️</div><p>Error searching. Please try again.</p></div>';
  }
}

// ─── STATS ─────────────────────────
async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    document.getElementById('stat-exams').textContent    = data.total_exams    ?? 0;
    document.getElementById('stat-rooms').textContent    = data.total_rooms    ?? 0;
    document.getElementById('stat-staff').textContent    = data.total_staff    ?? 0;
    document.getElementById('stat-students').textContent = data.total_students ?? 0;
    document.getElementById('stat-seated').textContent   = data.unique_seated  ?? 0;
    document.getElementById('stat-arrangements').textContent = data.total_seating ?? 0;
    document.getElementById('stat-colleges').textContent = data.total_colleges ?? 0;
    document.getElementById('stat-users').textContent    = data.total_users    ?? 0;
  } catch (e) {}
}

// ─── EXAMS ─────────────────────────
async function loadExams() {
  try {
    const res = await fetch('/api/exams');
    if (!res.ok) { console.error('loadExams failed:', res.status); return; }
    const exams = await res.json();
    const tbody = document.getElementById('exams-tbody');
    if (!tbody) return;
    if (exams.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#999;padding:24px">No exams yet. Add one!</td></tr>';
      return;
    }
    tbody.innerHTML = exams.map(e => {
      const ysm = e.year_subject_map || {};
      const ysc = e.year_subject_code_map || {};
      const ysmEntries = Object.entries(ysm);

      let subjList = [];
      let codeList = [];
      let dyList = [];

      // Add default subject if exists or if there are no group subjects
      if (e.subject || ysmEntries.length === 0) {
        subjList.push(`<div style="font-weight:600;padding:2px 0">${e.subject || '–'}</div>`);
        codeList.push(`<div style="padding:2px 0"><span class="subject-code-chip">${e.subject_code || '–'}</span></div>`);
        
        let dChip = e.department ? `<span class="dept-chip">${e.department}</span>` : '';
        let yChip = e.year ? `<span class="year-chip">Y${e.year}</span>` : '';
        let fallback = (e.department || e.year) ? '' : '—';
        dyList.push(`<div style="padding:2px 0">${dChip} ${yChip} ${fallback}</div>`);
      }

      // Add mapped subjects
      ysmEntries.forEach(([key, subj]) => {
        const parts = key.includes('|') ? key.split('|') : [key, ''];
        const yr = parts[0] ? 'Y' + parts[0] : 'All Yrs';
        const dept = parts[1] ? parts[1] : 'All Depts';
        const cd = ysc[key] || '–';

        subjList.push(`<div style="font-weight:600;padding:2px 0;color:#b85c00">${subj}</div>`);
        codeList.push(`<div style="padding:2px 0"><span class="subject-code-chip" style="background:#fff3e0;color:#b85c00;border:none">${cd}</span></div>`);
        dyList.push(`<div style="padding:2px 0"><span class="year-chip">${yr}</span> <span class="dept-chip">${dept}</span></div>`);
      });

      const subjectHtml = `<div style="display:flex;flex-direction:column;gap:4px">${subjList.join('')}</div>`;
      const codeHtml = `<div style="display:flex;flex-direction:column;gap:4px">${codeList.join('')}</div>`;
      const deptYearHtml = `<div style="display:flex;flex-direction:column;gap:4px">${dyList.join('')}</div>`;

      return '<tr>'
        + '<td><strong>' + e.name + '</strong>'
        + (e.semester ? '<br><small style="color:#999">' + e.semester + '</small>' : '')
        + '</td>'
        + '<td>' + subjectHtml + '</td>'
        + '<td>' + codeHtml + '</td>'
        + '<td>' + deptYearHtml + '</td>'
        + '<td>' + (e.date || '–') + '</td>'
        + '<td>' + (e.time ? formatTime(e.time) : '–') + '</td>'
        + '<td>' + (e.duration || '–') + '</td>'
        + '<td><span style="background:#FFEBEE;color:#C62828;padding:2px 7px;border-radius:4px;font-size:0.8rem;font-weight:600">' + (e.paper_sets || '2') + ' Sets</span></td>'
        + '<td style="display:flex;gap:6px;flex-wrap:wrap">'
        + '<button class="btn-secondary" style="padding:5px 10px;font-size:0.8rem" onclick=\'editExam(' + JSON.stringify(e).replace(/\'/g, "&#39;") + ')\'>Edit</button>'
        + '<button class="btn-danger" onclick="deleteExam(\'' + e.id + '\')">Delete</button>'
        + '</td>'
        + '</tr>';
    }).join('');
  } catch (e) { console.error('loadExams error:', e); }
}

function addYearSubjectRow() {
  const container = document.getElementById('year-subject-rows');
  const row = document.createElement('div');
  row.className = 'year-subject-row';
  row.innerHTML = `
    <select class="ys-year">
      <option value="">Any Year</option>
      <option value="1">1st Year</option>
      <option value="2">2nd Year</option>
      <option value="3">3rd Year</option>
      <option value="4">4th Year</option>
    </select>
    <input type="text" class="ys-dept" placeholder="e.g. AIDS or blank"/>
    <input type="text" class="ys-subject" placeholder="Subject name"/>
    <input type="text" class="ys-subject-code" placeholder="e.g. CS3301"/>
    <button type="button" onclick="this.closest('.year-subject-row').remove()" class="ys-remove">✕</button>`;
  container.appendChild(row);
}

function getYearSubjectMap() {
  const map = {};
  const codeMap = {};
  document.querySelectorAll('.year-subject-row').forEach(row => {
    const year = row.querySelector('.ys-year')?.value || '';
    const dept = (row.querySelector('.ys-dept')?.value || '').trim();
    const subject = row.querySelector('.ys-subject')?.value.trim();
    const subjectCode = row.querySelector('.ys-subject-code')?.value.trim() || '';
    if (subject) {
      const key = `${year}|${dept}`;
      map[key] = subject;
      if (subjectCode) codeMap[key] = subjectCode;
    }
  });
  return { map, codeMap };
}

let editingExamId = null;

async function addExam() {
  const name = document.getElementById('exam-name').value.trim();
  const date = document.getElementById('exam-date').value;
  if (!name) { toast('Exam name is required', 'error'); return; }

  const { map: yearSubjectMap, codeMap: yearSubjectCodeMap } = getYearSubjectMap();

  try {
    const isEditing = !!editingExamId;
    const url = isEditing ? `/api/exams/${editingExamId}` : '/api/exams';
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, date,
        subject: document.getElementById('exam-subject').value.trim(),
        subject_code: document.getElementById('exam-subject-code').value.trim(),
        time: document.getElementById('exam-time').value,
        duration: document.getElementById('exam-duration').value.trim(),
        paper_sets: document.getElementById('exam-paper-sets').value,
        department: document.getElementById('exam-dept').value.trim(),
        semester: document.getElementById('exam-sem').value.trim(),
        year_subject_map: yearSubjectMap,
        year_subject_code_map: yearSubjectCodeMap
      })
    });
    const data = await res.json();
    if (res.ok) {
      toast(isEditing ? 'Exam updated successfully!' : 'Exam added successfully!', 'success');
      
      // Reset form
      editingExamId = null;
      const btn = document.getElementById('btn-add-exam');
      if (btn) {
        btn.textContent = 'Add Exam';
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-secondary');
      }

      ['exam-name','exam-subject','exam-subject-code','exam-date',
       'exam-time','exam-duration','exam-dept','exam-sem'].forEach(id => {
        document.getElementById(id).value = '';
      });
      document.getElementById('exam-paper-sets').value = '2';
      
      const container = document.getElementById('year-subject-rows');
      container.innerHTML = '';
      // Inject at least one row automatically
      addYearSubjectRow();
      
      loadExams();
    } else {
      toast(data.error || 'Failed to process exam', 'error');
    }
  } catch (e) { toast('Network error — check if server is running', 'error'); }
}

function editExam(e) {
  editingExamId = e.id;
  document.getElementById('exam-name').value = e.name || '';
  document.getElementById('exam-subject').value = e.subject || '';
  document.getElementById('exam-subject-code').value = e.subject_code || '';
  document.getElementById('exam-date').value = e.date || '';
  document.getElementById('exam-time').value = e.time || '';
  document.getElementById('exam-duration').value = e.duration || '';
  document.getElementById('exam-dept').value = e.department || '';
  document.getElementById('exam-sem').value = e.semester || '';
  document.getElementById('exam-paper-sets').value = e.paper_sets || '2';
  
  const btn = document.getElementById('btn-add-exam');
  if (btn) {
    btn.textContent = 'Update Exam';
    btn.classList.add('btn-secondary');
    btn.classList.remove('btn-primary');
  }
  
  const ysm = e.year_subject_map || {};
  const ysc = e.year_subject_code_map || {};
  const entries = Object.entries(ysm);
  
  const container = document.getElementById('year-subject-rows');
  if (container) container.innerHTML = '';
  
  if (entries.length === 0) {
    addYearSubjectRow();
  } else {
    entries.forEach(([key, subj]) => {
      addYearSubjectRow();
      const rows = container.querySelectorAll('.year-subject-row');
      const lastRow = rows[rows.length - 1];
      const parts = key.includes('|') ? key.split('|') : [key, ''];
      lastRow.querySelector('.ys-year').value = parts[0] || '';
      lastRow.querySelector('.ys-dept').value = parts[1] || '';
      lastRow.querySelector('.ys-subject').value = subj || '';
      lastRow.querySelector('.ys-subject-code').value = ysc[key] || '';
    });
  }
  
  // Scroll form into view
  const formCard = document.querySelector('.form-card');
  if (formCard) formCard.scrollIntoView({ behavior: 'smooth' });
}

async function deleteExam(id) {
  if (!confirm('Delete this exam? This will also remove its seating arrangement.')) return;
  await fetch(`/api/exams/${id}`, { method: 'DELETE' });
  toast('Exam deleted', 'success');
  loadExams();
}

// ─── ROOMS ─────────────────────────
async function loadRooms() {
  try {
    const res = await fetch('/api/rooms');
    const rooms = await res.json();
    const tbody = document.getElementById('rooms-tbody');
    tbody.innerHTML = rooms.length === 0
      ? '<tr><td colspan="7" style="text-align:center;color:#999;padding:24px">No rooms yet. Add one!</td></tr>'
      : rooms.map(r => `
          <tr>
            <td><strong>${r.name}</strong></td>
            <td>${r.block || '–'}</td>
            <td>${r.capacity}</td>
            <td>${r.grid_rows || '–'}×${r.grid_cols || '–'}</td>
            <td>${r.location || '–'}</td>
            <td>${r.aisle_after_col ? 'After col ' + r.aisle_after_col : '–'}</td>
            <td style="display:flex;gap:6px">
              <button class="btn-secondary" style="padding:5px 10px;font-size:0.8rem" onclick='editRoom(${JSON.stringify(r)})'>Edit</button>
              <button class="btn-danger" onclick="deleteRoom('${r.id}')">Remove</button>
            </td>
          </tr>`).join('');
  } catch (e) {}
}

async function addRoom() {
  const name = document.getElementById('room-name').value.trim();
  const capacity = document.getElementById('room-capacity').value;
  if (!name || !capacity) { toast('Room name and capacity are required', 'error'); return; }

  const blockedRaw = document.getElementById('room-blocked').value.trim();
  const blocked = blockedRaw ? blockedRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  try {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        block: document.getElementById('room-block').value.trim(),
        capacity,
        grid_rows: document.getElementById('room-rows').value || 5,
        grid_cols: document.getElementById('room-cols').value || 8,
        location: document.getElementById('room-location').value.trim(),
        blocked_seats: blocked,
        aisle_after_col: document.getElementById('room-aisle').value || null
      })
    });
    if (res.ok) {
      toast('Room added!', 'success');
      ['room-name','room-block','room-capacity','room-rows','room-cols','room-location','room-blocked','room-aisle'].forEach(id => {
        document.getElementById(id).value = '';
      });
      loadRooms();
    }
  } catch (e) { toast('Error adding room', 'error'); }
}

async function deleteRoom(id) {
  if (!confirm('Remove this room?')) return;
  await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
  toast('Room removed', 'success');
  loadRooms();
}

// ─── STAFF ─────────────────────────
async function loadStaff() {
  try {
    const res = await fetch('/api/staff');
    const staff = await res.json();
    const tbody = document.getElementById('staff-tbody');
    tbody.innerHTML = staff.length === 0
      ? '<tr><td colspan="5" style="text-align:center;color:#999;padding:24px">No staff added yet.</td></tr>'
      : staff.map(s => `
          <tr>
            <td><strong>${s.name}</strong></td>
            <td>${s.email || '–'}</td>
            <td>${s.phone || '–'}</td>
            <td>${s.department || '–'}</td>
            <td style="display:flex;gap:6px">
              <button class="btn-secondary" style="padding:5px 10px;font-size:0.8rem" onclick='editStaff(${JSON.stringify(s)})'>Edit</button>
              <button class="btn-danger" onclick="deleteStaff('${s.id}')">Remove</button>
            </td>
          </tr>`).join('');
  } catch (e) {}
}

async function addStaff() {
  const name = document.getElementById('staff-name').value.trim();
  if (!name) { toast('Staff name is required', 'error'); return; }

  try {
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email: document.getElementById('staff-email').value,
        phone: document.getElementById('staff-phone').value,
        department: document.getElementById('staff-dept').value
      })
    });
    if (res.ok) {
      toast('Staff added!', 'success');
      ['staff-name','staff-email','staff-phone','staff-dept'].forEach(id => {
        document.getElementById(id).value = '';
      });
      loadStaff();
    }
  } catch (e) { toast('Error adding staff', 'error'); }
}

async function deleteStaff(id) {
  if (!confirm('Remove this staff member?')) return;
  await fetch(`/api/staff/${id}`, { method: 'DELETE' });
  toast('Staff removed', 'success');
  loadStaff();
}

// ─── COLLEGES ─────────────────────
// loadColleges is now handled by the full renderColleges() function below




// ─── GENERATE DROPDOWNS ─────────────
async function loadGenerateDropdowns() {
  try {
    const [examsRes, roomsRes, staffRes] = await Promise.all([
      fetch('/api/exams'), fetch('/api/rooms'), fetch('/api/staff')
    ]);
    const [exams, rooms, staff] = await Promise.all([
      examsRes.json(), roomsRes.json(), staffRes.json()
    ]);

    const examSel = document.getElementById('gen-exam-id');
    examSel.innerHTML = '<option value="">Select an exam...</option>' +
      exams.map(e => `<option value="${e.id}">${e.name} (${e.date})</option>`).join('');

    const roomSel = document.getElementById('gen-room-ids');
    roomSel.innerHTML = rooms.map(r => `
      <label class="checklist-item">
        <input type="checkbox" name="halls" value="${r.id}" onchange="toggleChecklistItem(this)">
        <span class="tick"></span>
        <span>${r.name} – ${r.location} (Cap: ${r.capacity})</span>
      </label>`).join('');

    const staffSel = document.getElementById('gen-invigilator-ids');
    staffSel.innerHTML = staff.map(s => `
      <label class="checklist-item">
        <input type="checkbox" name="staff" value="${s.id}" onchange="toggleChecklistItem(this)">
        <span class="tick"></span>
        <span>${s.name}${s.department ? ' – ' + s.department : ''}</span>
      </label>`).join('');
  } catch (e) {
    console.error('loadGenerateDropdowns:', e);
  }
}

function toggleChecklistItem(cb) {
  const item = cb.closest('.checklist-item');
  if (cb.checked) item.classList.add('selected');
  else item.classList.remove('selected');
}

// ─── FILE UPLOAD ─────────────────────
// Stores all parsed students from uploaded file (unfiltered)
let allUploadedStudents = [];
let filteredUploadedStudents = [];

async function handleFileUpload(input) {
  const file = input.files[0];
  if (!file) return;

  const zone = document.getElementById('upload-zone');
  const info = document.getElementById('upload-info');
  zone.querySelector('p').textContent = `⏳ Reading ${file.name}...`;

  allUploadedStudents = await parseStudentFile(file);

  zone.querySelector('p').textContent = `✓ ${file.name}`;
  zone.classList.add('has-file');
  info.style.display = 'block';
  info.textContent = `${allUploadedStudents.length} students loaded`;

  // Populate dept checkboxes from parsed data
  const depts = [...new Set(allUploadedStudents.map(s => s.department).filter(Boolean))].sort();
  const deptBox = document.getElementById('dept-checkboxes');
  if (deptBox) {
    deptBox.innerHTML = depts.map(d => `
      <label class="filter-check">
        <input type="checkbox" class="fd-item" value="${d}" checked onchange="applyUploadFilters()">
        ${d}
      </label>`).join('');
  }

  // Show filter panel
  const filters = document.getElementById('upload-filters');
  if (filters) filters.style.display = 'block';

  applyUploadFilters();
}

function filterYearAll(checkbox) {
  document.querySelectorAll('.fy-item').forEach(cb => { cb.checked = checkbox.checked; });
  applyUploadFilters();
}

function filterDeptAll(checkbox) {
  document.querySelectorAll('.fd-item').forEach(cb => { cb.checked = checkbox.checked; });
  applyUploadFilters();
}

function applyUploadFilters() {
  // Sync "All Years" checkbox
  const fyAll = document.getElementById('fy-all');
  const fyItems = document.querySelectorAll('.fy-item');
  if (fyAll) fyAll.checked = [...fyItems].every(cb => cb.checked);

  // Sync "All Departments" checkbox
  const fdAll = document.getElementById('fd-all');
  const fdItems = document.querySelectorAll('.fd-item');
  if (fdAll) fdAll.checked = [...fdItems].every(cb => cb.checked);

  // Get selected years
  const selectedYears = [...fyItems].filter(cb => cb.checked).map(cb => cb.value);
  // Get selected depts
  const selectedDepts = [...fdItems].filter(cb => cb.checked).map(cb => cb.value);

  filteredUploadedStudents = allUploadedStudents.filter(s => {
    const matchYear = selectedYears.length === 0 || selectedYears.includes(String(s.year));
    const matchDept = selectedDepts.length === 0 || selectedDepts.includes(s.department);
    return matchYear && matchDept;
  });

  const summaryEl = document.getElementById('upload-filter-summary');
  if (summaryEl) {
    const excluded = allUploadedStudents.length - filteredUploadedStudents.length;
    if (excluded > 0) {
      summaryEl.innerHTML = `<span style="color:var(--red);font-weight:600">✓ ${filteredUploadedStudents.length} students will be seated</span> · <span style="color:#999">${excluded} excluded by filter</span>`;
    } else {
      summaryEl.innerHTML = `<span style="color:#2e7d32;font-weight:600">✓ All ${filteredUploadedStudents.length} students selected</span>`;
    }
  }
}

// ─── GENERATE SEATING ────────────────
// Store remaining students between generation runs
let remainingStudentsForNextHall = [];
let currentExamIdForGeneration = null;

async function generateSeating(appendMode = false) {
  const examId = document.getElementById('gen-exam-id').value;
  if (!examId) { toast('Please select an exam', 'error'); return; }

  const roomIds = Array.from(document.querySelectorAll('#gen-room-ids input:checked')).map(i => i.value);
  if (roomIds.length === 0) { toast('Please select at least one hall', 'error'); return; }

  const invIds = Array.from(document.querySelectorAll('#gen-invigilator-ids input:checked')).map(i => i.value);

  const settings = {
    interleave_departments: document.getElementById('gen-interleave').checked,
    prevent_same_dept: document.getElementById('gen-prevent-dept').checked,
    paper_sets: document.getElementById('gen-paper-sets').value,
    separate_year: document.getElementById('gen-separate-year')?.checked || false,
  };

  // Determine student source
  let students = [];
  const activeTab = document.getElementById('tab-saved')?.classList.contains('active');

  if (appendMode && remainingStudentsForNextHall.length > 0) {
    // Use remaining students from previous run
    students = remainingStudentsForNextHall;
  } else if (activeTab) {
    // From saved students
    students = savedStudentsForGen;
    if (students.length === 0) { toast('No students selected. Use filters to select students.', 'error'); return; }
    students = students.map(s => ({
      student_name: s.student_name, register_number: s.register_number,
      department: s.department, year: s.year, subject: s.subject
    }));
  } else {
    // From uploaded CSV — use already-parsed + filtered students
    if (filteredUploadedStudents.length > 0) {
      students = filteredUploadedStudents;
    } else if (allUploadedStudents.length > 0) {
      students = allUploadedStudents;
    } else {
      // Fallback: try to parse file now
      const csvFile = document.getElementById('students-csv').files[0];
      if (!csvFile) { toast('Please upload a student file', 'error'); return; }
      students = await parseStudentFile(csvFile);
    }
    if (students.length === 0) { toast('No students found. Check your file or filters.', 'error'); return; }
  }

  const btn = document.querySelector('.gen-btn');
  const originalText = btn.textContent;
  btn.textContent = '⏳ Generating...';
  btn.disabled = true;

  // Get year_subject_code_map from current exam form (for subject code resolution)
  const { codeMap: ysCodes } = getYearSubjectMap();

  try {
    const res = await fetch('/api/generate-seating', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exam_id: examId,
        room_ids: roomIds,
        invigilator_ids: invIds,
        students,
        settings,
        append_mode: appendMode,
        year_subject_code_map: ysCodes
      })
    });
    const data = await res.json();

    if (data.success) {
      currentArrangementId = examId;
      currentExamIdForGeneration = examId;
      remainingStudentsForNextHall = data.remaining_students || [];

      renderSeatingPreview(data.arrangement.seats);
      document.getElementById('preview-legend').style.display = 'flex';


      // Show print/export action bar
      const printActions = document.getElementById('preview-print-actions');
      if (printActions) printActions.style.display = 'flex';

      // Show remaining students banner
      showRemainingBanner(data.total_seated, data.total_remaining, examId);

      toast(`✅ ${data.message}`, 'success');
    } else {
      toast(data.error || 'Generation failed', 'error');
    }
  } catch (e) {
    toast('Error communicating with server', 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

function showRemainingBanner(seated, remaining, examId) {
  // Remove old banner
  const old = document.getElementById('remaining-banner');
  if (old) old.remove();

  const preview = document.getElementById('seating-preview');
  if (!preview) return;

  const banner = document.createElement('div');
  banner.id = 'remaining-banner';
  banner.style.cssText = `
    background: ${remaining > 0 ? '#fff3e0' : '#e8f5e9'};
    border: 1.5px solid ${remaining > 0 ? '#ff9800' : '#4caf50'};
    border-radius: 10px; padding: 14px 18px; margin-bottom: 16px;
    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;
  `;

  if (remaining > 0) {
    banner.innerHTML = `
      <div>
        <div style="font-weight:800;color:#B71C1C;font-size:1.1rem;margin-bottom:6px">⚠️ HALL CAPACITY INSUFFICIENT! PLEASE ADD EXTRA HALLS</div>
        <div style="font-weight:700;color:#e65100">${remaining} students not yet seated</div>
        <div style="font-size:0.82rem;color:#999;margin-top:3px">${seated} seated in selected halls. Select more halls and click <strong>Generate Next Hall</strong> to seat remaining students.</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button onclick="generateSeating(true)" style="background:#ff9800;color:white;border:none;padding:9px 16px;border-radius:8px;font-weight:600;cursor:pointer;font-family:inherit">
          ➕ Generate Next Hall (${remaining} students)
        </button>
        <button onclick="downloadRemainingCSV()" style="background:white;border:1.5px solid #ff9800;color:#e65100;padding:9px 16px;border-radius:8px;font-weight:600;cursor:pointer;font-family:inherit">
          📥 Export Remaining
        </button>
      </div>`;
  } else {
    banner.innerHTML = `<div style="font-weight:700;color:#2e7d32">✅ All ${seated} students have been seated!</div>`;
  }

  preview.insertBefore(banner, preview.firstChild);
}

function downloadRemainingCSV() {
  if (!remainingStudentsForNextHall.length) { toast('No remaining students', 'error'); return; }
  const rows = [['Name','Register Number','Department','Year','Subject']];
  remainingStudentsForNextHall.forEach(s => {
    rows.push([s.student_name||'', s.register_number||'', s.department||'', s.year||'', s.subject||'']);
  });
  const csv = rows.map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'remaining_students.csv';
  a.click();
  toast(`Downloaded ${remainingStudentsForNextHall.length} remaining students`, 'success');
}

// Auto-decode department and year from Sasurie register number
function decodeRegisterNumber(regno) {
  if (!regno || regno.length !== 12 || !regno.startsWith('73')) return { dept: '', year: '' };
  const deptMap = {
    '243':'AIDS','205':'IT','104':'CSE','105':'ECE','106':'EEE',
    '103':'MECH','114':'CIVIL','149':'CSE CS','631':'MBA','107':'EIE','108':'ICE'
  };
  const yearMap = { '21':'4','22':'3','23':'3','24':'2','25':'1' };
  return {
    dept: deptMap[regno.substring(6,9)] || '',
    year: yearMap[regno.substring(4,6)] || ''
  };
}

async function parseStudentFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length === 0) { resolve([]); return; }

      const students = [];

      // Detect plain register number list (no header, just register numbers)
      const firstVal = lines[0].split(',')[0].trim().replace(/"/g,'');
      const isPlainList = /^73\d{10}$/.test(firstVal);

      if (isPlainList) {
        for (const line of lines) {
          const regno = line.split(',')[0].trim().replace(/"/g,'');
          if (!regno) continue;
          const { dept, year } = decodeRegisterNumber(regno);
          students.push({ student_name: '—', register_number: regno, department: dept, year, subject: '' });
        }
      } else {
        // CSV with headers
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g,'').toLowerCase());
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(',').map(v => v.trim().replace(/"/g,''));
          const obj = {};
          headers.forEach((h, idx) => obj[h] = vals[idx] || '');
          const regno = obj['register number'] || obj['register_number'] || obj['regno'] || obj['reg no'] || '';
          if (!regno) continue;
          const { dept, year } = decodeRegisterNumber(regno);
          students.push({
            student_name: obj['name'] || obj['student name'] || obj['student_name'] || '—',
            register_number: regno,
            department: obj['department'] || obj['dept'] || dept,
            year: obj['year'] || year,
            subject: obj['subject'] || '',
          });
        }
      }
      resolve(students);
    };
    reader.readAsText(file);
  });
}

// ─── SEATING PREVIEW ────────────────
function renderSeatingPreview(seats) {
  const container = document.getElementById('seating-preview');
  container.innerHTML = '';

  // Group by room
  const byRoom = {};
  seats.forEach(s => {
    const key = s.room_id || 'unknown';
    byRoom[key] = byRoom[key] || { name: s.room_name, seats: [] };
    byRoom[key].seats.push(s);
  });

  Object.entries(byRoom).forEach(([roomId, room]) => {
    const maxRow = Math.max(...room.seats.map(s => s.row || 1));
    const maxCol = Math.max(...room.seats.map(s => s.col || 1));

    // Get aisles from first seat's data — handle string "3,6", array [3,6], or number
    function parseAisles(raw) {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw.map(Number).filter(n => n > 0);
      const s = String(raw).trim();
      if (s.startsWith('[')) { try { return JSON.parse(s).map(Number); } catch(e){} }
      return s.split(',').map(x=>parseInt(x.trim())).filter(n=>!isNaN(n)&&n>0);
    }
    const aisles = parseAisles(room.seats[0] && room.seats[0].aisles);

    const block = document.createElement('div');
    block.className = 'room-grid-block';

    const label = document.createElement('div');
    label.className = 'room-grid-label';
    label.innerHTML = `🏫 ${room.name} <span style="color:#999;font-weight:400">(${room.seats.length} students)</span>`;
    block.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'room-grid';

    // Build column template — add aisle gaps
    let colTemplate = '';
    for (let c = 1; c <= maxCol; c++) {
      colTemplate += '60px ';
      if (aisles.includes(c)) colTemplate += '14px '; // aisle gap column
    }
    grid.style.gridTemplateColumns = colTemplate.trim();

    for (let r = 1; r <= maxRow; r++) {
      for (let c = 1; c <= maxCol; c++) {
        const seat = room.seats.find(s => s.row === r && s.col === c);
        const cell = document.createElement('div');
        cell.className = 'seat-cell';

        if (!seat) {
          cell.classList.add('empty');
          cell.innerHTML = `<span class="seat-num">—</span>`;
        } else {
          const paperClass = seat.paper_set === 'B' ? 'paper-b' : seat.paper_set === 'C' ? 'paper-c' : 'paper-a';
          cell.classList.add(paperClass);
          const dept = seat.department ? seat.department.substring(0, 6) : '';
          const regno = seat.register_number || '';
          cell.innerHTML = `
            <span class="seat-num">${seat.seat_number}</span>
            <span class="seat-regno">${regno}</span>
            <span class="seat-dept">${dept} · ${seat.paper_set || 'A'}</span>`;
          cell.title = `Seat ${seat.seat_number} | ${regno} | ${seat.department} | Y${seat.year} | ${seat.subject} | Paper ${seat.paper_set}`;
        }
        grid.appendChild(cell);

        // Insert aisle gap cell after this column if needed
        if (aisles.includes(c)) {
          const aisleCell = document.createElement('div');
          aisleCell.className = 'aisle-gap';
          aisleCell.style.cssText = 'background:transparent;border:none;';
          grid.appendChild(aisleCell);
        }
      }
    }

    block.appendChild(grid);
    container.appendChild(block);
  });
}



// ─── ARCHIVES ─────────────────────────
async function loadArchives() {
  try {
    const res = await fetch('/api/archives');
    if (!res.ok) return;
    const archives = await res.json();
    const container = document.getElementById('archives-list');
    if (!container) return;

    if (archives.length === 0) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:#999"><div style="font-size:2.5rem">📁</div><p>No seating arrangements yet.</p></div>';
      return;
    }

    container.innerHTML = archives.map(a => {
      const hallsList = (a.halls_detail || []).map(h =>
        `<div style="display:flex; justify-content:space-between; align-items:center; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:10px 14px; margin-top:8px; font-size:0.85rem">
           <div>
             <div style="font-weight:600; color:#374151">🏫 ${h.name} <span style="font-weight:400; color:#6b7280; font-size:0.8rem">&nbsp;(${h.students} students)</span></div>
             <div style="color:#6b7280; margin-top:4px; font-size:0.8rem">${h.groups.join(', ')}</div>
           </div>
           <div style="text-align:right">
             <div style="font-weight:500; color:#4b5563">👤 Invigilator: ${h.invigilator || '—'}</div>
             <div style="color:#9ca3af; font-size:0.75rem; margin-top:4px">📅 ${a.exam_date || 'No Date'} · ${a.exam_time || ''}</div>
             <button class="btn-sm" style="margin-top:6px;background:#e5e7eb;border:1px solid #d1d5db;color:#374151;padding:4px 10px;font-size:0.75rem;border-radius:4px;cursor:pointer;font-weight:600" onclick="printSpecificHall('${a.exam_id}', '${h.id}')">🖨️ Print</button>
             <button class="btn-sm" style="margin-top:6px;background:#e5e7eb;border:1px solid #d1d5db;color:#374151;padding:4px 10px;font-size:0.75rem;border-radius:4px;cursor:pointer;font-weight:600" onclick="exportSpecificPDF('${a.exam_id}', '${h.id}')">📄 PDF</button>
           </div>
         </div>`
      ).join('');

      const safeName = (a.exam_name || '').replace(/'/g, "\\'");
      return `
      <div class="archive-card">
        <div class="archive-info">
          <h4>${a.exam_name}${a.subject ? ` <span style="font-weight:400;color:#666;font-size:0.85rem">— ${a.subject}</span>` : ''}</h4>
          <div class="archive-meta" style="flex-wrap:wrap;gap:8px;margin-bottom:6px">
            <span>📅 ${a.exam_date || 'No date'}${a.exam_time ? ' · ' + a.exam_time : ''}${a.duration ? ' · ' + a.duration : ''}</span>
            <span>🎓 ${a.total_students ?? 0} students across ${a.rooms_used ?? 0} hall${(a.rooms_used||0)!==1?'s':''}</span>
            <span>⏱️ Generated ${formatDate(a.generated_at)}</span>
          </div>
          ${hallsList ? `<div style="display:flex;flex-direction:column;gap:2px;margin-top:10px;margin-bottom:8px">${hallsList}</div>` : ''}
        </div>
        <div class="archive-actions" style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn-secondary" onclick="viewArrangement('${a.exam_id}','${safeName}')">View</button>
          <button class="btn-primary" onclick="printArchivedAllHalls('${a.exam_id}')" style="background:linear-gradient(135deg,#C62828,#D32F2F)">🖨️ Print</button>
          <button class="btn-primary" onclick="notifyEmail('${a.exam_id}', this)" style="background:linear-gradient(135deg, #10b981, #059669);border-color:#059669;">📧 Notify via Email</button>
          <button class="btn-danger" onclick="deleteArchive('${a.id}','${safeName}')">🗑 Delete</button>
        </div>
      </div>`;
    }).join('');
  } catch (e) { console.error('loadArchives:', e); }
}

async function deleteArchive(archiveId, examName) {
  if (!confirm(`Delete arrangement for "${examName}"?\nThis cannot be undone.`)) return;
  try {
    const res = await fetch(`/api/archives/${archiveId}`, { method: 'DELETE' });
    if (res.ok) { toast('Deleted', 'success'); loadArchives(); }
    else toast('Failed to delete', 'error');
  } catch(e) { toast('Error', 'error'); }
}

async function removeDuplicateArchives() {
  if (!confirm('Keep only the LATEST arrangement per exam and delete all older duplicates?\nThis cannot be undone.')) return;
  try {
    const res = await fetch('/api/archives');
    const archives = await res.json();
    const seen = new Set();
    const toDelete = [];
    for (const a of archives) {
      if (seen.has(a.exam_id)) toDelete.push(a.id);
      else seen.add(a.exam_id);
    }
    if (toDelete.length === 0) { toast('No duplicates found ✓', 'success'); return; }
    let deleted = 0;
    for (const id of toDelete) {
      const r = await fetch(`/api/archives/${id}`, { method: 'DELETE' });
      if (r.ok) deleted++;
    }
    toast(`Removed ${deleted} duplicate${deleted!==1?'s':''}`, 'success');
    loadArchives();
  } catch(e) { toast('Error removing duplicates', 'error'); }
}

function formatDate(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function formatTime(t) {
  if (!t) return '–';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr-12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

function printArchivedAllHalls(examId) {
  const cleanId = String(examId).trim().replace(/\s+/g, '-');
  window.open(`/api/print/${cleanId}`, '_blank');
}

function printSingleHall() {
  if (!currentArrangementId) {
    toast('No arrangement selected for printing', 'error');
    return;
  }
  window.open(`/api/print/${currentArrangementId}`, '_blank');
}

function printSpecificHall(examId, roomId) {
  const ce = String(examId).trim().replace(/\s+/g, '-');
  const cr = String(roomId).trim().replace(/\s+/g, '-');
  window.open(`/api/print/${ce}/${cr}`, '_blank');
}

async function viewArrangement(examId, examName) {
  try {
    const cleanId = String(examId).trim().replace(/\s+/g, '-');
    const res = await fetch(`/api/seating/${cleanId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load arrangement');
    currentArrangementId = cleanId;
    currentArrangementData = data;

    // Fetch exam subject too
    try {
      const er = await fetch('/api/exams');
      const exams = await er.json();
      const exam = exams.find(e => e.id === examId);
      if (exam && exam.subject) {
        document.getElementById('detail-title').textContent = `${examName} — ${exam.subject}`;
      } else {
        document.getElementById('detail-title').textContent = `Seating: ${examName}`;
      }
    } catch(e) {
      document.getElementById('detail-title').textContent = `Seating: ${examName}`;
    }
    renderDetailTable(data);
    document.getElementById('arrangement-detail').style.display = 'block';
    document.getElementById('arrangement-detail').scrollIntoView({ behavior: 'smooth' });
  } catch (e) { toast('Error loading arrangement', 'error'); }
}

async function viewAndPDF(examId, examName) {
  await viewArrangement(examId, examName);
  setTimeout(() => exportPDF(), 500);
}

function renderDetailTable(data) {
  const content = document.getElementById('detail-content');
  const examSubjectCode = data.exam ? (data.exam.subject_code || '') : '';
  const examDefaultSubject = data.exam ? (data.exam.subject || '') : '';

  // Build year_subject_map lookup
  let ysm = {};
  try {
    const raw = data.exam ? data.exam.year_subject_map : {};
    ysm = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
  } catch(e) { ysm = {}; }

  function resolveSubject(s) {
    // Priority: saved subject on seat → year|dept lookup → year lookup → exam default
    if (s.subject && s.subject !== '—') return s.subject;
    const yr = String(s.year || '');
    const dept = String(s.department || '');
    for (const key of [`${yr}|${dept}`, `${yr}|`, `|${dept}`, yr, '']) {
      if (ysm[key]) return ysm[key];
    }
    return examDefaultSubject || '—';
  }

  function resolveCode(s) {
    return s.subject_code || examSubjectCode || '—';
  }

  const byRoom = {};
  data.seats.forEach(s => {
    const key = s.room_id;
    byRoom[key] = byRoom[key] || { name: s.room_name, invigilator: s.invigilator, seats: [] };
    byRoom[key].seats.push(s);
  });

  content.innerHTML = Object.entries(byRoom).map(([roomId, room]) => `
    <div style="margin-bottom:32px">
      <div style="background:linear-gradient(135deg,#B71C1C,#D32F2F);color:white;padding:14px 20px;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:center">
        <strong style="font-size:1.05rem">🏫 ${room.name}</strong>
        <div style="display:flex;align-items:center;gap:12px">
          ${room.invigilator ? `<span style="opacity:0.8;font-size:0.85rem">Invigilator: ${room.invigilator}</span>` : ''}
          <button class="btn-sm" style="background:rgba(255,255,255,0.25);border:none;color:white;padding:5px 10px;border-radius:4px;cursor:pointer;font-weight:600" onclick="printSpecificHall('${currentArrangementId}', '${roomId}')">🖨️ Print</button>
          <button class="btn-sm" style="background:rgba(255,255,255,0.25);border:none;color:white;padding:5px 10px;border-radius:4px;cursor:pointer;font-weight:600" onclick="exportSpecificPDF('${currentArrangementId}', '${roomId}')">📄 Export PDF</button>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-top:none">
        <thead>
          <tr style="background:#f5f5f5">
            <th style="padding:10px 14px;text-align:left;font-size:0.75rem;color:#666;text-transform:uppercase;letter-spacing:0.04em">Seat</th>
            <th style="padding:10px 14px;text-align:left;font-size:0.75rem;color:#666;text-transform:uppercase;letter-spacing:0.04em">Student Name</th>
            <th style="padding:10px 14px;text-align:left;font-size:0.75rem;color:#666;text-transform:uppercase;letter-spacing:0.04em">Register No.</th>
            <th style="padding:10px 14px;text-align:left;font-size:0.75rem;color:#666;text-transform:uppercase;letter-spacing:0.04em">Department</th>
            <th style="padding:10px 14px;text-align:left;font-size:0.75rem;color:#666;text-transform:uppercase;letter-spacing:0.04em">Year</th>
            <th style="padding:10px 14px;text-align:left;font-size:0.75rem;color:#666;text-transform:uppercase;letter-spacing:0.04em">Subject</th>
            <th style="padding:10px 14px;text-align:left;font-size:0.75rem;color:#666;text-transform:uppercase;letter-spacing:0.04em">Code</th>
            <th style="padding:10px 14px;text-align:left;font-size:0.75rem;color:#666;text-transform:uppercase;letter-spacing:0.04em">Paper</th>
          </tr>
        </thead>
        <tbody>
          ${room.seats.map((s, i) => `
            <tr style="border-bottom:1px solid #f0f0f0;background:${i%2===0?'#fff':'#fafafa'}">
              <td style="padding:10px 14px;font-weight:700;color:#D32F2F">${s.seat_number}<br><span style="font-size:0.7rem;color:#999;font-weight:400">${s.seat_label||''}</span></td>
              <td style="padding:10px 14px;font-weight:500">${s.student_name}</td>
              <td style="padding:10px 14px;font-family:monospace;font-size:0.82rem">${s.register_number}</td>
              <td style="padding:10px 14px">${s.department || '–'}</td>
              <td style="padding:10px 14px">${s.year ? 'Y' + s.year : '–'}</td>
              <td style="padding:10px 14px">${resolveSubject(s)}</td>
              <td style="padding:10px 14px"><span class="subject-code-chip">${resolveCode(s)}</span></td>
              <td style="padding:10px 14px">
                <span style="background:${s.paper_set==='B'?'#E3F2FD':s.paper_set==='C'?'#E8F5E9':'#FFEBEE'};color:${s.paper_set==='B'?'#1565C0':s.paper_set==='C'?'#2e7d32':'#C62828'};padding:2px 8px;border-radius:4px;font-size:0.8rem;font-weight:600">${s.paper_set || 'A'}</span>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`).join('');

  // Also render visual tab
  renderDetailVisual(data);
}

function renderDetailVisual(data) {
  const container = document.getElementById('detail-visual-content');
  if (!container) return;

  const examDefaultSubject = data.exam ? (data.exam.subject || '') : '';
  const examSubjectCode = data.exam ? (data.exam.subject_code || '') : '';
  let ysm = {};
  try {
    const raw = data.exam ? data.exam.year_subject_map : {};
    ysm = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
  } catch(e) { ysm = {}; }

  function resolveSubjectV(s) {
    if (s.subject && s.subject !== '—') return s.subject;
    const yr = String(s.year || '');
    const dept = String(s.department || '');
    for (const key of [`${yr}|${dept}`, `${yr}|`, `|${dept}`, yr, '']) {
      if (ysm[key]) return ysm[key];
    }
    return examDefaultSubject || '';
  }

  const byRoom = {};
  data.seats.forEach(s => {
    const key = s.room_id;
    byRoom[key] = byRoom[key] || { name: s.room_name, invigilator: s.invigilator, seats: [] };
    byRoom[key].seats.push(s);
  });

  function parseAisles(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(Number).filter(n => n > 0);
    const str = String(raw).trim();
    if (str.startsWith('[')) { try { return JSON.parse(str).map(Number); } catch(e){} }
    return str.split(',').map(x => parseInt(x.trim())).filter(n => !isNaN(n) && n > 0);
  }

  container.innerHTML = '<div class="visual-hall-wrap">' + Object.entries(byRoom).map(([roomId, room]) => {
    const maxRow = Math.max(...room.seats.map(s => s.row || 1));
    const maxCol = Math.max(...room.seats.map(s => s.col || 1));
    const aisles = parseAisles(room.seats[0]?.aisles);
    const seatMap = {};
    room.seats.forEach(s => { seatMap[`${s.row}_${s.col}`] = s; });

    // Build grid columns (including aisle gaps)
    let colTemplate = '';
    for (let c = 1; c <= maxCol; c++) {
      colTemplate += '64px ';
      if (aisles.includes(c)) colTemplate += '20px ';
    }

    let gridHtml = '';
    for (let r = 1; r <= maxRow; r++) {
      for (let c = 1; c <= maxCol; c++) {
        const s = seatMap[`${r}_${c}`];
        if (!s) {
          gridHtml += `<div class="vseat vsempty"><span style="color:#ccc">—</span></div>`;
        } else {
          const cls = s.paper_set === 'B' ? 'vsb' : s.paper_set === 'C' ? 'vsc' : 'vsa';
          const subjV = resolveSubjectV(s);
          const codeV = s.subject_code || examSubjectCode;
          const tip = [
            `Seat ${s.seat_number}`,
            s.register_number,
            `${s.department||''} · Y${s.year||''}`,
            subjV ? `Subject: ${subjV}` : '',
            codeV ? `Code: ${codeV}` : '',
            `Set ${s.paper_set||'A'}`
          ].filter(Boolean).join('\n');
          const tipStr = tip.replace(/'/g,"\\'").replace(/"/g,'&quot;').replace(/\n/g, '\\n');
          gridHtml += `<div class="vseat ${cls}" 
            onmouseenter="showVTooltip(event, '${tipStr}')"
            onmouseleave="hideVTooltip(event)">
            <span class="vseat-num">${s.seat_number}</span>
            <span class="vseat-reg">${s.register_number}</span>
            <span class="vseat-dept">${(s.department||'').substring(0,6)} Y${s.year||''}</span>
            <span class="vseat-set">Set ${s.paper_set||'A'}</span>
          </div>`;
        }
        if (aisles.includes(c)) {
          gridHtml += `<div class="vaisle"></div>`;
        }
      }
    }

    return `<div class="visual-room-block">
      <div class="visual-room-header">
        <strong>🏫 ${room.name}</strong>
        ${room.invigilator ? `<span>Invigilator: ${room.invigilator}</span>` : ''}
      </div>
      <div class="visual-blackboard">Blackboard / Front of Hall</div>
      <div class="visual-seat-grid-wrap">
        <div class="visual-seat-grid" style="grid-template-columns:${colTemplate.trim()};gap:5px">${gridHtml}</div>
      </div>
      <div class="visual-legend">
        <div class="vleg-item"><div class="vleg-box vleg-a"></div> Set A</div>
        <div class="vleg-item"><div class="vleg-box vleg-b"></div> Set B</div>
        <div class="vleg-item"><div class="vleg-box vleg-c"></div> Set C</div>
        <div class="vleg-item"><div class="vleg-box vleg-bl"></div> Blocked</div>
        <span style="color:#999;font-size:0.75rem;margin-left:auto">Hover over any seat to see details</span>
      </div>
    </div>`;
  }).join('') + '</div>';
}

function showVTooltip(e, text) {
  let tip = document.getElementById('vseat-tooltip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'vseat-tooltip';
    tip.style.cssText = 'position:fixed;background:#1a1a2e;color:white;padding:10px 14px;border-radius:8px;font-size:0.75rem;z-index:9999;box-shadow:0 10px 30px rgba(0,0,0,0.3);line-height:1.5;pointer-events:none;display:none;white-space:pre-line;max-width:200px;font-family:sans-serif;';
    document.body.appendChild(tip);
  }
  tip.textContent = text;
  tip.style.display = 'block';

  const updatePos = (e) => {
    const margin = 15;
    let x = e.clientX + margin;
    let y = e.clientY + margin;
    
    // Check viewport bounds
    if (x + tip.offsetWidth > window.innerWidth - 10) x = e.clientX - tip.offsetWidth - margin;
    if (y + tip.offsetHeight > window.innerHeight - 10) y = e.clientY - tip.offsetHeight - margin;
    if (x < 10) x = 10;
    if (y < 10) y = 10;
    
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  };
  
  updatePos(e);
  e.currentTarget._vmove = updatePos;
  e.currentTarget.addEventListener('mousemove', updatePos);
}

function hideVTooltip(e) {
  const tip = document.getElementById('vseat-tooltip');
  if (tip) tip.style.display = 'none';
  const target = e ? e.currentTarget : null;
  if (target && target._vmove) {
    target.removeEventListener('mousemove', target._vmove);
    delete target._vmove;
  }
}

function switchDetailTab(tab, btn) {
  document.querySelectorAll('.detail-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('detail-tab-table').style.display = tab === 'table' ? 'block' : 'none';
  document.getElementById('detail-tab-visual').style.display = tab === 'visual' ? 'block' : 'none';
}

function closeDetail() {
  document.getElementById('arrangement-detail').style.display = 'none';
}

// ─── EXPORT ────────────────────────
function exportCSV() {
  if (!currentArrangementId) { toast('No arrangement selected', 'error'); return; }
  window.open(`/api/export/${currentArrangementId}`, '_blank');
}

function exportCSVById(id) {
  window.open(`/api/export/${id}`, '_blank');
}

function exportSpecificPDF(examId, roomId) {
  const cleanId = String(examId).trim().replace(/\s+/g, '-');
  if (!currentArrangementData || currentArrangementData.exam_id !== examId) {
    // Show loading state
    const btn = event?.currentTarget;
    const oldText = btn ? btn.textContent : '';
    if (btn) btn.textContent = '⏳ Loading...';
    
    fetch(`/api/seating/${cleanId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        currentArrangementData = data;
        currentArrangementId = cleanId;
        if (btn) btn.textContent = oldText;
        exportPDF(roomId);
      })
      .catch(e => {
        if (btn) btn.textContent = oldText;
        toast('Failed to load data for PDF', 'error');
      });
  } else {
    exportPDF(roomId);
  }
}

function printGeneratedHalls() {
  if (!currentArrangementId) { toast('No arrangement generated yet', 'error'); return; }
  window.open(`/api/print/${currentArrangementId}`, '_blank');
}

function printQRPoster() {
  const rootUrl = window.location.origin;
  const searchUrl = rootUrl + '#search';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(searchUrl)}`;
  
  const w = window.open('', '_blank');
  w.document.write(`
    <html>
      <head>
        <title>SeatMatrix QR Poster</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">
        <style>
          @page { margin: 0; size: A4 portrait; }
          body { font-family: 'DM Sans', sans-serif; text-align: center; padding: 0; margin: 0; color: #1f2937; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: white; }
          h1 { font-family: 'Playfair Display', serif; font-size: 4rem; color: #B71C1C; margin: 0 0 10px 0; }
          .subtitle { font-size: 1.8rem; color: #4b5563; margin-bottom: 40px; font-weight: 600; }
          .instructions { font-size: 1.4rem; width: 80%; max-width: 650px; margin: 0 auto 50px; line-height: 1.6; background: #fffbeb; padding: 25px; border-radius: 12px; border: 2px solid #fef3c7; }
          .qr-box { padding: 40px; border: 4px dashed #e5e7eb; border-radius: 30px; display: inline-block; background: white; }
          .qr-box img { width: 450px; height: 450px; display: block; }
          .url-text { margin-top: 40px; color: #6b7280; font-size: 1.3rem; font-weight: 700; word-break: break-all; width: 80%; }
          @media print {
            body { padding: 0; background: white; }
            .instructions { background: transparent !important; border: 2px solid #000; color: #000; }
            .url-text { color: #000; }
          }
        </style>
      </head>
      <body>
        <h1>SeatMatrix</h1>
        <div class="subtitle">Sasurie College of Engineering</div>
        <div class="instructions">
          <strong>📱 Find your exam seat instantly!</strong><br><br>
          We have upgraded to a digital seating system. <br>
          Scan the QR code below using your mobile camera and enter your Register Number to securely find your assigned Hall and Seat.
        </div>
        <div class="qr-box">
          <img src="${qrUrl}" alt="QR Code to Seat Finder" onload="setTimeout(() => window.print(), 300)" />
        </div>
        <div style="margin-top: 50px; color: #9ca3af; font-size: 1.1rem; font-weight: 600;">
          Or visit directly on your browser: <b>${searchUrl}</b>
        </div>
      </body>
    </html>
  `);
  w.document.close();
}

async function notifyEmail(overrideId = null, btnEventSource = null) {
  const targetId = overrideId || currentArrangementId;
  if (!targetId) {
    toast('No arrangement selected', 'error');
    return;
  }
  
  if (!confirm('Are you sure you want to trigger automated emails for all students in this arrangement?')) return;
  
  const btn = btnEventSource || document.getElementById('btn-notify-email-gen') || document.getElementById('btn-notify-email');
  const orgText = btn ? btn.innerHTML : '📧 Notify via Email';
  if(btn) { btn.innerHTML = '⏳ Sending...'; btn.disabled = true; }
  
  try {
    const res = await fetch(`/api/notify-email/${targetId}`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      toast(`✅ Successfully triggered email workflow (${data.notified_count} students)`, 'success');
    } else {
      toast(data.error || 'Failed to send emails', 'error');
      if(data.error && data.error.includes('N8N_WEBHOOK_URL')) {
        alert(data.error);
      }
    }
  } catch (e) {
    toast('Network error triggering emails', 'error');
  } finally {
    if(btn) { btn.innerHTML = orgText; btn.disabled = false; }
  }
}

async function exportPDF(filterRoomId = null) {
  if (!currentArrangementData) { toast('No arrangement to export', 'error'); return; }

  // Load logo
  let logoBase64 = null;
  try {
    const logoUrl = '/static/images/sasurie_invert_logo-removebg-preview.png';
    logoBase64 = await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = logoUrl;
    });
  } catch(e) { console.error('Logo load error', e); }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Get exam info
  const examId = currentArrangementData.exam_id;
  let examInfo = { name: 'Exam', subject: '', date: '', semester: '', department: '' };
  try {
    const res = await fetch('/api/exams');
    const exams = await res.json();
    const found = exams.find(e => e.id === examId);
    if (found) examInfo = found;
  } catch(e) {}

  const seats = currentArrangementData.seats || [];
  const byRoom = {};
  seats.forEach(s => {
    byRoom[s.room_id] = byRoom[s.room_id] || { name: s.room_name, invigilator: s.invigilator, seats: [] };
    byRoom[s.room_id].seats.push(s);
  });

  const genDate = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
  const examDate = examInfo.date ? new Date(examInfo.date).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' }) : '–';

  function drawPageHeader(doc, roomName, invigilator, displaySubject) {
    // College header band
    doc.setFillColor(183, 28, 28);
    doc.rect(0, 0, pageW, 28, 'F');

    // Logo in white
    if (logoBase64) {
      try {
        // Draw logo shifted left
        doc.addImage(logoBase64, 'PNG', margin, 4, 18, 18);
      } catch(e){}
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('SASURIE COLLEGE OF ENGINEERING', pageW / 2 + 6, 10, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Vijayamangalam, Tiruppur District, Tamil Nadu - 638056 | Autonomous Institution', pageW / 2 + 6, 17, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('EXAMINATION SEATING ARRANGEMENT', pageW / 2 + 6, 24, { align: 'center' });

    // Header info box with wrapping for long subjects
    const col2x = pageW / 2 + 4;
    const infoLabelW = 24; // Width for "Dept/Subject:" label and padding
    const maxW = (pageW - margin) - (col2x + infoLabelW) - 4; // Buffer 4mm
    const lines = doc.splitTextToSize(displaySubject || '–', maxW);
    const lineH = 5;
    const shiftY = (lines.length - 1) * lineH;
    const row3y = 50 + shiftY;
    // Box must cover from y=31 down to row3y + padding
    const boxHeight = (row3y + 9) - 31; 

    doc.setFillColor(255, 245, 245);
    doc.setDrawColor(211, 47, 47);
    doc.setLineWidth(0.3);
    doc.rect(margin, 31, pageW - margin * 2, boxHeight, 'FD');

    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    const col1x = margin + 4;
    const row1y = 38;

    // Labels bold, values normal
    const label = (text, x, y) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(183, 28, 28);
      doc.text(text, x, y);
    };
    const value = (text, x, y) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);
      doc.text(text || '–', x, y);
    };

    label('Exam:', col1x, row1y);
    value(examInfo.name, col1x + 20, row1y);

    label('Dept/Subject:', col2x - 6, row1y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(33, 33, 33);
    doc.text(lines, col2x + 18, row1y);

    // Dynamic vertical shift already calculated above
    
    // Position Hall and Date on the same row, shifted if needed
    const row2y = 44 + shiftY;
    label('Date:', col1x, row2y);
    value(`${examDate} ${examInfo.time ? '@ ' + formatTime(examInfo.time) : ''}`, col1x + 20, row2y);

    label('Hall:', col2x, row2y);
    value(roomName, col2x + 22, row2y);

    // Position Duration and Invigilator on the next row (row3y already calculated)
    label('Duration:', col1x, row3y);
    value(examInfo.duration || '–', col1x + 22, row3y);

    label('Invigilator:', col2x, row3y);
    value(invigilator || 'TBD', col2x + 28, row3y);

    // Paper set legend
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120, 120, 120);
    doc.text('Paper Sets: A = Set A (Red rows)   B = Set B (Blue rows)   Adjacent students always have different sets', margin, 31 + boxHeight + 4);

    return 31 + boxHeight + 8; // y position after header
  }

  const roomsToExport = filterRoomId 
    ? Object.values(byRoom).filter(r => seats.find(s => s.room_id === filterRoomId && s.room_name === r.name)) // Simple matching logic for refactored seats
    : Object.values(byRoom);

  // Filter actual rooms by ID if provided
  const targetRooms = filterRoomId 
    ? Object.entries(byRoom).filter(([id]) => id === filterRoomId).map(([id, r]) => r)
    : Object.values(byRoom);

  targetRooms.forEach((room, idx) => {
    if (idx > 0) doc.addPage();

    const uniqueDs = [];
    room.seats.forEach(s => {
      const dy = `${s.department || ''} ${s.year ? 'Y'+s.year : ''}`.trim();
      const subj = s.subject || '';
      const lbl = subj ? `${dy}: ${subj}` : dy;
      if (lbl && !uniqueDs.includes(lbl)) uniqueDs.push(lbl);
    });
    const dsText = uniqueDs.length ? uniqueDs.join(' | ') : (examInfo.subject || '–');

    // Harder lookup for invigilator if missing
    let invigilator = room.invigilator;
    if (!invigilator || invigilator === 'TBD' || invigilator === '—') {
      const firstSeatWithInv = room.seats.find(s => s.invigilator && s.invigilator !== 'TBD' && s.invigilator !== '—');
      if (firstSeatWithInv) invigilator = firstSeatWithInv.invigilator;
    }
    // Final fallback to arrangement-level list
    if (!invigilator || invigilator === 'TBD' || invigilator === '—') {
      if (currentArrangementData && currentArrangementData.invigilators && currentArrangementData.invigilators.length > 0) {
        invigilator = currentArrangementData.invigilators[idx % currentArrangementData.invigilators.length].name;
      }
    }

    const startY = drawPageHeader(doc, room.name, invigilator, dsText);

    doc.autoTable({
      startY: startY,
      head: [['SEAT', 'Student Name', 'Reg. Number', 'Dept.', 'Year', 'Subject', 'Code', 'Set']],
      body: room.seats.map((s, i) => [
        `${i + 1}\nR${s.row||1}C${s.col||1}`,
        s.student_name,
        s.register_number,
        s.department || '–',
        s.year || '–',
        s.subject || examInfo.subject || '–',
        s.subject_code || examInfo.subject_code || '–',
        s.paper_set || 'A'
      ]),
      headStyles: {
        fillColor: [183, 28, 28],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: 2
      },
      bodyStyles: { fontSize: 7, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center', fontStyle: 'bold', textColor: [183, 28, 28] },
        1: { cellWidth: 38 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20 },
        4: { cellWidth: 12, halign: 'center' },
        5: { cellWidth: 32 },
        6: { cellWidth: 22 },
        7: { cellWidth: 12, halign: 'center' }
      },
      alternateRowStyles: { fillColor: [255, 252, 252] },
      rowPageBreak: 'auto',
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const val = data.cell.raw;
          if (val === 'B') {
            data.cell.styles.textColor = [21, 101, 192];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [183, 28, 28];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      didDrawPage: (data) => {
        // Footer on each page
        const pY = pageH - 8;
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated by SeatMatrix on ${genDate}`, margin, pY);
        doc.text(`Page ${data.pageNumber}`, pageW - margin, pY, { align: 'right' });
        doc.setDrawColor(211, 47, 47);
        doc.setLineWidth(0.3);
        doc.line(margin, pY - 3, pageW - margin, pY - 3);
      }
    });
  });

  const filename = `SeatMatrix_${(examInfo.name || 'Seating').replace(/\s+/g,'-')}_${examInfo.date || new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(filename);
  toast('PDF exported successfully!', 'success');
}

// ─── EXPORT LAYOUT (Printable Hall Grid) ──────────────────────
async function viewAndLayout(examId, examName) {
  await viewArrangement(examId, examName);
  setTimeout(() => exportLayout(), 400);
}

async function exportLayout() {
  if (!currentArrangementData) { toast('No arrangement selected', 'error'); return; }

  const seats = currentArrangementData.seats || [];
  const examId = currentArrangementData.exam_id;

  // Fetch exam info for subject/date
  let examInfo = { name: 'Exam', subject: '', date: '', department: '', semester: '' };
  try {
    const res = await fetch('/api/exams');
    const exams = await res.json();
    const found = exams.find(e => e.id === examId);
    if (found) examInfo = found;
  } catch(e) {}

  // Group by room
  const byRoom = {};
  seats.forEach(s => {
    const key = s.room_id;
    byRoom[key] = byRoom[key] || {
      name: s.room_name, invigilator: s.invigilator, seats: [],
      maxRow: 0, maxCol: 0
    };
    byRoom[key].seats.push(s);
    if (s.row > byRoom[key].maxRow) byRoom[key].maxRow = s.row;
    if (s.col > byRoom[key].maxCol) byRoom[key].maxCol = s.col;
  });

  const examDate = examInfo.date
    ? new Date(examInfo.date).toLocaleDateString('en-IN', {day:'2-digit', month:'long', year:'numeric'})
    : '–';

  // Build rooms HTML
  const roomsHtml = Object.values(byRoom).map(room => {
    // Build grid
    const seatMap = {};
    room.seats.forEach(s => { seatMap[`${s.row}_${s.col}`] = s; });

    let gridHtml = `<div class="room-block">
      <div class="room-title">
        <span>🏫 ${room.name}</span>
        <span class="inv-label">Invigilator: ${room.invigilator || 'TBD'}</span>
      </div>
      <div class="blackboard">BLACKBOARD / FRONT OF HALL</div>
      <div class="grid" style="grid-template-columns: repeat(${room.maxCol}, 1fr)">`;

    for (let r = 1; r <= room.maxRow; r++) {
      for (let c = 1; c <= room.maxCol; c++) {
        const seat = seatMap[`${r}_${c}`];
        if (!seat) {
          gridHtml += `<div class="cell empty">–</div>`;
        } else {
          const cls = seat.paper_set === 'B' ? 'set-b' : seat.paper_set === 'C' ? 'set-c' : 'set-a';
          const shortName = seat.student_name ? seat.student_name.split(' ').map(w=>w[0]).join('') : '?';
          gridHtml += `
            <div class="cell ${cls}" title="${seat.student_name} | ${seat.register_number} | Paper ${seat.paper_set}">
              <div class="c-num">#${seat.seat_number}</div>
              <div class="c-reg">${seat.register_number}</div>
              <div class="c-name">${seat.student_name}</div>
              <div class="c-set">Set ${seat.paper_set}</div>
            </div>`;
        }
      }
    }
    gridHtml += `</div>`;

    // Summary table below grid
    gridHtml += `
      <table class="summary-table">
        <thead><tr><th>#</th><th>Seat No.</th><th>Student Name</th><th>Register No.</th><th>Department</th><th>Subject</th><th>Paper Set</th></tr></thead>
        <tbody>
          ${room.seats.map(s => `
            <tr class="${s.paper_set === 'B' ? 'row-b' : s.paper_set === 'C' ? 'row-c' : 'row-a'}">
              <td>${s.seat_index || s.seat_number}</td>
              <td><strong>#${s.seat_number}</strong><br><small>${s.seat_label||''}</small></td>
              <td>${s.student_name}</td>
              <td>${s.register_number}</td>
              <td>${s.department||'–'}</td>
              <td>${s.subject||'–'}</td>
              <td><span class="badge-${(s.paper_set||'A').toLowerCase()}">Set ${s.paper_set||'A'}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

    return gridHtml;
  }).join('<div class="page-break"></div>');

  // Pre-calculate unique subjects across all halls
  const uniqueDs = [];
  seats.forEach(s => {
    const dy = `${s.department || ''} ${s.year ? 'Y'+s.year : ''}`.trim();
    const subj = s.subject || '';
    const lbl = subj ? `${dy}: ${subj}` : dy;
    if (lbl && !uniqueDs.includes(lbl)) uniqueDs.push(lbl);
  });
  const displaySubject = uniqueDs.length ? uniqueDs.join(' | ') : (examInfo.subject || '–');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Seating Layout - ${examInfo.name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'DM Sans',sans-serif; background:#fff; color:#1a1a2e; font-size:12px; }

  .header { background:linear-gradient(135deg,#B71C1C,#D32F2F); color:white; padding:16px 24px; }
  .header h1 { font-size:18px; font-weight:700; letter-spacing:0.5px; }
  .header h2 { font-size:13px; font-weight:400; opacity:0.85; margin-top:2px; }
  .info-bar { background:#fff5f5; border-bottom:2px solid #D32F2F; padding:10px 24px; display:flex; gap:32px; flex-wrap:wrap; }
  .info-item { display:flex; flex-direction:column; }
  .info-label { font-size:10px; text-transform:uppercase; letter-spacing:0.06em; color:#999; }
  .info-val { font-weight:600; font-size:12px; color:#1a1a2e; margin-top:1px; }

  .legend { padding:8px 24px; background:#fafafa; border-bottom:1px solid #eee; display:flex; gap:20px; align-items:center; font-size:11px; }
  .legend-item { display:flex; align-items:center; gap:6px; }
  .legend-box { width:14px; height:14px; border-radius:3px; }
  .la { background:#FFEBEE; border:1px solid #FFCDD2; }
  .lb { background:#E3F2FD; border:1px solid #BBDEFB; }
  .lc { background:#E8F5E9; border:1px solid #C8E6C9; }

  .content { padding:20px 24px; }

  .room-block { margin-bottom:32px; }
  .room-title { font-size:13px; font-weight:700; color:#B71C1C; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:#fff5f5; border-left:4px solid #D32F2F; border-radius:0 6px 6px 0; }
  .inv-label { font-size:11px; font-weight:500; color:#666; }
  .blackboard { background:#2c4a2e; color:#fff; text-align:center; padding:6px; font-size:10px; letter-spacing:1px; border-radius:4px; margin-bottom:10px; opacity:0.8; }

  .grid { display:grid; gap:4px; margin-bottom:20px; }
  .cell { border-radius:5px; padding:4px 3px; text-align:center; border:1px solid #ddd; min-height:52px; display:flex; flex-direction:column; justify-content:center; gap:1px; }
  .cell.empty { background:#f5f5f5; color:#ccc; font-size:11px; }
  .set-a { background:#FFEBEE; border-color:#FFCDD2; }
  .set-b { background:#E3F2FD; border-color:#BBDEFB; }
  .set-c { background:#E8F5E9; border-color:#C8E6C9; }
  .c-num { font-size:10px; font-weight:800; color:#B71C1C; }
  .set-b .c-num { color:#1565C0; }
  .set-c .c-num { color:#2e7d32; }
  .c-reg { font-size:9px; font-weight:600; color:#333; }
  .c-name { font-size:8px; color:#555; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:100%; }
  .c-set { font-size:8px; font-weight:700; color:#888; }

  .summary-table { width:100%; border-collapse:collapse; font-size:10.5px; margin-top:4px; }
  .summary-table thead th { background:#D32F2F; color:white; padding:6px 8px; text-align:left; font-size:9.5px; text-transform:uppercase; letter-spacing:0.04em; }
  .summary-table tbody td { padding:5px 8px; border-bottom:1px solid #f0f0f0; vertical-align:middle; }
  .summary-table tbody tr:hover { background:#fafafa; }
  .row-a { background:#fff; } .row-b { background:#f8fbff; } .row-c { background:#f8fff9; }
  .badge-a { background:#FFEBEE; color:#C62828; padding:2px 7px; border-radius:4px; font-size:9px; font-weight:700; }
  .badge-b { background:#E3F2FD; color:#1565C0; padding:2px 7px; border-radius:4px; font-size:9px; font-weight:700; }
  .badge-c { background:#E8F5E9; color:#2e7d32; padding:2px 7px; border-radius:4px; font-size:9px; font-weight:700; }

  .page-break { page-break-after: always; }
  .footer { text-align:center; font-size:9px; color:#aaa; padding:16px; border-top:1px solid #eee; margin-top:8px; }
  .print-btn { position:fixed; bottom:24px; right:24px; background:#D32F2F; color:white; border:none; padding:12px 24px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; box-shadow:0 4px 16px rgba(211,47,47,0.4); font-family:'DM Sans',sans-serif; z-index:999; }
  .print-btn:hover { background:#B71C1C; }
  @media print {
    .print-btn { display:none !important; }
    .page-break { page-break-after: always; }
    body { font-size:10px; }
    .grid .cell { min-height:44px; }
  }
</style>
</head>
<body>

<button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>

<div class="header">
  <h1>SASURIE COLLEGE OF ENGINEERING — EXAM SEATING LAYOUT</h1>
  <h2>Vijayamangalam, Tiruppur District, Tamil Nadu | Autonomous Institution | Powered by SeatMatrix</h2>
</div>

<div class="info-bar">
  <div class="info-item"><span class="info-label">Exam</span><span class="info-val">${examInfo.name}</span></div>
  <div class="info-item"><span class="info-label">Dept / Subject</span><span class="info-val">${displaySubject}</span></div>
  <div class="info-item"><span class="info-label">Date</span><span class="info-val">${examDate}</span></div>
  <div class="info-item"><span class="info-label">Department</span><span class="info-val">${examInfo.department || 'All Departments'}</span></div>
  <div class="info-item"><span class="info-label">Semester</span><span class="info-val">${examInfo.semester || '–'}</span></div>
  <div class="info-item"><span class="info-label">Total Students</span><span class="info-val">${seats.length}</span></div>
</div>

<div class="legend">
  <strong style="font-size:11px">Paper Sets:</strong>
  <div class="legend-item"><div class="legend-box la"></div> Set A</div>
  <div class="legend-item"><div class="legend-box lb"></div> Set B</div>
  <div class="legend-item"><div class="legend-box lc"></div> Set C</div>
  <span style="color:#aaa;font-size:10px">Adjacent students always have different paper sets. Same subject → different set variant.</span>
</div>

<div class="content">
  ${roomsHtml}
  <div class="footer">Generated by SeatMatrix · Sasurie College of Engineering · ${new Date().toLocaleString('en-IN')}</div>
</div>

</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  toast('Layout opened in new tab — use Print button to save as PDF!', 'success');
}

// ─── STUDENTS ─────────────────────────────────────────
let allStudents = [];
let savedStudentsForGen = [];

async function loadStudents() {
  try {
    const res = await fetch('/api/students');
    allStudents = await res.json();
    renderStudentsTable(allStudents);
    populateStudentDeptFilter();
  } catch (e) {}
}

function renderStudentsTable(students) {
  const tbody = document.getElementById('students-tbody');
  if (!tbody) return;
  tbody.innerHTML = students.length === 0
    ? '<tr><td colspan="6" style="text-align:center;color:#999;padding:24px">No students yet. Add one or import CSV!</td></tr>'
    : students.map(s => `
        <tr>
          <td><strong>${s.student_name}</strong></td>
          <td><span style="font-family:monospace;background:#f3f4f6;padding:2px 7px;border-radius:4px;font-size:0.82rem">${s.register_number}</span></td>
          <td>${s.department || '–'}</td>
          <td>${s.year ? s.year + (s.year==1?'st':s.year==2?'nd':s.year==3?'rd':'th') + ' Year' : '–'}</td>
          <td>${s.email || '–'}</td>
          <td style="display:flex;gap:6px">
            <button class="btn-secondary" style="padding:5px 10px;font-size:0.8rem" onclick='editStudent(${JSON.stringify(s)})'>Edit</button>
            <button class="btn-danger" onclick="deleteStudent('${s.id}')">Remove</button>
          </td>
        </tr>`).join('');
}

function filterStudentsTable() {
  const q = (document.getElementById('student-search')?.value || '').toLowerCase();
  const dept = document.getElementById('student-dept-filter')?.value || '';
  const filtered = allStudents.filter(s => {
    const matchQ = !q || s.student_name.toLowerCase().includes(q) || s.register_number.toLowerCase().includes(q);
    const matchDept = !dept || s.department === dept;
    return matchQ && matchDept;
  });
  renderStudentsTable(filtered);
}

function populateStudentDeptFilter() {
  const depts = [...new Set(allStudents.map(s => s.department).filter(Boolean))].sort();
  const sel = document.getElementById('student-dept-filter');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">All Depts</option>' + depts.map(d => `<option value="${d}">${d}</option>`).join('');
  sel.value = cur;

  // Also populate generate seating dept filter
  const genSel = document.getElementById('gen-dept-filter');
  if (genSel) {
    genSel.innerHTML = '<option value="">All Departments</option>' + depts.map(d => `<option value="${d}">${d}</option>`).join('');
  }
}

async function addStudent() {
  const name = document.getElementById('student-name').value.trim();
  const regno = document.getElementById('student-regno').value.trim();
  if (!name || !regno) { toast('Name and Register Number are required', 'error'); return; }

  try {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_name: name,
        register_number: regno,
        department: document.getElementById('student-dept').value.trim(),
        year: document.getElementById('student-year').value,
        email: document.getElementById('student-email').value.trim()
      })
    });
    const data = await res.json();
    if (res.ok) {
      toast('Student added!', 'success');
      ['student-name','student-regno','student-dept','student-subject', 'student-email'].forEach(id => {
        document.getElementById(id).value = '';
      });
      document.getElementById('student-year').value = '1';
      loadStudents();
    } else {
      toast(data.error || 'Error adding student', 'error');
    }
  } catch (e) { toast('Error adding student', 'error'); }
}

async function deleteStudent(id) {
  if (!confirm('Remove this student?')) return;
  await fetch(`/api/students/${id}`, { method: 'DELETE' });
  toast('Student removed', 'success');
  loadStudents();
}

async function removeAllStudents() {
  if (!confirm('Are you sure you want to remove ALL students? This cannot be undone.')) return;
  try {
    const res = await fetch('/api/students', { method: 'DELETE' });
    if (res.ok) {
      toast('All students removed', 'success');
      loadStudents();
    } else {
      toast('Failed to remove students', 'error');
    }
  } catch (e) { toast('Error removing students', 'error'); }
}

async function bulkImportStudents(input) {
  const file = input.files[0];
  if (!file) return;

  const resultDiv = document.getElementById('bulk-import-result');
  if (resultDiv) {
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `<div class="upload-info">⏳ Importing ${file.name}...</div>`;
  }

  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch('/api/students/bulk', { method: 'POST', body: formData });
    const data = await res.json();
    if (res.ok) {
      toast(`✅ Imported ${data.added} students (${data.skipped} skipped as duplicates)`, 'success');
      if (resultDiv) {
        resultDiv.innerHTML = `<div class="upload-info" style="background:#e8f5e9;color:#2e7d32;border-left:3px solid #4caf50">
          ✅ <strong>${data.added}</strong> students imported · <strong>${data.skipped}</strong> skipped
        </div>`;
      }
    } else {
      toast(data.error || 'Import failed', 'error');
      if (resultDiv) resultDiv.innerHTML = `<div class="upload-info" style="background:#ffebee;color:#c62828;border-left:3px solid #f44336">❌ ${data.error}</div>`;
    }
    input.value = '';
    loadStudents();
  } catch (e) {
    toast('Import failed', 'error');
  }
}

async function exportStudentsCSV() {
  window.location.href = '/api/students/export';
}

// ─── GENERATE: Student source tabs ───────────────────
function switchStudentSource(tab) {
  document.getElementById('source-upload').style.display = tab === 'upload' ? 'block' : 'none';
  document.getElementById('source-saved').style.display = tab === 'saved' ? 'block' : 'none';
  document.getElementById('tab-upload').classList.toggle('active', tab === 'upload');
  document.getElementById('tab-saved').classList.toggle('active', tab === 'saved');
  if (tab === 'saved') filterSavedStudents();
}

function filterSavedStudents() {
  const dept = document.getElementById('gen-dept-filter')?.value || '';
  const year = document.getElementById('gen-year-filter')?.value || '';
  savedStudentsForGen = allStudents.filter(s => {
    const matchDept = !dept || s.department === dept;
    const matchYear = !year || String(s.year) === String(year);
    return matchDept && matchYear;
  });
  const info = document.getElementById('saved-students-count');
  if (info) {
    info.style.display = 'block';
    info.textContent = `✅ ${savedStudentsForGen.length} students selected`;
  }
}


// ─── COLLEGE PRESETS ──────────────────────────────────────
function closeModal(id, e) {
  if (e && e.target !== document.getElementById(id)) return;
  document.getElementById(id).style.display = 'none';
}

async function loadColleges() {
  try {
    const res = await fetch('/api/colleges');
    const colleges = await res.json();
    renderColleges(colleges);
  } catch(e) { console.error(e); }
}

function renderColleges(colleges) {
  const acc = document.getElementById('colleges-accordion');
  const empty = document.getElementById('colleges-empty');
  if (!acc) return;
  if (!colleges.length) {
    acc.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  acc.innerHTML = colleges.map(col => `
    <div class="college-card" id="college-${col.id}">
      <div class="college-card-header" onclick="toggleCollege('${col.id}')">
        <div class="college-card-left">
          <span class="college-expand-icon" id="icon-${col.id}">▶</span>
          <div>
            <div class="college-card-name">${col.name}</div>
            <div class="college-card-meta">${col.address || ''} ${col.city ? '· ' + col.city : ''} ${col.notes ? '· ' + col.notes : ''}</div>
          </div>
        </div>
        <div class="college-card-right">
          <span class="college-hall-count">${col.halls.length} hall${col.halls.length !== 1 ? 's' : ''}</span>
          <button class="btn-sm btn-sm-outline" onclick="event.stopPropagation();showAddHallModal('${col.id}','${col.name.replace(/'/g,"\\'")}')">＋ Add Hall</button>
          <button class="btn-sm btn-sm-danger" onclick="event.stopPropagation();deleteCollege('${col.id}')">🗑</button>
        </div>
      </div>
      <div class="college-halls-wrap" id="halls-${col.id}" style="display:none">
        ${col.halls.length === 0
          ? `<div class="halls-empty">No halls added yet. Click <strong>＋ Add Hall</strong> to define hall layouts for this college.</div>`
          : `
            <div class="halls-toolbar">
              <label class="check-label">
                <input type="checkbox" onchange="toggleAllHalls('${col.id}', this.checked)">
                Select All
              </label>
              <button class="btn-sm btn-sm-danger" id="bulk-del-${col.id}" style="display:none" onclick="bulkDeleteHalls('${col.id}')">🗑 Delete Selected</button>
            </div>
            <div class="halls-grid">${col.halls.map(h => renderHallCard(col.id, h)).join('')}</div>`
        }
      </div>

    </div>
  `).join('');
}

function renderHallCard(colId, h) {
  const blocked = Array.isArray(h.blocked_seats) ? h.blocked_seats : [];
  return `
  <div class="hall-preset-card">
    <div class="hall-preset-top">
      <div class="hall-preset-header-left">
        <input type="checkbox" class="hall-select-check" data-col="${colId}" data-id="${h.id}" onchange="updateBulkDeleteBtn('${colId}')" onclick="event.stopPropagation()">
        <div>
          <div class="hall-preset-name">${h.name}</div>
          ${h.block ? `<div class="hall-preset-block">${h.block}${h.location ? ' · ' + h.location : ''}</div>` : ''}
        </div>
      </div>
      <button class="modal-close-small" onclick="deleteHall('${colId}','${h.id}','${h.name.replace(/'/g,"\\'")}')">✕</button>
    </div>
    <div class="hall-preset-meta">
      <span class="preset-meta-pill">🪑 ${h.capacity || '?'} seats</span>
      <span class="preset-meta-pill">⊞ ${h.grid_rows || '?'} × ${h.grid_cols || '?'}</span>
      ${h.aisle_after_col ? `<span class="preset-meta-pill">↕ Aisles: ${parseAisleInput(h.aisle_after_col).join(', ') || h.aisle_after_col}</span>` : ''}
      ${blocked.length ? `<span class="preset-meta-pill">🚫 ${blocked.length} blocked</span>` : ''}
    </div>
    ${h.notes ? `<div style="font-size:0.77rem;color:#999;margin:6px 0">${h.notes}</div>` : ''}
    <div class="hall-mini-grid-wrap">${buildMiniGrid(h.grid_rows||5, h.grid_cols||8, h.aisle_after_col, blocked)}</div>
    <button class="btn-sm btn-sm-load" style="width:100%;margin-top:10px" onclick="loadHallToRooms('${colId}','${h.id}','${h.name.replace(/'/g,"\\'")}')">↗ Load to Active Rooms</button>
  </div>`;
}

function parseAisleInput(val) {
  if (!val) return [];
  const s = String(val).trim();
  if (s.startsWith('[')) { try { return JSON.parse(s).map(Number); } catch(e){} }
  return s.split(',').map(x => parseInt(x.trim())).filter(n => !isNaN(n) && n > 0);
}

function buildMiniGrid(rows, cols, aisleInput, blocked) {
  const aisles = parseAisleInput(aisleInput);
  const totalCols = cols + aisles.length;
  let html = `<div class="preset-mini-grid" style="grid-template-columns:repeat(${totalCols},1fr);gap:2px">`;
  for (let r = 1; r <= Math.min(rows, 8); r++) {
    for (let c = 1; c <= cols; c++) {
      const isB = blocked.includes(`R${r}C${c}`);
      html += `<div class="preset-mini-seat${isB ? ' blocked' : ''}"></div>`;
      if (aisles.includes(c)) html += `<div class="preset-mini-seat aisle"></div>`;
    }
  }
  html += '</div>';
  return html;
}

function toggleCollege(id) {
  const wrap = document.getElementById('halls-' + id);
  const icon = document.getElementById('icon-' + id);
  const open = wrap.style.display === 'block';
  wrap.style.display = open ? 'none' : 'block';
  icon.textContent = open ? '▶' : '▼';
}

function showAddCollegeModal() {
  ['col-name','col-city','col-notes','col-address'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('college-modal').style.display = 'flex';
}

async function saveCollege() {
  const name = document.getElementById('col-name').value.trim();
  if (!name) { toast('College name is required', 'error'); return; }
  try {
    const res = await fetch('/api/colleges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        address: document.getElementById('col-address').value.trim(),
        city: document.getElementById('col-city').value.trim(),
        notes: document.getElementById('col-notes').value.trim()
      })
    });
    if (res.ok) {
      toast('College added!', 'success');
      document.getElementById('college-modal').style.display = 'none';
      loadColleges();
    }
  } catch(e) { toast('Error adding college', 'error'); }
}

async function deleteCollege(id) {
  if (!confirm('Delete this college and all its hall presets?')) return;
  await fetch(`/api/colleges/${id}`, { method: 'DELETE' });
  toast('College deleted', 'success');
  loadColleges();
}

function toggleAllHalls(colId, checked) {
  const wrap = document.getElementById('halls-' + colId);
  if (!wrap) return;
  wrap.querySelectorAll('.hall-select-check').forEach(cb => {
    cb.checked = checked;
  });
  updateBulkDeleteBtn(colId);
}

function updateBulkDeleteBtn(colId) {
  const wrap = document.getElementById('halls-' + colId);
  const btn = document.getElementById('bulk-del-' + colId);
  if (!wrap || !btn) return;
  const count = wrap.querySelectorAll('.hall-select-check:checked').length;
  btn.style.display = count > 0 ? 'inline-block' : 'none';
  btn.textContent = `🗑 Delete Selected (${count})`;
}

async function bulkDeleteHalls(colId) {
  const wrap = document.getElementById('halls-' + colId);
  if (!wrap) return;
  const checked = wrap.querySelectorAll('.hall-select-check:checked');
  const ids = Array.from(checked).map(cb => cb.dataset.id);
  if (ids.length === 0) return;

  if (!confirm(`Delete ${ids.length} selected hall presets?`)) return;

  try {
    const res = await fetch(`/api/colleges/${colId}/halls/bulk-delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hall_ids: ids })
    });
    if (res.ok) {
      toast(`${ids.length} halls deleted`, 'success');
      loadColleges();
    } else {
      const d = await res.json();
      toast(d.error || 'Delete failed', 'error');
    }
  } catch (e) { toast('Network error', 'error'); }
}


function showAddHallModal(collegeId, collegeName) {
  document.getElementById('hall-college-id').value = collegeId;
  document.getElementById('hall-modal-title').textContent = `Add Hall — ${collegeName}`;
  ['hall-name','hall-block','hall-location','hall-capacity','hall-rows','hall-cols','hall-aisle','hall-blocked','hall-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('hall-grid-preview').innerHTML = '';
  document.getElementById('hall-modal').style.display = 'flex';
  // Expand that college accordion
  const wrap = document.getElementById('halls-' + collegeId);
  if (wrap) wrap.style.display = 'block';
  const icon = document.getElementById('icon-' + collegeId);
  if (icon) icon.textContent = '▼';
}

async function saveHall() {
  const colId = document.getElementById('hall-college-id').value;
  const name = document.getElementById('hall-name').value.trim();
  const capacity = document.getElementById('hall-capacity').value;
  if (!name || !capacity) { toast('Hall name and capacity are required', 'error'); return; }

  const blockedRaw = document.getElementById('hall-blocked').value.trim();
  const blocked = blockedRaw ? blockedRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  try {
    const res = await fetch(`/api/colleges/${colId}/halls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, capacity: parseInt(capacity),
        block: document.getElementById('hall-block').value.trim(),
        location: document.getElementById('hall-location').value.trim(),
        grid_rows: parseInt(document.getElementById('hall-rows').value) || 5,
        grid_cols: parseInt(document.getElementById('hall-cols').value) || 8,
        aisle_after_col: document.getElementById('hall-aisle').value.trim() || null,
        blocked_seats: blocked,
        notes: document.getElementById('hall-notes').value.trim()
      })
    });
    if (res.ok) {
      toast('Hall preset saved!', 'success');
      document.getElementById('hall-modal').style.display = 'none';
      loadColleges();
    }
  } catch(e) { toast('Error saving hall', 'error'); }
}

async function deleteHall(colId, hallId, hallName) {
  if (!confirm(`Delete hall preset "${hallName}"?`)) return;
  await fetch(`/api/colleges/${colId}/halls/${hallId}`, { method: 'DELETE' });
  toast('Hall preset deleted', 'success');
  loadColleges();
}

async function loadHallToRooms(colId, hallId, hallName) {
  try {
    const res = await fetch(`/api/colleges/${colId}/halls/${hallId}/load`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      toast(`"${hallName}" added to active rooms! Go to Generate Seating to use it.`, 'success');
      loadRooms();
    } else {
      toast(data.error || 'Could not load hall', 'error');
    }
  } catch(e) { toast('Error loading hall', 'error'); }
}

function updateHallPreview() {
  const rows = parseInt(document.getElementById('hall-rows')?.value) || 0;
  const cols = parseInt(document.getElementById('hall-cols')?.value) || 0;
  const aisleInput = document.getElementById('hall-aisle')?.value || '';
  const aisles = parseAisleInput(aisleInput);
  const blockedRaw = document.getElementById('hall-blocked')?.value || '';
  const blocked = blockedRaw ? blockedRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  const container = document.getElementById('hall-grid-preview');
  if (!container) return;
  if (!rows || !cols) {
    container.innerHTML = '<p style="color:#999;font-size:0.8rem;text-align:center">Enter rows & columns to preview</p>';
    return;
  }
  const maxRows = Math.min(rows, 8);
  const totalCols = cols + aisles.length;
  let html = `<div style="display:grid;grid-template-columns:repeat(${totalCols},1fr);gap:3px">`;
  for (let r = 1; r <= maxRows; r++) {
    for (let c = 1; c <= cols; c++) {
      const isB = blocked.includes(`R${r}C${c}`);
      html += `<div class="pgp-seat${isB ? ' blocked' : ''}"></div>`;
      if (aisles.includes(c)) html += `<div class="pgp-seat aisle"></div>`;
    }
  }
  html += '</div>';
  if (rows > 8) html += `<p style="font-size:0.75rem;color:#999;text-align:center;margin-top:6px">Showing first 8 of ${rows} rows</p>`;
  container.innerHTML = html;
}

// ─── USER MANAGEMENT ─────────────────────────────────
async function loadUsers() {
  // Show immediately based on cached role (set at login) — no flicker
  const cachedRole = window.currentUserRole;
  const addUserSection = document.getElementById('add-user-section');
  const allUsersCard = document.getElementById('all-users-card');
  const chpwHint = document.getElementById('chpw-hint');

  if (cachedRole === 'admin') {
    if (addUserSection) addUserSection.style.display = 'block';
    if (allUsersCard) allUsersCard.style.display = 'block';
    if (chpwHint) chpwHint.textContent = "You can change any user's password";
  }

  // Then confirm with server (authoritative)
  let isAdmin = cachedRole === 'admin';
  try {
    const meRes = await fetch('/api/me');
    if (meRes.ok) {
      const me = await meRes.json();
      isAdmin = me.role === 'admin';
      window.currentUserRole = me.role;
    }
  } catch(e) {}

  // Apply confirmed role
  if (addUserSection) addUserSection.style.display = isAdmin ? 'block' : 'none';
  if (allUsersCard) allUsersCard.style.display = isAdmin ? 'block' : 'none';
  if (chpwHint) chpwHint.textContent = isAdmin
    ? "You can change any user's password"
    : 'Enter your own username and new password below';

  if (!isAdmin) return;

  // Load users list
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  try {
    const res = await fetch('/api/users');
    if (!res.ok) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#c62828;padding:24px">
        ${res.status === 403 ? 'Admin access required.' : 'Could not load users — please refresh.'}</td></tr>`;
      return;
    }
    const users = await res.json();
    if (!Array.isArray(users) || users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;padding:24px">No users added yet.</td></tr>';
      return;
    }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td><code style="background:#f3f4f6;padding:2px 6px;border-radius:4px">${u.username}</code></td>
        <td><span style="background:${u.role==='admin'?'#ffebee':'#e3f2fd'};color:${u.role==='admin'?'#c62828':'#1565c0'};padding:2px 8px;border-radius:12px;font-size:0.8rem;font-weight:600">${u.role}</span></td>
        <td>${u.username === 'admin'
          ? '<span style="color:#ccc;font-size:0.8rem">Protected</span>'
          : `<button class="btn-danger" onclick="deleteUser('${u.username}','${u.name}')">Remove</button>`}
        </td>
      </tr>`).join('');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#c62828;padding:24px">Error loading users.</td></tr>';
  }
}

async function addUser() {
  const name = document.getElementById('user-name').value.trim();
  const username = document.getElementById('user-username').value.trim();
  const password = document.getElementById('user-password').value;
  const role = document.getElementById('user-role').value;
  if (!name || !username || !password) { toast('Name, username and password required', 'error'); return; }
  if (password.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
  try {
    const res = await fetch('/api/users', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name, username, password, role })
    });
    const data = await res.json();
    if (res.ok) {
      toast(`User "${username}" created!`, 'success');
      ['user-name','user-username','user-password'].forEach(id => document.getElementById(id).value = '');
      loadUsers();
    } else { toast(data.error || 'Error creating user', 'error'); }
  } catch(e) { toast('Error', 'error'); }
}

async function deleteUser(username, name) {
  if (!confirm(`Remove user "${name}" (${username})?`)) return;
  const res = await fetch(`/api/users/${username}`, { method: 'DELETE' });
  const data = await res.json();
  if (res.ok) { toast('User removed', 'success'); loadUsers(); }
  else toast(data.error || 'Error', 'error');
}

async function changePassword() {
  const username = document.getElementById('chpw-username').value.trim();
  const password = document.getElementById('chpw-password').value;
  if (!username || !password) { toast('Username and new password required', 'error'); return; }
  if (password.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
  const res = await fetch(`/api/users/${username}/password`, {
    method: 'PUT', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ password })
  });
  const data = await res.json();
  if (res.ok) {
    toast('Password updated!', 'success');
    document.getElementById('chpw-username').value = '';
    document.getElementById('chpw-password').value = '';
  } else toast(data.error || 'Error', 'error');
}

// ─── EDIT FUNCTIONALITY ───────────────────────────────

// ─── EDIT HELPER ─────────────────────────────────────────────────────────────
function setEditMode(btnId, updateText, resetText, saveFn, resetFn) {
  const btn = document.getElementById(btnId);
  if (!btn) { console.warn('Edit button not found:', btnId); return; }
  btn.textContent = updateText;
  btn.style.background = 'linear-gradient(135deg,#E65100,#F57C00)';
  btn.onclick = async () => {
    await saveFn();
    btn.textContent = resetText;
    btn.style.background = '';
    btn.onclick = resetFn;
  };
}

function editExam(exam) {
  // Pre-fill the form with existing exam data
  document.getElementById('exam-name').value = exam.name || '';
  document.getElementById('exam-subject').value = exam.subject || '';
  document.getElementById('exam-subject-code').value = exam.subject_code || '';
  document.getElementById('exam-date').value = exam.date || '';
  document.getElementById('exam-time').value = exam.time || '';
  document.getElementById('exam-duration').value = exam.duration || '';
  document.getElementById('exam-paper-sets').value = exam.paper_sets || '2';
  document.getElementById('exam-dept').value = exam.department || '';
  document.getElementById('exam-sem').value = exam.semester || '';

  // Set year-subject rows
  const container = document.getElementById('year-subject-rows');
  container.innerHTML = '';
  const ysm = exam.year_subject_map || {};
  const ysCodes = exam.year_subject_code_map || {};
  const entries = Object.entries(ysm);
  if (entries.length === 0) {
    addYearSubjectRow();
  } else {
    entries.forEach(([key, subj]) => {
      addYearSubjectRow();
      const rows = container.querySelectorAll('.year-subject-row');
      const lastRow = rows[rows.length - 1];
      const parts = key.includes('|') ? key.split('|') : [key, ''];
      lastRow.querySelector('.ys-year').value = parts[0] || '';
      const deptEl = lastRow.querySelector('.ys-dept');
      if (deptEl) deptEl.value = parts[1] || '';
      lastRow.querySelector('.ys-subject').value = subj;
      const codeEl = lastRow.querySelector('.ys-subject-code');
      if (codeEl) codeEl.value = ysCodes[key] || '';
    });
  }

  setEditMode('btn-add-exam', '✏ Update Exam', 'Add Exam', async () => {
    const { map: ysMap, codeMap: ysCMap } = getYearSubjectMap();
    const res = await fetch(`/api/exams/${exam.id}`, {
      method: 'PUT', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        name: document.getElementById('exam-name').value,
        subject: document.getElementById('exam-subject').value,
        subject_code: document.getElementById('exam-subject-code').value,
        date: document.getElementById('exam-date').value,
        time: document.getElementById('exam-time').value,
        duration: document.getElementById('exam-duration').value,
        paper_sets: document.getElementById('exam-paper-sets').value,
        department: document.getElementById('exam-dept').value,
        semester: document.getElementById('exam-sem').value,
        year_subject_map: ysMap,
        year_subject_code_map: ysCMap
      })
    });
    if (res.ok) { toast('Exam updated!', 'success'); loadExams(); }
    else { const d=await res.json(); toast(d.error||'Error updating exam','error'); }
  }, addExam);
  // Scroll to form and highlight Subject per Group
  document.getElementById('exam-name').scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Flash the year-subject section so user knows to update it
  const ysSection = document.getElementById('year-subject-rows');
  if (ysSection) {
    ysSection.style.transition = 'background 0.3s';
    ysSection.style.background = '#fff3e0';
    setTimeout(() => { ysSection.style.background = ''; }, 1500);
  }
}

function editRoom(room) {
  document.getElementById('room-name').value = room.name || '';
  document.getElementById('room-block').value = room.block || '';
  document.getElementById('room-capacity').value = room.capacity || '';
  document.getElementById('room-rows').value = room.grid_rows || '';
  document.getElementById('room-cols').value = room.grid_cols || '';
  document.getElementById('room-location').value = room.location || '';
  document.getElementById('room-blocked').value = Array.isArray(room.blocked_seats) ? room.blocked_seats.join(', ') : '';
  document.getElementById('room-aisle').value = room.aisle_after_col || '';

  setEditMode('btn-add-room', '✏ Update Room', 'Add Room', async () => {
    const blocked = document.getElementById('room-blocked').value.trim();
    const res = await fetch(`/api/rooms/${room.id}`, {
      method: 'PUT', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        name: document.getElementById('room-name').value,
        block: document.getElementById('room-block').value,
        capacity: document.getElementById('room-capacity').value,
        grid_rows: document.getElementById('room-rows').value || 5,
        grid_cols: document.getElementById('room-cols').value || 8,
        location: document.getElementById('room-location').value,
        blocked_seats: blocked ? blocked.split(',').map(s=>s.trim()).filter(Boolean) : [],
        aisle_after_col: document.getElementById('room-aisle').value || null
      })
    });
    if (res.ok) { toast('Room updated!', 'success'); loadRooms(); }
    else { const d=await res.json(); toast(d.error||'Error updating room','error'); }
  }, addRoom);
  document.getElementById('room-name').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function editStaff(staff) {
  document.getElementById('staff-name').value = staff.name || '';
  document.getElementById('staff-email').value = staff.email || '';
  document.getElementById('staff-dept').value = staff.department || '';
  document.getElementById('staff-phone').value = staff.phone || '';

  setEditMode('btn-add-staff', '✏ Update Staff', 'Add Invigilator', async () => {
    const res = await fetch(`/api/staff/${staff.id}`, {
      method: 'PUT', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        name: document.getElementById('staff-name').value,
        email: document.getElementById('staff-email').value,
        department: document.getElementById('staff-dept').value,
        phone: document.getElementById('staff-phone').value
      })
    });
    if (res.ok) { toast('Staff updated!', 'success'); loadStaff(); }
    else { const d=await res.json(); toast(d.error||'Error updating staff','error'); }
  }, addStaff);
  document.getElementById('staff-name').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function editStudent(student) {
  document.getElementById('student-name').value = student.student_name || '';
  document.getElementById('student-regno').value = student.register_number || '';
  document.getElementById('student-dept').value = student.department || '';
  document.getElementById('student-year').value = student.year || '1';
  document.getElementById('student-subject').value = student.subject || '';

  setEditMode('btn-add-student', '✏ Update Student', 'Add Student', async () => {
    const res = await fetch(`/api/students/${student.id}`, {
      method: 'PUT', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        student_name: document.getElementById('student-name').value,
        register_number: document.getElementById('student-regno').value,
        department: document.getElementById('student-dept').value,
        year: document.getElementById('student-year').value,
        subject: document.getElementById('student-subject').value
      })
    });
    if (res.ok) { toast('Student updated!', 'success'); loadStudents(); }
    else { const d=await res.json(); toast(d.error||'Error updating student','error'); }
  }, addStudent);
  document.getElementById('student-name').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ─── PRINT FUNCTIONS ─────────────────────────────────
function printAllHalls() {
  if (!currentArrangementId) { toast('Generate a seating arrangement first', 'error'); return; }
  // Use same tab on mobile to avoid popup blockers
  const isMobile = window.innerWidth <= 900;
  if (isMobile) { window.location.href = `/api/print/${currentArrangementId}`; }
  else { window.open(`/api/print/${currentArrangementId}`, '_blank'); }
}

let currentPreviewRoomId = null;

function printSingleHall() {
  if (!currentArrangementId) { toast('Generate a seating arrangement first', 'error'); return; }
  if (!currentPreviewRoomId && currentArrangementData) {
    const seats = currentArrangementData.seats || [];
    if (seats.length > 0) currentPreviewRoomId = seats[0].room_id;
  }
  if (!currentPreviewRoomId) { toast('No hall selected', 'error'); return; }
  const isMobile = window.innerWidth <= 900;
  const url = `/api/print/${currentArrangementId}/${currentPreviewRoomId}`;
  if (isMobile) { window.location.href = url; }
  else { window.open(url, '_blank'); }
}

function printArchivedHall(examId, roomId) {
  const isMobile = window.innerWidth <= 900;
  const url = `/api/print/${examId}/${roomId}`;
  if (isMobile) { window.location.href = url; }
  else { window.open(url, '_blank'); }
}

function printArchivedAllHalls(examId) {
  const isMobile = window.innerWidth <= 900;
  const url = `/api/print/${examId}`;
  if (isMobile) { window.location.href = url; }
  else { window.open(url, '_blank'); }
}
