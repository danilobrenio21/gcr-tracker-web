// Center map on Navotas Fish Port area
const NAVOTAS_CENTER = [14.6545, 120.9485];
const map = L.map('map').setView(NAVOTAS_CENTER, 13);

// Clean map tiles
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  maxZoom: 19
}).addTo(map);

// Cold chain operational fleet data
const fleetData = [
  {
    id: 'REEFER-01',
    plate: 'NDG-4421',
    driver: 'Danilo B.',
    cargo: 'Frozen Bangus & Tilapia Blocks',
    origin: 'Navotas Fish Port Market',
    destination: 'Balintawak Cold Storage',
    lat: 14.6560,
    lng: 120.9520,
    temp: -19.4,
    reeferEngine: 'Running',
    doorStatus: 'Closed',
    speed: '36 km/h',
    status: 'Optimal'
  },
  {
    id: 'REEFER-02',
    plate: 'CBC-8902',
    driver: 'Reynaldo S.',
    cargo: 'Imported Beef Cuts & Pork Bellies',
    origin: 'North Harbor Pier 4',
    destination: 'Quezon City Commissary',
    lat: 14.6390,
    lng: 120.9850,
    temp: -11.5, // Alert: elevated temperature
    reeferEngine: 'Running',
    doorStatus: 'Open (Unloading)',
    speed: '0 km/h',
    status: 'Temp Warning'
  },
  {
    id: 'REEFER-03',
    plate: 'TGC-1198',
    driver: 'Arnel M.',
    cargo: 'Fresh Shells (Tahong & Talaba)',
    origin: '578 Gov. Pascual St. Facility',
    destination: 'Farmer\'s Market Cubao',
    lat: 14.6545,
    lng: 120.9485,
    temp: 2.4, // Chilled shellfish range
    reeferEngine: 'Standby',
    doorStatus: 'Closed',
    speed: '0 km/h',
    status: 'Pre-cooling'
  }
];

const markers = {};
const listContainer = document.getElementById('fleet-list');

fleetData.forEach((truck) => {
  const isAlert = truck.temp > -12 && truck.cargo.toLowerCase().includes('frozen');
  const tempBadgeColor = isAlert 
    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse' 
    : 'bg-sky-500/10 text-gcr border border-gcr/30';

  // Add pin to map
  const marker = L.marker([truck.lat, truck.lng]).addTo(map);
  marker.bindPopup(`
    <div style="min-width: 170px;">
      <div style="font-weight:bold; color:#4AADE3;">${truck.id} (${truck.plate})</div>
      <div style="font-size:12px; margin-top:4px; color:#e2e8f0;"><b>Cargo:</b> ${truck.cargo}</div>
      <div style="font-size:12px; color:#e2e8f0;"><b>Temp:</b> <span style="color:${isAlert ? '#f87171' : '#38bdf8'}; font-weight:bold;">${truck.temp}°C</span></div>
      <div style="font-size:11px; color:#94a3b8; margin-top:4px;">📍 ${truck.destination}</div>
    </div>
  `);
  markers[truck.id] = marker;

  // Create card element
  const card = document.createElement('div');
  card.className = `p-4 rounded-xl border ${isAlert ? 'border-rose-500/40 bg-rose-950/20' : 'border-gcr-border bg-gcr-card'} hover:border-gcr transition cursor-pointer group shadow-sm`;

  card.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <span class="font-bold text-base text-white group-hover:text-gcr transition">${truck.id}</span>
      <span class="text-xs px-2.5 py-0.5 rounded-full font-medium ${tempBadgeColor}">
        ${truck.temp}°C
      </span>
    </div>
    <div class="text-xs text-slate-300 space-y-1.5">
      <p class="text-slate-400 text-[11px] truncate">📦 <span class="text-slate-200">${truck.cargo}</span></p>
      <p class="flex justify-between"><span class="text-slate-400">Driver:</span> <span class="text-white">${truck.driver}</span></p>
      <p class="flex justify-between"><span class="text-slate-400">Reefer Unit:</span> <span class="text-emerald-400 font-medium">${truck.reeferEngine}</span></p>
      <p class="flex justify-between"><span class="text-slate-400">Door:</span> <span class="${truck.doorStatus.includes('Open') ? 'text-amber-400 font-medium' : 'text-slate-300'}">${truck.doorStatus}</span></p>
      <p class="text-[11px] text-slate-400 border-t border-gcr-border/50 pt-1.5 truncate mt-1">🏁 Dest: ${truck.destination}</p>
    </div>
  `;

  card.addEventListener('click', () => {
    map.flyTo([truck.lat, truck.lng], 15, { animate: true, duration: 1 });
    marker.openPopup();
  });

  listContainer.appendChild(card);
});
