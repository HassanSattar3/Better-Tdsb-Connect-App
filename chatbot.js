document.addEventListener('DOMContentLoaded', () => {
    const providerButtons = document.querySelectorAll('.provider-button');
    const openaiGroup = document.getElementById('openai-group');
    const groqGroup = document.getElementById('groq-group');
    const openaiInput = document.getElementById('openai-key');
    const groqInput = document.getElementById('groq-key');
    const saveButtons = document.querySelectorAll('.save-button');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-message');

    let currentProvider = 'openai';
    let isProcessing = false;

    // Add beta notification functionality
    const showBetaNotification = () => {
        // Check if we've already shown the notification in this session
        if (sessionStorage.getItem('betaNotificationShown')) return;
        
        const notification = document.createElement('div');
        notification.className = 'beta-notification';
        notification.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0377 2.66667 10.2679 4L3.33975 16C2.56995 17.3333 3.53217 19 5.07183 19Z" 
                      stroke="currentColor" 
                      stroke-width="2" 
                      stroke-linecap="round" 
                      stroke-linejoin="round"/>
            </svg>
            The AI chatbot is currently in beta. Some features may be limited or experimental.
        `;

        document.body.appendChild(notification);
        sessionStorage.setItem('betaNotificationShown', 'true');

        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.classList.add('hiding');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    };

    // Show beta notification when clicking the chatbot nav link
    const chatbotNavLink = document.querySelector('a[href="#chatbot"]');
    if (chatbotNavLink) {
        chatbotNavLink.addEventListener('click', showBetaNotification);
    }

    // Also show notification when directly navigating to #chatbot
    if (window.location.hash === '#chatbot') {
        showBetaNotification();
    }

    // Schedule Configuration
    const getLastTwoWednesdaysOfMonth = (year, month) => {
        const wednesdays = [];
        const date = new Date(year, month + 1, 0); // Last day of the month

        while (date.getMonth() === month) {
            if (date.getDay() === 3) { // Wednesday is 3
                wednesdays.push(new Date(date));
            }
            date.setDate(date.getDate() - 1);
        }

        // Return the last two Wednesdays (most recent first)
        return wednesdays.slice(0, 2).reverse();
    };

    // Generate late starts for the academic year
    const generateLateStarts = () => {
        const lateStarts = {};
        
        // Generate for each month from September to June
        for (let month = 8; month <= 11; month++) { // September to December 2024
            const wednesdays = getLastTwoWednesdaysOfMonth(2024, month);
            wednesdays.forEach(date => {
                const dateStr = date.toISOString().split('T')[0];
                lateStarts[dateStr] = { type: 'late_start', name: 'Late Start' };
            });
        }
        
        for (let month = 0; month <= 5; month++) { // January to June 2025
            const wednesdays = getLastTwoWednesdaysOfMonth(2025, month);
            wednesdays.forEach(date => {
                const dateStr = date.toISOString().split('T')[0];
                lateStarts[dateStr] = { type: 'late_start', name: 'Late Start' };
            });
        }
        
        return lateStarts;
    };

    const scheduleConfig = {
        semester1Start: '2024-09-03', // First semester start
        semester1End: '2025-01-30',   // First semester end
        specialDates: {
            // Holidays and PD Days
            '2024-09-02': { type: 'holiday', name: 'Labour Day' },
            '2024-10-14': { type: 'holiday', name: 'Thanksgiving' },
            '2024-12-23': { type: 'holiday', name: 'Winter Break Start' },
            '2024-12-24': { type: 'holiday', name: 'Winter Break' },
            '2024-12-25': { type: 'holiday', name: 'Christmas Day' },
            '2024-12-26': { type: 'holiday', name: 'Boxing Day' },
            '2024-12-27': { type: 'holiday', name: 'Winter Break' },
            '2024-12-30': { type: 'holiday', name: 'Winter Break' },
            '2024-12-31': { type: 'holiday', name: 'Winter Break' },
            '2025-01-01': { type: 'holiday', name: 'New Year\'s Day' },
            '2025-01-02': { type: 'holiday', name: 'Winter Break' },
            '2025-01-03': { type: 'holiday', name: 'Winter Break End' },
            // Late starts - Add actual dates when available
            '2024-09-19': { type: 'late_start', name: 'Late Start' },
            '2024-10-17': { type: 'late_start', name: 'Late Start' },
            '2024-12-11': { type: 'late_start', name: 'Late Start' },
            '2024-12-19': { type: 'late_start', name: 'Late Start' },
            '2025-01-16': { type: 'late_start', name: 'Late Start' },
            ...generateLateStarts() // Add dynamic late starts
        },
        referenceDay1: '2023-12-08' // Keep December 8th as Day 1 reference
    };

    // Get periods from localStorage
    const getPeriodsFromStorage = () => {
        const periods = [];
        for (let i = 1; i <= 4; i++) {
            const periodKey = `period${i}`;
            const periodData = localStorage.getItem(periodKey) || localStorage.getItem(`sw_${periodKey}`);
            periods.push({
                period: i,
                class: periodData && periodData.trim() !== '' ? periodData : 'Not set'
            });
        }
        return periods;
    };

    // Save period to localStorage
    const savePeriodToStorage = (periodNumber, className) => {
        localStorage.setItem(`period${periodNumber}`, className);
        // Also update the input field if it exists
        const periodInput = document.getElementById(`period${periodNumber}`);
        if (periodInput) {
            periodInput.value = className;
        }
    };

    const saveSchedule = (day1Schedule, day2Schedule) => {
        localStorage.setItem('day1Schedule', JSON.stringify(day1Schedule));
        localStorage.setItem('day2Schedule', JSON.stringify(day2Schedule));
    };

    // Initialize schedule if not set
    const initializeSchedule = () => {
        // Load saved values from localStorage first
        for (let i = 1; i <= 4; i++) {
            const savedValue = localStorage.getItem(`period${i}`);
            const periodInput = document.getElementById(`period${i}`);
            if (periodInput && savedValue) {
                periodInput.value = savedValue;
            }
        }

        const periods = getPeriodsFromStorage();
        
        // Day 1: Normal order
        const day1Schedule = periods.map(p => ({ ...p }));
        
        // Day 2: Swap periods 3 and 4, keep 1 and 2 the same
        const day2Schedule = periods.map((p, index) => {
            if (index < 2) {
                return { ...p };
            } else {
                const swappedIndex = index === 2 ? 3 : 2;
                return {
                    period: index + 1,
                    class: periods[swappedIndex].class
                };
            }
        });

        saveSchedule(day1Schedule, day2Schedule);
    };

    // Update schedule when settings change
    const setupSettingsListeners = () => {
        for (let i = 1; i <= 4; i++) {
            const periodInput = document.getElementById(`period${i}`);
            if (periodInput) {
                periodInput.addEventListener('change', () => {
                    const className = periodInput.value.trim() || 'Not set';
                    savePeriodToStorage(i, className);
                    const periods = getPeriodsFromStorage();
                    const day1Schedule = periods.map(p => ({ ...p }));
                    const day2Schedule = periods.map((p, index) => {
                        if (index < 2) {
                            return { ...p };
                        } else {
                            const swappedIndex = index === 2 ? 3 : 2;
                            return {
                                period: index + 1,
                                class: periods[swappedIndex].class
                            };
                        }
                    });
                    saveSchedule(day1Schedule, day2Schedule); // Update only the affected period
                });
            }
        }
    };

    // Calculate school days between dates
    const calculateSchoolDays = (startDate, endDate) => {
        let schoolDays = 0;
        const currentDate = new Date(startDate);
        currentDate.setHours(12, 0, 0, 0);
        const endDateTime = endDate.getTime();
        
        while (currentDate.getTime() <= endDateTime) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
            const isHoliday = scheduleConfig.specialDates[dateStr]?.type === 'holiday';
            
            if (!isWeekend && !isHoliday) {
                schoolDays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return schoolDays;
    };

    // Get next valid school day
    const getNextValidSchoolDay = (date) => {
        const nextDate = new Date(date);
        nextDate.setHours(12, 0, 0, 0);
        
        // If it's a weekend or holiday, find next school day
        const isWeekend = nextDate.getDay() === 0 || nextDate.getDay() === 6;
        const dateStr = nextDate.toISOString().split('T')[0];
        const isHoliday = scheduleConfig.specialDates[dateStr]?.type === 'holiday';
        
        if (isWeekend || isHoliday) {
            let testDate = new Date(nextDate);
            while (true) {
                testDate.setDate(testDate.getDate() + 1);
                const testDateStr = testDate.toISOString().split('T')[0];
                const isTestWeekend = testDate.getDay() === 0 || testDate.getDay() === 6;
                const isTestHoliday = scheduleConfig.specialDates[testDateStr]?.type === 'holiday';
                
                if (!isTestWeekend && !isTestHoliday) {
                    return {
                        date: testDate,
                        isOriginalWeekend: isWeekend,
                        isOriginalHoliday: isHoliday,
                        originalDate: new Date(date)
                    };
                }
            }
        }
        
        return {
            date: nextDate,
            isOriginalWeekend: false,
            isOriginalHoliday: false,
            originalDate: new Date(date)
        };
    };

    // Determine if a date is Day 1 or Day 2
    const getDayPattern = (dateInput) => {
        const date = new Date(dateInput);
        date.setHours(12, 0, 0, 0);
        
        const refDate = new Date(scheduleConfig.referenceDay1);
        refDate.setHours(12, 0, 0, 0);
        
        // Get next valid school day if current date is weekend/holiday
        const nextSchoolDay = getNextValidSchoolDay(date);
        
        // Check if it's a special date
        const dateStr = nextSchoolDay.date.toISOString().split('T')[0];
        const specialDate = scheduleConfig.specialDates[dateStr];
        if (specialDate) {
            return {
                ...specialDate,
                actualDate: nextSchoolDay.date,
                originalDate: nextSchoolDay.originalDate
            };
        }

        // Check semester bounds
        const semesterStart = new Date(scheduleConfig.semester1Start);
        const semesterEnd = new Date(scheduleConfig.semester1End);
        if (nextSchoolDay.date < semesterStart || nextSchoolDay.date > semesterEnd) {
            return {
                type: 'off_semester',
                name: 'Outside of Semester',
                actualDate: nextSchoolDay.date,
                originalDate: nextSchoolDay.originalDate
            };
        }

        // Calculate school days since reference date
        const schoolDays = calculateSchoolDays(refDate, nextSchoolDay.date);
        // Since Dec 8 is Day 1, odd days after that are Day 2, even days are Day 1
        const dayNumber = (schoolDays % 2 === 0) ? 1 : 2;

        return {
            type: 'school_day',
            dayNumber,
            actualDate: nextSchoolDay.date,
            originalDate: nextSchoolDay.originalDate
        };
    };

    // Get schedule information for a specific date
    const getScheduleInfo = (targetDate = new Date()) => {
        const date = new Date(targetDate);
        date.setHours(12, 0, 0, 0);
        
        // Get next valid school day and day pattern
        const nextSchoolDay = getNextValidSchoolDay(date);
        const dayPattern = getDayPattern(nextSchoolDay.date);
        
        // Retrieve saved schedules from localStorage
        const day1Schedule = JSON.parse(localStorage.getItem('day1Schedule')) || [];
        const day2Schedule = JSON.parse(localStorage.getItem('day2Schedule')) || [];

        const userSchedule = {
            day1: day1Schedule,
            day2: day2Schedule
        };

        const currentSchedule = dayPattern.type === 'school_day' 
            ? userSchedule[`day${dayPattern.dayNumber}`]
            : userSchedule.day1;

        const dateStr = date.toISOString().split('T')[0];
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isHoliday = scheduleConfig.specialDates[dateStr]?.type === 'holiday';

        return {
            periods: currentSchedule,
            dayInfo: dayPattern.type === 'school_day' ? `Day ${dayPattern.dayNumber}` : dayPattern.name,
            currentTime: date.toLocaleTimeString(),
            currentDate: date.toLocaleDateString(),
            nextSchoolDate: nextSchoolDay.date.toLocaleDateString(),
            dayPattern,
            isLateStart: scheduleConfig.specialDates[dateStr]?.type === 'late_start',
            isHoliday,
            isWeekend,
            isSchoolDay: !isWeekend && !isHoliday,
            schedule: userSchedule,
            nextSchoolDay
        };
    };

    // Add this new helper function
    const parseDateQuery = (message) => {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

        message = message.toLowerCase();
        
        if (message.includes('tomorrow')) {
            return tomorrow;
        } else if (message.includes('day after tomorrow')) {
            return dayAfterTomorrow;
        } else if (message.includes('today')) {
            return today;
        } else if (message.match(/next (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i)) {
            const dayMap = {
                'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
                'friday': 5, 'saturday': 6, 'sunday': 0
            };
            const targetDay = dayMap[message.match(/next (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i)[1].toLowerCase()];
            const nextDate = new Date(today);
            while (nextDate.getDay() !== targetDay) {
                nextDate.setDate(nextDate.getDate() + 1);
            }
            return nextDate;
        }
        
        // Check for YYYY-MM-DD format
        const dateMatch = message.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch) {
            return new Date(dateMatch[0]);
        }
        
        return today;
    };

    // Process message with Groq
    const processGroqMessage = async (message, apiKey) => {
        if (!isEducationRelated(message)) {
            return "I can only answer questions about school-related topics. Please ask me about your schedule, classes, or other educational matters.";
        }
        
        const targetDate = parseDateQuery(message);
        const schedule = getScheduleInfo(targetDate);
        const dayPattern = schedule.dayPattern;
        const isWeekendOrHoliday = schedule.isWeekend || schedule.isHoliday;

        // Get current periods from storage
        const currentPeriods = getPeriodsFromStorage();
        const day1Schedule = currentPeriods;
        const day2Schedule = currentPeriods.map((p, index) => {
            if (index < 2) return { ...p };
            const swappedIndex = index === 2 ? 3 : 2;
            return {
                period: index + 1,
                class: currentPeriods[swappedIndex].class
            };
        });

        const systemPrompt = `You are a helpful AI assistant that helps students with their TDSB high school schedule. 
        When responding about schedules:
        1. ALWAYS format the day as "Day X" (never just the number)
        2. ALWAYS list ALL periods and classes for the requested date
        3. Mention if it's a late start day
        
        Current schedule information for ${schedule.currentDate}:
        ${isWeekendOrHoliday ? 
            `Note: This is a ${schedule.isWeekend ? 'weekend' : 'holiday'}. 
            The next school day will be ${schedule.nextSchoolDate}, which will be Day ${dayPattern.dayNumber} with the following schedule:` : 
            `This is Day ${dayPattern.dayNumber} with the following schedule:`
        }
        
        ${schedule.periods.map(p => `Period ${p.period}: ${p.class}`).join('\n')}
        ${schedule.isLateStart ? '\nThis is a Late Start day!' : ''}
        ${schedule.isHoliday ? `\nThis is a holiday: ${dayPattern.name}` : ''}

        When answering:
        1. Start with the date and day pattern
        2. List ALL periods and their classes
        3. Mention if it's a late start day
        4. Format response as:
           "On [Date], Day [1/2]:
           Period 1: [Class]
           Period 2: [Class]
           Period 3: [Class]
           Period 4: [Class]
           [Late Start notice if applicable]"`;

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'mixtral-8x7b-32768',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: message }
                    ],
                    temperature: 0.7,
                    max_tokens: 150,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`Groq API error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Groq API Error:', error);
            throw error;
        }
    };

    // Process message with OpenAI
    const processOpenAIMessage = async (message, apiKey) => {
        if (!isEducationRelated(message)) {
            return "I can only answer questions about school-related topics. Please ask me about your schedule, classes, or other educational matters.";
        }
        
        const targetDate = parseDateQuery(message);
        const schedule = getScheduleInfo(targetDate);
        const isWeekendOrHoliday = schedule.isWeekend || schedule.isHoliday;
        
        const systemPrompt = `You are a helpful AI assistant that helps students with their school schedule. 
        When responding about schedules:
        1. ALWAYS format the day as "Day X" (never just the number)
        2. ALWAYS list ALL periods and classes for the requested date
        3. Mention if it's a late start day
        
        Current schedule information for ${schedule.currentDate}:
        ${isWeekendOrHoliday ? 
            `Note: This is a ${schedule.isWeekend ? 'weekend' : 'holiday'}. 
            The next school day will be ${schedule.nextSchoolDate}, which will be Day ${schedule.dayPattern.dayNumber} with the following schedule:` : 
            `This is Day ${schedule.dayPattern.dayNumber} with the following schedule:`
        }
        
        ${schedule.periods.map(p => `Period ${p.period}: ${p.class}`).join('\n')}
        ${schedule.isLateStart ? '\nThis is a Late Start day!' : ''}
        ${schedule.isHoliday ? `\nThis is a holiday: ${schedule.dayPattern.name}` : ''}

        When answering:
        1. Start with the date and day pattern
        2. List ALL periods and their classes
        3. Mention if it's a late start day
        4. Format response as:
           "On [Date], Day [1/2]:
           Period 1: [Class]
           Period 2: [Class]
           Period 3: [Class]
           Period 4: [Class]
           [Late Start notice if applicable]"`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'OpenAI API request failed');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    };

    // Add message to chat
    const addMessage = (content, isUser = false) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
        messageDiv.textContent = content;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    // Show loading indicator
    const showLoading = () => {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-indicator';
        loadingDiv.innerHTML = `
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
        `;
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return loadingDiv;
    };

    // Handle send message
    const handleSend = async (withAudio = false) => {
        const message = chatInput.value.trim();
        if (!message || isProcessing) return;

        const apiKey = localStorage.getItem(`${currentProvider}_api_key`);
        if (!apiKey) {
            addMessage('Please set your API key first.', false);
            return;
        }

        isProcessing = true;
        addMessage(message, true);
        chatInput.value = '';

        const loadingIndicator = showLoading();
        try {
            const response = await (currentProvider === 'groq' 
                ? processGroqMessage(message, apiKey)
                : processOpenAIMessage(message, apiKey));
            addMessage(response, false);

            // Speak the response if audio was requested
            if (withAudio) {
                speakText(response);
            }
        } catch (error) {
            addMessage(`Error: ${error.message}`, false);
            console.error('Error:', error);
        } finally {
            loadingIndicator.remove();
            isProcessing = false;
        }
    };

    // Event listeners for provider buttons
    providerButtons.forEach(button => {
        button.addEventListener('click', () => {
            const provider = button.dataset.provider;
            currentProvider = provider;
            providerButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.provider === provider);
            });
            openaiGroup.classList.toggle('hidden', provider !== 'openai');
            groqGroup.classList.toggle('hidden', provider !== 'groq');
            
            // Make sure the mic button stays visible
            const micButton = document.getElementById('mic-button');
            if (micButton) {
                micButton.style.display = 'flex';
            }
        });
    });

    // Event listeners for save buttons
    saveButtons.forEach(button => {
        button.addEventListener('click', () => {
            const provider = button.dataset.provider;
            const input = document.getElementById(`${provider}-key`);
            const key = input.value.trim();
            if (!key) {
                alert('Please enter an API key');
                return;
            }
            localStorage.setItem(`${provider}_api_key`, key);
            alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} API key saved successfully!`);
        });
    });

    // Event listeners for chat
    sendButton.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    // Load saved periods into input fields
    const loadSavedPeriods = () => {
        for (let i = 1; i <= 4; i++) {
            const periodInput = document.getElementById(`period${i}`);
            if (periodInput) {
                const savedValue = localStorage.getItem(`period${i}`);
                if (savedValue) {
                    periodInput.value = savedValue;
                }
            }
        }
    };

    // Update all data from localStorage
    const updateFromLocalStorage = () => {
        // Load saved API keys
        const openaiKey = localStorage.getItem('openai_api_key');
        const groqKey = localStorage.getItem('groq_api_key');
        if (openaiKey) openaiInput.value = openaiKey;
        if (groqKey) groqInput.value = groqKey;

        // Load saved periods
        for (let i = 1; i <= 4; i++) {
            const periodInput = document.getElementById(`period${i}`);
            if (periodInput) {
                const savedValue = localStorage.getItem(`period${i}`);
                if (savedValue) {
                    periodInput.value = savedValue;
                }
            }
        }

        // Reinitialize schedule
        initializeSchedule();
        setupSettingsListeners();
    };

    // Modify the startPeriodicUpdate function
    const startPeriodicUpdate = () => {
        const chatbotNavLink = document.querySelector('a[href="#chatbot"]');
        if (chatbotNavLink) {
            chatbotNavLink.addEventListener('click', () => {
                updateFromLocalStorage();
                showBetaNotification();
                
                // Make sure the mic button stays visible
                const micButton = document.getElementById('mic-button');
                if (micButton) {
                    micButton.style.display = 'flex';
                }
            });
        }

        // Also update when directly navigating to #chatbot
        if (window.location.hash === '#chatbot') {
            updateFromLocalStorage();
            showBetaNotification();
            
            // Make sure the mic button stays visible
            const micButton = document.getElementById('mic-button');
            if (micButton) {
                micButton.style.display = 'flex';
            }
        }
    };

    // Initialize
    updateFromLocalStorage();
    startPeriodicUpdate();

    // Instead, get the existing mic button
    const micButton = document.getElementById('mic-button');

    let isRecording = false;
    let mediaRecorder = null;
    let audioChunks = [];

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    // Initialize speech synthesis
    const synth = window.speechSynthesis;

    // Handle microphone button click
    micButton.addEventListener('click', () => {
        if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    });

    function startRecording() {
        isRecording = true;
        micButton.classList.add('recording');
        recognition.start();
    }

    function stopRecording() {
        isRecording = false;
        micButton.classList.remove('recording');
        recognition.stop();
    }

    // Handle speech recognition results
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        chatInput.value = transcript;
        handleSend(true); // Pass true to indicate we want audio response
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        addMessage('Error: Could not understand audio input', false);
        stopRecording();
    };

    // Text-to-speech function
    function speakText(text) {
        if (synth.speaking) {
            synth.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        synth.speak(utterance);
    }

    // Add audio control functions
    function stopSpeaking() {
        if (synth.speaking) {
            synth.cancel();
        }
    }

    // Event listener for stopping speech when new recording starts
    micButton.addEventListener('mousedown', () => {
        stopSpeaking();
    });

    // Function to adjust chat input container position based on device type
    const adjustChatInputPosition = () => {
        const chatInputContainer = document.querySelector('.chat-input-container');
        if (window.innerWidth <= 480) {
            chatInputContainer.style.bottom = '60px';
        } else if (window.innerWidth <= 320) {
            chatInputContainer.style.bottom = '55px';
        } else {
            chatInputContainer.style.bottom = '5px'; // Adjusted for desktop
        }
    };

    // Call the function on load and on resize
    adjustChatInputPosition();
    window.addEventListener('resize', adjustChatInputPosition);
});

function isEducationRelated(question) {
    const educationKeywords = [
        'school', 'class', 'homework', 'teacher', 'grade', 'study',
        'exam', 'test', 'assignment', 'course', 'tdsb', 'brightspace',
        'classroom', 'subject', 'learning', 'education', 'period',
        'schedule', 'day 1', 'day 2', 'semester', 'day'
    ];

    const offTopicKeywords = [
        'food', 'pizza', 'movie', 'game', 'sport', 'weather', 'music',
        'favorite', 'like', 'hate', 'love', 'think about', 'opinion',
        'best', 'worst', 'politics', 'religion'
    ];
    
    // Check if question contains off-topic keywords
    if (offTopicKeywords.some(keyword => 
        question.toLowerCase().includes(keyword.toLowerCase()))) {
        return false;
    }
    
    // Must contain at least one education keyword
    return educationKeywords.some(keyword => 
        question.toLowerCase().includes(keyword.toLowerCase()));
}

// Update both API processing functions to include the off-topic check
async function processGroqMessage(message, apiKey) {
    if (!isEducationRelated(message)) {
        return "I can only answer questions about school-related topics. Please ask me about your schedule, classes, or other educational matters.";
    }
    
    const targetDate = parseDateQuery(message);
    const schedule = getScheduleInfo(targetDate);
    const dayPattern = schedule.dayPattern;
    const isWeekendOrHoliday = schedule.isWeekend || schedule.isHoliday;

    // Get current periods from storage
    const currentPeriods = getPeriodsFromStorage();
    const day1Schedule = currentPeriods;
    const day2Schedule = currentPeriods.map((p, index) => {
        if (index < 2) return { ...p };
        const swappedIndex = index === 2 ? 3 : 2;
        return {
            period: index + 1,
            class: currentPeriods[swappedIndex].class
        };
    });

    const systemPrompt = `You are a helpful AI assistant that helps students with their TDSB high school schedule. 
    When responding about schedules:
    1. ALWAYS format the day as "Day X" (never just the number)
    2. ALWAYS list ALL periods and classes for the requested date
    3. Mention if it's a late start day
    
    Current schedule information for ${schedule.currentDate}:
    ${isWeekendOrHoliday ? 
        `Note: This is a ${schedule.isWeekend ? 'weekend' : 'holiday'}. 
        The next school day will be ${schedule.nextSchoolDate}, which will be Day ${dayPattern.dayNumber} with the following schedule:` : 
        `This is Day ${dayPattern.dayNumber} with the following schedule:`
    }
    
    ${schedule.periods.map(p => `Period ${p.period}: ${p.class}`).join('\n')}
    ${schedule.isLateStart ? '\nThis is a Late Start day!' : ''}
    ${schedule.isHoliday ? `\nThis is a holiday: ${dayPattern.name}` : ''}

    When answering:
    1. Start with the date and day pattern
    2. List ALL periods and their classes
    3. Mention if it's a late start day
    4. Format response as:
       "On [Date], Day [1/2]:
       Period 1: [Class]
       Period 2: [Class]
       Period 3: [Class]
       Period 4: [Class]
       [Late Start notice if applicable]"`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'mixtral-8x7b-32768',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 150,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Groq API Error:', error);
        throw error;
    }
}

// Process message with OpenAI
const processOpenAIMessage = async (message, apiKey) => {
    if (!isEducationRelated(message)) {
        return "I can only answer questions about school-related topics. Please ask me about your schedule, classes, or other educational matters.";
    }
    
    const targetDate = parseDateQuery(message);
    const schedule = getScheduleInfo(targetDate);
    const isWeekendOrHoliday = schedule.isWeekend || schedule.isHoliday;
    
    const systemPrompt = `You are a helpful AI assistant that helps students with their school schedule. 
    When responding about schedules:
    1. ALWAYS format the day as "Day X" (never just the number)
    2. ALWAYS list ALL periods and classes for the requested date
    3. Mention if it's a late start day
    
    Current schedule information for ${schedule.currentDate}:
    ${isWeekendOrHoliday ? 
        `Note: This is a ${schedule.isWeekend ? 'weekend' : 'holiday'}. 
        The next school day will be ${schedule.nextSchoolDate}, which will be Day ${schedule.dayPattern.dayNumber} with the following schedule:` : 
        `This is Day ${schedule.dayPattern.dayNumber} with the following schedule:`
    }
    
    ${schedule.periods.map(p => `Period ${p.period}: ${p.class}`).join('\n')}
    ${schedule.isLateStart ? '\nThis is a Late Start day!' : ''}
    ${schedule.isHoliday ? `\nThis is a holiday: ${schedule.dayPattern.name}` : ''}

    When answering:
    1. Start with the date and day pattern
    2. List ALL periods and their classes
    3. Mention if it's a late start day
    4. Format response as:
       "On [Date], Day [1/2]:
       Period 1: [Class]
       Period 2: [Class]
       Period 3: [Class]
       Period 4: [Class]
       [Late Start notice if applicable]"`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            temperature: 0.7,
            max_tokens: 150
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
};

async function handleUserInput(userInput) {
    if (!isEducationRelated(userInput)) {
        return "I can only answer questions related to school and education. Please try asking something about your studies!";
    }
    
    // ...existing code for AI processing...
}
