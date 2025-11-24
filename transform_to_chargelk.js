const fs = require('fs');

console.log("⚡ FORCE UPDATING ChargeLK (Adding Batticaloa)...");

const writeFile = (filePath, content) => {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${filePath}`);
};

// --- 1. BACKEND (EV Station Data with Batticaloa) ---
const flaskAppCode = `
from flask import Flask, jsonify, request
from flask_cors import CORS
from geopy.distance import geodesic

app = Flask(__name__)
CORS(app)

# --- DATA STORE (EV INFRASTRUCTURE) ---
stations = [
    {"id": 1, "name": "ChargeNet - Arcade Independence", "lat": 6.9062, "lng": 79.8708, "type": "DC Fast"},
    {"id": 2, "name": "Vega Charge - Havelock City", "lat": 6.8865, "lng": 79.8668, "type": "AC Standard"},
    {"id": 3, "name": "ChargeNet - One Galle Face", "lat": 6.9296, "lng": 79.8444, "type": "DC Fast"},
    {"id": 4, "name": "KCC Charging Station", "lat": 7.2936, "lng": 80.6350, "type": "AC Standard"},
    {"id": 5, "name": "Jetwing Lighthouse Charger", "lat": 6.0535, "lng": 80.2110, "type": "DC Fast"},
    {"id": 6, "name": "North Gate Hotel Charger", "lat": 9.6660, "lng": 80.0200, "type": "AC Standard"},
    {"id": 7, "name": "Trinco Blu Charger", "lat": 8.6020, "lng": 81.2200, "type": "DC Fast"},
    {"id": 8, "name": "Welipenna Service Area", "lat": 6.4530, "lng": 80.0450, "type": "DC Fast"},
    # BATTICALOA STATION
    {"id": 9, "name": "East Lagoon Charger", "lat": 7.7170, "lng": 81.6996, "type": "AC Standard"} 
]

demand_zones = [
    {"id": 1, "name": "Port City Financial District", "lat": 6.9335, "lng": 79.8400, "density": 95},
    {"id": 2, "name": "Cinnamon Gardens", "lat": 6.9128, "lng": 79.8650, "density": 85},
    {"id": 3, "name": "Peradeniya Uni", "lat": 7.2664, "lng": 80.5930, "density": 88},
    {"id": 4, "name": "Galle Fort", "lat": 6.0260, "lng": 80.2170, "density": 92},
    {"id": 5, "name": "Nallur Temple", "lat": 9.6740, "lng": 80.0290, "density": 75},
    {"id": 6, "name": "Nilaveli Beach", "lat": 8.7020, "lng": 81.1900, "density": 80},
    # BATTICALOA HOTSPOTS
    {"id": 7, "name": "Kallady Bridge Area", "lat": 7.7130, "lng": 81.7080, "density": 78},
    {"id": 8, "name": "Batticaloa Gate", "lat": 7.7102, "lng": 81.6924, "density": 85}
]

@app.route('/api/data', methods=['GET'])
def get_map_data():
    return jsonify({
        "competitors": stations,
        "hotspots": demand_zones
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_location():
    data = request.json
    target_loc = (data['lat'], data['lng'])
    
    nearest_station_dist = 10000
    nearest_station_name = ""
    
    for st in stations:
        dist = geodesic(target_loc, (st['lat'], st['lng'])).kilometers
        if dist < nearest_station_dist:
            nearest_station_dist = dist
            nearest_station_name = st['name']

    nearest_demand_dist = 10000
    nearest_demand_name = ""
    demand_score = 0
    
    for zone in demand_zones:
        dist = geodesic(target_loc, (zone['lat'], zone['lng'])).kilometers
        if dist < nearest_demand_dist:
            nearest_demand_dist = dist
            nearest_demand_name = zone['name']
            demand_score = zone['density']

    score = demand_score
    if nearest_station_dist < 2:
        score -= 30
    elif nearest_station_dist < 5:
        score -= 10
    else:
        score += 10 
        
    if nearest_demand_dist > 5:
        score -= 40
        
    score = max(0, min(100, score))
    
    insights = []
    if score > 80:
        verdict = "Critical Gap"
        color = "green"
        insights.append("🚀 High Priority: Excellent spot for a new DC Fast Charger.")
    elif score > 50:
        verdict = "Good Expansion"
        color = "orange"
        insights.append("⚡ Viable: Moderate demand, could support an AC destination charger.")
    else:
        verdict = "Low Priority"
        color = "red"
        insights.append("⚠️ Risk: Either saturated or low demand.")
        
    insights.append(f"🔌 Nearest Station: {nearest_station_name} ({nearest_station_dist:.2f}km).")
    insights.append(f"🏙️ Demand Driver: {nearest_demand_name} ({nearest_demand_dist:.2f}km).")

    return jsonify({
        "score": int(score),
        "verdict": verdict,
        "color": color,
        "metrics": {
            "nearest_comp_dist": f"{nearest_station_dist:.2f} km",
            "nearest_hotspot": nearest_demand_name,
            "est_density": f"{demand_score}/100"
        },
        "insights": insights
    })

if __name__ == '__main__':
    print("⚡ ChargeLK Planner Backend running on port 5000")
    app.run(debug=True, port=5000)
`;

writeFile('backend/app.py', flaskAppCode);

// --- 2. FRONTEND (With Batticaloa Button) ---
const appJsx = `import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import { Zap, MapPin, BatteryCharging, TrendingUp, Search, Navigation, Info } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import L from 'leaflet';

const stationIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/markers/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const userPinIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/markers/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const LocationSelector = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

const CityFlyer = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, 12, { duration: 1.5 });
    }
  }, [target]);
  return null;
};

