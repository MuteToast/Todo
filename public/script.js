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
    reset();
    render();
    // Debugging feedback for APK/webview: alert success and show count
    alert('Uppgift sparad — totalt: ' + tasks.length + ' items');
  } catch (err) {
    // Provide immediate feedback when something goes wrong in the APK
    alert('Fel vid sparande: ' + (err.message || err));
    console.error('Save error', err);
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

removeOldDoneTasks();
render();
setInterval(removeOldDoneTasks, 5 * 60 * 1000);
