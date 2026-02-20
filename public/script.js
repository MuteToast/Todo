// Konstanter
const form = document.getElementById('form');
const openBtn = document.getElementById('openBtn');
const closeBtn = document.getElementById('closeBtn');
const saveBtn = document.getElementById('saveBtn');
const list = document.getElementById('list');
const title = document.getElementById('title');
const date  = document.getElementById('date');
const desc  = document.getElementById('desc');
const status = document.getElementById('status');

// tasks kommer nu från server
let tasks = [];
let current = {};



// Rendera tasks
function render() {
  list.innerHTML = '';
  if (status) status.textContent = '';

  tasks.sort((a, b) => {
    if(a.done && !b.done) return 1;
    if(!a.done && b.done) return -1;
    if(!a.date && !b.date) return 0;
    if(!a.date) return 1;
    if(!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });

  tasks.forEach(t => {
    list.innerHTML += `
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


}

// Markera/avmarkera task
async function toggleDone(id) {
  const i = tasks.findIndex(t => t.id === id);
  if (i === -1) return;
  tasks[i].done = !tasks[i].done;
  if (tasks[i].done) tasks[i].doneDate = new Date().toISOString();
  else delete tasks[i].doneDate;

  const res = await fetch(`/tasks/${id}`, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(tasks[i])
  });
  if (!res.ok) {
    const text = await res.text().catch(()=>'');
    if (status) status.textContent = `Kan inte uppdatera task: ${res.status} ${text}`;
    return;
  }
  tasks = await res.json();
  render();
}

// Spara/uppdatera task
async function save() {
  if(!title.value.trim()) { alert('Skriv en titel!'); return; }
  const obj = {
    id: current.id || `${title.value.toLowerCase().replace(/\s+/g,'-')}-${Date.now()}`,
    title: title.value,
    date: date.value,
    desc: desc.value.trim(),
    done: current.done || false,
    doneDate: current.doneDate
  };

  try {
    if (current.id) {
    // update
    const res = await fetch(`/tasks/${current.id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(obj)
    });
    if (!res.ok) {
      const text = await res.text().catch(()=>'');
      if (status) status.textContent = `Kan inte spara: ${res.status} ${text}`;
      return;
    }
    tasks = await res.json();
  } else {
    // create
    const res = await fetch('/tasks', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(obj)
    });
    if (!res.ok) {
      const text = await res.text().catch(()=>'');
      if (status) status.textContent = `Kan inte skapa task: ${res.status} ${text}`;
      return;
    }
    tasks = await res.json();
  }
  } catch (err) {
    if (status) status.textContent = 'Nätverksfel: ' + err.message;
    // fallback: save to localStorage so user doesn't lose data
    const fallback = JSON.parse(localStorage.getItem('tasks')||'[]');
    fallback.unshift(obj);
    localStorage.setItem('tasks', JSON.stringify(fallback));
    tasks = fallback;
  }

  reset();
  render();
}

// Ta bort task
async function delTask(id){
  try {
    const res = await fetch(`/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const text = await res.text().catch(()=>'');
      if (status) status.textContent = `Kan inte ta bort: ${res.status} ${text}`;
      return;
    }
    tasks = await res.json();
    render();
  } catch (err) {
    if (status) status.textContent = 'Nätverksfel vid borttagning: ' + err.message;
  }
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
  (async () => {
    const idsToRemove = [];
    tasks.forEach(t => {
      if (t.done && t.doneDate) {
        const doneDate = new Date(t.doneDate);
        if (doneDate.toDateString() !== today.toDateString()) {
          idsToRemove.push(t.id);
        }
      }
    });
    if (idsToRemove.length === 0) return;
    for (const id of idsToRemove) {
      await fetch(`/tasks/${id}`, { method: 'DELETE' });
    }
    const res = await fetch('/tasks');
    tasks = await res.json();
    render();
  })();
}



// Event listeners
openBtn.addEventListener('click', () => form.classList.remove('hide'));
closeBtn.addEventListener('click', () => reset());
form.addEventListener('submit', e => { 
  e.preventDefault(); 
  save(); 
});

// Koppla knappar
window.editTask = id => editTask(id);
window.delTask = id => delTask(id);

// ladda tasks från server
async function loadTasks(){
  const candidates = ['/tasks','/tasks.json','/api/tasks','/list','/data/tasks','/tasks/'];
  let loaded = false;
  for (const endpoint of candidates) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        // try next
        const txt = await res.text().catch(()=>'');
        if (status) status.textContent = `Försökte ${endpoint}: ${res.status} ${txt}`;
        continue;
      }

      const data = await res.json().catch(async () => {
        const txt = await res.text().catch(()=>'');
        throw new Error('Inte JSON: ' + txt);
      });

      // accept either an array or an object with `tasks` property
      if (Array.isArray(data)) {
        tasks = data;
      } else if (data && Array.isArray(data.tasks)) {
        tasks = data.tasks;
      } else {
        // unknown format, show it and continue
        if (status) status.textContent = `Okänt svar från ${endpoint}`;
        continue;
      }

      if (status) status.textContent = `Laddade tasks från ${endpoint}`;
      loaded = true;
      render();
      break;
    } catch (err) {
      console.warn('loadTasks try', endpoint, err);
      if (status) status.textContent = `Fel när ${endpoint}: ${err.message}`;
      // try next
    }
  }

  if (!loaded) {
    // fallback to localStorage
    tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    if (tasks.length === 0 && status) status.textContent = 'Ingen serverkontakt — laddade tom lokal lista.';
    render();
  }
}

loadTasks();
setInterval(removeOldDoneTasks, 5 * 60 * 1000);
