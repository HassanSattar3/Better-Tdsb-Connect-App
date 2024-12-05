if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Check if it's the first time loading the app
  if (!localStorage.getItem('hasVisitedBefore')) {
    showFirstTimeSetup();
  }
  
  // Hide all sections first
  document.querySelectorAll('.section').forEach(section => {
    section.style.display = 'none';
    section.classList.remove('active');
  });
  
  // Show timetable section
  const timetableSection = document.querySelector('#timetable');
  timetableSection.style.display = 'flex';
  timetableSection.classList.add('active');
  
  // Navigation Links
  const navLinks = document.querySelectorAll(".navbar a");
  navLinks.forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      
      // Remove active class from all sections and links
      document.querySelectorAll(".section").forEach(section => {
        section.style.display = "none";
        section.classList.remove("active");
      });
      navLinks.forEach(navLink => navLink.classList.remove("active"));
      
      // Add active class to clicked link and target section
      this.classList.add("active");
      target.style.display = "flex";
      target.classList.add("active");
      
      // Update URL hash without scrolling
      history.pushState(null, null, this.getAttribute("href"));
    });
  });

  const today = new Date();
  const formattedToday = formatDate(today);
  const isLateStart = checkIfLateStart(today);
  loadTimetableForToday(formattedToday, isLateStart);
  generateCalendar();

  const darkModeToggle = document.getElementById("dark-mode-toggle");

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

  // Add auto-save functionality to period inputs
  const periodInputs = ['period1', 'period2', 'period3', 'period4'];
  periodInputs.forEach(periodId => {
    const input = document.getElementById(periodId);
    if (input) {
      input.addEventListener('blur', () => {
        const timetable = {
          period1: document.getElementById('period1').value,
          period2: document.getElementById('period2').value,
          period3: document.getElementById('period3').value,
          period4: document.getElementById('period4').value,
        };
        localStorage.setItem("timetable", JSON.stringify(timetable));
        loadTimetableForToday(formattedToday, isLateStart); // Reload timetable for today
      });
    }
  });

  if (localStorage.getItem("darkMode") === "enabled") {
    darkModeToggle.checked = true;
    document.body.classList.add("dark-mode");
  }

  // Set initial active state based on URL hash or default to timetable
  const setInitialActiveState = () => {
    const hash = window.location.hash || "#timetable";
    const activeLink = document.querySelector(`.navbar a[href="${hash}"]`);
    if (activeLink) {
      activeLink.classList.add("active");
      const target = document.querySelector(hash);
      if (target) {
        target.style.display = "flex";
        target.classList.add("active");
      }
    }
  };
  setInitialActiveState();

  // Add click handlers for period items
  const periodItems = document.querySelectorAll('.period-item');
  periodItems.forEach(item => {
    item.addEventListener('click', () => {
      // Add the clicked class for animation
      item.classList.add('clicked');
      
      // Remove the clicked class after animation completes
      setTimeout(() => {
        item.classList.remove('clicked');
      }, 400);

      // Show the notification
      showNotification('You can edit periods in Settings! 👉');
    });
  });

  // Todo functionality
  initializeTodos();
});

function formatDate(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
}

function formatMonthDay(date) {
  const shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = date.getMonth();
  const day = date.getDate();
  
  // Add ordinal suffix to day (1st, 2nd, 3rd, etc.)
  const ordinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  return `${shortMonthNames[month]} ${day}${ordinalSuffix(day)}`;
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
  const dayIndicator = document.getElementById("day-indicator");
  const dayType = isHoliday(date) ? 'Holiday' : getDayType(date);
  const displayDate = new Date(date);
  displayDate.setDate(displayDate.getDate() + 1);
  const formattedDisplayDate = formatMonthDay(displayDate);
  const lateStartText = isLateStart ? " (Late Start)" : "";

  // Set initial content
  if (isToday) {
    dayIndicator.textContent = `Today - ${dayType}${lateStartText}`;
  } else {
    dayIndicator.textContent = `${formattedDisplayDate} - ${dayType}${lateStartText}`;
  }

  // Trigger fade animation
  dayIndicator.style.opacity = '0';
  dayIndicator.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
  
  // Force reflow
  void dayIndicator.offsetWidth;
  
  // Fade in
  dayIndicator.style.opacity = '1';
}

