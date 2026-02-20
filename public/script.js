// Konstanter
const DEBUG = false; // sätt true för alerts i APK vid behov
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

function debugAlert(msg) {
  if (DEBUG) alert(msg);
  console.log(msg);
}

// Rendera tasks (DOM-baserad för bättre WebView-kompatibilitet)
function render() {
  if (!list) { debugAlert('render(): #list saknas i DOM'); return; }
  debugAlert('render() called — tasks.length=' + tasks.length);

  // Rensa listan
  while (list.firstChild) list.removeChild(list.firstChild);

  tasks.sort((a, b) => {
    if(a.done && !b.done) return 1;
    if(!a.done && b.done) return -1;
    if(!a.date && !b.date) return 0;
    if(!a.date) return 1;
    if(!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });

  tasks.forEach(t => {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task' + (t.done ? ' done' : '');
    taskDiv.id = t.id;

    const titleP = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = t.title;
    titleP.appendChild(strong);
    taskDiv.appendChild(titleP);

    const dateP = document.createElement('p');
    dateP.textContent = t.date || '';
    taskDiv.appendChild(dateP);

    const descP = document.createElement('p');
    descP.textContent = t.desc || '';
    taskDiv.appendChild(descP);

    const editBtn = document.createElement('button');
    editBtn.className = 'btn';
    editBtn.type = 'button';
    editBtn.textContent = 'Ändra';
    editBtn.addEventListener('click', () => editTask(t.id));
    taskDiv.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'btn';
    delBtn.type = 'button';
    delBtn.textContent = 'Ta bort';
    delBtn.addEventListener('click', () => delTask(t.id));
    taskDiv.appendChild(delBtn);

    const doneBtn = document.createElement('button');
    doneBtn.className = 'btn';
    doneBtn.type = 'button';
    doneBtn.textContent = 'Klart';
    doneBtn.addEventListener('click', () => toggleDone(t.id));
    taskDiv.appendChild(doneBtn);

    list.appendChild(taskDiv);
  });

  // Sanity check
  const children = list.children.length;
  if (tasks.length > 0 && children !== tasks.length) {
    debugAlert('Debug: tasks saved but not rendered. tasks.length=' + tasks.length + ', DOM children=' + children);
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
    debugAlert('Uppgift sparad — totalt: ' + tasks.length + ' items');
  } catch (err) {
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

// Koppla knappar (export för konsol/test)
window.editTask = editTask;
window.delTask = delTask;

removeOldDoneTasks();
render();
setInterval(removeOldDoneTasks, 5 * 60 * 1000);
