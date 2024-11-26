document.addEventListener("DOMContentLoaded", () => {
  displayDates();
  loadTimetable();

  // Settings button
  const settingsBtn = document.getElementById("settings-btn");
  const settingsPopup = document.getElementById("settings-popup");
  const closeBtn = document.querySelector(".close-btn");
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const saveSettingsBtn = document.getElementById("save-settings-btn");

  settingsBtn.addEventListener("click", () => {
    settingsPopup.style.display = "block";
  });

  closeBtn.addEventListener("click", () => {
    settingsPopup.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === settingsPopup) {
      settingsPopup.style.display = "none";
    }
  });

  darkModeToggle.addEventListener("change", () => {
    if (darkModeToggle.checked) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("darkMode", "enabled");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("darkMode", "disabled");
    }
  });

  saveSettingsBtn.addEventListener("click", () => {
    const period1 = document.getElementById("period1").value;
    const period2 = document.getElementById("period2").value;
    const period3 = document.getElementById("period3").value;
    const period4 = document.getElementById("period4").value;

    const timetable = {
      period1: period1,
      period2: period2,
      period3: period3,
      period4: period4,
    };

    localStorage.setItem("timetable", JSON.stringify(timetable));
    loadTimetable();
    settingsPopup.style.display = "none";
  });

  // Load settings
  if (localStorage.getItem("darkMode") === "enabled") {
    darkModeToggle.checked = true;
    document.body.classList.add("dark-mode");
  }
});

function formatDate(date) {
  let month = date.getMonth() + 1; // Months are 0-based
  let day = date.getDate();
  let year = date.getFullYear();
  return `${year}-${month < 10 ? "0" + month : month}-${
    day < 10 ? "0" + day : day
  }`;
}

function checkAndSetDate() {
  const currentDate = new Date();
  const storedDate = localStorage.getItem("storedDate");

  if (!storedDate) {
    const formattedDate = formatDate(currentDate);
    localStorage.setItem("storedDate", formattedDate);
    return formattedDate;
  }

  const storedDateObject = new Date(storedDate);
  if (currentDate > storedDateObject) {
    let nextDay = new Date(storedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    if (nextDay.getDate() === 1) {
      nextDay.setMonth(nextDay.getMonth() + 1);
    }

    localStorage.setItem("storedDate", formatDate(nextDay));
    return formatDate(nextDay);
  }

  return storedDate;
}

const today = checkAndSetDate();

function displayDates() {
  const todayDate = new Date(today);
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(todayDate.getDate() + 1);

  document.getElementById("today-date").textContent = `Today: ${formatDate(
    todayDate
  )}`;
  document.getElementById(
    "tomorrow-date"
  ).textContent = `Tomorrow: ${formatDate(tomorrowDate)}`;
}

function isOddDay(date) {
  return date.getDate() % 2 !== 0;
}

function loadTimetable() {
  const timetable = JSON.parse(localStorage.getItem("timetable"));

  if (timetable) {
    const timetableItems = document.getElementById("timetable-items");

    const todayDate = new Date(today);
    let period3 = timetable.period3;
    let period4 = timetable.period4;

    if (isOddDay(todayDate)) {
      [period3, period4] = [period4, period3];
    }

    timetableItems.innerHTML = `
      <div>Period 1: ${timetable.period1}</div>
      <div>Period 2: ${timetable.period2}</div>
      <div>Period 3: ${period3}</div>
      <div>Period 4: ${period4}</div>
    `;
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then(
      (registration) => {
        console.log(
          "ServiceWorker registration successful with scope: ",
          registration.scope
        );
      },
      (error) => {
        console.log("ServiceWorker registration failed: ", error);
      }
    );
  });
}
