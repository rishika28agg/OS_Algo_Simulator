# OS_Algo_Simulator

# 🧠 Web-Based Operating System Simulator

Simulate core Operating System concepts like Process Scheduling, Disk Scheduling, Memory Management, File Systems, and Deadlock Handling — right in your browser. This project uses Angular for the frontend and Django REST Framework for the backend.

# 📜 Project Overview

A full-stack educational simulator to help students and enthusiasts interactively learn how OS algorithms work through clean UI, real-time charts, and animated visualizations.

# 🚀 Live Demo

📹 [Demo Video (coming soon)]

🔗 [Deployed Link (not ready)]

# 🧠 Simulated OS Concepts

1. Process Scheduling
- Algorithms: FCFS, SJF, Round Robin, Priority
- Visuals: Gantt Chart, Waiting & Turnaround Time Table

2. Disk Scheduling
- Algorithms: FCFS, SSTF, SCAN, C-SCAN
- Visuals: Seek Sequence, Head Movement Animation

3. Memory Management (Paging)
- Algorithms: FIFO, LRU, Optimal
- Visuals: Page Fault Count, Frame-by-frame Animation

4. File System Allocation
- Techniques: Contiguous, Linked, Indexed
- Visuals: Block Allocation View

5. Deadlock Handling
- Algorithm: Banker's Algorithm
- Visuals: Safe/Unsafe State Tree

# 🧰 Tech Stack

Frontend - Angular 16+, TypeScript, SCSS, Chart.js, Angular Material
Backend - Django 4+, DRF, Python
Database - MySQL (for simulation history)
Tools - Postman, Docker (optional), GitHub, Trello/Notion

# 🧪 Testing & Validation

- Angular Reactive Form validation
- Unit tests in Django for each algorithm
- API testing using Postman/Swagger
- Sample test cases with expected output
- Optional CI for automated testing

# 🛠️ Setup Instructions

## Backend (Django)

- Clone the repo:

git clone https://github.com/your-org/os-simulator.git
cd os-simulator/backend

- Create virtual environment:

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

- Install requirements:

pip install -r requirements.txt

- Run migrations:

python manage.py migrate

- Start server:

python manage.py runserver

## Frontend (Angular)

cd ../frontend

- Install dependencies:

npm install

- Start dev server:

ng serve

> By default, Angular will run on `http://localhost:4200` and Django on `http://localhost:8000`

# 📁 Folder Structure

os-simulator/
├── backend/
│   ├── os_api/
│   └── manage.py
├── frontend/
│   └── src/
│       └── app/
│           ├── scheduling/
│           ├── disk/
│           ├── memory/
│           ├── filesystem/
│           └── deadlock/

# ✅ Features To Implement

- REST APIs for each simulation
- Dynamic forms and result views
- Data visualizations with Chart.js
- Export results (CSV, PDF)
- Real-time animation via WebSocket (optional)
- User login & saved simulations (optional)

# 🙌 Acknowledgements

This project is built for academic learning and is inspired by traditional OS simulators, textbooks, and hands-on labs.

# ⭐️ If you like it...

Star the repo 🌟 | Fork it 🍴 | Share it 💬 | Use it in class 👨‍🏫
