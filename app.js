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
  return [
    "2024-12-23", "2024-12-24", "2024-12-25", "2024-12-26", "2024-12-27",
    "2024-12-28", "2024-12-29", "2024-12-30", "2024-12-31", "2025-01-01",
    "2025-01-02", "2025-01-03", "2025-01-30", "2024-02-14", "2025-02-17",
    "2025-03-10", "2025-03-11", "2025-03-12", "2025-03-13", "2025-03-14",
    "2025-04-18", "2025-04-21", "2025-05-19", "2025-06-26", "2025-06-27"
  ];


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

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
}

function getDayType(date) {
  // Set the fixed start date to November 30, 2023
  const startDate = new Date('2023-11-30');
  const currentDate = new Date(date);
  
  // First check if it's a holiday
  if (isHoliday(formatDate(currentDate))) {
    return 'Holiday';
  }
  
  // Calculate days since start
  const timeDiff = currentDate.getTime() - startDate.getTime();
  const daysSinceStart = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  
  // Simple alternation between Day 1 and Day 2
  return (daysSinceStart % 2 === 0) ? 'Day 1' : 'Day 2';
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
        const clickedDate = new Date(date);
        clickedDate.setDate(clickedDate.getDate() + 1); // Add one day
        alert(`${formatMonthDay(clickedDate)} is a Holiday!`);
        document.getElementById("day-indicator").textContent = `${formatMonthDay(clickedDate)} is a Holiday!`;
      });
    }
  });
}

function isWeekendDate(date) {
  const weekends = [
    "2024-12-01", "2024-12-07", "2024-12-08", "2024-12-14", "2024-12-15", "2024-12-21", "2024-12-22", "2024-12-28", "2024-12-29",
    "2025-01-04", "2025-01-05", "2025-01-11", "2025-01-12", "2025-01-18", "2025-01-19", "2025-01-25", "2025-01-26",
    "2025-02-01", "2025-02-02", "2025-02-08", "2025-02-09", "2025-02-15", "2025-02-16", "2025-02-22", "2025-02-23",
    "2025-03-01", "2025-03-02", "2025-03-08", "2025-03-09", "2025-03-15", "2025-03-16", "2025-03-22", "2025-03-23", "2025-03-29", "2025-03-30",
    "2025-04-05", "2025-04-06", "2025-04-12", "2025-04-13", "2025-04-19", "2025-04-20", "2025-04-26", "2025-04-27",
    "2025-05-03", "2025-05-04", "2025-05-10", "2025-05-11", "2025-05-17", "2025-05-18", "2025-05-24", "2025-05-25", "2025-05-31",
    "2025-06-01", "2025-06-07", "2025-06-08", "2025-06-14", "2025-06-15", "2025-06-21", "2025-06-22", "2025-06-28", "2025-06-29"
  ];
  return weekends.includes(date);
}

function buildCalendarHTML(monthDays, month, year) {
  const firstDay = new Date(year, month, 1).getDay();
  const lastTwoWednesdays = findLastTwoWednesdays(monthDays, month, year);
  let calendarHTML = "<table><thead><tr><th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr></thead><tbody><tr>";

  for (let i = 0; i < firstDay; i++) {
    calendarHTML += "<td></td>";
  }

  for (let i = 1; i <= monthDays; i++) {
    const date = new Date(year, month, i);
    const formattedDate = formatDate(date);
    const isWeekend = isWeekendDate(formattedDate);
    const isHolidayDate = !isWeekend && isHoliday(formattedDate); // Check holiday only if not a weekend
    const dayType = isWeekend ? 'Weekend' : (isHolidayDate ? 'Holiday' : getDayType(formattedDate));
    const isLateStart = !isHolidayDate && !isWeekend && lastTwoWednesdays.includes(i);
    
    let cellClass = isWeekend ? "weekend" : (isHolidayDate ? "holiday" : (isLateStart ? "late-start" : dayType.toLowerCase().replace(' ', '')));

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
