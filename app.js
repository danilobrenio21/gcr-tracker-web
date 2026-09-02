// Navotas Central Hub Coordinates
const NAVOTAS_CENTER = [14.6545, 120.9485];

// Initialize Map
const map = L.map('map', { 
  zoomControl: false,
  tap: false
}).setView(NAVOTAS_CENTER, 12);

L.control.zoom({ position: 'bottomright' }).addTo(map);

// Voyager Tiles
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap &copy; CARTO',
  maxZoom: 19
}).addTo(map);

// 10-Unit Operational Fleet Roster
let fleetData = [
  {
    id: 'REEFER-01',
    plate: 'NDG-4421',
    driver: 'Danilo Brenio Sr.',
    passcode: '88211978',
    cargo: 'Frozen Bangus Blocks (2.4T)',
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
    driver: 'Reynaldo Santos',
    passcode: '41901984',
    cargo: 'Imported Pork Belly (3.2T)',
    temp: -18.2,
    lat: 14.6390,
    lng: 120.9850,
    speed: 26,
    currentStopIndex: 0,
    stops: [
      { name: 'Divisoria Frozen Section', lat: 14.6040, lng: 120.9720, status: 'In Transit' },
      { name: 'España Commissary Bay 2', lat: 14.6120, lng: 120.9930, status: 'Pending' }
    ]
  },
  {
    id: 'REEFER-03',
    plate: 'TGC-1198',
    driver: 'Arnel Mendoza',
    passcode: '77321991',
    cargo: 'Live Shells / Tahong (1.8T)',
    temp: 2.5,
    lat: 14.6545,
    lng: 120.9485,
    speed: 0,
    currentStopIndex: 0,
    stops: [
      { name: 'Farmer\'s Market Cubao', lat: 14.6210, lng: 121.0530, status: 'Loading' }
    ]
  },
  {
    id: 'REEFER-04',
    plate: 'NAL-5510',
    driver: 'Eduardo De Guzman',
    passcode: '33141980',
    cargo: 'Frozen Squid / Crab (2.0T)',
    temp: -20.1,
    lat: 14.6450,
    lng: 120.9650,
    speed: 40,
    currentStopIndex: 0,
    stops: [
      { name: 'Pasig Mega Market Bay 1', lat: 14.5580, lng: 121.0840, status: 'In Transit' }
    ]
  },
  {
    id: 'REEFER-05',
    plate: 'WAX-2041',
    driver: 'Marlon Bautista',
    passcode: '90211988',
    cargo: 'Imported Beef Ribs (2.8T)',
    temp: -17.8,
    lat: 14.6120,
    lng: 121.0020,
    speed: 22,
    currentStopIndex: 0,
    stops: [
      { name: 'Commonwealth Cold Depot', lat: 14.6900, lng: 121.0800, status: 'In Transit' }
    ]
  },
  {
    id: 'REEFER-06',
    plate: 'NDO-7729',
    driver: 'Roberto Villanueva',
    passcode: '66451975',
    cargo: 'Frozen Galunggong (3.5T)',
    temp: -19.0,
    lat: 14.6620,
    lng: 120.9380,
    speed: 15,
    currentStopIndex: 0,
    stops: [
      { name: 'Malabon Central Market', lat: 14.6610, lng: 120.9550, status: 'In Transit' }
    ]
  },
  {
    id: 'REEFER-07',
    plate: 'CBA-3301',
    driver: 'Junar Delos Reyes',
    passcode: '11981995',
    cargo: 'Chilled Oysters (1.5T)',
    temp: 3.1,
    lat: 14.5800,
    lng: 120.9900,
    speed: 30,
    currentStopIndex: 0,
    stops: [
      { name: 'Manila Bay Terminal', lat: 14.5650, lng: 120.9850, status: 'In Transit' }
    ]
  },
  {
    id: 'REEFER-08',
    plate: 'NDF-6184',
    driver: 'Joel Manansala',
    passcode: '55401982',
    cargo: 'Frozen Pork Ham (2.1T)',
    temp: -18.6,
    lat: 14.6300,
    lng: 121.0300,
    speed: 38,
    currentStopIndex: 0,
    stops: [
      { name: 'San Juan Storage Hub', lat: 14.6010, lng: 121.0350, status: 'In Transit' }
    ]
  },
  {
    id: 'REEFER-09',
    plate: 'WBH-4890',
    driver: 'Christopher Ocampo',
    passcode: '22761989',
    cargo: 'Frozen Tiger Prawns (1.9T)',
    temp: -21.0,
    lat: 14.6700,
    lng: 121.0100,
    speed: 0,
    currentStopIndex: 0,
    stops: [
      { name: 'Novaliches Center', lat: 14.7200, lng: 121.0400, status: 'Loading' }
    ]
  },
  {
    id: 'REEFER-10',
    plate: 'TGH-7734',
    driver: 'Ferdinand Soriano',
    passcode: '49031979',
    cargo: 'Frozen Beef Brisket (3.0T)',
    temp: -19.5,
    lat: 14.6545,
    lng: 120.9485,
    speed: 0,
    currentStopIndex: 0,
    stops: [
      { name: 'Marikina Riverbanks Bay', lat: 14.6300, lng: 121.0900, status: 'Loading' }
    ]
  }
];

