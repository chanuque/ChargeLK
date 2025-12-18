# ⚡ ChargeLK: Intelligent EV Infrastructure Planner 

<img width="1919" height="946" alt="Image" src="https://github.com/user-attachments/assets/5d2c8959-96fa-40b8-84cb-03115dbf8e9e" />

<img width="1919" height="946" alt="Image" src="https://github.com/user-attachments/assets/65801b8f-3307-459d-b936-3cd68c0773d3" />

ChargeLK is a full-stack Location Intelligence platform designed to optimize the expansion of Sri Lanka's Electric Vehicle (EV) charging network.

Unlike standard map apps that just find chargers, ChargeLK uses a geospatial scoring engine to identify critical infrastructure gaps—analyzing the distance between existing chargers (supply) and high-traffic hotspots (demand) to recommend the perfect spot for the next station.

# Key Features

🌍 Interactive Islandwide Map: Visualizes the entire EV network from Jaffna to Matara using high-performance Leaflet maps.

🧠 AI Feasibility Engine: Click any location on the map to instantly generate a Viability Score (0-100) based on proximity algorithms.

📊 Smart Visualization: Dynamic radial gauges and charts visualize demand density vs. competition saturation.

⚡ Premium UI/UX: A modern, glassmorphism-inspired interface with custom SVG markers and smooth animations.

📍 Multi-City Navigation: One-click "Fly To" navigation for major hubs like Colombo, Kandy, and Trincomalee.

# 🛠️ Tech Stack

Frontend (The Glass Cockpit)

- React.js (Vite): Lightning-fast UI rendering.

- Leaflet & React-Leaflet: Advanced mapping and custom marker layers.

- Tailwind CSS: For the polished, responsive "Glassmorphism" design.

- Recharts: Data visualization for the score gauges.

- Lucide React: Beautiful, consistent iconography.

Backend (The Geospatial Brain)

- Python (Flask): Robust REST API handling analysis requests.

- Geopy: Performs real-time geodesic distance calculations (Haversine formula).

- Pandas: Data structuring for station and hotspot management.

📦 Installation & Setup

This project follows a Monorepo structure (Frontend + Backend in one repo).

Prerequisites

- Node.js (v16+)

- Python (v3.8+)

1. Clone & Install

git clone [https://github.com/chanuque/ChargeLK](https://github.com/chanuque/ChargeLK)
cd ChargeLK


2. Setup Backend (Python)

cd backend
pip install -r requirements.txt
python app.py
// Server starts on http://localhost:5000


3. Setup Frontend (React)

(Open a new terminal)

cd frontend
npm install
npm run dev
// App opens on http://localhost:5173


# 🔮 The Logic Behind the Score

The AI Scoring Engine evaluates three key metrics:

- Demand Proximity: Is the location near a known hotspot (Mall, Hotel, Tourist Site)? (+Score)

- Competition Distance: Is there already a charger nearby? (-Score for saturation)

- Grid Gap: Is this a "desert" with no coverage? (+Score for strategic value)

Built by Chanuque 
