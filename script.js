/* =========================================
   GLOBAL STATE
========================================= */

let allTasks = [];
let currentFilter = "all";


/* =========================================
   DOM
========================================= */

const themeToggle = document.getElementById("themeToggle");
const addTaskButton = document.getElementById("addTaskButton");
const searchInput = document.getElementById("searchInput");


/* =========================================
   DARK MODE
   PERMANENTLY SAVED
========================================= */

function loadTheme() {

    const savedTheme = localStorage.getItem("studentTaskTheme");

    if (savedTheme === "dark") {

        document.body.classList.add("dark-mode");

        themeToggle.textContent = "☀️";

    } else {

        document.body.classList.remove("dark-mode");

        themeToggle.textContent = "🌙";
    }
}


function toggleTheme() {

    const isDark =
        document.body.classList.toggle("dark-mode");

    localStorage.setItem(
        "studentTaskTheme",
        isDark ? "dark" : "light"
    );

    themeToggle.textContent =
        isDark ? "☀️" : "🌙";
}


themeToggle.addEventListener(
    "click",
    toggleTheme
);


/* =========================================
   LOAD TASKS
========================================= */

async function loadTasks() {

    try {

        const response =
            await fetch("/api/tasks");

        if (!response.ok) {
            throw new Error("Failed to load tasks");
        }

        allTasks =
            await response.json();

        updateStats(allTasks);

        renderTasks();

    } catch (error) {

        console.error(error);

        showError(
            "Unable to load tasks. Please restart Flask."
        );
    }
}


/* =========================================
   UPDATE STATS
========================================= */

function updateStats(tasks) {

    const total = tasks.length;

    const completed =
        tasks.filter(task => task.completed).length;

    const pending =
        total - completed;

    const progress =
        total === 0
            ? 0
            : Math.round((completed / total) * 100);


    document.getElementById(
        "totalTasks"
    ).textContent = total;


    document.getElementById(
        "pendingTasks"
    ).textContent = pending;


    document.getElementById(
        "completedTasks"
    ).textContent = completed;


    document.getElementById(
        "progressTasks"
    ).textContent = `${progress}%`;


    document.getElementById(
        "progressPercent"
    ).textContent = `${progress}%`;


    document.getElementById(
        "progressFill"
    ).style.width = `${progress}%`;


    document.getElementById(
        "progressText"
    ).textContent =
        total === 0
            ? "Start adding your tasks!"
            : progress === 100
                ? "🎉 All tasks completed!"
                : "Keep completing your tasks!";
}


/* =========================================
   RENDER TASKS
========================================= */

function renderTasks() {

    const taskList =
        document.getElementById("taskList");

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    let filteredTasks =
        [...allTasks];


    /* FILTER */

    if (currentFilter === "pending") {

        filteredTasks =
            filteredTasks.filter(
                task => !task.completed
            );

    }


    if (currentFilter === "completed") {

        filteredTasks =
            filteredTasks.filter(
                task => task.completed
            );

    }


    if (currentFilter === "high") {

        filteredTasks =
            filteredTasks.filter(
                task =>
                    task.priority.toLowerCase()
                    === "high"
            );

    }


    /* SEARCH */

    if (search !== "") {

        filteredTasks =
            filteredTasks.filter(task => {

                const text =
                    `${task.title}
                     ${task.subject}
                     ${task.priority}
                     ${task.dueDate}`
                    .toLowerCase();

                return text.includes(search);
            });
    }


    /* COUNT */

    document.getElementById(
        "taskCount"
    ).textContent =
        `${filteredTasks.length} ${
            filteredTasks.length === 1
                ? "task"
                : "tasks"
        }`;


    /* EMPTY */

    if (filteredTasks.length === 0) {

        taskList.innerHTML = `
            <div class="empty-state">
                <h3>📭 No tasks found</h3>
                <p>Try another filter or add a new task.</p>
            </div>
        `;

        return;
    }


    /* DISPLAY */

    taskList.innerHTML = "";

    filteredTasks.forEach(task => {

        const div =
            document.createElement("div");


        div.className = "task";


        if (task.completed) {
            div.classList.add("completed");
        }


        const priorityClass =
            task.priority.toLowerCase();


        div.innerHTML = `

            <div class="task-info">

                <h3>${escapeHTML(task.title)}</h3>

                <p>
                    📚 ${escapeHTML(task.subject)}
                </p>

                <p>
                    Priority:
                    <span class="priority ${priorityClass}">
                        ${escapeHTML(task.priority)}
                    </span>
                </p>

                ${
                    task.dueDate
                        ? `
                        <p>
                            📅 Due:
                            ${escapeHTML(task.dueDate)}
                        </p>
                        `
                        : ""
                }

            </div>


            <div class="task-actions">

                <button
                    class="complete-btn"
                    onclick="completeTask(${task.id})">

                    ${
                        task.completed
                            ? "↩ Undo"
                            : "✓ Complete"
                    }

                </button>


                <button
                    class="delete-btn"
                    onclick="deleteTask(${task.id})">

                    🗑 Delete

                </button>

            </div>
        `;


        taskList.appendChild(div);
    });
}