const markers = {};
let activeRoutingControl = null;
let loggedInDriverTruckId = null;
let isAdminAuthenticated = false;

// Synchronize Manifest Vehicle Selection with Driver Name
function initManifestDriverSync() {
  const manSelect = document.getElementById('man-truck-id');
  const manDriver = document.getElementById('man-driver-name');
  if (manSelect && manDriver) {
    manSelect.onchange = () => {
      const found = fleetData.find(t => t.id === manSelect.value);
      if (found) manDriver.value = found.driver;
    };
  }
}

// In-App Turn Routing
function drawInAppRoute(fromLat, fromLng, toLat, toLng, destinationName) {
  if (activeRoutingControl) {
    map.removeControl(activeRoutingControl);
  }

  activeRoutingControl = L.Routing.control({
    waypoints: [L.latLng(fromLat, fromLng), L.latLng(toLat, toLng)],
    routeWhileDragging: false,
    addWaypoints: false,
    showAlternatives: false,
    collapsible: true,
    lineOptions: {
      styles: [
        { color: '#0369a1', opacity: 0.8, weight: 5 },
        { color: '#38bdf8', opacity: 1, weight: 3 }
      ]
    },
    createMarker: function(i, wp) {
      const isStart = i === 0;
      return L.marker(wp.latLng).bindPopup(
        `<div style="font-size:11px;font-family:inherit;"><b>${isStart ? 'Vehicle Location' : 'Destination'}:</b> ${isStart ? 'GPS Pos' : destinationName}</div>`
      );
    }
  }).addTo(map);
}

// OpenStreetMap Geocoding Search
async function executeMapSearch() {
  const input = document.getElementById('map-search-input');
  const query = input.value.trim();
  const resultsBox = document.getElementById('search-results-box');
  if (!query) return;

  resultsBox.classList.remove('hidden');
  resultsBox.innerHTML = `<div class="p-2.5 text-xs text-slate-400">Searching road network...</div>`;

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Philippines')}&limit=4`);
    const data = await res.json();

    resultsBox.innerHTML = '';
    if (data.length === 0) {
      resultsBox.innerHTML = `<div class="p-2.5 text-xs text-slate-400">No destination points found.</div>`;
      return;
    }

    data.forEach(item => {
      const div = document.createElement('div');
      div.className = "p-2 hover:bg-white/[0.05] text-xs text-slate-300 cursor-pointer transition truncate";
      div.innerText = item.display_name;
      div.onclick = () => {
        const destLat = parseFloat(item.lat);
        const destLng = parseFloat(item.lon);
        resultsBox.classList.add('hidden');
        input.value = item.display_name.split(',')[0];

        drawInAppRoute(NAVOTAS_CENTER[0], NAVOTAS_CENTER[1], destLat, destLng, item.display_name.split(',')[0]);
        map.flyTo([destLat, destLng], 14, { animate: true });
      };
      resultsBox.appendChild(div);
    });
  } catch (err) {
    resultsBox.innerHTML = `<div class="p-2.5 text-xs text-rose-400">Lookup service error.</div>`;
  }
}

