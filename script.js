const STORAGE_KEY = 'studytrack_tasks_v1';
let tasks = [];
let sortKey = 'due';
let sortAsc = true;

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load tasks:', e);
    tasks = [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks:', e);
  }
}

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function isOverdue(task) {
  return !task.done && task.due && task.due < todayISO();
}

function priorityRank(p) {
  return { High: 0, Medium: 1, Low: 2 }[p] ?? 3;
}

function addTask(subject, name, due, priority) {
  tasks.push({
    id: Date.now() + Math.random().toString(16).slice(2),
    subject: subject.trim(),
    task: name.trim(),
    due,
    priority,
    done: false
  });
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

function toggleDone(id) {
  const t = tasks.find(t => t.id === id);
  if (t) { t.done = !t.done; saveTasks(); render(); }
}

function editTask(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  const newSubject = prompt('Subject:', t.subject);
  if (newSubject === null) return;
  const newName = prompt('Assignment:', t.task);
  if (newName === null) return;
  const newDue = prompt('Due date (YYYY-MM-DD):', t.due);
  if (newDue === null) return;
  const newPriority = prompt('Priority (Low/Medium/High):', t.priority);
  if (newPriority === null) return;

  if (newPriority && !['Low','Medium','High'].includes(newPriority)) {
    alert('Priority must be Low, Medium or High');
    return;
  }
  t.subject = newSubject.trim() || t.subject;
  t.task = newName.trim() || t.task;
  t.due = newDue;
  t.priority = newPriority || t.priority;
  saveTasks();
  render();
}

function sortTasks(list) {
  return [...list].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'priority') {
      cmp = priorityRank(a.priority) - priorityRank(b.priority);
    } else if (sortKey === 'due') {
      cmp = (a.due || '').localeCompare(b.due || '');
    } else {
      cmp = String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''));
    }
    return sortAsc ? cmp : -cmp;
  });
}

function render() {
  const tbody = document.getElementById('taskBody');
  const sorted = sortTasks(tasks);
  tbody.innerHTML = '';

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty">No tasks yet. Add your first assignment above!</td></tr>`;
  } else {
    for (const t of sorted) {
      const tr = document.createElement('tr');
      if (isOverdue(t)) tr.classList.add('overdue');
      if (t.done) tr.classList.add('done');

      tr.innerHTML = `
        <td>${escapeHtml(t.subject)}</td>
        <td>${escapeHtml(t.task)}</td>
        <td>${t.due || '—'}</td>
        <td><span class="badge ${t.priority.toLowerCase()}">${t.priority}</span></td>
        <td>${t.done ? '✅ Done' : (isOverdue(t) ? '⏰ Overdue' : '🕓 Pending')}</td>
        <td class="actions">
          <button class="btn-toggle" data-id="${t.id}" data-action="toggle">${t.done ? 'Undo' : 'Done'}</button>
          <button class="btn-edit" data-id="${t.id}" data-action="edit">Edit</button>
          <button class="btn-del" data-id="${t.id}" data-action="delete">Del</button>
        </td>
      `;
      tbody.appendChild(tr);
    }
  }

  const total = tasks.length;
  const overdue = tasks.filter(isOverdue).length;
  document.getElementById('count').textContent = `${total} task${total === 1 ? '' : 's'}`;
  document.getElementById('overdueCount').textContent =
    overdue ? `⚠️ ${overdue} overdue` : '';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

document.getElementById('addBtn').addEventListener('click', () => {
  const subject = document.getElementById('subject').value;
  const name = document.getElementById('task').value;
  const due = document.getElementById('due').value;
  const priority = document.getElementById('priority').value;

  if (!subject.trim() || !name.trim()) {
    alert('Please fill in both Subject and Assignment.');
    return;
  }
  addTask(subject, name, due, priority);
  document.getElementById('subject').value = '';
  document.getElementById('task').value = '';
  document.getElementById('due').value = '';
  document.getElementById('priority').value = 'Medium';
  document.getElementById('subject').focus();
});

document.getElementById('clearBtn').addEventListener('click', () => {
  if (tasks.length && confirm('Delete all tasks? This cannot be undone.')) {
    tasks = [];
    saveTasks();
    render();
  }
});

document.getElementById('taskBody').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if (action === 'toggle') toggleDone(id);
  else if (action === 'edit') editTask(id);
  else if (action === 'delete') {
    if (confirm('Delete this task?')) deleteTask(id);
  }
});

document.querySelectorAll('thead th[data-sort]').forEach(th => {
  th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (sortKey === key) sortAsc = !sortAsc;
    else { sortKey = key; sortAsc = true; }
    render();
  });
});

loadTasks();
render();