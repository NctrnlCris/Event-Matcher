import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, Timestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase Configuration
// NOTE: Using a placeholder key for demonstration. Replace with your actual key.
const firebaseConfig = {
    apiKey: "AIzaSyD-i24KhVy-1_ARXhBPaUT3FJV1-lQ9cKE",
    authDomain: "eventmatcher-b228a.firebaseapp.com",
    projectId: "eventmatcher-b228a",
    storageBucket: "eventmatcher-b228a.firebasestorage.app",
    messagingSenderId: "147997772201",
    appId: "1:147997772201:web:80cb87a9feac15c97fdcb8",
    measurementId: "G-3H7CY8NDND"
};

let db;
let auth;
let isAuthReady = false;

// The core application logic object
window.App = {
    db: null,
    auth: null,
    userId: null,
    isAuthReady: false,
    unavailableTimes: {},
    currentWeekStart: new Date(),
    interests: [
        'Technology', 'Finance', 'Biology', 'Sports', 'Food',
        'Gaming', 'Volunteering', 'Climbing', 'Running', 'Engineering',
        'Animals', 'UI/UX Design', 'Arts', 'Music', 'Environment',
        'Cooking', 'Culture', 'Reading', 'Weightlifting', 'Writing'
    ],
    selectedInterests: new Set(),
    allEvents: [] // Stores all club events from Firestore
};

// --- Utility Functions ---

const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 (Sun) to 6 (Sat)
    // Calculate difference to get back to Monday (1). 
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

const formatTimeKey = (date, hour) => {
    const d = new Date(date);
    d.setHours(hour);
    return `${d.toISOString().substring(0, 10)}-${hour}`;
};

const parseTime = (timeStr) => {
    try {
        const parts = timeStr.toUpperCase().trim().split(' ');
        
        let hours;
        let modifier;

        if (parts.length === 2) {
            [hours] = parts[0].split(':');
            modifier = parts[1];
        } else if (parts.length === 1 && parts[0].includes(':')) {
            [hours] = parts[0].split(':');
            let hour24 = parseInt(hours, 10);
            if (hour24 >= 0 && hour24 <= 23) return hour24;
            return null; 
        } else {
            return null;
        }

        let hours24 = parseInt(hours, 10);
        
        if (modifier === 'PM' && hours24 !== 12) {
            hours24 += 12;
        } else if (modifier === 'AM' && hours24 === 12) {
            hours24 = 0; // 12 AM is hour 0
        }
        
        return hours24;
    } catch (e) {
        console.error("Time parsing failed for:", timeStr, e);
        return null;
    }
};

// --- CALENDAR RENDERING --- 
const renderCalendar = () => {
    // ... (Calendar logic remains the same)
    const calendarGrid = document.getElementById('calendar-grid');
    if (!calendarGrid) return;
    calendarGrid.innerHTML = '';

    const startOfWeek = getStartOfWeek(App.currentWeekStart);
    
    // 24 Hour Time Headers
    const timeHeaderRow = document.createElement('div');
    timeHeaderRow.className = 'flex'; 
    
    // Top-left corner placeholder - Z-index 30 ensures it's above both sticky axis
    timeHeaderRow.innerHTML = '<div class="time-header z-30 bg-gray-200">Time / Day</div>'; 

    // Time loop from 0 (12 AM) to 23 (11 PM)
    for (let hour = 0; hour <= 23; hour++) {
        const timeStr = hour === 0 ? '12 AM' 
                                 : hour < 12 ? `${hour} AM` 
                                 : hour === 12 ? '12 PM' 
                                 : `${hour - 12} PM`;
        
        timeHeaderRow.innerHTML += `
            <div class="time-header-slot text-center text-xs font-semibold text-gray-600">
                ${timeStr}
            </div>
        `;
    }
    calendarGrid.appendChild(timeHeaderRow);

    // 7 Days: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Render Days (0 to 6)
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = date.toISOString().substring(5, 10); 

        const dayRow = document.createElement('div');
        dayRow.className = 'flex items-stretch day-row';
        
        // First element is the sticky day label
        dayRow.innerHTML = `<div class="time-header">${days[i]}<span class="text-gray-500 ml-1 font-normal">(${dateStr})</span></div>`;

        // Hour loop from 0 to 23
        for (let hour = 0; hour <= 23; hour++) {
            const timeKey = formatTimeKey(date, hour);
            const isUnavailable = App.unavailableTimes[timeKey];
            
            const slot = document.createElement('div');
            // time-slot class ensures fixed width for alignment
            slot.className = `time-slot rounded-sm 
                              ${isUnavailable ? 'unavailable' : 'available'}`;
            slot.dataset.timeKey = timeKey;
            slot.dataset.day = i + 1; 
            slot.dataset.hour = hour;
            
            slot.addEventListener('click', () => {
                toggleAvailability(slot, timeKey);
            });
            
            dayRow.appendChild(slot);
        }
        calendarGrid.appendChild(dayRow);
    }

    // Update week header
    const weekStartStr = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekEnd = new Date(startOfWeek);
    weekEnd.setDate(startOfWeek.getDate() + 6); // End on Sunday
    const weekEndStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    document.getElementById('week-display').textContent = `${weekStartStr} - ${weekEndStr}`;
};

