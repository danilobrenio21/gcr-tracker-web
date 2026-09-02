// Navotas Central Hub baseline
const NAVOTAS_CENTER = [14.6545, 120.9485];

// Initialize Map
const map = L.map('map').setView(NAVOTAS_CENTER, 12);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  maxZoom: 19
}).addTo(map);

// Multi-drop fleet data
let fleetData = [
  {
    id: 'REEFER-01',
    plate: 'NDG-4421',
    driver: 'Danilo B.',
    cargo: 'Frozen Bangus & Tilapia Blocks (1.8T)',
    temp: -19.2,
    lat: 14.6560,
    lng: 120.9520,
    speed: 34,
    currentStopIndex: 0,
    stops: [
      { name: 'Balintawak Market Stall #14', lat: 14.6575, lng: 121.0025, status: 'In Transit', targetEtaMin: 12 },
      { name: 'Munoz Wet Market Cold Bay', lat: 14.6580, lng: 121.0200, status: 'Pending', targetEtaMin: 28 },
      { name: 'Commonwealth Seafood Depot', lat: 14.6900, lng: 121.0800, status: 'Pending', targetEtaMin: 45 }
    ]
  },
  {
    id: 'REEFER-02',
    plate: 'CBC-8902',
    driver: 'Reynaldo S.',
    cargo: 'Imported Pork Belly & Beef (2.2T)',
    temp: -18.4,
    lat: 14.6390,
    lng: 120.9850,
    speed: 26,
    currentStopIndex: 1,
    stops: [
      { name: 'Divisoria Frozen Wholesale', lat: 14.6040, lng: 120.9720, status: 'Completed', targetEtaMin: 0 },
      { name: 'Espana Commissary Bay 2', lat: 14.6120, lng: 120.9930, status: 'In Transit', targetEtaMin: 8 },
      { name: 'Cubao Supermarket Central', lat: 14.6200, lng: 121.0520, status: 'Pending', targetEtaMin: 32 }
    ]
  },
  {
    id: 'REEFER-03',
    plate: 'TGC-1198',
    driver: 'Arnel M.',
    cargo: 'Fresh Live Shellfish (Tahong/Talaba)',
    temp: 2.5,
    lat: 14.6545,
    lng: 120.9485,
    speed: 0,
    currentStopIndex: 0,
    stops: [
      { name: 'Farmer\'s Market Cubao', lat: 14.6210, lng: 121.0530, status: 'Loading at Hub', targetEtaMin: 55 },
      { name: 'Pasig Mega Market Stall 8', lat: 14.5580, lng: 121.0840, status: 'Pending', targetEtaMin: 80 }
    ]
  }
];

const markers = {};
const routePolylines = {};
const listContainer = document.getElementById('fleet-list');

// Calculate straight-line rough distance & ETA
function calculateETA(lat1, lon1, lat2, lon2, speedKmH) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const effectiveSpeed = speedKmH > 10 ? speedKmH : 25; // fallback average city speed
  const minutes = Math.round((d / effectiveSpeed) * 60);
  return { distanceKm: d.toFixed(1), etaMinutes: minutes };
}

// Render Admin View
function renderAdminDashboard() {
  listContainer.innerHTML = '';

  fleetData.forEach((truck) => {
    const activeStop = truck.stops[truck.currentStopIndex] || truck.stops[truck.stops.length - 1];
    const completedStops = truck.stops.filter(s => s.status === 'Completed').length;
    const etaInfo = calculateETA(truck.lat, truck.lng, activeStop.lat, activeStop.lng, truck.speed);

    // Update or create Map Marker
    if (!markers[truck.id]) {
      markers[truck.id] = L.marker([truck.lat, truck.lng]).addTo(map);
    } else {
      markers[truck.id].setLatLng([truck.lat, truck.lng]);
    }

    markers[truck.id].bindPopup(`
      <div style="min-width: 190px;">
        <div style="font-weight:bold; color:#4AADE3;">${truck.id} (${truck.plate})</div>
        <div style="font-size:12px; margin-top:3px; color:#e2e8f0;"><b>Driver:</b> ${truck.driver}</div>
        <div style="font-size:12px; color:#e2e8f0;"><b>Next Drop:</b> ${activeStop.name}</div>
        <div style="font-size:12px; color:#38bdf8;"><b>ETA:</b> ~${etaInfo.etaMinutes} mins (${etaInfo.distanceKm} km)</div>
        <div style="font-size:11px; color:#94a3b8; margin-top:4px;"><b>Cargo Temp:</b> ${truck.temp}°C</div>
      </div>
    `);

    // Draw route line to next stop
    const pathCoords = [[truck.lat, truck.lng], [activeStop.lat, activeStop.lng]];
    if (!routePolylines[truck.id]) {
      routePolylines[truck.id] = L.polyline(pathCoords, { color: '#4AADE3', weight: 3, dashArray: '6, 6' }).addTo(map);
    } else {
      routePolylines[truck.id].setLatLngs(pathCoords);
    }

    // Sidebar Card
    const card = document.createElement('div');
    card.className = "p-4 rounded-xl border border-gcr-border bg-gcr-card hover:border-gcr transition cursor-pointer shadow-sm group";
    card.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <span class="font-bold text-base text-white group-hover:text-gcr transition">${truck.id}</span>
        <span class="text-xs px-2.5 py-0.5 rounded-full font-medium bg-sky-500/10 text-gcr border border-gcr/30">
          ${completedStops}/${truck.stops.length} Delivered
        </span>
      </div>

      <div class="text-xs text-slate-300 space-y-1.5">
        <p class="text-[11px] text-slate-400 truncate">📦 ${truck.cargo}</p>
        <p class="flex justify-between"><span class="text-slate-400">Driver:</span> <span class="text-white">${truck.driver}</span></p>
        <p class="flex justify-between"><span class="text-slate-400">Cargo Temp:</span> <span class="text-sky-300 font-medium">${truck.temp}°C</span></p>
        <div class="mt-2 pt-2 border-t border-gcr-border/60">
          <p class="text-[11px] text-slate-400 font-semibold">📍 NEXT STOP:</p>
          <p class="text-white font-medium truncate">${activeStop.name}</p>
          <p class="text-emerald-400 font-semibold mt-0.5">ETA: ~${etaInfo.etaMinutes} mins (${etaInfo.distanceKm} km away)</p>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      map.flyTo([truck.lat, truck.lng], 14, { animate: true, duration: 1 });
      markers[truck.id].openPopup();
    });

    listContainer.appendChild(card);
  });
}