// Page Router
window.navigatePage = function(pageId, pageTitle) {
  document.querySelectorAll('.page-content').forEach(el => el.classList.add('hidden'));

  const targetPage = document.getElementById(pageId);
  if (targetPage) targetPage.classList.remove('hidden');

  document.getElementById('page-subtitle').innerText = pageTitle;

  if (pageId === 'page-map') {
    setTimeout(() => map.invalidateSize(), 250);
    renderAdminDashboard();
  } else if (pageId === 'page-coldchain') {
    renderColdChainCards();
  } else if (pageId === 'page-driver-cockpit') {
    renderDriverCockpit();
  } else if (pageId === 'page-admin-dashboard') {
    renderAdminPortal();
  }

  if (typeof toggleDrawer === 'function') toggleDrawer(false);
};

// ==================== LOGISTICS ADMIN PORTAL ====================
window.openAdminGate = function() {
  if (isAdminAuthenticated) {
    navigatePage('page-admin-dashboard', 'Logistics Admin Command');
  } else {
    navigatePage('page-admin-gate', 'Admin Authentication');
  }
};

window.handleAdminAuth = function(e) {
  e.preventDefault();
  const inputPin = document.getElementById('admin-passcode-input').value.trim();
  const errorBox = document.getElementById('admin-error-msg');

  if (inputPin === '1234') {
    errorBox.classList.add('hidden');
    isAdminAuthenticated = true;
    document.getElementById('admin-passcode-input').value = '';
    document.getElementById('header-admin-label').innerText = 'Admin Active';
    navigatePage('page-admin-dashboard', 'Logistics Admin Command');
  } else {
    errorBox.classList.remove('hidden');
    errorBox.innerText = 'Access Denied: Invalid Dispatch Passcode.';
  }
};

window.handleAdminSignOut = function() {
  isAdminAuthenticated = false;
  document.getElementById('header-admin-label').innerText = 'Admin Portal';
  navigatePage('page-map', 'Fleet Monitoring & Map');
};