const toggleAvailability = (slot, timeKey) => {
    if (App.unavailableTimes[timeKey]) {
        delete App.unavailableTimes[timeKey];
        slot.classList.remove('unavailable');
        slot.classList.add('available');
    } else {
        App.unavailableTimes[timeKey] = true;
        slot.classList.remove('available');
        slot.classList.add('unavailable');
    }
};

const changeWeek = (direction) => {
    const nextWeek = new Date(App.currentWeekStart);
    nextWeek.setDate(App.currentWeekStart.getDate() + (direction * 7));
    App.currentWeekStart = nextWeek;
    renderCalendar();
};

// --- INTERESTS RENDERING ---
const renderInterests = () => {
    // ... (Interests logic remains the same)
    const interestsContainer = document.getElementById('interests-container');
    if (!interestsContainer) return;
    interestsContainer.innerHTML = '';

    App.interests.forEach(interest => {
        const id = `interest-${interest.replace(/\s/g, '-')}`;
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'flex items-center';
        checkboxDiv.innerHTML = `
            <input type="checkbox" id="${id}" value="${interest}" class="form-checkbox h-4 w-4 text-indigo-600 rounded">
            <label for="${id}" class="ml-2 text-gray-700">${interest}</label>
        `;
        const checkbox = checkboxDiv.querySelector('input');
        
        if (App.selectedInterests.has(interest)) {
            checkbox.checked = true;
        }

        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                App.selectedInterests.add(interest);
            } else {
                App.selectedInterests.delete(interest);
            }
        });
        interestsContainer.appendChild(checkboxDiv);
    });
};

