
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