function loadTimetable(date) {
  const timetable = JSON.parse(localStorage.getItem('timetable')) || {};
  const dayType = getDayType(date);
  const timetableItems = document.getElementById('timetable-items');
  
  // Fade out
  timetableItems.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
  timetableItems.style.opacity = '0';
  
  // Update content after fade out
  setTimeout(() => {
    document.querySelectorAll('.period-text').forEach((periodText, index) => {
      const periodNumber = index + 1;
      let periodContent = timetable[`period${periodNumber}`] || '';
      
      if (dayType === 'Day 2' && (periodNumber === 3 || periodNumber === 4)) {
        const swappedNumber = periodNumber === 3 ? 4 : 3;
        periodContent = timetable[`period${swappedNumber}`] || '';
      }
      
      periodText.textContent = periodContent;
      
      // Trigger input event to resize after setting content
      const inputEvent = new Event('input', {
        bubbles: true,
        cancelable: true,
      });
      periodText.dispatchEvent(inputEvent);
    });
    
    // Fade in
    timetableItems.style.opacity = '1';
  }, 400);
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
  const isMobile = window.innerWidth <= 480;
  
  let calendarHTML = "<table><thead><tr>";
  
  // Shorter day names for mobile
  const dayNames = isMobile ? 
    ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] : 
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
  dayNames.forEach(day => {
    calendarHTML += `<th>${day}</th>`;
  });
  
  calendarHTML += "</tr></thead><tbody><tr>";

  for (let i = 0; i < firstDay; i++) {
    calendarHTML += "<td></td>";
  }

  for (let i = 1; i <= monthDays; i++) {
    const date = new Date(year, month, i);
    const formattedDate = formatDate(date);
    const isWeekend = isWeekendDate(formattedDate);
    const isHolidayDate = !isWeekend && isHoliday(formattedDate);
    const dayType = isWeekend ? 'Weekend' : (isHolidayDate ? 'Holiday' : getDayType(formattedDate));
    const isLateStart = !isHolidayDate && !isWeekend && lastTwoWednesdays.includes(i);
    
    let cellClass = isWeekend ? "weekend" : (isHolidayDate ? "holiday" : (isLateStart ? "late-start" : dayType.toLowerCase().replace(' ', '')));
    
    // Shorter day type labels for mobile
    let displayDayType = dayType;
    if (isMobile) {
      displayDayType = dayType.replace('Day ', 'D');
      if (displayDayType === 'Weekend') displayDayType = 'W';
      if (displayDayType === 'Holiday') displayDayType = 'H';
    }

    calendarHTML += `<td class="${cellClass}" data-date="${formattedDate}" data-late-start="${isLateStart}">
      ${i}<br><span class="day-type">${displayDayType}</span>
    </td>`;
    
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
  const dayIndicator = document.getElementById("day-indicator");
  dayIndicator.style.animation = 'fadeOut 0.3s forwards';
  
  setTimeout(() => {
    if (isHoliday(date)) {
      const displayDate = new Date(date);
      displayDate.setDate(displayDate.getDate() + 1);
      dayIndicator.textContent = `${formatMonthDay(displayDate)} is a Holiday!`;
    } else {
      displayDayType(date, false, isLateStart);
      loadTimetable(date);
    }
    dayIndicator.style.animation = 'fadeInUp 0.5s forwards';
  }, 300);
}

function smoothTransition(from, to) {
  from.style.animation = 'fadeOut 0.3s forwards';
  
  setTimeout(() => {
    from.style.display = 'none';
    to.style.display = 'flex';
    to.style.animation = 'fadeInUp 0.5s forwards';
  }, 300);
}

