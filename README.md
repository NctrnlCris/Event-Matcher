📅 Campus Connect: The Conflict-Free Event Matcher
🚀 Introduction: What is Campus Connect?
Campus Connect is a utility-first event matching tool designed to solve a critical problem for busy students: time conflict and information overload. Students often miss out on valuable club activities, networking sessions, or workshops simply because the event time clashes with their fixed schedule, or because finding relevant events buried in newsletters is too cumbersome.

This application provides a seamless experience for students to define their unavailable time slots (classes, work, appointments) and interests, instantly filtering the university's event feed to show only the events that are both relevant and conflict-free.

✨ Key Features
Conflict-Free Scheduling: Students can click and mark hour-long time blocks (e.g., Monday 9 AM - 10 AM) as "unavailable" on an interactive, weekly calendar.

Intelligent Matching: Events are filtered in real-time by checking the intersection between event tags (e.g., Technology, Finance, Food) and the user's selected interests.

Time Conflict Detection: The app runs a precise check to ensure that every hour of a matching event's duration falls within a user's available time slots for that specific day and week.

Organizer Submission Portal: A dedicated view allows clubs and organizers to easily post new events, including details like club name, date, time range, description, and relevant tags.

Static University Branding: Maintains a consistent, professional appearance across all event listings by displaying a single university logo in the results view.

⚙️ How It Works
Campus Connect leverages clean data structures and real-time database capabilities to execute fast filtering logic:

Data Persistence (Firestore): All events submitted by organizers are immediately stored in the Firebase Firestore database.

Time Key Mapping: When a student marks a time slot, the application generates a unique string key (e.g., 2025-10-06-09 for October 6th, 9 AM). These keys are stored in a JavaScript object (App.unavailableTimes) for instant O(1) lookups.

Interest & Tag Check: When the user clicks "Find Events," the application first filters the event list down to those where at least one event tag matches at least one user interest.

Hourly Conflict Check: For the remaining matching events, the app iterates from the event's startTime up to its endTime. For each hour in that range, it generates the corresponding "Time Key" and checks if it exists in the user's App.unavailableTimes object.

If any event hour is found in the user's unavailable list, the event is discarded.

If all hours pass the check, the event is displayed as a successful match.

💻 Tech Stack
Frontend Framework (Pure JavaScript / HTML5): Handles all user interaction, DOM manipulation, and core application logic.

Styling & Design (Tailwind CSS): Provides the utility-first classes for a fully responsive, modern, and aesthetic UI without writing custom CSS.

Database & Backend (Google Firebase - Firestore): Used for real-time, persistent storage of all organizer-submitted events.

Authentication (Google Firebase - Auth): Used for managing secure user sessions, including anonymous sign-in for quick access and custom token support.