/* =========================================
   ADD TASK
========================================= */

async function addTask() {

    const title =
        document.getElementById(
            "taskInput"
        ).value.trim();


    const subject =
        document.getElementById(
            "subject"
        ).value;


    const priority =
        document.getElementById(
            "priority"
        ).value;


    const dueDate =
        document.getElementById(
            "dueDate"
        ).value;


    if (!title) {

        alert("Please enter a task.");

        document.getElementById(
            "taskInput"
        ).focus();

        return;
    }


    try {

        const response =
            await fetch(
                "/api/tasks",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        title,
                        subject,
                        priority,
                        dueDate
                    })
                }
            );


        if (!response.ok) {
            throw new Error(
                "Failed to add task"
            );
        }


        document.getElementById(
            "taskInput"
        ).value = "";


        document.getElementById(
            "dueDate"
        ).value = "";


        await loadTasks();


    } catch (error) {

        console.error(error);

        alert(
            "Error adding task."
        );
    }
}


addTaskButton.addEventListener(
    "click",
    addTask
);


/* ENTER KEY */

document.getElementById(
    "taskInput"
).addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {
            addTask();
        }

    }
);


/* =========================================
   DELETE TASK
========================================= */

async function deleteTask(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this task?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/tasks/${id}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {
            throw new Error(
                "Failed to delete task"
            );
        }


        await loadTasks();


    } catch (error) {

        console.error(error);

        alert(
            "Error deleting task."
        );
    }
}


/* =========================================
   COMPLETE TASK
========================================= */

async function completeTask(id) {

    try {

        const response =
            await fetch(
                `/api/tasks/${id}`,
                {
                    method: "PUT"
                }
            );


        if (!response.ok) {
            throw new Error(
                "Failed to update task"
            );
        }


        await loadTasks();


    } catch (error) {

        console.error(error);

        alert(
            "Error updating task."
        );
    }
}


/* =========================================
   SEARCH
========================================= */

searchInput.addEventListener(
    "input",
    renderTasks
);


/* =========================================
   FILTER BUTTONS
========================================= */

document.querySelectorAll(
    ".filter-btn"
).forEach(button => {

    button.addEventListener(
        "click",
        function() {

            document.querySelectorAll(
                ".filter-btn"
            ).forEach(btn => {

                btn.classList.remove(
                    "active"
                );

            });


            this.classList.add(
                "active"
            );


            currentFilter =
                this.dataset.filter;


            renderTasks();
        }
    );

});


/* =========================================
   HTML SAFETY
========================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================
   ERROR
========================================= */

function showError(message) {

    document.getElementById(
        "taskList"
    ).innerHTML = `
        <div class="empty-state">
            <h3>⚠️ Something went wrong</h3>
            <p>${message}</p>
        </div>
    `;
}


/* =========================================
   START APP
========================================= */

loadTheme();
loadTasks();