function renderAdminPortal() {
  const tableBody = document.getElementById('admin-fleet-table');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  let totalPendingDrops = 0;

  fleetData.forEach(truck => {
    const activeStop = truck.stops[truck.currentStopIndex] || truck.stops[truck.stops.length - 1];
    const completedCount = truck.stops.filter(s => s.status === 'Completed').length;
    const remainingStops = truck.stops.length - completedCount;
    totalPendingDrops += remainingStops;

    const eta = calculateQuickETA(truck.lat, truck.lng, activeStop.lat, activeStop.lng, truck.speed);

    const isTempAlert = truck.temp > -12 && truck.cargo.toLowerCase().includes('frozen');
    const tempClass = isTempAlert ? 'text-rose-400 font-bold' : 'text-sky-300';

    const row = document.createElement('tr');
    row.className = "hover:bg-white/[0.04] transition cursor-pointer border-b border-white/[0.04]";
    row.onclick = () => {
      navigatePage('page-map', 'Live Fleet Overview');
      setTimeout(() => {
        map.flyTo([truck.lat, truck.lng], 14, { animate: true });
        if (markers[truck.id]) markers[truck.id].openPopup();
        drawInAppRoute(truck.lat, truck.lng, activeStop.lat, activeStop.lng, activeStop.name);
      }, 300);
    };

    row.innerHTML = `
      <td class="p-3 font-mono">
        <span class="font-bold text-white block">${truck.id}</span>
        <span class="text-[10px] text-slate-400">${truck.plate}</span>
      </td>
      <td class="p-3 text-slate-200">${truck.driver}</td>
      <td class="p-3 text-slate-300 max-w-[180px] truncate" title="${truck.cargo}">${truck.cargo}</td>
      <td class="p-3 font-mono ${tempClass}">${truck.temp}°C</td>
      <td class="p-3 text-slate-200 max-w-[180px] truncate" title="${activeStop.name}">
        <span class="block truncate">${activeStop.name}</span>
        <span class="text-[10px] font-mono text-slate-400">${truck.speed} km/h</span>
      </td>
      <td class="p-3 font-mono text-emerald-400 font-semibold">
        ~${eta.etaMinutes}m <span class="text-[10px] text-slate-400">(${eta.distanceKm}km)</span>
      </td>
      <td class="p-3 font-mono">
        <span class="text-[10px] px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-gcr">
          ${completedCount}/${truck.stops.length} DROPS
        </span>
      </td>
      <td class="p-3 text-right">
        <span class="text-[10px] text-gcr font-semibold underline">Locate</span>
      </td>
    `;
    tableBody.appendChild(row);
  });

  const pendingCounter = document.getElementById('admin-pending-drops-count');
  if (pendingCounter) pendingCounter.innerText = `${totalPendingDrops} Drops`;
}

// Driver Login
window.handleDriverLogin = function(e) {
  e.preventDefault();
  const truckId = document.getElementById('login-truck-select').value;
  const passcode = document.getElementById('login-passcode').value.trim();
  const errorBox = document.getElementById('login-error-msg');

  const truck = fleetData.find(t => t.id === truckId);

  if (truck && truck.passcode === passcode) {
    errorBox.classList.add('hidden');
    loggedInDriverTruckId = truck.id;

    document.getElementById('header-auth-label').innerText = truck.driver.split(' ')[0];
    document.getElementById('header-auth-btn').onclick = () => navigatePage('page-driver-cockpit', 'Driver Cockpit');

    navigatePage('page-driver-cockpit', `${truck.id} Cockpit`);
    renderDriverCockpit();
  } else {
    errorBox.classList.remove('hidden');
    errorBox.innerText = 'Passcode mismatch for selected unit.';
  }
};

window.handleDriverLogout = function() {
  loggedInDriverTruckId = null;
  document.getElementById('header-auth-label').innerText = 'Driver Portal';
  document.getElementById('header-auth-btn').onclick = () => navigatePage('page-driver-login', 'Driver Authentication');
  document.getElementById('login-passcode').value = '';
  navigatePage('page-driver-login', 'Driver Authentication');
};

function renderDriverCockpit() {
  if (!loggedInDriverTruckId) {
    navigatePage('page-driver-login', 'Driver Authentication');
    return;
  }

  const truck = fleetData.find(t => t.id === loggedInDriverTruckId);
  if (!truck) return;

  document.getElementById('cockpit-driver-name').innerText = truck.driver;
  document.getElementById('cockpit-truck-tag').innerText = `${truck.id} (${truck.plate}) — ${truck.cargo}`;

  const container = document.getElementById('driver-stops-list');
  container.innerHTML = '';

  truck.stops.forEach((stop, index) => {
    const isCurrent = index === truck.currentStopIndex;
    const isDone = stop.status === 'Completed';

    const card = document.createElement('div');
    card.className = `p-3 rounded-lg border ${isCurrent ? 'border-gcr/50 bg-gcr/10' : 'border-white/[0.06] bg-black/25'} flex items-center justify-between gap-2`;
    card.innerHTML = `
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5">
          <span class="text-xs font-semibold ${isDone ? 'text-slate-500 line-through' : 'text-white'} truncate">${index + 1}. ${stop.name}</span>
          ${isCurrent ? '<span class="text-[9px] font-mono bg-gcr text-white px-1.5 py-0.2 rounded shrink-0">NEXT</span>' : ''}
        </div>
        <p class="text-[10px] text-slate-400 font-mono mt-0.5">${stop.status}</p>
      </div>
      <div class="shrink-0">
        ${isCurrent ? `
          <button onclick="markStopCompleted('${truck.id}', ${index})" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition cursor-pointer">
            Delivered
          </button>
        ` : isDone ? '<span class="text-xs text-emerald-400 font-mono">COMPLETE</span>' : '<span class="text-xs text-slate-500 font-mono">QUEUED</span>'}
      </div>
    `;
    container.appendChild(card);
  });
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
  renderDriverCockpit();
  renderAdminDashboard();
  if (isAdminAuthenticated) renderAdminPortal();
};

