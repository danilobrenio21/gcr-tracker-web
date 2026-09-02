// Navotas Central Hub baseline
const NAVOTAS_CENTER = [14.6545, 120.9485];

// Initialize Leaflet Map
const map = L.map('map', { zoomControl: false }).setView(NAVOTAS_CENTER, 12);
L.control.zoom({ position: 'bottomright' }).addTo(map);

// Carto Voyager Clean Navigation Tiles
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap &copy; CARTO',
  maxZoom: 19
}).addTo(map);

// Global Fleet State
let fleetData = [
  {
    id: 'REEFER-01',
    plate: 'NDG-4421',
    driver: 'Danilo B.',
    cargo: 'Frozen Bangus & Tilapia Blocks (2.4T)',
    temp: -19.4,
    lat: 14.6560,
    lng: 120.9520,
    speed: 34,
    currentStopIndex: 0,
    stops: [
      { name: 'Balintawak Market Stall #14', lat: 14.6575, lng: 121.0025, status: 'In Transit' },
      { name: 'Muñoz Wet Market Cold Bay', lat: 14.6580, lng: 121.0200, status: 'Pending' }
    ]
  },
  {
    id: 'REEFER-02',
    plate: 'CBC-8902',
    driver: 'Reynaldo S.',
    cargo: 'Imported Pork Belly & Beef Cuts (3.2T)',
    temp: -18.2,
    lat: 14.6390,
    lng: 120.9850,
    speed: 26,
    currentStopIndex: 0,
    stops: [
      { name: 'Divisoria Frozen Wholesale Section', lat: 14.6040, lng: 120.9720, status: 'In Transit' },
      { name: 'España Commissary Bay 2', lat: 14.6120, lng: 120.9930, status: 'Pending' }
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
      { name: 'Farmer\'s Market Cubao Bay 4', lat: 14.6210, lng: 121.0530, status: 'Loading at Hub' }
    ]
  }
];

const markers = {};
let activeRoutingControl = null;

// ==================== IN-APP ROUTING ENGINE ====================
function drawInAppRoute(fromLat, fromLng, toLat, toLng, destinationName) {
  if (activeRoutingControl) {
    map.removeControl(activeRoutingControl);
  }

  activeRoutingControl = L.Routing.control({
    waypoints: [
      L.latLng(fromLat, fromLng),
      L.latLng(toLat, toLng)
    ],
    routeWhileDragging: false,
    addWaypoints: false,
    showAlternatives: false,
    collapsible: true,
    lineOptions: {
      styles: [
        { color: '#0369a1', opacity: 0.8, weight: 8 },
        { color: '#38bdf8', opacity: 1, weight: 5 }
      ]
    },
    createMarker: function(i, wp) {
      const isStart = i === 0;
      return L.marker(wp.latLng).bindPopup(
        `<div style="font-family:inherit;font-size:12px;"><b>${isStart ? 'Starting Point' : 'Destination'}:</b> ${isStart ? 'Navotas/Truck Position' : destinationName}</div>`
      );
    }
  }).addTo(map);
}

// ==================== GOOGLE-STYLE MAP SEARCH ENGINE ====================
async function executeMapSearch() {
  const input = document.getElementById('map-search-input');
  const query = input.value.trim();
  const resultsBox = document.getElementById('search-results-box');
  if (!query) return;

  resultsBox.classList.remove('hidden');
  resultsBox.innerHTML = `<div class="p-3 text-xs text-slate-400">Searching road addresses in the Philippines...</div>`;

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Philippines')}&limit=5`);
    const data = await res.json();

    resultsBox.innerHTML = '';
    if (data.length === 0) {
      resultsBox.innerHTML = `<div class="p-3 text-xs text-slate-400">No locations found. Try including city name (e.g., 'Balintawak, Quezon City').</div>`;
      return;
    }

    data.forEach(item => {
      const div = document.createElement('div');
      div.className = "p-2.5 hover:bg-gcr/20 text-xs text-slate-200 cursor-pointer transition flex items-start gap-2";
      div.innerHTML = `<span class="text-gcr">📍</span> <span class="truncate">${item.display_name}</span>`;
      div.onclick = () => {
        const destLat = parseFloat(item.lat);
        const destLng = parseFloat(item.lon);
        resultsBox.classList.add('hidden');
        input.value = item.display_name.split(',')[0];

        // Draw in-app road route from Navotas Central Hub to selected search destination
        drawInAppRoute(NAVOTAS_CENTER[0], NAVOTAS_CENTER[1], destLat, destLng, item.display_name.split(',')[0]);
        map.flyTo([destLat, destLng], 14, { animate: true });
      };
      resultsBox.appendChild(div);
    });
  } catch (err) {
    resultsBox.innerHTML = `<div class="p-3 text-xs text-rose-400">Search error. Please try again.</div>`;
  }
}

