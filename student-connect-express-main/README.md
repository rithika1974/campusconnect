🎓 CampusConnect – Student Coordination Platform

CampusConnect is a full-stack web application built to help students coordinate campus travel, request urgent help, and improve safety through real-time posting and tracking.
This project was developed as a hackathon submission focusing on practical campus-level problems.

🚀 Features Implemented
🔐 Authentication

Student registration and login

Secure authentication using Supabase

🏠 Dashboard

Central home screen with quick actions

View recent travel posts

Navigate to emergency help

🚶 Travel Coordination

Students can post travel plans (From → To, date, time, mode)

Posts are stored and displayed in a shared feed

Helps others coordinate or offer assistance

🆘 Emergency Help System

Students can raise urgent help requests

Emergency type selection (Medical, Safety, Other)

Location input and timestamped submission

🧑‍💼 Admin Emergency Panel

View all emergency requests

Track request status (Open / Resolved)

Mark emergencies as resolved

🗄️ Database Design (Supabase)

Users – student profiles and authentication

TravelPosts – travel coordination entries

EmergencyRequests – emergency reports with status tracking

Roles – admin access for emergency dashboard

🛠 Tech Stack

Frontend: React + Tailwind CSS

Backend: Express (Node.js)

Database & Auth: Supabase

Build Tool: Vite

▶️ Run Locally

Clone the repository

git clone <your-repo-url>

Install dependencies

npm install

Add environment variables
Create a .env file:

VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here

Start development server

npm run dev

🌱 Planned Enhancements

Carpool system with seat limits

Item & errand request module

Smart matching & notifications

Mobile responsiveness

Campus map integration

🎯 Project Goal

To reduce friction in daily campus life by providing a structured platform for:

travel coordination

urgent help requests

student-to-student assistance

safety communication

📦 Deployment

The project can be deployed as a static frontend with a backend API and Supabase as the database.
