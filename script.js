// Adjust the time schedule dynamically
function adjustSchedule() {
  const today = new Date();
  const isLastTwoWeeks = today.getDate() > 14;
  const isWednesday = today.getDay() === 3; // Wednesday

  const task3Label = document.getElementById("task3Label");
  const task4Label = document.getElementById("task4Label");

  if (isLastTwoWeeks && isWednesday) {
    document.getElementById("info").textContent = "Adjusted schedule for Wednesday in the last two weeks of the month.";
    task3Label.textContent = "Task 3 (1:05 PM - 2:10 PM):";
    task4Label.textContent = "Task 4 (2:15 PM - 3:15 PM):";
  } else {
    task3Label.textContent = "Task 3 (12:40 PM - 1:55 PM):";
    task4Label.textContent = "Task 4 (3:15 PM - 4:30 PM):";
  }
}

// Save routine to localStorage
document.getElementById("taskForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const task1 = document.getElementById("task1").value;
  const task2 = document.getElementById("task2").value;
  const task3 = document.getElementById("task3").value;
  const task4 = document.getElementById("task4").value;

  const routine = { task1, task2, task3, task4 };
  localStorage.setItem("routine", JSON.stringify(routine));
  document.getElementById("info").textContent = "Routine saved successfully!";
});

// Load routine on page load
document.addEventListener("DOMContentLoaded", () => {
  adjustSchedule();

  const routine = JSON.parse(localStorage.getItem("routine"));
  if (routine) {
    document.getElementById("task1").value = routine.task1;
    document.getElementById("task2").value = routine.task2;
    document.getElementById("task3").value = routine.task3;
    document.getElementById("task4").value = routine.task4;
  }
});
