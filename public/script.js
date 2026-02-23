// Konstanter
const form = document.getElementById('form');
const fab = document.getElementById('fab');
const closeBtn = document.getElementById('closeBtn');
const saveBtn = document.getElementById('saveBtn');
const list = document.getElementById('list');
const title = document.getElementById('title');
const date  = document.getElementById('date');
const desc  = document.getElementById('desc');
const modal = document.getElementById('modal');
const confirmModal = document.getElementById('confirmModal');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');

let taskToDelete = null;

// localStorage för tasks
let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let current = {};



// Rendera tasks
function render() {

  tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  list.innerHTML = '';

  const now = new Date();
  const todayStr = now.toDateString();

  let groups = {
    overdue: [],
    today: [],
    tomorrow: [],
    future: {},
    nodate: [],
    completed: []
  };

  tasks.forEach(t => {

    if (t.done) {
      groups.completed.push(t);
      return;
    }

    if (!t.date) {
      groups.nodate.push(t);
      return;
    }

    const taskDate = new Date(t.date);
    const taskDay = taskDate.toDateString();

    if (taskDate < now && !t.done) {
      groups.overdue.push(t);
    }
    else if (taskDay === todayStr) {
      groups.today.push(t);
    }
    else {
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);

      if (taskDay === tomorrow.toDateString()) {
        groups.tomorrow.push(t);
      }
      else {
        const key = taskDay;
        if (!groups.future[key]) groups.future[key] = [];
        groups.future[key].push(t);
      }
    }
  });

  // Render in order
  renderGroup("🔴 Overdue", groups.overdue, true);
  renderGroup("📅 Today", groups.today);
  renderGroup("🌤 Tomorrow", groups.tomorrow);

  Object.keys(groups.future).sort().forEach(date => {
    renderGroup("📆 " + date, groups.future[date]);
  });

  renderGroup("📝 No Date", groups.nodate);
  renderGroup("✅ Completed", groups.completed);
}

function renderGroup(title, tasks, open = false) {

  if (!tasks || tasks.length === 0) return;

  const group = document.createElement("div");
  group.className = "group";

  const header = document.createElement("div");
  header.className = "group-header";
  header.textContent = title;

  const content = document.createElement("div");
  content.className = "group-content";
  if (!open) content.classList.add("hide");

  header.addEventListener("click", () => {
    content.classList.toggle("hide");
  });

  tasks.forEach(t => {
    const div = document.createElement("div");
    div.className = "task";
    if (t.done) div.classList.add("done");

    // Overdue style
    if (!t.done && t.date && new Date(t.date) < new Date()) {
      div.classList.add("overdue");
    }

    div.innerHTML = `
      <p><strong>${t.title}</strong></p>
      <p>${t.date || ""}</p>
      <p>${t.desc || ""}</p>
      <button onclick="editTask('${t.id}')" class="btn">Ändra</button>
      <button onclick="delTask('${t.id}')" class="btn">Ta bort</button>
      <button onclick="toggleDone('${t.id}')" class="btn">Klart</button>
    `;

    content.appendChild(div);
  });

  group.appendChild(header);
  group.appendChild(content);
  list.appendChild(group);
}

// Markera/avmarkera task
function toggleDone(id) {
  const i = tasks.findIndex(t => t.id === id);
  if(i !== -1){
    tasks[i].done = !tasks[i].done;

    if (tasks[i].done && typeof Android !== "undefined") {
      Android.cancelNotification(tasks[i].id);
    }

    if(tasks[i].done) {
      tasks[i].doneDate = new Date().toISOString();
    } else {
      delete tasks[i].doneDate;
    }

    localStorage.setItem('tasks', JSON.stringify(tasks));
    render();
  }
}

// Spara/uppdatera task
function save() {
  if(!title.value.trim()) { alert('Skriv en titel!'); return; }
  const obj = {
    id: `${title.value.toLowerCase().replace(/\s+/g,'-')}-${Date.now()}`,
    title: title.value,
    date: date.value,
    desc: desc.value.trim(),
    done: false
  };
  const i = tasks.findIndex(x => x.id === current.id);
  if(i === -1) tasks.unshift(obj);
  else tasks[i] = obj;
  localStorage.setItem('tasks', JSON.stringify(tasks));

  if (date.value.trim() !== "") {
    if (typeof Android !== "undefined") {
        Android.scheduleNotification(obj.id, title.value, date.value);
    }
  }
  reset();
  render();
}

// Ta bort task
function delTask(id){
  taskToDelete = id;
  confirmModal.classList.remove('hide');
  document.body.style.overflow = "hidden";
}

confirmYes.addEventListener('click', () => {
  if (!taskToDelete) return;

  tasks = tasks.filter(t => t.id !== taskToDelete);
  localStorage.setItem('tasks', JSON.stringify(tasks));

  if (typeof Android !== "undefined") {
    Android.cancelNotification(taskToDelete);
  }

  taskToDelete = null;
  confirmModal.classList.add('hide');
  document.body.style.overflow = "";
  render();
});

confirmNo.addEventListener('click', () => {
  taskToDelete = null;
  confirmModal.classList.add('hide');
  document.body.style.overflow = "";
});

// Redigera task
function editTask(id){
  current = tasks.find(t => t.id === id) || {};
  title.value = current.title || '';
  date.value = current.date || '';
  desc.value = current.desc || '';
  saveBtn.textContent = 'Uppdatera';
  modal.classList.remove('hide');
}

// Återställ formulär
function reset(){
  title.value = '';
  date.value = '';
  desc.value = '';
  saveBtn.textContent = 'Lägg till';
  modal.classList.add('hide');
  document.body.style.overflow = "";
  current = {};
}

function removeOldDoneTasks() {
  const today = new Date();
  let changed = false;

  tasks = tasks.filter(t => {
    if (t.done && t.doneDate) {
      const doneDate = new Date(t.doneDate);
      if (doneDate.toDateString() !== today.toDateString()) {
        changed = true;
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



// Event listeners
fab.addEventListener('click', () => {
  modal.classList.remove('hide');
  document.body.style.overflow = "hidden";
});
closeBtn.addEventListener('click', () => reset());
form.addEventListener('submit', e => { 
  e.preventDefault(); 
  save(); 
});

// Koppla knappar
window.editTask = editTask;
window.delTask = delTask;
window.toggleDone = toggleDone;

// Ensure DOM is ready and localStorage is available
window.addEventListener("load", function () {
  console.log("App fully loaded");
  removeOldDoneTasks();
  render();
});

modal.addEventListener('click', function(e) {
  if (e.target === modal) {
    reset();
  }
});

setInterval(removeOldDoneTasks, 5 * 60 * 1000);
