// Initialize map centered on Savar
var map = L.map('map').setView([23.8700, 90.2500], 13);

// OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Restrict map to Savar area
map.setMaxBounds([
    [23.8600, 90.2400], // SW
    [23.8800, 90.2700]  // NE
]);

let routeLine;

// Geocode function convert place name to coordinates
async function geocode(place) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.length === 0) throw new Error(`Place not found: ${place}`);
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

// OpenRouteService API Key
const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjdiNzNmY2JkZGZmODQzNzdhYjYxOTIwMWYwYjc0MWUxIiwiaCI6Im11cm11cjY0In0="; 

// Find route dynamically
async function findRoute() {
    try {
        const sourceName = document.getElementById("source").value;
        const destName = document.getElementById("destination").value;

        if (!sourceName || !destName) {
            alert("Please enter both start and destination.");
            return;
        }

        const sourceCoord = await geocode(sourceName); // [lat, lng]
        const destCoord = await geocode(destName);

        if (routeLine) map.removeLayer(routeLine);

        // OpenRouteService expects [lng, lat]
        const coords = [
            [sourceCoord[1], sourceCoord[0]],
            [destCoord[1], destCoord[0]]
        ];

        const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${coords[0][0]},${coords[0][1]}&end=${coords[1][0]},${coords[1][1]}`;
        const res = await fetch(url);
        const data = await res.json();

        const geometry = data.features[0].geometry.coordinates;
        const distance = data.features[0].properties.segments[0].distance / 1000; // km
        const duration = data.features[0].properties.segments[0].duration / 60;  // min

        const latlngs = geometry.map(coord => [coord[1], coord[0]]);
        routeLine = L.polyline(latlngs, { color: 'blue' }).addTo(map);
        map.fitBounds(routeLine.getBounds());

        document.getElementById("info").innerText = 
            `Route: ${sourceName} -> ${destName} | Distance: ${distance.toFixed(2)} km | Estimated Time: ${duration.toFixed(0)} min | Estimated Fare: ${Math.round(distance * 10)} BDT`;

    } catch (err) {
        alert(err.message);
        console.error(err);
    }
}

// Reset map and inputs
function resetMap() {
    if (routeLine) map.removeLayer(routeLine);
    map.setView([23.8700, 90.2500], 13);
    document.getElementById("source").value ="";
    document.getElementById("destination").value = "";
    document.getElementById("info").innerText = "";
}
