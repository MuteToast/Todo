// ===== DOM REFERENCES =====
const form = document.getElementById('form');
const closeBtn = document.getElementById('closeBtn');
const saveBtn = document.getElementById('saveBtn');
const list = document.getElementById('list');
const title = document.getElementById('title');
const date  = document.getElementById('date');
const desc  = document.getElementById('desc');
const fab = document.getElementById('fab');
const modal = document.getElementById('modal');

// ===== STORAGE =====
let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let current = {};

// ===== RENDER TASKS =====
function render() {

  tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

  list.innerHTML = '';

  tasks.sort((a, b) => {
    if (a.done && !b.done) return 1;
    if (!a.done && b.done) return -1;
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });

  let html = '';

  tasks.forEach(t => {
    html += `
      <div class="task ${t.done ? "done": ""}" id="${t.id}">
        <p><strong>${t.title}</strong></p>
        <p>${t.date || ''}</p>
        <p>${t.desc || ''}</p>
        <button onclick="editTask('${t.id}')" class="btn" type="button">Ändra</button>
        <button onclick="delTask('${t.id}')" class="btn" type="button">Ta bort</button>
        <button onclick="toggleDone('${t.id}')" class="btn" type="button">Klart</button>
      </div>
    `;
  });

  list.innerHTML = html;
}

// ===== TOGGLE DONE =====
function toggleDone(id) {

  const i = tasks.findIndex(t => t.id === id);
  if (i === -1) return;

  tasks[i].done = !tasks[i].done;

  if (tasks[i].done) {
    tasks[i].doneDate = new Date().toISOString();

    // Cancel Android reminders
    if (typeof Android !== "undefined") {
      Android.cancelNotification(id);
    }

  } else {
    delete tasks[i].doneDate;

    // Reschedule if date exists
    if (tasks[i].date && typeof Android !== "undefined") {
      Android.scheduleNotification(
        tasks[i].id,
        tasks[i].title,
        tasks[i].date
      );
    }
  }

  localStorage.setItem('tasks', JSON.stringify(tasks));
  render();
}

// ===== SAVE / UPDATE TASK =====
function save() {

  if (!title.value.trim()) {
    alert('Skriv en titel!');
    return;
  }

  let obj;

  const i = tasks.findIndex(x => x.id === current.id);

  if (i === -1) {
    // New task
    obj = {
      id: `${title.value.toLowerCase().replace(/\s+/g,'-')}-${Date.now()}`,
      title: title.value,
      date: date.value,
      desc: desc.value.trim(),
      done: false
    };

    tasks.unshift(obj);

  } else {
    // Update existing task
    obj = {
      ...tasks[i],
      title: title.value,
      date: date.value,
      desc: desc.value.trim()
    };

    tasks[i] = obj;

    // Cancel old notifications before rescheduling
    if (typeof Android !== "undefined") {
      Android.cancelNotification(obj.id);
    }
  }

  localStorage.setItem('tasks', JSON.stringify(tasks));

  // Schedule notification if date exists
  if (obj.date && typeof Android !== "undefined") {
    Android.scheduleNotification(obj.id, obj.title, obj.date);
  }

  reset();
  render();
}

// ===== DELETE TASK =====
function delTask(id){

  tasks = tasks.filter(t => t.id !== id);
  localStorage.setItem('tasks', JSON.stringify(tasks));

  if (typeof Android !== "undefined") {
    Android.cancelNotification(id);
  }

  render();
}

// ===== EDIT TASK =====
function editTask(id){

  current = tasks.find(t => t.id === id) || {};

  title.value = current.title || '';
  date.value = current.date || '';
  desc.value = current.desc || '';

  saveBtn.textContent = 'Uppdatera';

  openModal();
}

// ===== MODAL CONTROL =====
function openModal() {
  modal.classList.remove('hide');
  document.body.classList.add('modal-open');
}

function reset() {
  title.value = '';
  date.value = '';
  desc.value = '';
  saveBtn.textContent = 'Lägg till';
  modal.classList.add('hide');
  document.body.classList.remove('modal-open');
  current = {};
}

// Close when clicking outside
modal.addEventListener('click', function(e){
  if (e.target === modal) {
    reset();
  }
});

// ===== REMOVE OLD DONE TASKS =====
function removeOldDoneTasks() {

  const today = new Date();
  let changed = false;

  tasks = tasks.filter(t => {
    if (t.done && t.doneDate) {
      const doneDate = new Date(t.doneDate);
      if (doneDate.toDateString() !== today.toDateString()) {
        changed = true;

        if (typeof Android !== "undefined") {
          Android.cancelNotification(t.id);
        }

        return false;
      }
    }
    return true;
  });

  if (changed) {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    render();
  }
}

// ===== EVENT LISTENERS =====
fab.addEventListener('click', openModal);
closeBtn.addEventListener('click', reset);

form.addEventListener('submit', e => {
  e.preventDefault();
  save();
});

// Make functions globally accessible
window.editTask = editTask;
window.delTask = delTask;
window.toggleDone = toggleDone;

// ===== INIT =====
window.addEventListener("load", function () {
  removeOldDoneTasks();
  render();
});

setInterval(removeOldDoneTasks, 5 * 60 * 1000);