const App = () => {
  const [mapData, setMapData] = useState({ competitors: [], hotspots: [] });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userPin, setUserPin] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/data')
      .then(res => res.json())
      .then(data => setMapData(data))
      .catch(err => console.error("API Error:", err));
  }, []);

  const handleLocationSelect = (latlng) => {
    setUserPin(latlng);
    setLoading(true);
    setAnalysis(null);

    fetch('http://localhost:5000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: latlng.lat, lng: latlng.lng }),
    })
    .then(res => res.json())
    .then(data => {
      setAnalysis(data);
      setLoading(false);
    })
    .catch(err => setLoading(false));
  };

  const cities = [
    { name: "Colombo", coords: [6.9271, 79.8612] },
    { name: "Kandy", coords: [7.2906, 80.6337] },
    { name: "Galle", coords: [6.0535, 80.2210] },
    { name: "Jaffna", coords: [9.6615, 80.0255] },
    { name: "Trinco", coords: [8.5874, 81.2152] },
    { name: "Batticaloa", coords: [7.7170, 81.6996] }
  ];

  const getScoreColor = (score) => {
    if (score > 75) return '#10B981'; 
    if (score > 50) return '#F59E0B'; 
    return '#EF4444';
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
      
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-2xl z-20 overflow-y-auto relative">
        <div className="p-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="w-8 h-8 fill-yellow-300 text-yellow-300" /> ChargeLK
          </h1>
          <p className="text-emerald-100 text-sm mt-1 font-medium">EV Planner v2.0 (With Batticaloa)</p>
          
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
            {cities.map(city => (
              <button 
                key={city.name}
                onClick={() => setFlyTarget(city.coords)}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-bold backdrop-blur-sm transition-all whitespace-nowrap"
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-6">
          {!userPin ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-4">
              <div className="bg-emerald-50 p-6 rounded-full animate-bounce-slow">
                <MapPin className="w-12 h-12 text-emerald-300" />
              </div>
              <div>
                <p className="font-bold text-gray-600 text-lg">Plan a New Station</p>
                <p className="text-sm max-w-[200px] mx-auto">Tap any location to analyze its potential for a new EV charger.</p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-emerald-600 font-bold animate-pulse">Analyzing Grid Data...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
              
              <div className="text-center relative bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="h-40 w-full">
                  <ResponsiveContainer>
                    <RadialBarChart 
                      innerRadius="70%" 
                      outerRadius="100%" 
                      barSize={12} 
                      data={[{ value: 100, fill: '#E2E8F0' }, { value: analysis.score, fill: getScoreColor(analysis.score) }]} 
                      startAngle={180} 
                      endAngle={0}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="absolute top-20 left-0 right-0 flex flex-col items-center">
                  <span className="text-5xl font-black" style={{ color: getScoreColor(analysis.score) }}>
                    {analysis.score}
                  </span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Location Score</span>
                </div>
                <div className="mt-[-30px] text-center">
                  <span className={\`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm \${analysis.color === 'green' ? 'bg-green-500 text-white' : analysis.color === 'orange' ? 'bg-orange-500 text-white' : 'bg-red-500 text-white'}\`}>
                    {analysis.verdict}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg"><BatteryCharging className="w-5 h-5 text-blue-500" /></div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold">Nearest Charger</p>
                      <p className="text-sm font-semibold text-gray-700 truncate w-32">{analysis.metrics.nearest_comp_dist}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg"><TrendingUp className="w-5 h-5 text-purple-500" /></div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold">Demand Driver</p>
                      <p className="text-sm font-semibold text-gray-700 truncate w-32">{analysis.metrics.nearest_hotspot}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-emerald-500" /> Feasibility Report
                </h3>
                <div className="space-y-2">
                  {analysis.insights.map((insight, i) => (
                    <div key={i} className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-100 shadow-sm leading-relaxed flex gap-2">
                      <span className="text-emerald-500 font-bold">•</span> {insight}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : null}
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="h-full w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white relative">
          <MapContainer center={flyTarget} zoom={12} scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            
            <CityFlyer target={flyTarget} />
            <LocationSelector onLocationSelect={handleLocationSelect} />
            
            {mapData.competitors.map(st => (
              <Marker key={st.id} position={[st.lat, st.lng]} icon={stationIcon}>
                <Popup>
                  <strong>{st.name}</strong><br/>
                  <span className="text-xs text-gray-500">{st.type}</span>
                </Popup>
              </Marker>
            ))}

            {mapData.hotspots.map(spot => (
              <Circle 
                key={spot.id} 
                center={[spot.lat, spot.lng]} 
                pathOptions={{ fillColor: '#10B981', color: '#10B981', fillOpacity: 0.3, weight: 0 }} 
                radius={800}
              >
                 <Popup>
                  <strong>{spot.name}</strong><br/>
                  <span className="text-xs text-green-600 font-bold">High Demand Zone</span>
                 </Popup>
              </Circle>
            ))}

            {userPin && (
               <Marker position={userPin} icon={userPinIcon} opacity={0.9}>
                 <Popup>Proposed Location</Popup>
               </Marker>
            )}

          </MapContainer>
          
          <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg z-[400] text-xs space-y-2 border border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="font-medium text-gray-600">Existing Charger</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 opacity-50"></div>
              <span className="font-medium text-gray-600">High Demand Area</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="font-medium text-gray-600">Your Selection</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;`;

writeFile('frontend/src/App.jsx', appJsx);

console.log("⚡ CHARGELK UPDATED SUCCESSFULLY!");
console.log("PLEASE RESTART SERVERS NOW:");
console.log("1. Backend Terminal: Click Trash Icon -> Re-open -> cd backend -> python app.py");
console.log("2. Frontend Terminal: Click Trash Icon -> Re-open -> cd frontend -> npm run dev");