navLinks.forEach(link => {
  link.addEventListener("click", function(e) {
    e.preventDefault();
    const targetId = this.getAttribute("href").substring(1);
    const currentSection = document.querySelector('.section.active');
    const targetSection = document.getElementById(targetId);
    
    if (currentSection !== targetSection) {
      // Start fade out of current section
      currentSection.style.opacity = '0';
      
      setTimeout(() => {
        // Hide current section and show target
        currentSection.style.display = 'none';
        currentSection.classList.remove('active');
        
        targetSection.style.display = 'flex';
        // Force reflow
        void targetSection.offsetWidth;
        
        // Start fade in of target section
        targetSection.classList.add('active');
        targetSection.style.opacity = '1';
      }, 300);
    }
  });
});

function showFirstTimeSetup() {
  const popup = document.createElement('div');
  popup.innerHTML = `
    <div id="setup-overlay" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      padding: 16px;
    ">
      <div style="
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        padding: 24px 20px;
        border-radius: 20px;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        transform: scale(0.95);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        margin: auto;
        -webkit-tap-highlight-color: transparent;
      ">
        <h2 style="
          text-align: center;
          margin-top: 0;
          color: #1c1c1e;
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 20px;
          letter-spacing: -0.5px;
          padding: 0 10px;
        ">Write these class periods for Day 1!!!</h2>
        <div style="margin-bottom: 16px;">
          <label style="
            display: block;
            margin-bottom: 8px;
            color: #1c1c1e;
            font-weight: 500;
            font-size: 1rem;
            padding-left: 4px;
          ">Period 1:</label>
          <input type="text" id="setup-period1" placeholder="Enter Period 1" style="
            width: 100%;
            padding: 12px 16px;
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            font-size: 16px;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            transition: all 0.2s ease;
            margin-bottom: 0;
            -webkit-appearance: none;
            appearance: none;
          ">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="
            display: block;
            margin-bottom: 8px;
            color: #1c1c1e;
            font-weight: 500;
            font-size: 1rem;
            padding-left: 4px;
          ">Period 2:</label>
          <input type="text" id="setup-period2" placeholder="Enter Period 2" style="
            width: 100%;
            padding: 12px 16px;
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            font-size: 16px;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            transition: all 0.2s ease;
            margin-bottom: 0;
            -webkit-appearance: none;
            appearance: none;
          ">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="
            display: block;
            margin-bottom: 8px;
            color: #1c1c1e;
            font-weight: 500;
            font-size: 1rem;
            padding-left: 4px;
          ">Period 3:</label>
          <input type="text" id="setup-period3" placeholder="Enter Period 3" style="
            width: 100%;
            padding: 12px 16px;
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            font-size: 16px;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            transition: all 0.2s ease;
            margin-bottom: 0;
            -webkit-appearance: none;
            appearance: none;
          ">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="
            display: block;
            margin-bottom: 8px;
            color: #1c1c1e;
            font-weight: 500;
            font-size: 1rem;
            padding-left: 4px;
          ">Period 4:</label>
          <input type="text" id="setup-period4" placeholder="Enter Period 4" style="
            width: 100%;
            padding: 12px 16px;
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            font-size: 16px;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            transition: all 0.2s ease;
            margin-bottom: 0;
            -webkit-appearance: none;
            appearance: none;
          ">
        </div>
        <div style="
          text-align: center;
          color: #86868b;
          font-size: 0.9rem;
          margin-top: 16px;
          font-weight: 500;
          padding: 8px;
        ">Press Enter or click outside to save</div>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  // Prevent body scrolling when popup is open
  document.body.style.overflow = 'hidden';

  // Trigger entrance animation
  requestAnimationFrame(() => {
    const overlay = document.getElementById('setup-overlay');
    const dialog = overlay.querySelector('div');
    overlay.style.opacity = '1';
    dialog.style.transform = 'scale(1)';
    dialog.style.opacity = '1';
  });

  // Handle dark mode
  if (document.body.classList.contains('dark-mode')) {
    const setupDialog = popup.querySelector('div > div');
    setupDialog.style.background = 'rgba(28, 28, 30, 0.9)';
    setupDialog.querySelectorAll('h2, label').forEach(el => el.style.color = '#ffffff');
    setupDialog.querySelectorAll('input').forEach(input => {
      input.style.background = 'rgba(44, 44, 46, 0.8)';
      input.style.color = '#ffffff';
      input.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      
      // Add active state for touch devices
      input.addEventListener('touchstart', () => {
        input.style.transform = 'scale(0.98)';
      });
      
      input.addEventListener('touchend', () => {
        input.style.transform = 'scale(1)';
      });
      
      // Add focus styles
      input.addEventListener('focus', () => {
        input.style.borderColor = '#0A84FF';
        input.style.boxShadow = '0 0 0 3px rgba(10, 132, 255, 0.3)';
      });
      
      input.addEventListener('blur', () => {
        input.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        input.style.boxShadow = 'none';
      });
    });
    setupDialog.querySelector('div[style*="color: #86868b"]').style.color = '#98989d';
  } else {
    // Add focus styles for light mode
    popup.querySelectorAll('input').forEach(input => {
      // Add active state for touch devices
      input.addEventListener('touchstart', () => {
        input.style.transform = 'scale(0.98)';
      });
      
      input.addEventListener('touchend', () => {
        input.style.transform = 'scale(1)';
      });
      
      input.addEventListener('focus', () => {
        input.style.borderColor = '#007AFF';
        input.style.boxShadow = '0 0 0 3px rgba(0, 122, 255, 0.2)';
      });
      
      input.addEventListener('blur', () => {
        input.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        input.style.boxShadow = 'none';
      });
    });
  }

  let allFieldsFilled = false;
  const inputs = [
    document.getElementById('setup-period1'),
    document.getElementById('setup-period2'),
    document.getElementById('setup-period3'),
    document.getElementById('setup-period4')
  ];

  function checkAllFieldsAndSave() {
    const allFilled = inputs.every(input => input.value.trim() !== '');
    
    if (allFilled && !allFieldsFilled) {
      // Wait 2 seconds after the last input before closing
      setTimeout(() => {
        allFieldsFilled = true;
        const timetable = {
          period1: inputs[0].value,
          period2: inputs[1].value,
          period3: inputs[2].value,
          period4: inputs[3].value,
        };

        localStorage.setItem('timetable', JSON.stringify(timetable));
        localStorage.setItem('hasVisitedBefore', 'true');
        
        // Enhanced fade out animation
        const overlay = document.getElementById('setup-overlay');
        const dialog = overlay.querySelector('div');
        overlay.style.opacity = '0';
        dialog.style.transform = 'scale(0.95)';
        dialog.style.opacity = '0';
        
        setTimeout(() => {
          popup.remove();
          document.body.style.overflow = ''; // Restore body scrolling
          
          const today = new Date();
          const formattedToday = formatDate(today);
          const isLateStart = checkIfLateStart(today);
          loadTimetableForToday(formattedToday, isLateStart);
        }, 300);
      }, 2000); // Wait 2 seconds before closing
    }
  }

  // Add event listeners for each input
  inputs.forEach((input, index) => {
    // Save on blur (clicking outside)
    input.addEventListener('blur', () => {
      // Only trigger save on blur if it's the last input
      if (index === inputs.length - 1) {
        checkAllFieldsAndSave();
      }
    });
    
    // Handle Enter key and mobile keyboard "done"
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (index < inputs.length - 1) {
          inputs[index + 1].focus();
        } else {
          input.blur();
        }
      }
    });
    
    // Auto-save as user types with delay
    let timeout;
    input.addEventListener('input', () => {
      clearTimeout(timeout);
      // Only start the auto-save timeout for the last input
      if (index === inputs.length - 1) {
        timeout = setTimeout(checkAllFieldsAndSave, 2000);
      }
    });
  });
}

// Add this function after your existing code
function showNotification(message, duration = 3000) {
  // Remove any existing notification
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create and add the new notification
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  // Trigger the animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);

  // Remove the notification after duration
  setTimeout(() => {
    notification.style.top = '-100px';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, duration);
}

// Todo functionality
function initializeTodos() {
  const addTodoButton = document.getElementById('add-todo');
  const todoText = document.getElementById('todo-text');
  const todoDate = document.getElementById('todo-date');
  const todoPeriod = document.getElementById('todo-period');
  const todoList = document.getElementById('todo-list');

  // Set default date to today
  const today = new Date();
  todoDate.value = formatDate(today);

  addTodoButton.addEventListener('click', () => {
    if (!todoText.value) return;

    const todo = {
      id: Date.now(),
      text: todoText.value,
      date: todoDate.value,
      period: todoPeriod.value,
      completed: false
    };

    const todos = getTodos();
    todos.push(todo);
    saveTodos(todos);
    
    todoText.value = '';
    todoPeriod.value = '';
    
    displayTodos();
    updatePeriodTodoDropdowns();
  });

  // Initial display
  displayTodos();
  updatePeriodTodoDropdowns();
}

function getTodos() {
  return JSON.parse(localStorage.getItem('todos') || '[]');
}

function saveTodos(todos) {
  localStorage.setItem('todos', JSON.stringify(todos));
}

function getTodoStatus(dueDate) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const due = new Date(dueDate);

  // Reset time components for accurate date comparison
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  if (due < today) return 'overdue';
  if (due.getTime() === today.getTime()) return 'due-today';
  if (due.getTime() === tomorrow.getTime()) return 'due-tomorrow';
  return 'due-later';
}

function displayTodos() {
  const todoList = document.getElementById('todo-list');
  const todos = getTodos();

  todoList.innerHTML = '';
  todos.sort((a, b) => new Date(a.date) - new Date(b.date));

  todos.forEach(todo => {
    const status = getTodoStatus(todo.date);
    const todoItem = document.createElement('div');
    todoItem.className = `todo-item ${status} ${todo.completed ? 'completed' : ''}`;
    
    todoItem.innerHTML = `
      <div class="checkbox ${todo.completed ? 'checked' : ''}" onclick="toggleTodo(${todo.id})"></div>
      <div class="todo-content">
        <p class="todo-text">${todo.text}</p>
        <span class="todo-date">${formatMonthDay(new Date(todo.date))}${todo.period ? ` - ${todo.period}` : ''}</span>
      </div>
      <button class="delete-todo" onclick="deleteTodo(${todo.id})">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    `;

    todoList.appendChild(todoItem);
  });
}

function updatePeriodTodoDropdowns() {
  const todos = getTodos();
  const periodItems = document.querySelectorAll('.period-item');

  periodItems.forEach((item, index) => {
    const periodNumber = index + 1;
    const dropdown = item.querySelector('.todo-dropdown');
    const periodTodos = todos.filter(todo => 
      todo.period === `period${periodNumber}` && !todo.completed
    );

    if (periodTodos.length > 0) {
      item.classList.add('has-todos');
      dropdown.innerHTML = periodTodos.map(todo => {
        const status = getTodoStatus(todo.date);
        return `
          <div class="todo-mini-item ${status}">
            <span>${todo.text}</span>
            <small>${formatMonthDay(new Date(todo.date))}</small>
          </div>
        `;
      }).join('');

      // Add click handler for the period item
      item.onclick = (e) => {
        // Don't toggle if clicking on a todo item
        if (e.target.closest('.todo-mini-item')) return;
        
        // Toggle the dropdown
        item.classList.toggle('dropdown-open');
      };
    } else {
      item.classList.remove('has-todos', 'dropdown-open');
      dropdown.innerHTML = '';
      item.onclick = null;
    }
  });
}

function toggleTodo(id) {
  const todos = getTodos();
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    saveTodos(todos);
    displayTodos();
    updatePeriodTodoDropdowns();
  }
}

function deleteTodo(id) {
  const todos = getTodos().filter(t => t.id !== id);
  saveTodos(todos);
  displayTodos();
  updatePeriodTodoDropdowns();
}