// Geolocation Broadcaster
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
      btnGps.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12.75 19.5v-.75a7.5 7.5 0 00-7.5-7.5H4.5m0-6.75h.75c7.87 0 14.25 6.38 14.25 14.25v.75M6 18.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
        <span>Broadcast GPS</span>`;
      btnGps.className = "w-full py-2.5 rounded-lg font-semibold text-xs bg-gcr hover:bg-gcr-dark text-white transition flex items-center justify-center gap-2 cursor-pointer";
      gpsBadge.className = "px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.05] text-slate-400 border border-white/[0.08]";
      gpsBadge.innerText = 'STANDBY';
      telemetry.classList.add('hidden');
    } else {
      if (!navigator.geolocation) return alert('Geolocation is not supported.');
      gpsBadge.className = "px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      gpsBadge.innerText = 'LIVE BROADCAST';
      btnGps.innerText = 'Stop GPS Stream';
      btnGps.className = "w-full py-2.5 rounded-lg font-semibold text-xs bg-rose-600 hover:bg-rose-700 text-white transition flex items-center justify-center gap-2 cursor-pointer";
      telemetry.classList.remove('hidden');

      watchId = navigator.geolocation.watchPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const spd = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0;

        coordsTxt.innerText = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        speedTxt.innerText = `${spd} km/h`;

        const truck = fleetData.find(t => t.id === loggedInDriverTruckId);
        if (truck) {
          truck.lat = lat;
          truck.lng = lng;
          truck.speed = spd;
          const activeStop = truck.stops[truck.currentStopIndex];
          if (activeStop) {
            drawInAppRoute(truck.lat, truck.lng, activeStop.lat, activeStop.lng, activeStop.name);
          }
          renderAdminDashboard();
          if (isAdminAuthenticated) renderAdminPortal();
        }
      }, (err) => console.error(err), { enableHighAccuracy: true });
    }
  });
}

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

// Sidebar Vehicle List
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
      <div style="font-size:11px;font-family:inherit;min-width:160px;">
        <div style="font-weight:700;color:#4AADE3;">${truck.id} • ${truck.plate}</div>
        <div style="color:#94a3b8;margin-top:2px;">Driver: ${truck.driver}</div>
        <div style="color:#cbd5e1;">Next: ${activeStop.name}</div>
        <div style="color:#38bdf8;font-family:monospace;margin-top:2px;">ETA: ~${eta.etaMinutes}m (${eta.distanceKm}km)</div>
      </div>
    `);

    if (index === 0 && !activeRoutingControl) {
      drawInAppRoute(truck.lat, truck.lng, activeStop.lat, activeStop.lng, activeStop.name);
    }

    const card = document.createElement('div');
    card.className = "p-2.5 rounded-lg ui-panel hover:border-white/[0.18] transition cursor-pointer shadow-sm";
    card.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <span class="font-display font-bold text-xs text-white">${truck.id}</span>
        <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.05] text-gcr border border-white/[0.08]">
          ${completedCount}/${truck.stops.length} DROPS
        </span>
      </div>
      <div class="text-[11px] text-slate-300 space-y-0.5">
        <div class="flex justify-between font-mono text-[10px]">
          <span class="text-slate-400">${truck.plate}</span>
          <span class="text-sky-300 font-bold">${truck.temp}°C</span>
        </div>
        <p class="text-slate-400 text-[10px] truncate">${truck.driver} • ${truck.cargo}</p>
        <div class="pt-1 mt-1 border-t border-white/[0.05] flex justify-between items-center text-[10px]">
          <span class="text-slate-400 truncate max-w-[130px]">${activeStop.name}</span>
          <span class="text-emerald-400 font-mono">~${eta.etaMinutes}m</span>
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

