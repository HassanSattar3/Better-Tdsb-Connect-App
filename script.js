// Generate daily tasks for Task 3 and Task 4
function getDailyTasks() {
  const dailyTasks = {
    monday: ["Task 3A", "Task 4A"],
    tuesday: ["Task 3B", "Task 4B"],
    wednesday: ["Task 3C", "Task 4C"],
    thursday: ["Task 3D", "Task 4D"],
    friday: ["Task 3E", "Task 4E"],
    weekend: ["Relax", "Enjoy"]
  };

  const today = new Date();
  const day = today.getDay();

  return day === 0 || day === 6
    ? dailyTasks.weekend
    : dailyTasks[Object.keys(dailyTasks)[day - 1]];
}

// Update Task 3 and Task 4
function updateDailyTasks() {
  const [task3, task4] = getDailyTasks();
  document.getElementById("task3").value = task3;
  document.getElementById("task4").value = task4;
}

// Save Routine
document.getElementById("taskForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const task1 = document.getElementById("task1").value;
  const task2 = document.getElementById("task2").value;

  const savedRoutine = {
    task1,
    task2,
    task3: document.getElementById("task3").value,
    task4: document.getElementById("task4").value,
  };

  localStorage.setItem("routine", JSON.stringify(savedRoutine));
  document.getElementById("info").textContent = "Routine Saved!";
});

// Load Routine on App Start
document.addEventListener("DOMContentLoaded", () => {
  updateDailyTasks();
  const savedRoutine = JSON.parse(localStorage.getItem("routine"));
  if (savedRoutine) {
    document.getElementById("task1").value = savedRoutine.task1;
    document.getElementById("task2").value = savedRoutine.task2;
  }
});