// ==================== PAGE ROUTER ====================
window.navigatePage = function(pageId, pageTitle) {
  document.querySelectorAll('.page-content').forEach(el => el.classList.add('hidden'));

  const targetPage = document.getElementById(pageId);
  if (targetPage) targetPage.classList.remove('hidden');

  document.getElementById('page-subtitle').innerText = pageTitle;

  if (pageId === 'page-map') {
    setTimeout(() => map.invalidateSize(), 200);
    renderAdminDashboard();
  } else if (pageId === 'page-driver') {
    renderDriverStops();
  } else if (pageId === 'page-coldchain') {
    renderColdChainCards();
  }

  if (typeof toggleDrawer === 'function') toggleDrawer(false);
};

function calculateQuickETA(lat1, lon1, lat2, lon2, speedKmH) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const effectiveSpeed = speedKmH > 10 ? speedKmH : 25;
  const minutes = Math.round((d / effectiveSpeed) * 60);
  return { distanceKm: d.toFixed(1), etaMinutes: minutes };
}

// ==================== PAGE 1: ADMIN DASHBOARD RENDER ====================
function renderAdminDashboard() {
  const listContainer = document.getElementById('fleet-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  fleetData.forEach((truck, index) => {
    const activeStop = truck.stops[truck.currentStopIndex] || truck.stops[truck.stops.length - 1];
    const completedCount = truck.stops.filter(s => s.status === 'Completed').length;
    const eta = calculateQuickETA(truck.lat, truck.lng, activeStop.lat, activeStop.lng, truck.speed);

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
        <div style="font-size:12px; color:#38bdf8;"><b>Approx:</b> ~${eta.etaMinutes} mins (${eta.distanceKm} km)</div>
        <div style="font-size:11px; color:#94a3b8; margin-top:3px;">📦 ${truck.cargo}</div>
      </div>
    `);

    if (index === 0 && !activeRoutingControl) {
      drawInAppRoute(truck.lat, truck.lng, activeStop.lat, activeStop.lng, activeStop.name);
    }

    const card = document.createElement('div');
    card.className = "p-4 rounded-2xl glass-panel hover:border-gcr/60 transition duration-200 cursor-pointer shadow-lg group hover:scale-[1.01]";
    card.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <span class="font-display font-bold text-sm text-white group-hover:text-gcr transition">${truck.id}</span>
        <span class="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-sky-500/15 text-gcr border border-gcr/30">
          ${completedCount}/${truck.stops.length} Drops Done
        </span>
      </div>
      <div class="text-xs text-slate-300 space-y-1.5">
        <p class="text-[11px] text-slate-400 truncate">📦 ${truck.cargo}</p>
        <p class="flex justify-between"><span class="text-slate-400">Driver:</span> <span class="text-white font-medium">${truck.driver}</span></p>
        <p class="flex justify-between"><span class="text-slate-400">Box Temp:</span> <span class="text-sky-300 font-bold font-mono">${truck.temp}°C</span></p>
        <div class="mt-2.5 pt-2 border-t border-gcr-border/30">
          <p class="text-[10px] text-slate-400 uppercase font-semibold">📍 Next Drop-off:</p>
          <p class="text-white font-medium truncate">${activeStop.name}</p>
          <p class="text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> ETA: ~${eta.etaMinutes} mins (${eta.distanceKm} km away)
          </p>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      map.flyTo([truck.lat, truck.lng], 13, { animate: true });
      markers[truck.id].openPopup();
      drawInAppRoute(truck.lat, truck.lng, activeStop.lat, activeStop.lng, activeStop.name);
    });

    listContainer.appendChild(card);
  });
}

// ==================== PAGE 2: OPERATOR DYNAMIC MANIFEST ====================
let stopRowCount = 2;

window.addStopInputRow = function() {
  stopRowCount++;
  const container = document.getElementById('stops-input-container');
  const row = document.createElement('div');
  row.className = "flex items-center gap-2.5 stop-row";
  row.innerHTML = `
    <span class="text-xs text-gcr font-bold w-16">Stop ${stopRowCount}:</span>
    <input type="text" required placeholder="Enter destination drop location..." class="stop-name-input flex-1 bg-black/40 border border-gcr-border rounded-xl px-3.5 py-2 text-xs text-white focus:border-gcr focus:outline-none placeholder-slate-500">
    <button type="button" onclick="removeStopRow(this)" class="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs font-bold transition cursor-pointer">✕</button>
  `;
  container.appendChild(row);
};

window.removeStopRow = function(btn) {
  const rows = document.querySelectorAll('.stop-row');
  if (rows.length <= 1) {
    alert('At least 1 destination stop is required.');
    return;
  }
  btn.closest('.stop-row').remove();
};

window.handleManifestSubmit = function(e) {
  e.preventDefault();

  const truckId = document.getElementById('man-truck-id').value;
  const driverName = document.getElementById('man-driver-name').value.trim();
  const cargoDesc = document.getElementById('man-cargo').value.trim();
  const tempSet = parseFloat(document.getElementById('man-temp').value);

  const stopInputs = document.querySelectorAll('.stop-name-input');
  const stopsList = [];

  stopInputs.forEach((input, index) => {
    const name = input.value.trim();
    if (name) {
      stopsList.push({
        name: name,
        lat: NAVOTAS_CENTER[0] + (Math.random() - 0.5) * 0.06,
        lng: NAVOTAS_CENTER[1] + (Math.random() - 0.5) * 0.08,
        status: index === 0 ? 'In Transit' : 'Pending'
      });
    }
  });

  if (stopsList.length === 0) return alert('Please specify a delivery destination.');

  const truck = fleetData.find(t => t.id === truckId);
  if (truck) {
    truck.driver = driverName;
    truck.cargo = cargoDesc;
    truck.temp = tempSet;
    truck.stops = stopsList;
    truck.currentStopIndex = 0;
    truck.speed = 30;
  }

  renderAdminDashboard();
  alert(`✅ Manifest Logged for ${truckId}!\nAssigned ${stopsList.length} drop-off stops.`);
  navigatePage('page-map', 'Live Fleet & Road Search Map');
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
    card.className = `p-4 rounded-xl border ${isCurrent ? 'border-gcr bg-gcr/10' : 'border-gcr-border/40 bg-black/20'} flex items-center justify-between gap-3`;
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
          <button onclick="markStopCompleted('${truck.id}', ${index})" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer">
            Mark Delivered
          </button>
        ` : isDone ? '<span class="text-xs text-emerald-400 font-bold">✓ Done</span>' : '<span class="text-xs text-slate-500">Upcoming</span>'}
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
    const nextStop = truck.stops[truck.currentStopIndex];
    drawInAppRoute(truck.lat, truck.lng, nextStop.lat, nextStop.lng, nextStop.name);
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
      btnGps.className = "w-full py-3.5 rounded-xl font-bold text-xs bg-gcr hover:bg-gcr-dark text-white shadow-lg transition flex items-center justify-center gap-2 cursor-pointer";
      gpsBadge.className = "px-3 py-1 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700";
      gpsBadge.innerText = 'GPS Offline';
      telemetry.classList.add('hidden');
    } else {
      if (!navigator.geolocation) return alert('Geolocation is not supported by your browser.');
      gpsBadge.className = "px-3 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
      gpsBadge.innerText = 'GPS Broadcasting Live';
      btnGps.innerHTML = '<span>⏹️</span> Stop Sharing GPS';
      btnGps.className = "w-full py-3.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-lg transition flex items-center justify-center gap-2 cursor-pointer";
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
          const activeStop = truck.stops[truck.currentStopIndex];
          if (activeStop) {
            drawInAppRoute(truck.lat, truck.lng, activeStop.lat, activeStop.lng, activeStop.name);
          }
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
    card.className = "glass-panel p-4 rounded-xl space-y-2 border border-gcr-border/40 shadow-lg";
    card.innerHTML = `
      <div class="flex justify-between items-center">
        <span class="font-display font-bold text-sm text-white">${truck.id}</span>
        <span class="text-xs font-mono font-bold text-gcr">${truck.temp}°C</span>
      </div>
      <p class="text-xs text-slate-300">📦 Cargo: ${truck.cargo}</p>
      <div class="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
        <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span> Reefer Compressor Optimal
      </div>
    `;
    container.appendChild(card);
  });
}

// Initial Boot
renderAdminDashboard();
