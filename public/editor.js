const titleInput = document.getElementById('note-title');
const contentInput = document.getElementById('note-content');
const mediaPreview = document.getElementById('media-preview');
const saveBtn = document.getElementById('save-note');
const deleteBtn = document.getElementById('delete-note');
const pinBtn = document.getElementById('pin-note');
const notesList = document.getElementById('notes-list');
const createBtn = document.getElementById('create-note-btn');

let notes = [];
let selectedNoteId = null;
let currentMediaBase64 = '';

const userEmail = localStorage.getItem("loggedInUser");

if (!userEmail) {
  alert("You must be signed in to view notes.");
  window.location.href = "signin.html";
}

async function loadNotes() {
  try {
    const res = await fetch(`/api/notes?email=${encodeURIComponent(userEmail)}`);
    notes = await res.json();
    renderNotes();
  } catch (err) {
    console.error("Error fetching notes:", err);
    alert("Failed to load notes.");
  }
}

async function saveNoteToServer(note) {
  const res = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'Failed to save note.');
}

function renderNotes() {
  notesList.innerHTML = '';
  const sorted = [...notes].sort((a, b) => b.pinned - a.pinned);
  sorted.forEach(note => {
    const li = document.createElement('li');
    li.className = 'note-item';
    li.innerHTML = `
      <strong>${note.title || 'Untitled'}</strong>
      <br><small>${new Date(note.timestamp).toLocaleString()}</small>
      <span class="pin">${note.pinned ? '📌' : ''}</span>
    `;
    li.onclick = () => selectNote(note.id);
    notesList.appendChild(li);
  });
}

function clearEditor() {
  titleInput.value = '';
  contentInput.value = '';
  mediaPreview.innerHTML = '';
  currentMediaBase64 = '';
  selectedNoteId = null;
}

function selectNote(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;

  selectedNoteId = id;
  titleInput.value = note.title;
  contentInput.value = note.content;
  currentMediaBase64 = note.media || '';

  if (currentMediaBase64.startsWith('data:image/')) {
    mediaPreview.innerHTML = `<img src="${currentMediaBase64}" width="100%" alt="Preview" />`;
  } else if (currentMediaBase64.startsWith('data:video/')) {
    mediaPreview.innerHTML = `<video src="${currentMediaBase64}" controls width="100%"></video>`;
  } else {
    mediaPreview.innerHTML = '';
  }
}

saveBtn.onclick = async () => {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const media = currentMediaBase64;

  if (!title && !content && !media) {
    return alert("Note is empty!");
  }

  const note = {
    id: selectedNoteId || Date.now(),
    title,
    content,
    media,
    pinned: selectedNoteId ? notes.find(n => n.id === selectedNoteId).pinned : false,
    timestamp: Date.now(),
    email: userEmail,
  };

  if (selectedNoteId) {
    notes = notes.map(n => n.id === selectedNoteId ? note : n);
  } else {
    notes.push(note);
  }

  await saveNoteToServer(note);
  renderNotes();
  clearEditor();
  alert('Note saved!');
};

deleteBtn.onclick = async () => {
  if (!selectedNoteId) return alert('No note selected');
  notes = notes.filter(n => n.id !== selectedNoteId);

  await fetch('/api/notes/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: selectedNoteId, email: userEmail }),
  });

  renderNotes();
  clearEditor();
  alert('Note deleted!');
};

pinBtn.onclick = async () => {
  if (!selectedNoteId) return alert('No note selected');
  const note = notes.find(n => n.id === selectedNoteId);
  note.pinned = !note.pinned;
  note.timestamp = Date.now();

  await saveNoteToServer(note);
  renderNotes();
};

createBtn.onclick = () => clearEditor();

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("loggedInUser");
    window.location.href = "signin.html";
  }
}
window.logout = logout;

loadNotes();