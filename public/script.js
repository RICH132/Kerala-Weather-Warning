document.addEventListener('DOMContentLoaded', () => {
    const lastUpdatedSpan = document.getElementById('last-updated');
    const mapContainer = document.getElementById('map-container');

    // 1. Initialize the Leaflet map, centered on Kerala
    const map = L.map('map').setView([10.8505, 76.2711], 7);

    // 2. Add the beautiful base map layer from OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // 3. Define the colors for our warnings
    function getColor(warningColor) {
        switch (warningColor) {
            case 'Red':    return '#F44336';
            case 'Orange': return '#FF9800';
            case 'Yellow': return '#FFEB3B';
            case 'Green':  return '#4CAF50';
            default:       return '#BDBDBD'; // Default Grey for "No Warning"
        }
    }

    // 4. Fetch both our weather data and the map shape data at the same time
    Promise.all([
        fetch('data.json'),
        fetch('kerala-districts.geojson')
    ])
    .then(([warningsResponse, geojsonResponse]) => {
        if (!warningsResponse.ok) throw new Error('Could not load data.json. Please run the scraper.');
        if (!geojsonResponse.ok) throw new Error('Could not load kerala-districts.geojson.');
        return Promise.all([warningsResponse.json(), geojsonResponse.json()]);
    })
    .then(([weatherData, geojsonData]) => {

        // Update the timestamp on the page
        lastUpdatedSpan.textContent = new Date(weatherData.lastUpdated).toLocaleString('en-IN', {
            dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Kolkata'
        });

        // Create a lookup map for fast access: { "ERNAKULAM": "Red", ... }
        // This is the robust part: it cleans the names before creating the map.
        const warningsMap = new Map(
            weatherData.warnings.map(d => [d.district.toUpperCase().trim(), d.color])
        );

        // 5. Create the GeoJSON layer, which will be our colored districts
        L.geoJson(geojsonData, {
            // This function styles each district based on the warning data
            style: function(feature) {
                // Clean the district name from the map file before looking it up
                const districtName = feature.properties.DISTRICT.toUpperCase().trim();
                const warningColor = warningsMap.get(districtName) || 'None';
                
                return {
                    fillColor: getColor(warningColor),
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.7
                };
            },
            // This function adds interactivity (popups on click)
            onEachFeature: function(feature, layer) {
                const districtName = feature.properties.DISTRICT;
                const lookupName = districtName.toUpperCase().trim();
                const warningColor = warningsMap.get(lookupName) || 'No Warning';
                
                layer.bindPopup(`<strong>${districtName}</strong><br>Warning: ${warningColor}`);
            }
        }).addTo(map);
    })
    .catch(error => {
        console.error("Error loading map or weather data:", error);
        mapContainer.innerHTML = `<p style="color: red; text-align: center;"><b>Error:</b> Could not load map data. Please ensure the scraper has run and all files are in the 'public' folder.</p>`;
    });
});