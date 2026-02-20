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
<<<<<<< HEAD
  list.innerHTML = '';
  if (status) status.textContent = '';
=======
  try {
    list.innerHTML = '';

    // Ensure a visible debug bar exists so APK users can see task data
    let debugBar = document.getElementById('debugBar');
    if (!debugBar) {
      debugBar = document.createElement('div');
      debugBar.id = 'debugBar';
      debugBar.style.background = '#fffae6';
      debugBar.style.border = '1px solid #ffd966';
      debugBar.style.padding = '8px';
      debugBar.style.marginBottom = '8px';
      debugBar.style.fontSize = '0.9rem';
      debugBar.style.color = '#333';
      list.parentNode.insertBefore(debugBar, list);
    }
    // Debug: log tasks length on render (useful inside APK)
    console.log('render() called — tasks.length =', tasks.length);
  } catch (err) {
    alert('Fel i render(): ' + (err.message || err));
    console.error('Render error', err);
    return;
  }
>>>>>>> parent of b069725 (Test 57)

  tasks.sort((a, b) => {
    if(a.done && !b.done) return 1;
    if(!a.done && b.done) return -1;
    if(!a.date && !b.date) return 0;
    if(!a.date) return 1;
    if(!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });

  // Use DOM methods instead of innerHTML concatenation (better compatibility in WebViews)
  tasks.forEach(t => {
    const taskEl = document.createElement('div');
    taskEl.className = 'task' + (t.done ? ' done' : '');
    taskEl.id = t.id;
    // Inline styles to ensure visibility inside various WebViews
    taskEl.style.display = 'block';
    taskEl.style.width = '100%';
    taskEl.style.background = '#fffbe6';
    taskEl.style.borderLeft = '5px solid #25a55f';
    taskEl.style.padding = '12px';
    taskEl.style.borderRadius = '6px';
    taskEl.style.fontSize = '1.1rem';
    taskEl.style.color = '#000';
    taskEl.style.boxSizing = 'border-box';

    const titleP = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = t.title || '';
    titleP.appendChild(strong);

    const dateP = document.createElement('p');
    dateP.textContent = t.date || '';

    const descP = document.createElement('p');
    descP.textContent = t.desc || '';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn';
    editBtn.textContent = 'Ändra';
    editBtn.addEventListener('click', () => editTask(t.id));

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn';
    delBtn.textContent = 'Ta bort';
    delBtn.addEventListener('click', () => delTask(t.id));

    const doneBtn = document.createElement('button');
    doneBtn.type = 'button';
    doneBtn.className = 'btn';
    doneBtn.textContent = 'Klart';
    doneBtn.addEventListener('click', () => toggleDone(t.id));

    taskEl.appendChild(titleP);
    taskEl.appendChild(dateP);
    taskEl.appendChild(descP);
    taskEl.appendChild(editBtn);
    taskEl.appendChild(delBtn);
    taskEl.appendChild(doneBtn);

    list.appendChild(taskEl);
    // If this is the newly added item, visually highlight it briefly
    try {
      if (window.__lastAddedId && t.id === window.__lastAddedId) {
        taskEl.style.outline = '3px solid #ffd966';
        taskEl.style.transition = 'outline 0.3s ease-in-out';
        setTimeout(() => {
          taskEl.style.outline = '';
          try { delete window.__lastAddedId; } catch(e) { window.__lastAddedId = null; }
        }, 3000);
      }
    } catch (e) {
      console.error('Highlight new item failed', e);
    }
  });
  // Debug check: verify DOM children match tasks length
  try {
    const children = list.children.length;
    console.log('render() — DOM children:', children);
    // Update debug bar with tasks info (visible in APK)
    try {
      const debugBar = document.getElementById('debugBar');
      if (debugBar) {
        debugBar.textContent = 'tasks.length=' + tasks.length + ' | DOM children=' + children + ' | titles: ' + tasks.map(t => t.title).join(', ');
      }
    } catch (e) {
      console.error('Could not update debugBar', e);
    }
    if (tasks.length > 0 && children !== tasks.length) {
      alert('Debug: tasks saved but not rendered. tasks.length=' + tasks.length + ', DOM children=' + children);
    }
  } catch (err) {
    console.error('Post-render check error', err);
  }

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
<<<<<<< HEAD
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
=======
function save() {
  try {
    if(!title.value || !title.value.trim()) { alert('Skriv en titel!'); return; }
    const obj = {
      id: `${title.value.toLowerCase().replace(/\s+/g,'-')}-${Date.now()}`,
      title: title.value,
      date: date.value,
      desc: desc.value ? desc.value.trim() : '',
      done: false
    };
    const i = tasks.findIndex(x => x.id === current.id);
    if(i === -1) tasks.unshift(obj);
    else tasks[i] = obj;
    localStorage.setItem('tasks', JSON.stringify(tasks));
    // remember id of new/updated item so we can scroll to it after render
    const newId = obj.id;
    // expose to render() so it can highlight the new element if needed
    try { window.__lastAddedId = newId; } catch(e) { /* ignore */ }
    reset();
    render();
    // Ensure the newly added task is visible in the WebView
    try {
      const el = document.getElementById(newId);
      if (el && el.scrollIntoView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (list && list.lastElementChild) {
        // fallback: scroll list to bottom
        list.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    } catch (e) {
      console.error('Scroll to new item failed', e);
    }
    // Debugging feedback for APK/webview: alert success and show count
    alert('Uppgift sparad — totalt: ' + tasks.length + ' items');
  } catch (err) {
    // Provide immediate feedback when something goes wrong in the APK
    alert('Fel vid sparande: ' + (err.message || err));
    console.error('Save error', err);
  }
>>>>>>> parent of b069725 (Test 57)
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
