📅 Eventure
🚀 Hey There: What's Eventure All About?
Eventure is your all-in-one event finder designed to solve a huge headache for busy students: missing out on stuff because of scheduling conflicts or info overload. Let's face it, finding a relevant event buried in a stack of campus emails or social media posts is a pain—and often, you find it too late, only to realize it clashes with your Monday lecture.

This app cuts through the noise. It gives students a super-easy way to tell the system their unavailable hours (like classes or appointments) and their interests. Then, it instantly shows only the events that are relevant to them AND don't clash with their schedule.

✨ The Cool Stuff (Key Features)
Zero-Conflict Scheduling: You can simply click on an interactive, weekly calendar to block out hour-long slots (e.g., Monday 9 AM) as "unavailable."

Smart Matching: The app instantly filters events by matching event tags (like Technology or Food) with the interests you've picked.

Precise Time Check: It goes one step further by checking every single hour of a potential event's duration against your blocked time slots to guarantee a conflict-free match.

Easy Posting for Clubs: A separate portal lets clubs and organizers quickly submit new events, including all the need-to-know details like time, date, and relevant tags.

Pro Look: The whole app maintains a clean, professional, and consistent look, perfect for a university setting.

⚙️ The Engine Room (How It Works)
Eventure runs on clean code and a real-time database to make its quick filtering magic happen:

Database Power (Firestore): Everything posted by club organizers gets immediately saved to the Firebase Firestore database, making the data instantly available to all students.

Schedule Fingerprints (Time Key Mapping): When you click an unavailable slot, the app creates a unique string "fingerprint" called a Time Key (like 2025-10-06-09). This key is quickly stored in a memory list (App.unavailableTimes) to track your blocked hours.

Interest First: When you hit "Find Events," the app first slashes the event list down to only those where the event's tags overlap with your selected interests.

Hour-by-Hour Guard Check: For the remaining relevant events, the app runs a fast loop. It checks each hour of the event's running time, generating the corresponding Time Key and instantly checking if that key exists in your blocked list (App.unavailableTimes).

Match Result: If any hour conflicts with your schedule, the event is immediately thrown out. If all hours are clear, the event is happily displayed as a perfect match!

💻 What It's Built With (Tech Stack)
The Interface (Pure JavaScript / HTML5): Handles all the buttons, clicks, screen changes, and fundamental app rules right in your browser.

The Look (Tailwind CSS & CSS): Uses utility classes to make the UI modern, responsive, and good-looking without needing pages of custom styling code.

The Data (Google Firebase - Firestore): Serves as the reliable, real-time backend that stores and instantly updates all event data for the entire campus community.












Tools

Gemini can make mistakes, so double-check it
