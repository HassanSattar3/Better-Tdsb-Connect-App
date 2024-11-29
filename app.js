document.addEventListener("DOMContentLoaded", () => {
  // Ensure only the timetable section is visible on page load
  document.querySelector('#timetable').style.display = 'flex';
  document.querySelector('#settings').style.display = 'none';

  // Navigation Links
  const navLinks = document.querySelectorAll(".navbar a");
  navLinks.forEach(link => {
    link.addEventListener("click", function () {
      const target = document.querySelector(this.getAttribute("href"));
      document.querySelectorAll(".section").forEach(section => section.style.display = "none");
      target.style.display = "flex";
    });
  });

  const today = new Date();
  const formattedToday = formatDate(today);
  const isLateStart = checkIfLateStart(today);
  loadTimetableForToday(formattedToday, isLateStart);
  generateCalendar();

  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const saveSettingsBtn = document.getElementById("save-settings-btn");

  darkModeToggle.addEventListener("change", () => {
    if (darkModeToggle.checked) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("darkMode", "enabled");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("darkMode", "disabled");
    }
    generateCalendar(); // Regenerate the calendar to apply the correct styles
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
    loadTimetableForToday(formattedToday, isLateStart); // Reload timetable for today
    alert("Settings saved successfully!"); // Show a success message
  });

  if (localStorage.getItem("darkMode") === "enabled") {
    darkModeToggle.checked = true;
    document.body.classList.add("dark-mode");
  }
});

function formatDate(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
}

function formatMonthDay(date) {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const month = date.getMonth();
  const day = date.getDate();
  return day === 1 ? `${monthNames[month]}` : `${monthNames[month]} ${day}`;
}

function getHolidays() {
  return ["2024-11-29"]; // Add holidays here (e.g., "2024-11-29" for November 29th, 2024)
}

function isHoliday(date) {
  const holidays = getHolidays();
  return holidays.includes(date);
}

function handleHolidays(date) {
  let currentDate = new Date(date);
  while (isHoliday(formatDate(currentDate))) {
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return formatDate(currentDate);
}

function getDayType(date) {
  if (isHoliday(date)) {
    return 'Holiday';
  }

  const startDate = new Date(localStorage.getItem("startDate"));
  const currentDate = new Date(date);
  const diffTime = Math.abs(currentDate - startDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays % 2 === 0 ? 'Day 1' : 'Day 2';
}

function displayDayType(date, isToday = true, isLateStart = false) {
  const dayType = isHoliday(date) ? 'Holiday' : getDayType(date);
  const displayDate = new Date(date);
  displayDate.setDate(displayDate.getDate() + 1); // Add one day
  const formattedDisplayDate = formatMonthDay(displayDate);
  const lateStartText = isLateStart ? " (Late Start)" : "";

  if (isToday) {
    document.getElementById("day-indicator").textContent = `Today is ${dayType}${lateStartText}`;
  } else {
    document.getElementById("day-indicator").textContent = `${formattedDisplayDate} is ${dayType}${lateStartText}`;
  }
}


function loadTimetable(date, isLateStart) {
  const timetable = JSON.parse(localStorage.getItem("timetable"));

  if (timetable) {
    const timetableItems = document.getElementById("timetable-items");

    const dayType = getDayType(date);
    let period3 = timetable.period3;
    let period4 = timetable.period4;

    if (dayType === 'Day 2') {
      [period3, period4] = [period4, period3];
    }

    timetableItems.innerHTML = `
      <div>Period 1: ${timetable.period1}</div>
      <div>Period 2: ${timetable.period2}</div>
      <div>Period 3: ${period3}</div>
      <div>Period 4: ${period4}</div>
    `;

    console.log(`Timetable for ${date}: Period 1 - ${timetable.period1}, Period 2 - ${timetable.period2}, Period 3 - ${period3}, Period 4 - ${period4}`);
  }
}

function generateCalendar() {
  const calendarDiv = document.getElementById("calendar-content");
  const currentDate = new Date();
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const monthDays = new Date(year, month + 1, 0).getDate();
  let calendarHTML = buildCalendarHTML(monthDays, month, year);

  calendarDiv.innerHTML = calendarHTML;

  document.querySelectorAll(".calendar-container td").forEach(day => {
    const date = day.getAttribute("data-date");
    const isHolidayDate = isHoliday(date);
    if (!isHolidayDate) {
      day.addEventListener("click", () => {
        const isLateStart = day.getAttribute("data-late-start") === "true";
        displayTimetableForDate(date, isLateStart);
      });
    } else {
      day.addEventListener("click", () => {
        alert(`${formatMonthDay(new Date(date))} is a Holiday!`);
        document.getElementById("day-indicator").textContent = `${formatMonthDay(new Date(date))} is a Holiday!`;
      });
    }
  });
}

function buildCalendarHTML(monthDays, month, year) {
  const firstDay = new Date(year, month, 1).getDay();
  const lastTwoWednesdays = findLastTwoWednesdays(monthDays, month, year);
  let calendarHTML = "<table><thead><tr><th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri></th><th>Sat</th></tr></thead><tbody><tr>";

  for (let i = 0; i < firstDay; i++) {
    calendarHTML += "<td></td>";
  }

  for (let i = 1; i <= monthDays; i++) {
    const date = new Date(year, month, i);
    const formattedDate = formatDate(date);
    const isHolidayDate = isHoliday(formattedDate);
    const dayType = isHolidayDate ? 'Holiday' : getDayType(formattedDate);
    const isLateStart = lastTwoWednesdays.includes(i);
    const cellClass = isHolidayDate ? "holiday" : isLateStart ? "neon-purple" : dayType.toLowerCase().replace(' ', '');

    calendarHTML += `<td class="${cellClass}" data-date="${formattedDate}" data-late-start="${isLateStart}">${i}<br>(${dayType})</td>`;
    if ((i + firstDay) % 7 === 0) {
      calendarHTML += "</tr><tr>";
    }
  }
  calendarHTML += "</tr></tbody></table>";
  return calendarHTML;
}

function findLastTwoWednesdays(monthDays, month, year) {
  const lastTwoWednesdays = [];
  for (let i = monthDays; i > 0; i--) {
    const date = new Date(year, month, i);
    if (date.getDay() === 3) { // Wednesday
      lastTwoWednesdays.push(i);
      if (lastTwoWednesdays.length === 2) break;
    }
  }
  return lastTwoWednesdays;
}

function loadTimetableForToday(date, isLateStart) {
  displayDayType(date, true, isLateStart);
  loadTimetable(date);
}

function checkIfLateStart(date) {
  const currentDate = new Date(date);
  const monthDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const lastTwoWednesdays = findLastTwoWednesdays(monthDays, currentDate.getMonth(), currentDate.getFullYear());
  return lastTwoWednesdays.includes(currentDate.getDate());
}

function displayTimetableForDate(date, isLateStart) {
  const isToday = false; // Since we're dealing with a clicked date, it's not "today"
  if (isHoliday(date)) {
    const displayDate = new Date(date);
    displayDate.setDate(displayDate.getDate() + 1); // Add one day
    document.getElementById("day-indicator").textContent = `${formatMonthDay(displayDate)} is a Holiday!`;
  } else {
    displayDayType(date, isToday, isLateStart);
    loadTimetable(date);
  }

}
