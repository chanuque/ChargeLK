import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import { Zap, MapPin, BatteryCharging, TrendingUp, Search, Info, Navigation, Menu, X, Star } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';

// --- PREMIUM CUSTOM MARKERS (SVG GENERATION) ---
// This creates icons using code, so they NEVER fail to load.

const createCustomIcon = (type) => {
  const isFast = type === 'DC Fast';
  const colorClass = isFast ? 'text-emerald-600' : 'text-blue-600';
  const bgClass = isFast ? 'bg-emerald-50' : 'bg-blue-50';
  const borderClass = isFast ? 'border-emerald-500' : 'border-blue-500';
  
  const iconMarkup = renderToStaticMarkup(
    <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 ${borderClass} ${bgClass} shadow-xl transform transition-transform hover:scale-110`}>
      <Zap className={`w-6 h-6 ${colorClass} fill-current`} />
      {/* Little arrow pointer at bottom */}
      <div className={`absolute -bottom-1 w-2 h-2 ${borderClass} ${bgClass} border-r border-b rotate-45 bg-white`}></div>
    </div>
  );

  return L.divIcon({
    html: iconMarkup,
    className: 'custom-marker-icon', // Styles in index.css handle transparency
    iconSize: [40, 40],
    iconAnchor: [20, 44], // Center bottom
    popupAnchor: [0, -44],
  });
};

const userLocationIcon = L.divIcon({
  html: renderToStaticMarkup(
    <div className="relative flex items-center justify-center w-8 h-8">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-red-500 border-2 border-white shadow-md">
        <MapPin className="w-5 h-5 text-white" />
      </div>
    </div>
  ),
  className: 'custom-marker-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// --- COMPONENTS ---

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
      map.flyTo(target, 13, { duration: 2, easeLinearity: 0.5 });
    }
  }, [target]);
  return null;
};

// --- MAIN APP ---

const App = () => {
  const [mapData, setMapData] = useState({ competitors: [], hotspots: [] });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userPin, setUserPin] = useState(null);
  const [flyTarget, setFlyTarget] = useState([6.9271, 79.8612]); // Colombo
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/data')
      .then(res => res.json())
      .then(data => {
        const stations = data.competitors || data.stations || [];
        const hotspots = data.hotspots || [];
        setMapData({ competitors: stations, hotspots: hotspots });
      })
      .catch(err => console.error("API Error:", err));
  }, []);

  const handleLocationSelect = (latlng) => {
    setUserPin(latlng);
    setLoading(true);
    setAnalysis(null);
    if (!isSidebarOpen) setIsSidebarOpen(true);

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
    .catch(err => {
      console.error("Analysis Error", err);
      setLoading(false);
    });
  };

  const cities = [
    { name: "Colombo", coords: [6.9271, 79.8612] },
    { name: "Kandy", coords: [7.2906, 80.6337] },
    { name: "Galle", coords: [6.0535, 80.2210] },
    { name: "Jaffna", coords: [9.6615, 80.0255] },
    { name: "Trinco", coords: [8.5874, 81.2152] },
    { name: "Batticaloa", coords: [7.7170, 81.6996] },
    { name: "Highway", coords: [6.4530, 80.0450] }
  ];

  const getScoreColor = (score) => {
    if (score > 75) return '#10B981';
    if (score > 50) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-slate-100">
      
      {/* SIDEBAR */}
      <aside 
        className={`absolute top-0 left-0 h-full bg-white/95 backdrop-blur-xl shadow-2xl z-[1000] transition-all duration-500 ease-in-out border-r border-white/20 flex flex-col ${isSidebarOpen ? 'w-full md:w-[420px] translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 bg-slate-900 text-white shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform rotate-12 scale-150 pointer-events-none">
            <Zap className="w-48 h-48 text-emerald-400" />
          </div>
          
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/30">
                <Zap className="w-6 h-6 text-white fill-current" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">ChargeLK</h1>
                <p className="text-emerald-400 text-xs font-medium uppercase tracking-wider">Network Planner Pro</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-white/10 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mt-8">
            <p className="text-slate-400 text-xs font-semibold uppercase mb-3">Quick Jump</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
              {cities.map(city => (
                <button 
                  key={city.name}
                  onClick={() => setFlyTarget(city.coords)}
                  className="snap-start shrink-0 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-xs font-medium transition-all hover:scale-105 active:scale-95"
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {!userPin ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-fade-in-up">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-100 rounded-full opacity-50 animate-ping"></div>
                <div className="relative bg-white p-6 rounded-full shadow-xl border border-emerald-100">
                  <MapPin className="w-12 h-12 text-emerald-500" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Ready to Scout</h2>
                <p className="text-slate-500 mt-2 max-w-[260px] mx-auto leading-relaxed">
                  Select any location on the map to generate a comprehensive EV infrastructure analysis.
                </p>
              </div>
            </div>
          ) : loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <Zap className="absolute inset-0 m-auto w-8 h-8 text-emerald-500 animate-pulse" />
              </div>
              <p className="text-slate-600 font-medium animate-pulse">Analyzing Grid Data...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-8 animate-fade-in-up">
              
              {/* SCORE CARD */}
              <div className="relative bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20" style={{ color: getScoreColor(analysis.score) }}></div>
                
                <div className="text-center mb-6">
                  <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                    analysis.color === 'green' ? 'bg-emerald-100 text-emerald-700' : 
                    analysis.color === 'orange' ? 'bg-amber-100 text-amber-700' : 
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {analysis.color === 'green' && <Star className="w-4 h-4 fill-current" />}
                    {analysis.verdict}
                  </span>
                </div>

                <div className="h-40 -mt-4 -mb-4">
                  <ResponsiveContainer>
                    <RadialBarChart 
                      innerRadius="75%" 
                      outerRadius="100%" 
                      barSize={16} 
                      data={[{ value: 100, fill: '#f1f5f9' }, { value: analysis.score, fill: getScoreColor(analysis.score) }]} 
                      startAngle={180} 
                      endAngle={0}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background={{ fill: '#f8fafc' }} dataKey="value" cornerRadius={999} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="text-center -mt-20 mb-4">
                  <div className="text-6xl font-black tracking-tight" style={{ color: getScoreColor(analysis.score) }}>
                    {analysis.score}
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Viability Score</p>
                </div>
              </div>

              {/* METRICS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><BatteryCharging className="w-5 h-5" /></div>
                    <span className="text-xs font-bold text-slate-400">NEARBY</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{analysis.metrics.nearest_comp_dist}</p>
                  <p className="text-xs text-slate-500 mt-1">to nearest charger</p>
                </div>
                
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><TrendingUp className="w-5 h-5" /></div>
                    <span className="text-xs font-bold text-slate-400">DEMAND</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{analysis.metrics.est_density}</p>
                  <p className="text-xs text-slate-500 mt-1">traffic density score</p>
                </div>
              </div>

              {/* INSIGHTS */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4 uppercase tracking-wider">
                  <Info className="w-4 h-4 text-emerald-500" /> Intelligence Report
                </h3>
                <div className="space-y-3">
                  {analysis.insights.map((insight, i) => (
                    <div key={i} className="group flex gap-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all">
                      <div className="shrink-0 w-1 h-full bg-slate-200 rounded-full group-hover:bg-emerald-400 transition-colors"></div>
                      <p className="text-sm text-slate-600 leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : null}
        </div>
      </aside>

      {/* --- TOGGLE BUTTON (MOBILE) --- */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-4 left-4 z-[1000] bg-white p-3 rounded-xl shadow-xl text-slate-700 hover:text-emerald-600 transition-colors md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* --- MAP AREA --- */}
      <div className="flex-1 relative h-full w-full">
        <MapContainer 
            center={flyTarget} 
            zoom={12} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false} 
        >
          {/* CartoDB Voyager Tiles for a cleaner, premium look */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          <CityFlyer target={flyTarget} />
          <LocationSelector onLocationSelect={handleLocationSelect} />
          
          {/* CUSTOM SVG MARKERS */}
          {mapData.competitors.map(st => (
            <Marker key={st.id} position={[st.lat, st.lng]} icon={createCustomIcon(st.type)}>
              <Popup className="custom-popup">
                <div className="font-sans text-center p-1">
                  <strong className="block text-sm mb-1">{st.name}</strong>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${st.type === 'DC Fast' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {st.type}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Hotspot Heatmap (Circles) */}
          {mapData.hotspots.map(spot => (
            <Circle 
              key={spot.id} 
              center={[spot.lat, spot.lng]} 
              pathOptions={{ fillColor: '#10B981', color: 'transparent', fillOpacity: 0.15 }} 
              radius={1200}
            />
          ))}

          {/* Selected User Pin */}
          {userPin && <Marker position={userPin} icon={userLocationIcon} />}

        </MapContainer>
        
        {/* Floating Map Controls (Zoom & Legend) */}
        <div className="absolute bottom-8 right-8 z-[1000] flex flex-col gap-4 items-end pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/20 pointer-events-auto w-64 animate-fade-in-up">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Map Key</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full border-2 border-emerald-500 bg-emerald-100"></div>
                  <span className="text-sm font-medium text-slate-600">DC Fast Charger</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-blue-100"></div>
                  <span className="text-sm font-medium text-slate-600">AC Standard</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 opacity-20"></div>
                  <span className="text-sm font-medium text-slate-600">High Demand Zone</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;