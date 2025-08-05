document.addEventListener('DOMContentLoaded', () => {
    const lastUpdatedSpan = document.getElementById('last-updated');

    const map = L.map('map').setView([10.8505, 76.2711], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    function getColor(warningColor) {
        switch (warningColor) {
            case 'Red': return '#F44336';
            case 'Orange': return '#FF9800';
            case 'Yellow': return '#FFEB3B';
            case 'Green': return '#4CAF50';
            default: return '#808080'; // Default Grey for no warning
        }
    }

    Promise.all([
        fetch('data.json'),
        fetch('kerala-districts.geojson')
    ])
    .then(([warningsResponse, geojsonResponse]) => 
        Promise.all([warningsResponse.json(), geojsonResponse.json()])
    )
    .then(([weatherData, geojsonData]) => {

        lastUpdatedSpan.textContent = new Date(weatherData.lastUpdated).toLocaleString('en-IN', {
            dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Kolkata'
        });

        // Create a lookup map. IMPORTANT: We normalize the names here to be robust.
        const warningsMap = new Map(
            weatherData.warnings.map(d => [d.district.toUpperCase().trim(), d.color])
        );

        L.geoJson(geojsonData, {
            style: function(feature) {
                // Normalize the GeoJSON district name in the same way for a reliable match
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
            onEachFeature: function(feature, layer) {
                const districtName = feature.properties.DISTRICT;
                // Normalize for lookup
                const lookupName = districtName.toUpperCase().trim();
                const warningColor = warningsMap.get(lookupName) || 'No Warning';
                
                // This console log is left in for debugging, just in case!
                console.log(`Matching: [${lookupName}] -> Found color from data.json: [${warningsMap.get(lookupName)}]`);

                layer.bindPopup(`<strong>${districtName}</strong><br>Warning: ${warningColor}`);
            }
        }).addTo(map);
    })
    .catch(error => {
        console.error("Error loading map or weather data:", error);
        document.getElementById('map').innerHTML = `<p style="color: red; text-align: center;"><b>Error:</b> Could not load data. Did you run the scraper?</p>`;
    });
});