// --- EVENT MATCHING LOGIC ---
const findMatchingEvents = () => {
    // ... (Matching logic remains the same)
    console.log("-> Executing findMatchingEvents...");
    
    const resultsContainer = document.getElementById('event-results-container'); 
    resultsContainer.innerHTML = '<p class="text-center text-gray-500 font-semibold">Searching for conflict-free events...</p>';
    
    if (App.selectedInterests.size === 0) {
        resultsContainer.innerHTML = '<p class="text-center text-red-500 font-semibold">Please select at least one interest to find events.</p>';
        return;
    }

    const lowerSelectedInterests = new Set(
        Array.from(App.selectedInterests).map(i => i.toLowerCase().trim())
    );

    const matchingEvents = App.allEvents.filter(event => {
        const eventName = event.name || 'Unknown Event';

        // 1. Check Interest Match
        const rawTags = event.tags;
        let eventTagsLowercased = [];

        if (Array.isArray(rawTags)) {
            eventTagsLowercased = rawTags.map(tag => String(tag).toLowerCase().trim());
        } else if (typeof rawTags === 'string') {
            eventTagsLowercased = rawTags.toLowerCase().split(/[,\s]+/).filter(tag => tag);
        }
        
        const hasInterestMatch = eventTagsLowercased.some(tag => lowerSelectedInterests.has(tag));
        
        if (!hasInterestMatch) {
            return false; 
        }
        
        // 2. Check Time Conflict
        if (!event.date || !event.startTime || !event.endTime) {
            return false;
        }

        try {
            const eventDate = new Date(event.date); 
            
            if (isNaN(eventDate.getTime())) {
                return false;
            }

            // Determine event start and end hours in 24h format
            const startHour = parseTime(event.startTime);
            const endHour = parseTime(event.endTime);

            // Validation for time range
            if (startHour === null || endHour === null || startHour >= endHour || startHour < 0 || endHour > 24) {
                console.log(`[FILTERED] ${eventName}: Invalid time format or duration.`);
                return false;
            }
            
            // Check if event is in the current calendar week
            const currentWeekStart = getStartOfWeek(App.currentWeekStart);
            const currentWeekEnd = new Date(currentWeekStart);
            currentWeekEnd.setDate(currentWeekStart.getDate() + 7); 

            const eventDateOnly = new Date(event.date);
            eventDateOnly.setHours(0, 0, 0, 0);

            if (eventDateOnly < currentWeekStart || eventDateOnly >= currentWeekEnd) {
                return false;
            }

            // Loop through every hourly slot the event occupies
            for (let currentHour = startHour; currentHour < endHour; currentHour++) {
                
                const eventTimeKey = formatTimeKey(eventDate, currentHour);

                if (App.unavailableTimes[eventTimeKey]) {
                    // Conflict found
                    return false; 
                }
            }
            
            return true; // No conflicts found

        } catch (e) {
            console.error("Error processing event date/time:", eventName, e);
            return false;
        }
    });

    // Display Results
    resultsContainer.innerHTML = ''; 
    
    if (matchingEvents.length === 0) {
        resultsContainer.innerHTML = '<p class="text-center text-gray-500 font-semibold">No available events match your selected interests or schedule for this week.</p>';
    } else {
        let htmlContent = '';
        matchingEvents.forEach(event => {
            const dateDisplay = new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            
            htmlContent += `
                <div class="matched-event-box">
                    <h3 class="text-lg font-bold text-indigo-900">${event.name}</h3>
                    <p class="text-sm text-gray-700 mt-1">
                        <span class="font-semibold">${event.club}</span> | 
                        ${dateDisplay}, ${event.startTime} - ${event.endTime}
                    </p>
                    <p class="text-xs text-indigo-600 mt-2 font-mono">
                        Tags: ${Array.isArray(event.tags) ? event.tags.join(', ') : event.tags}
                    </p>
                    <p class="mt-2 text-gray-800">${event.description}</p>
                </div>
            `;
        });
        resultsContainer.innerHTML = htmlContent;
    }
};

// --- FIREBASE AND AUTH SETUP ---
const setupFirebase = async () => {
    // ... (Firebase setup logic remains the same)
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    window.App.db = db;
    window.App.auth = auth;

    const signInUser = async () => {
        const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        
        try {
            if (token) {
                await signInWithCustomToken(auth, token);
            } else {
                await signInAnonymously(auth);
            }
        } catch (error) {
            console.error("Firebase Authentication failed:", error);
            console.warn("Continuing with temporary user ID. Write operations may be denied.");
            window.App.userId = crypto.randomUUID();
        }
    };
    
    if (!auth.currentUser) {
        await signInUser();
    }
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            window.App.userId = user.uid;
        } else if (!window.App.userId) {
            window.App.userId = crypto.randomUUID();
        }

        isAuthReady = true;
        window.App.isAuthReady = true;
        console.log("Auth is ready. User ID:", window.App.userId);
        setupEventListener();
    });
};

const setupEventListener = () => {
    // ... (Firestore listener setup remains the same)
    const eventsCollectionRef = collection(App.db, 'events');
    
    onSnapshot(eventsCollectionRef, (snapshot) => {
        App.allEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`Loaded ${App.allEvents.length} events from Firestore.`);
    }, (error) => {
        console.error("Error setting up event listener:", error);
        const roleDiv = document.getElementById('role-selection');
        if (roleDiv) {
            roleDiv.innerHTML = 
                `<p class="text-red-600 font-bold">Error connecting to database (check console/security rules): ${error.message}</p>`;
        }
    });
};

