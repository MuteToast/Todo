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

// ✅ Be om tillstånd för notiser
if ("Notification" in window) {
  Notification.requestPermission().then(result => {
    console.log("Notification permission:", result);
  });
}

// ✅ Registrera service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('Service Worker registrerad'))
    .catch(err => console.error('SW fel:', err));
}

// Rendera tasks
function render() {
  list.innerHTML = '';

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

  // ✅ Skicka push om datum är idag och inte notifierad
  tasks.forEach(t => {
    if (t.date) {
      const taskDate = new Date(t.date);
      const today = new Date();
      if(taskDate.toDateString() === today.toDateString() && !t.notified) {
        t.notified = true;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        sendNotification(t);
      }
    }
  });
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

// ✅ Simpel push-funktion via servern
function sendNotification(task) {
  fetch('/send-notification', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ 
      title: `Påminnelse: ${task.title}`, 
      body: task.desc || '' 
    })
  });
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


// ✅ Prenumerera push
async function subscribeUser() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    const reg = await navigator.serviceWorker.register('/sw.js');

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'BGp8UXausFLBjlcTXHKUTbZ7lhOUX60fKxL1Mtybb3NQq3gyi5mvaLiYfC09aqSoRh80vfNTWyhaKcZYMNB_9EE'
      )
    });

    await fetch('/subscribe', {
      method: 'POST',
      body: JSON.stringify(sub),
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Användare prenumererad för push!');
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

subscribeUser();
