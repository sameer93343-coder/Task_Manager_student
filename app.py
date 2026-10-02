from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)

FILE = "tasks.json"


# ==============================
# LOAD TASKS
# ==============================

def load_tasks():
    try:
        if not os.path.exists(FILE):
            return []

        with open(FILE, "r", encoding="utf-8") as file:
            return json.load(file)

    except (json.JSONDecodeError, FileNotFoundError):
        return []


# ==============================
# SAVE TASKS
# ==============================

def save_tasks(tasks):

    with open(FILE, "w", encoding="utf-8") as file:
        json.dump(
            tasks,
            file,
            indent=4,
            ensure_ascii=False
        )


# ==============================
# HOME
# ==============================

@app.route("/")
def home():

    return render_template("index.html")


# ==============================
# GET TASKS
# ==============================

@app.route("/api/tasks", methods=["GET"])
def get_tasks():

    return jsonify(load_tasks())


# ==============================
# ADD TASK
# ==============================

@app.route("/api/tasks", methods=["POST"])
def add_task():

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Invalid data"
        }), 400


    title = data.get("title", "").strip()

    if not title:

        return jsonify({
            "error": "Task title is required"
        }), 400


    tasks = load_tasks()


    # Generate unique ID
    if tasks:
        new_id = max(
            task.get("id", 0)
            for task in tasks
        ) + 1
    else:
        new_id = 1


    task = {

        "id": new_id,

        "title": title,

        "subject": data.get(
            "subject",
            "Other"
        ),

        "priority": data.get(
            "priority",
            "Low"
        ),

        "dueDate": data.get(
            "dueDate",
            ""
        ),

        "completed": False

    }


    tasks.append(task)

    save_tasks(tasks)


    return jsonify(task), 201


# ==============================
# DELETE TASK
# ==============================

@app.route(
    "/api/tasks/<int:task_id>",
    methods=["DELETE"]
)
def delete_task(task_id):

    tasks = load_tasks()


    updated_tasks = [
        task
        for task in tasks
        if task.get("id") != task_id
    ]


    save_tasks(updated_tasks)


    return jsonify({
        "message": "Task deleted"
    })


# ==============================
# COMPLETE / UNCOMPLETE
# ==============================

@app.route(
    "/api/tasks/<int:task_id>",
    methods=["PUT"]
)
def complete_task(task_id):

    tasks = load_tasks()


    for task in tasks:

        if task.get("id") == task_id:

            task["completed"] = not task.get(
                "completed",
                False
            )

            save_tasks(tasks)


            return jsonify({
                "message": "Task updated",
                "completed": task["completed"]
            })


    return jsonify({
        "error": "Task not found"
    }), 404


# ==============================
# RUN APP
# ==============================

if __name__ == "__main__":

    app.run(
        debug=True
    )