// Mode Toggle Handling
const tabAdmin = document.getElementById('tab-admin');
const tabDriver = document.getElementById('tab-driver');
const viewAdmin = document.getElementById('view-admin');
const viewDriver = document.getElementById('view-driver');

tabAdmin.addEventListener('click', () => {
  tabAdmin.className = "px-4 py-1.5 rounded-lg text-xs font-semibold bg-gcr text-white shadow-sm transition";
  tabDriver.className = "px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition";
  viewAdmin.classList.remove('hidden');
  viewDriver.classList.add('hidden');
  map.invalidateSize();
});

tabDriver.addEventListener('click', () => {
  tabDriver.className = "px-4 py-1.5 rounded-lg text-xs font-semibold bg-gcr text-white shadow-sm transition";
  tabAdmin.className = "px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition";
  viewAdmin.classList.add('hidden');
  viewDriver.classList.remove('hidden');
  renderDriverStops();
});

// Driver View: Render Stops for Selected Truck
const driverSelect = document.getElementById('driver-truck-select');
const driverStopsContainer = document.getElementById('driver-stops-list');

function renderDriverStops() {
  const selectedTruckId = driverSelect.value;
  const truck = fleetData.find(t => t.id === selectedTruckId);
  driverStopsContainer.innerHTML = '';

  truck.stops.forEach((stop, index) => {
    const isCurrent = index === truck.currentStopIndex;
    const isDone = stop.status === 'Completed';

    const stopCard = document.createElement('div');
    stopCard.className = `p-4 rounded-xl border ${isCurrent ? 'border-gcr bg-gcr/10' : 'border-gcr-border bg-gcr-card'} flex items-center justify-between gap-3`;
    
    stopCard.innerHTML = `
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold ${isDone ? 'text-slate-500 line-through' : 'text-white'}">Stop ${index + 1}: ${stop.name}</span>
          ${isCurrent ? '<span class="text-[10px] bg-gcr text-white font-bold px-1.5 py-0.2 rounded">NEXT</span>' : ''}
        </div>
        <p class="text-[11px] text-slate-400 mt-0.5">Status: <span class="${isDone ? 'text-emerald-400 font-medium' : 'text-slate-300'}">${stop.status}</span></p>
      </div>
      <div>
        ${isCurrent ? `
          <button onclick="markStopCompleted('${truck.id}', ${index})" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition">
            Mark Delivered
          </button>
        ` : isDone ? '<span class="text-xs text-emerald-400 font-bold">✓ Done</span>' : '<span class="text-xs text-slate-500">Upcoming</span>'}
      </div>
    `;
    driverStopsContainer.appendChild(stopCard);
  });
}

driverSelect.addEventListener('change', renderDriverStops);

// Mark Stop Delivered function
window.markStopCompleted = function(truckId, stopIndex) {
  const truck = fleetData.find(t => t.id === truckId);
  truck.stops[stopIndex].status = 'Completed';
  if (truck.currentStopIndex < truck.stops.length - 1) {
    truck.currentStopIndex += 1;
    truck.stops[truck.currentStopIndex].status = 'In Transit';
  }
  renderDriverStops();
  renderAdminDashboard();
};

// Driver GPS Broadcasting
let watchId = null;
const btnGps = document.getElementById('btn-toggle-gps');
const gpsStatusBadge = document.getElementById('gps-status-badge');
const telemetryBox = document.getElementById('driver-telemetry');
const coordsText = document.getElementById('telemetry-coords');
const speedText = document.getElementById('telemetry-speed');

btnGps.addEventListener('click', () => {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    btnGps.innerHTML = '<span>📡</span> Start Sharing Live GPS';
    btnGps.className = "w-full py-3 rounded-xl font-bold text-sm bg-gcr hover:bg-gcr-dark text-white shadow-lg transition flex items-center justify-center gap-2";
    gpsStatusBadge.className = "px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700";
    gpsStatusBadge.innerText = 'GPS Offline';
    telemetryBox.classList.add('hidden');
  } else {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    gpsStatusBadge.className = "px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    gpsStatusBadge.innerText = 'GPS Live Broadcasting';
    btnGps.innerHTML = '<span>⏹️</span> Stop Sharing GPS';
    btnGps.className = "w-full py-3 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-lg transition flex items-center justify-center gap-2";
    telemetryBox.classList.remove('hidden');

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const spd = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0;

        coordsText.innerText = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        speedText.innerText = `${spd} km/h`;

        // Update selected truck coordinates in memory
        const selectedTruckId = driverSelect.value;
        const truck = fleetData.find(t => t.id === selectedTruckId);
        if (truck) {
          truck.lat = lat;
          truck.lng = lng;
          truck.speed = spd;
          renderAdminDashboard();
        }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }
});

// Initial run
renderAdminDashboard();