// Manifest Stop Append
function addStopInputRow() {
  const container = document.getElementById('stops-input-container');
  const count = container.querySelectorAll('.stop-row').length + 1;
  const row = document.createElement('div');
  row.className = "flex items-center gap-2 stop-row";
  row.innerHTML = `
    <span class="text-[11px] font-mono text-slate-400 w-12 shrink-0">Stop ${count}</span>
    <input type="text" required placeholder="Destination address..." class="stop-name-input flex-1 bg-slate-900 border border-white/[0.12] rounded-lg px-3 py-1.5 text-xs text-white focus:border-gcr focus:outline-none">
    <button type="button" onclick="removeStopRow(this)" class="p-1 text-slate-400 hover:text-rose-400 cursor-pointer">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
    </button>
  `;
  container.appendChild(row);
}

function removeStopRow(btn) {
  const rows = document.querySelectorAll('.stop-row');
  if (rows.length <= 1) return alert('A minimum of 1 stop is required.');
  btn.closest('.stop-row').remove();
}

function handleManifestSubmit(e) {
  e.preventDefault();

  const truckId = document.getElementById('man-truck-id').value;
  const cargoDesc = document.getElementById('man-cargo').value.trim();
  const tempSet = parseFloat(document.getElementById('man-temp').value);

  const stopInputs = document.querySelectorAll('.stop-name-input');
  const stopsList = [];

  stopInputs.forEach((input, index) => {
    const name = input.value.trim();
    if (name) {
      stopsList.push({
        name: name,
        lat: NAVOTAS_CENTER[0] + (Math.random() - 0.5) * 0.08,
        lng: NAVOTAS_CENTER[1] + (Math.random() - 0.5) * 0.09,
        status: index === 0 ? 'In Transit' : 'Pending'
      });
    }
  });

  if (stopsList.length === 0) return alert('Please enter at least one stop.');

  const truck = fleetData.find(t => t.id === truckId);
  if (truck) {
    truck.cargo = cargoDesc;
    truck.temp = tempSet;
    truck.stops = stopsList;
    truck.currentStopIndex = 0;
    truck.speed = 30;
  }

  renderAdminDashboard();
  if (isAdminAuthenticated) renderAdminPortal();
  alert(`Manifest logged for ${truckId}.`);
  navigatePage('page-map', 'Fleet Monitoring & Map');
}

// Cold Chain Cards
function renderColdChainCards() {
  const container = document.getElementById('coldchain-cards');
  if (!container) return;
  container.innerHTML = '';

  fleetData.forEach(truck => {
    const card = document.createElement('div');
    card.className = "ui-panel p-3 rounded-lg space-y-1.5";
    card.innerHTML = `
      <div class="flex justify-between items-center">
        <span class="font-display font-bold text-xs text-white">${truck.id}</span>
        <span class="text-xs font-mono font-bold text-gcr">${truck.temp}°C</span>
      </div>
      <p class="text-[11px] text-slate-400 truncate">${truck.driver} • ${truck.cargo}</p>
      <div class="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 pt-0.5">
        <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> NORMAL
      </div>
    `;
    container.appendChild(card);
  });
}

window.addEventListener('resize', () => {
  if (map) map.invalidateSize();
});

// Initial Boot
initManifestDriverSync();
renderAdminDashboard();
