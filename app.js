// Navotas Central Hub baseline
const NAVOTAS_CENTER = [14.6545, 120.9485];

// Initialize Map
const map = L.map('map').setView(NAVOTAS_CENTER, 12);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  maxZoom: 19
}).addTo(map);

// Fleet & Multi-Drop Initial Data
let fleetData = [
  {
    id: 'REEFER-01',
    plate: 'NDG-4421',
    driver: 'Danilo B.',
    cargo: 'Frozen Bangus & Tilapia Blocks',
    temp: -19.2,
    lat: 14.6560,
    lng: 120.9520,
    speed: 34,
    currentStopIndex: 0,
    stops: [
      { name: 'Balintawak Market Stall #14', lat: 14.6575, lng: 121.0025, status: 'In Transit' },
      { name: 'Muñoz Wet Market Cold Bay', lat: 14.6580, lng: 121.0200, status: 'Pending' },
      { name: 'Commonwealth Seafood Depot', lat: 14.6900, lng: 121.0800, status: 'Pending' }
    ]
  },
  {
    id: 'REEFER-02',
    plate: 'CBC-8902',
    driver: 'Reynaldo S.',
    cargo: 'Imported Pork Belly & Beef Cuts',
    temp: -18.4,
    lat: 14.6390,
    lng: 120.9850,
    speed: 26,
    currentStopIndex: 1,
    stops: [
      { name: 'Divisoria Frozen Wholesale', lat: 14.6040, lng: 120.9720, status: 'Completed' },
      { name: 'España Commissary Bay 2', lat: 14.6120, lng: 120.9930, status: 'In Transit' },
      { name: 'Cubao Supermarket Central', lat: 14.6200, lng: 121.0520, status: 'Pending' }
    ]
  },
  {
    id: 'REEFER-03',
    plate: 'TGC-1198',
    driver: 'Arnel M.',
    cargo: 'Fresh Live Shells (Tahong & Talaba)',
    temp: 2.5,
    lat: 14.6545,
    lng: 120.9485,
    speed: 0,
    currentStopIndex: 0,
    stops: [
      { name: 'Farmer\'s Market Cubao', lat: 14.6210, lng: 121.0530, status: 'Loading at Hub' },
      { name: 'Pasig Mega Market Stall 8', lat: 14.5580, lng: 121.0840, status: 'Pending' }
    ]
  }
];

const markers = {};
const routePolylines = {};

// ==================== DRAWER CONTROLS ====================
window.openDrawer = function() {
  document.getElementById('nav-drawer').classList.add('open');
  document.getElementById('drawer-backdrop').classList.add('open');
};

window.closeDrawer = function() {
  document.getElementById('nav-drawer').classList.remove('open');
  document.getElementById('drawer-backdrop').classList.remove('open');
};

// ==================== PAGE ROUTER ====================
window.navigatePage = function(pageId, pageTitle) {
  // Hide all sections
  document.querySelectorAll('.page-content').forEach(el => el.classList.add('hidden'));

  // Reveal selected section
  const targetPage = document.getElementById(pageId);
  if (targetPage) targetPage.classList.remove('hidden');

  document.getElementById('page-subtitle').innerText = pageTitle;

  // Viewport refreshes per page
  if (pageId === 'page-map') {
    setTimeout(() => map.invalidateSize(), 200);
  } else if (pageId === 'page-routes') {
    renderRoutesTable();
  } else if (pageId === 'page-driver') {
    renderDriverStops();
  } else if (pageId === 'page-coldchain') {
    renderColdChainCards();
  }

  window.closeDrawer();
};

// ==================== CALCULATION HELPERS ====================
function calculateETA(lat1, lon1, lat2, lon2, speedKmH) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const effectiveSpeed = speedKmH > 10 ? speedKmH : 25; // default urban transit speed
  const minutes = Math.round((d / effectiveSpeed) * 60);
  return { distanceKm: d.toFixed(1), etaMinutes: minutes };
}

