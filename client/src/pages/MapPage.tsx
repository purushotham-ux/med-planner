import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import api from '../lib/api';
import type { Doctor, Plan, ApiResponse } from '../types';
import { getSpecialityLabel, GRADE_COLORS } from '../types';
import {
  Locate, Navigation2, ChevronUp, ChevronDown,
  Building2, Phone, Star, Filter, ExternalLink
} from 'lucide-react';
import { clsx } from 'clsx';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createGradeIcon(grade: string): L.DivIcon {
  const color = GRADE_COLORS[grade as keyof typeof GRADE_COLORS] || '#64748b';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 30px; height: 30px; border-radius: 50%;
      background: ${color}; border: 3px solid white;
      box-shadow: 0 2px 12px rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 11px; font-weight: 700;
      font-family: Inter, system-ui, sans-serif;
    ">${grade}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
}

const currentLocationIcon = L.divIcon({
  className: 'current-location-marker',
  html: `<div style="
    width: 18px; height: 18px; border-radius: 50%;
    background: #3b82f6; border: 3px solid white;
    box-shadow: 0 0 0 6px rgba(59,130,246,0.2), 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function FlyTo({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { duration: 1 }); }, [center, zoom, map]);
  return null;
}

export function MapPage() {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [nearbyRadius, setNearbyRadius] = useState(2);
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.9716, 77.5946]);
  const [mapZoom, setMapZoom] = useState(12);
  const [showFilters, setShowFilters] = useState(false);
  const [gradeFilters, setGradeFilters] = useState<Set<string>>(new Set(['A', 'B', 'C']));
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Fetch doctors
  const { data: allDoctors = [] } = useQuery({
    queryKey: ['doctors-map'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Doctor[]>>('/doctors?limit=500');
      return data.data.filter((d) => d.latitude && d.longitude);
    },
  });

  // Fetch today's plan for route display
  const { data: todayPlans } = useQuery({
    queryKey: ['plans-today-map'],
    queryFn: async () => {
      const from = new Date(); from.setHours(0, 0, 0, 0);
      const to = new Date(); to.setHours(23, 59, 59, 999);
      const { data } = await api.get<ApiResponse<Plan[]>>(
        `/plans?from=${from.toISOString()}&to=${to.toISOString()}`,
      );
      return data.data;
    },
  });

  const todayPlan = todayPlans?.[0];
  const routeCoords = useMemo(() => {
    if (!todayPlan?.items) return [];
    return todayPlan.items
      .filter((i) => i.doctor?.latitude && i.doctor?.longitude)
      .sort((a, b) => a.order - b.order)
      .map((i) => [i.doctor!.latitude!, i.doctor!.longitude!] as [number, number]);
  }, [todayPlan]);

  // Filter doctors
  const doctors = useMemo(() => {
    let list = allDoctors;
    if (gradeFilters.size < 3) list = list.filter((d) => gradeFilters.has(d.grade));
    if (favoritesOnly) list = list.filter((d) => d.favorite);
    return list;
  }, [allDoctors, gradeFilters, favoritesOnly]);

  // GPS
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Nearby
  const nearbyDoctors = useMemo(() => {
    if (!userLocation) return [];
    return doctors
      .map((d) => ({ ...d, distance: haversine(userLocation[0], userLocation[1], d.latitude!, d.longitude!) }))
      .filter((d) => d.distance <= nearbyRadius)
      .sort((a, b) => a.distance - b.distance);
  }, [doctors, userLocation, nearbyRadius]);

  const toggleGrade = (g: string) => {
    setGradeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(g)) { if (next.size > 1) next.delete(g); } else { next.add(g); }
      return next;
    });
  };

  return (
    <div className="relative h-[calc(100dvh-72px)] flex flex-col">
      <div className="flex-1 relative">
        <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full z-0" zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyTo center={mapCenter} zoom={mapZoom} />

          {/* Doctor markers */}
          {doctors.map((doc) => (
            <Marker key={doc.id} position={[doc.latitude!, doc.longitude!]} icon={createGradeIcon(doc.grade)}>
              <Popup>
                <div className="min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">{doc.name}</span>
                    {doc.favorite && <Star size={12} className="text-amber-400" fill="currentColor" />}
                  </div>
                  <p className="text-xs opacity-80 mb-1">{getSpecialityLabel(doc.speciality)} • Grade {doc.grade}</p>
                  {doc.hospital && (
                    <p className="text-xs opacity-60 flex items-center gap-1 mb-1"><Building2 size={10} /> {doc.hospital}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => navigate(`/doctors/${doc.id}`)}
                      className="text-xs px-2 py-1 rounded-lg" style={{ background: '#1e293b', color: 'white', minHeight: 'auto', minWidth: 'auto' }}>
                      Profile
                    </button>
                    <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${doc.latitude},${doc.longitude}&travelmode=driving`, '_blank')}
                      className="text-xs px-2 py-1 rounded-lg flex items-center gap-1" style={{ background: '#0891b2', color: 'white', minHeight: 'auto', minWidth: 'auto' }}>
                      <Navigation2 size={10} /> Go
                    </button>
                    {doc.phone && (
                      <a href={`tel:${doc.phone}`} className="text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                        style={{ background: '#1e293b', color: 'white', minHeight: 'auto', minWidth: 'auto' }}>
                        <Phone size={10} /> Call
                      </a>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Route polyline */}
          {routeCoords.length > 1 && (
            <Polyline
              positions={routeCoords}
              pathOptions={{ color: '#f59e0b', weight: 3, opacity: 0.7, dashArray: '8, 8' }}
            />
          )}

          {/* Current location */}
          {userLocation && (
            <>
              <Marker position={userLocation} icon={currentLocationIcon}>
                <Popup><span className="font-medium text-sm">You are here</span></Popup>
              </Marker>
              <Circle center={userLocation} radius={nearbyRadius * 1000}
                pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.06, weight: 1 }}
              />
            </>
          )}
        </MapContainer>

        {/* Controls */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
          <button onClick={() => { if (userLocation) { setMapCenter(userLocation); setMapZoom(15); } }}
            className="w-10 h-10 glass rounded-xl flex items-center justify-center text-teal-400 shadow-lg">
            <Locate size={18} />
          </button>
          <button onClick={() => setShowFilters(!showFilters)}
            className={clsx('w-10 h-10 glass rounded-xl flex items-center justify-center shadow-lg', showFilters ? 'text-teal-400' : 'text-navy-400')}>
            <Filter size={18} />
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="absolute top-3 left-3 z-[1000] glass rounded-xl p-3 animate-scale-in space-y-2.5 min-w-[160px]">
            <p className="text-[10px] font-semibold text-navy-400 uppercase">Filters</p>
            <div className="flex gap-1.5">
              {['A', 'B', 'C'].map((g) => (
                <button key={g} onClick={() => toggleGrade(g)}
                  className={clsx('w-8 h-8 rounded-lg text-xs font-bold min-h-0 min-w-0 transition-all', gradeFilters.has(g)
                    ? 'text-white' : 'bg-navy-800/50 text-navy-500')}
                  style={gradeFilters.has(g) ? { backgroundColor: `${GRADE_COLORS[g as keyof typeof GRADE_COLORS]}30`, color: GRADE_COLORS[g as keyof typeof GRADE_COLORS] } : undefined}>
                  {g}
                </button>
              ))}
            </div>
            <button onClick={() => setFavoritesOnly(!favoritesOnly)}
              className={clsx('flex items-center gap-1.5 text-xs font-medium py-1 min-h-0', favoritesOnly ? 'text-amber-400' : 'text-navy-400')}>
              <Star size={12} fill={favoritesOnly ? 'currentColor' : 'none'} /> Favorites only
            </button>
            <select value={nearbyRadius} onChange={(e) => setNearbyRadius(Number(e.target.value))}
              className="w-full bg-navy-800/60 rounded-lg px-2 py-1.5 text-xs text-navy-200 outline-none min-h-0">
              <option value={1}>Radius: 1 km</option>
              <option value={2}>Radius: 2 km</option>
              <option value={5}>Radius: 5 km</option>
              <option value={10}>Radius: 10 km</option>
            </select>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] glass rounded-xl px-3 py-2 flex items-center gap-3">
          {['A', 'B', 'C'].map((g) => (
            <div key={g} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GRADE_COLORS[g as keyof typeof GRADE_COLORS] }} />
              <span className="text-[10px] text-navy-300 font-medium">{g}</span>
            </div>
          ))}
          <span className="text-[10px] text-navy-500">|</span>
          <span className="text-[10px] text-navy-400">{doctors.length} shown</span>
        </div>

        {/* Route badge */}
        {routeCoords.length > 1 && (
          <div className="absolute bottom-3 right-3 z-[1000]">
            <button onClick={() => {
              const todayPending = todayPlan?.items.filter((i) => i.status === 'PENDING' && i.doctor?.latitude && i.doctor?.longitude) || [];
              if (todayPending.length === 0) return;
              const pts = todayPending.map((i) => `${i.doctor!.latitude},${i.doctor!.longitude}`);
              const dest = pts[pts.length - 1];
              const wp = pts.slice(0, -1).join('|');
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}${wp ? `&waypoints=${wp}` : ''}&travelmode=driving`, '_blank');
            }}
              className="glass rounded-xl px-3 py-2 flex items-center gap-1.5 text-teal-400 text-xs font-medium shadow-lg">
              <ExternalLink size={12} /> Navigate Route
            </button>
          </div>
        )}
      </div>

      {/* Nearby Panel Toggle */}
      <button onClick={() => setShowPanel(!showPanel)}
        className="w-full glass py-2.5 flex items-center justify-center gap-2 text-sm text-navy-300 font-medium">
        {showPanel ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        {nearbyDoctors.length} Nearby ({nearbyRadius}km)
      </button>

      {/* Nearby Panel */}
      {showPanel && (
        <div className="max-h-[35vh] overflow-y-auto bg-navy-900/95 animate-slide-up">
          {!userLocation ? (
            <div className="p-4 text-center text-navy-500 text-sm">Enable location to see nearby doctors</div>
          ) : nearbyDoctors.length === 0 ? (
            <div className="p-4 text-center text-navy-500 text-sm">No doctors within {nearbyRadius}km</div>
          ) : (
            <div className="divide-y divide-navy-800/50">
              {nearbyDoctors.map((doc) => (
                <div key={doc.id}
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-navy-800/40 transition-colors active:scale-[0.98]"
                  onClick={() => { setMapCenter([doc.latitude!, doc.longitude!]); setMapZoom(16); setShowPanel(false); }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: `${GRADE_COLORS[doc.grade]}15`, color: GRADE_COLORS[doc.grade] }}>
                    {doc.grade}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{doc.name}</p>
                    <p className="text-[10px] text-navy-400 truncate">{getSpecialityLabel(doc.speciality)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-teal-400">
                      {doc.distance < 1 ? `${Math.round(doc.distance * 1000)}m` : `${doc.distance.toFixed(1)}km`}
                    </p>
                    <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/dir/?api=1&destination=${doc.latitude},${doc.longitude}&travelmode=driving`, '_blank'); }}
                      className="text-[10px] text-teal-400/80 flex items-center gap-0.5 mt-0.5 min-h-0 min-w-0">
                      <Navigation2 size={9} /> Go
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
