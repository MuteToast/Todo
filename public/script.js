// Konstanter
const form = document.getElementById('form');
const openBtn = document.getElementById('openBtn');
const closeBtn = document.getElementById('closeBtn');
const saveBtn = document.getElementById('saveBtn');
const list = document.getElementById('list');
const title = document.getElementById('title');
const date  = document.getElementById('date');
const desc  = document.getElementById('desc');

// localStorage för tasks
let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let current = {};



// Rendera tasks
function render() {
  console.log("LocalStorage raw:", localStorage.getItem("tasks"));
  // Reload tasks from localStorage to ensure we have the latest
  tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  console.log('Rendering tasks:', tasks);
  
  list.innerHTML = '';

  tasks.sort((a, b) => {
    if(a.done && !b.done) return 1;
    if(!a.done && b.done) return -1;
    if(!a.date && !b.date) return 0;
    if(!a.date) return 1;
    if(!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });

  // Build HTML string first, then set once
  let html = '';
  tasks.forEach(t => {
    html += `
      <div class="task ${t.done ? "done": ""}" id="${t.id}">
        <p><strong>${t.title}</strong></p>
        <p>${t.date}</p>
        <p>${t.desc}</p>
        <button onclick="editTask('${t.id}')" class="btn" type="button">Ändra</button>
        <button onclick="delTask('${t.id}')" class="btn" type="button">Ta bort</button>
        <button onclick="toggleDone('${t.id}')" class="btn" type="button">Klart</button>
      </div>
    `;
  });
  list.innerHTML = html;
  list.requestLayout?.();
}

// Markera/avmarkera task
function toggleDone(id) {
  const i = tasks.findIndex(t => t.id === id);
  if(i !== -1){
    tasks[i].done = !tasks[i].done;

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
  reset();
  render();

if (date.value) {
  console.log("Trying to call Android bridge");

  if (typeof Android !== "undefined") {
      console.log("Android bridge exists");
      Android.scheduleNotification(title.value, date.value);
  } else {
      console.log("Android bridge NOT found");
  }
} else {
  console.log("No date set, skipping Android notification");
}
}

// Ta bort task
function delTask(id){
  tasks = tasks.filter(t => t.id !== id);
  localStorage.setItem('tasks', JSON.stringify(tasks));
  render();
}

// Redigera task
function editTask(id){
  current = tasks.find(t => t.id === id) || {};
  title.value = current.title || '';
  date.value = current.date || '';
  desc.value = current.desc || '';
  saveBtn.textContent = 'Uppdatera';
  form.classList.remove('hide');
}

// Återställ formulär
function reset(){
  title.value = '';
  date.value = '';
  desc.value = '';
  saveBtn.textContent = 'Lägg till';
  form.classList.add('hide');
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
openBtn.addEventListener('click', () => form.classList.remove('hide'));
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
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log("Raw date value:", date.value);
    console.log("Raw input element:", date);
    if (typeof Android !== "undefined") {
        console.log("Android bridge exists");
        Android.scheduleNotification(title.value, date.value);
    } else {
        console.log("Android bridge NOT found");
    }
    console.log(typeof Android);
    console.log('DOM ready, initializing app');
    removeOldDoneTasks();
    render();
  });
} else {
  console.log('DOM already ready, initializing app');
  removeOldDoneTasks();
  render();
}

setInterval(removeOldDoneTasks, 5 * 60 * 1000);
