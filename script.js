var STORAGE_KEY = 'taskTracker.tasks';

var tasks = [];
var currentFilter = 'all';

// ids of tasks that should play an animation on the next render
var newTaskId = null;
var toggledTaskId = null;

var form = document.getElementById('addForm');
var input = document.getElementById('taskInput');
var errorMsg = document.getElementById('errorMsg');
var list = document.getElementById('taskList');
var emptyBox = document.getElementById('emptyMsg');
var emptyText = document.getElementById('emptyText');
var filterButtons = document.querySelectorAll('.filter-btn');

var trashIcon =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
  'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>';

// ---- localStorage ----

function loadTasks() {
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      var parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        tasks = parsed;
      }
    }
  } catch (e) {
    // bad data or storage blocked, start with an empty list
    tasks = [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.warn('Could not save tasks', e);
  }
}

// ---- actions ----

function addTask(text) {
  var task = {
    id: Date.now(),
    text: text,
    completed: false
  };
  tasks.push(task);
  newTaskId = task.id;
  saveTasks();
  render();
}

function toggleTask(id) {
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].id === id) {
      tasks[i].completed = !tasks[i].completed;
      break;
    }
  }
  toggledTaskId = id;
  saveTasks();
  render();
}

function deleteTask(id, li) {
  if (li.classList.contains('removing')) return;

  // let the slide-out animation finish before removing it for real
  li.classList.add('removing');
  setTimeout(function () {
    tasks = tasks.filter(function (t) {
      return t.id !== id;
    });
    saveTasks();
    render();
  }, 200);
}

function setFilter(filter) {
  currentFilter = filter;
  filterButtons.forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  render();
}

// ---- drawing the page ----

function updateCounts() {
  var done = tasks.filter(function (t) { return t.completed; }).length;
  var total = tasks.length;
  var pending = total - done;
  var percent = total ? Math.round((done / total) * 100) : 0;

  document.getElementById('totalCount').textContent = total;
  document.getElementById('completedCount').textContent = done;
  document.getElementById('pendingCount').textContent = pending;

  document.getElementById('countAll').textContent = total;
  document.getElementById('countPending').textContent = pending;
  document.getElementById('countCompleted').textContent = done;

  var label = 'Nothing to do yet';
  if (total > 0 && done === total) {
    label = 'All done. Nice work!';
  } else if (total > 0) {
    label = done + ' of ' + total + ' done';
  }

  var fill = document.getElementById('progressFill');
  document.getElementById('progressLabel').textContent = label;
  document.getElementById('progressPercent').textContent = percent + '%';
  fill.style.width = percent + '%';
  fill.classList.toggle('empty-bar', percent === 0);
  fill.classList.toggle('full-bar', percent === 100);
}

function getVisibleTasks() {
  if (currentFilter === 'pending') {
    return tasks.filter(function (t) { return !t.completed; });
  }
  if (currentFilter === 'completed') {
    return tasks.filter(function (t) { return t.completed; });
  }
  return tasks;
}

function createTaskItem(task) {
  var li = document.createElement('li');
  li.className = 'task';
  if (task.completed) li.classList.add('done');
  if (task.id === newTaskId) li.classList.add('new');
  if (task.id === toggledTaskId) li.classList.add('toggled');

  var checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.completed;
  checkbox.setAttribute('aria-label', 'Mark "' + task.text + '" as ' + (task.completed ? 'pending' : 'completed'));
  checkbox.addEventListener('change', function () {
    toggleTask(task.id);
  });

  var text = document.createElement('span');
  text.className = 'task-text';
  text.textContent = task.text;

  var badge = document.createElement('span');
  badge.className = 'badge ' + (task.completed ? 'completed' : 'pending');
  badge.textContent = task.completed ? 'Completed' : 'Pending';

  var del = document.createElement('button');
  del.type = 'button';
  del.className = 'delete-btn';
  del.innerHTML = trashIcon;
  del.setAttribute('aria-label', 'Delete "' + task.text + '"');
  del.addEventListener('click', function () {
    deleteTask(task.id, li);
  });

  li.appendChild(checkbox);
  li.appendChild(text);
  li.appendChild(badge);
  li.appendChild(del);
  return li;
}

function render() {
  updateCounts();

  var visible = getVisibleTasks();
  list.innerHTML = '';

  visible.forEach(function (task) {
    list.appendChild(createTaskItem(task));
  });

  // animations only play once
  newTaskId = null;
  toggledTaskId = null;

  if (visible.length === 0) {
    if (tasks.length === 0) {
      emptyText.textContent = 'No tasks yet. Add your first one above.';
    } else if (currentFilter === 'pending') {
      emptyText.textContent = 'Nothing pending. You are all caught up.';
    } else {
      emptyText.textContent = 'No completed tasks yet.';
    }
    emptyBox.hidden = false;
    list.hidden = true;
  } else {
    emptyBox.hidden = true;
    list.hidden = false;
  }
}

// ---- events ----

form.addEventListener('submit', function (e) {
  e.preventDefault();

  var text = input.value.trim();

  if (text === '') {
    errorMsg.textContent = 'Type a task first, then press Add task.';
    input.classList.add('invalid');
    input.focus();
    return;
  }

  errorMsg.textContent = '';
  input.classList.remove('invalid');
  addTask(text);
  input.value = '';
  input.focus();
});

// clear the error as soon as they start typing again
input.addEventListener('input', function () {
  if (errorMsg.textContent) {
    errorMsg.textContent = '';
    input.classList.remove('invalid');
  }
});

filterButtons.forEach(function (btn) {
  btn.addEventListener('click', function () {
    setFilter(btn.dataset.filter);
  });
});

// ---- start ----
document.getElementById('todayDate').textContent = new Date().toLocaleDateString(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
});

loadTasks();
render();