const handleOrganizerSubmit = async (event) => {
    // ... (Organizer form submission logic remains the same)
    event.preventDefault();
    
    const form = event.target;

    const startHour = parseTime(form.eventStartTime.value);
    const endHour = parseTime(form.eventEndTime.value);

    const messageElement = document.getElementById('organizer-message');
    messageElement.classList.remove('hidden', 'bg-green-500', 'bg-red-500', 'bg-indigo-500');
    
    if (startHour === null || endHour === null || startHour >= endHour || startHour < 0 || endHour > 24) {
        messageElement.textContent = "Invalid Start/End Time. Must be a valid AM/PM format (e.g., 9:00 AM) and End Time must be later than Start Time.";
        messageElement.classList.add('bg-red-500');
        return;
    }

    const eventData = {
        name: form.eventName.value,
        club: form.clubName.value,
        date: form.eventDate.value,
        startTime: form.eventStartTime.value,
        endTime: form.eventEndTime.value,
        description: form.eventDescription.value,
        tags: form.eventTags.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0), 
        createdAt: Timestamp.now()
    };
    
    messageElement.textContent = "Posting event...";
    messageElement.classList.add('bg-indigo-500');

    if (!App.isAuthReady || !App.db) {
        messageElement.textContent = "Database connection not ready. Please wait a moment.";
        messageElement.classList.remove('bg-indigo-500');
        messageElement.classList.add('bg-red-500');
        return;
    }

    try {
        const eventsCollectionRef = collection(App.db, 'events');
        await addDoc(eventsCollectionRef, eventData);
        
        form.reset();
        messageElement.textContent = "Event successfully added!";
        messageElement.classList.remove('bg-indigo-500', 'bg-red-500');
        messageElement.classList.add('bg-green-500');
        setTimeout(() => {
            messageElement.classList.add('hidden');
        }, 3000);

    } catch (error) {
        console.error("Error adding document (PERMISSION DENIED likely): ", error);
        messageElement.textContent = `Error: ${error.message}. Check Firebase Console -> Firestore -> Rules.`;
        messageElement.classList.remove('bg-indigo-500', 'bg-green-500');
        messageElement.classList.add('bg-red-500');
    }
};

// --- UI TOGGLING AND INITIALIZATION ---
const showView = (viewId) => {
    document.getElementById('role-selection').classList.add('hidden');
    document.getElementById('student-view').classList.add('hidden');
    document.getElementById('organizer-view').classList.add('hidden');
    
    // Use 'flex' for the main container if you want it centered with Tailwind (optional)
    document.getElementById(viewId).classList.remove('hidden');
    document.getElementById(viewId).classList.add('block');
    
    if (viewId === 'student-view') {
        renderCalendar();
        renderInterests();
    }
};

const goBack = () => {
    showView('role-selection');
};

/**
 * Helper function to safely attach an event listener to an element ID.
 * Logs an error if the element is not found, preventing script crashes.
 */
const attachListener = (id, eventType, handler) => {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener(eventType, handler);
    } else {
        // This will print to your browser's console if an ID is misspelled
        console.error(`Element not found for ID: ${id}. Cannot attach listener. This is likely why the buttons are failing.`);
    }
};

// Use an event listener for the DOMContentLoaded event to ensure all elements exist before attaching listeners
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Setup
    App.currentWeekStart = getStartOfWeek(new Date());

    // 2. Attach Listeners for buttons using the safe helper
    console.log("Attempting to attach event listeners...");
    
    // Role Selection Buttons
    attachListener('btn-student', 'click', () => showView('student-view'));
    attachListener('btn-organizer', 'click', () => showView('organizer-view'));
    
    // Go Back Buttons
    attachListener('back-to-role-student', 'click', goBack);
    attachListener('back-to-role-organizer', 'click', goBack);

    // Student View Calendar/Matching buttons
    attachListener('prev-week', 'click', () => changeWeek(-1));
    attachListener('next-week', 'click', () => changeWeek(1));
    
    attachListener('find-events-btn', 'click', () => {
        console.log("--- Find Events Button Clicked ---");
        findMatchingEvents();
    });

    // Organizer Form submission
    attachListener('organizer-form', 'submit', handleOrganizerSubmit);
    
    // 3. Initialize Firebase and start listening for events
    setupFirebase();
});