// ==================== PAGE 1: ADMIN MAP ====================
function renderAdminDashboard() {
  const listContainer = document.getElementById('fleet-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  fleetData.forEach((truck) => {
    const activeStop = truck.stops[truck.currentStopIndex] || truck.stops[truck.stops.length - 1];
    const completedCount = truck.stops.filter(s => s.status === 'Completed').length;
    const eta = calculateETA(truck.lat, truck.lng, activeStop.lat, activeStop.lng, truck.speed);

    // Update or add map marker
    if (!markers[truck.id]) {
      markers[truck.id] = L.marker([truck.lat, truck.lng]).addTo(map);
    } else {
      markers[truck.id].setLatLng([truck.lat, truck.lng]);
    }

    markers[truck.id].bindPopup(`
      <div style="min-width: 180px;">
        <div style="font-weight:bold; color:#4AADE3;">${truck.id} (${truck.plate})</div>
        <div style="font-size:12px; margin-top:3px; color:#e2e8f0;"><b>Driver:</b> ${truck.driver}</div>
        <div style="font-size:12px; color:#e2e8f0;"><b>Next:</b> ${activeStop.name}</div>
        <div style="font-size:12px; color:#38bdf8;"><b>ETA:</b> ~${eta.etaMinutes} mins (${eta.distanceKm} km)</div>
      </div>
    `);

    // Draw route vector line to next waypoint
    const pathCoords = [[truck.lat, truck.lng], [activeStop.lat, activeStop.lng]];
    if (!routePolylines[truck.id]) {
      routePolylines[truck.id] = L.polyline(pathCoords, { color: '#4AADE3', weight: 3, dashArray: '6, 6' }).addTo(map);
    } else {
      routePolylines[truck.id].setLatLngs(pathCoords);
    }

    // Sidebar summary card
    const card = document.createElement('div');
    card.className = "p-4 rounded-xl border border-gcr-border bg-gcr-card hover:border-gcr transition cursor-pointer shadow-sm group";
    card.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <span class="font-bold text-sm text-white group-hover:text-gcr transition">${truck.id}</span>
        <span class="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-sky-500/10 text-gcr border border-gcr/30">
          ${completedCount}/${truck.stops.length} Delivered
        </span>
      </div>
      <div class="text-xs text-slate-300 space-y-1">
        <p class="text-[11px] text-slate-400 truncate">📦 ${truck.cargo}</p>
        <p class="flex justify-between"><span class="text-slate-400">Driver:</span> <span class="text-white">${truck.driver}</span></p>
        <p class="flex justify-between"><span class="text-slate-400">Temp:</span> <span class="text-sky-300 font-semibold">${truck.temp}°C</span></p>
        <div class="mt-2 pt-2 border-t border-gcr-border/60">
          <p class="text-[10px] text-slate-400 uppercase font-semibold">📍 Next Drop:</p>
          <p class="text-white font-medium truncate">${activeStop.name}</p>
          <p class="text-emerald-400 font-semibold mt-0.5">ETA: ~${eta.etaMinutes} mins (${eta.distanceKm} km)</p>
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

// ==================== PAGE 2: ROUTE MANAGER ====================
function renderRoutesTable() {
  const container = document.getElementById('routes-table-container');
  if (!container) return;
  container.innerHTML = '';

  fleetData.forEach(truck => {
    const section = document.createElement('div');
    section.className = "border border-gcr-border bg-gcr-card rounded-xl p-4";

    let stopsHtml = truck.stops.map((s, idx) => `
      <div class="flex items-center justify-between text-xs py-2 border-b border-gcr-border/40 last:border-0">
        <div>
          <span class="font-bold text-white">Stop ${idx + 1}:</span> <span class="text-slate-200">${s.name}</span>
        </div>
        <span class="px-2.5 py-0.5 rounded text-[10px] font-semibold ${s.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-300'}">
          ${s.status}
        </span>
      </div>
    `).join('');

    section.innerHTML = `
      <div class="flex items-center justify-between mb-3 border-b border-gcr-border/60 pb-2">
        <h4 class="font-bold text-sm text-gcr">${truck.id} (${truck.plate}) — ${truck.driver}</h4>
        <span class="text-xs text-slate-400">${truck.stops.length} Stops Total</span>
      </div>
      <div class="space-y-1">${stopsHtml}</div>
    `;
    container.appendChild(section);
  });
}

window.addNewStopFromAdmin = function() {
  const select = document.getElementById('route-truck-select');
  const input = document.getElementById('route-stop-name');
  if (!input.value.trim()) return alert('Please type a location name for the stop.');

  const truckId = select.value.split(' ')[0];
  const truck = fleetData.find(t => t.id === truckId);
  if (truck) {
    truck.stops.push({
      name: input.value.trim(),
      lat: truck.lat + (Math.random() - 0.5) * 0.04,
      lng: truck.lng + (Math.random() - 0.5) * 0.04,
      status: 'Pending'
    });
    input.value = '';
    renderRoutesTable();
    renderAdminDashboard();
    alert('New stop added to ' + truckId);
  }
};

// ==================== PAGE 3: DRIVER TELEMETRY ====================
const driverSelect = document.getElementById('driver-truck-select');
const driverStopsContainer = document.getElementById('driver-stops-list');

function renderDriverStops() {
  if (!driverStopsContainer || !driverSelect) return;
  const selectedTruckId = driverSelect.value;
  const truck = fleetData.find(t => t.id === selectedTruckId);
  driverStopsContainer.innerHTML = '';

  truck.stops.forEach((stop, index) => {
    const isCurrent = index === truck.currentStopIndex;
    const isDone = stop.status === 'Completed';

    const card = document.createElement('div');
    card.className = `p-4 rounded-xl border ${isCurrent ? 'border-gcr bg-gcr/10' : 'border-gcr-border bg-gcr-card'} flex items-center justify-between gap-3`;
    card.innerHTML = `
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold ${isDone ? 'text-slate-500 line-through' : 'text-white'}">Stop ${index + 1}: ${stop.name}</span>
          ${isCurrent ? '<span class="text-[9px] bg-gcr text-white font-bold px-1.5 py-0.2 rounded">NEXT</span>' : ''}
        </div>
        <p class="text-[11px] text-slate-400 mt-0.5">Status: <span class="${isDone ? 'text-emerald-400 font-medium' : 'text-slate-300'}">${stop.status}</span></p>
      </div>
      <div>
        ${isCurrent ? `
          <button onclick="markStopCompleted('${truck.id}', ${index})" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition cursor-pointer">
            Mark Delivered
          </button>
        ` : isDone ? '<span class="text-xs text-emerald-400 font-bold">✓ Delivered</span>' : '<span class="text-xs text-slate-500">Pending</span>'}
      </div>
    `;
    driverStopsContainer.appendChild(card);
  });
}

if (driverSelect) {
  driverSelect.addEventListener('change', renderDriverStops);
}

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

// Driver GPS Broadcasting Engine
let watchId = null;
const btnGps = document.getElementById('btn-toggle-gps');
const gpsBadge = document.getElementById('gps-status-badge');
const telemetry = document.getElementById('driver-telemetry');
const coordsTxt = document.getElementById('telemetry-coords');
const speedTxt = document.getElementById('telemetry-speed');

if (btnGps) {
  btnGps.addEventListener('click', () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
      btnGps.innerHTML = '<span>📡</span> Start Sharing Live GPS';
      btnGps.className = "w-full py-3 rounded-xl font-bold text-xs bg-gcr hover:bg-gcr-dark text-white shadow-lg transition flex items-center justify-center gap-2 cursor-pointer";
      gpsBadge.className = "px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700";
      gpsBadge.innerText = 'GPS Offline';
      telemetry.classList.add('hidden');
    } else {
      if (!navigator.geolocation) return alert('Geolocation is not supported by your browser.');
      gpsBadge.className = "px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      gpsBadge.innerText = 'GPS Broadcasting Live';
      btnGps.innerHTML = '<span>⏹️</span> Stop Sharing GPS';
      btnGps.className = "w-full py-3 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-lg transition flex items-center justify-center gap-2 cursor-pointer";
      telemetry.classList.remove('hidden');

      watchId = navigator.geolocation.watchPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const spd = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0;

        coordsTxt.innerText = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        speedTxt.innerText = `${spd} km/h`;

        const truck = fleetData.find(t => t.id === driverSelect.value);
        if (truck) {
          truck.lat = lat;
          truck.lng = lng;
          truck.speed = spd;
          renderAdminDashboard();
        }
      }, (err) => console.error(err), { enableHighAccuracy: true });
    }
  });
}

// ==================== PAGE 4: COLD CHAIN CARDS ====================
function renderColdChainCards() {
  const container = document.getElementById('coldchain-cards');
  if (!container) return;
  container.innerHTML = '';

  fleetData.forEach(truck => {
    const card = document.createElement('div');
    card.className = "bg-gcr-card border border-gcr-border p-4 rounded-xl space-y-2";
    card.innerHTML = `
      <div class="flex justify-between items-center">
        <span class="font-bold text-sm text-white">${truck.id}</span>
        <span class="text-xs font-mono font-bold text-gcr">${truck.temp}°C</span>
      </div>
      <p class="text-xs text-slate-300">📦 Cargo: ${truck.cargo}</p>
      <div class="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
        <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span> Reefer Compressor Active
      </div>
    `;
    container.appendChild(card);
  });
}

// Initialize boot view
renderAdminDashboard();
