document.addEventListener('DOMContentLoaded', () => {
    const lastUpdatedEl = document.getElementById('last-updated');
    const mapLoadingEl = document.getElementById('map-loading');
    const mapErrorEl = document.getElementById('map-error');
    const alertSummaryEl = document.getElementById('alert-summary');

    const WARNING_COLORS = {
        Red: '#d32f2f',
        Orange: '#ef6c00',
        Yellow: '#f9a825',
        Green: '#388e3c',
        None: 'oklch(0.72 0.01 230)'
    };

    function getColor(warningColor) {
        return WARNING_COLORS[warningColor] || WARNING_COLORS.None;
    }

    function hideLoading() {
        mapLoadingEl.classList.add('is-hidden');
    }

    function showError(message) {
        hideLoading();
        mapErrorEl.hidden = false;
        mapErrorEl.textContent = message;
    }

    function buildPopupContent(districtName, warningColor) {
        const swatchColor = getColor(warningColor === 'No Warning' ? 'None' : warningColor);
        return `
            <span class="popup-district">${districtName}</span>
            <span class="popup-warning">
                <span class="popup-swatch" style="background-color: ${swatchColor}"></span>
                ${warningColor}
            </span>
        `;
    }

    function renderAlertSummary(warnings) {
        const counts = { Red: 0, Orange: 0, Yellow: 0, Green: 0 };
        warnings.forEach(({ color }) => {
            if (counts[color] !== undefined) counts[color]++;
        });

        const badges = Object.entries(counts)
            .filter(([, count]) => count > 0)
            .map(([level, count]) =>
                `<span class="alert-badge alert-badge--${level.toLowerCase()}">${count} ${level}</span>`
            )
            .join('');

        if (badges) {
            alertSummaryEl.innerHTML = badges;
            alertSummaryEl.hidden = false;
        }
    }

    const map = L.map('map', { zoomControl: true }).setView([10.8505, 76.2711], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

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
            const updatedDate = new Date(weatherData.lastUpdated);
            lastUpdatedEl.textContent = updatedDate.toLocaleString('en-IN', {
                dateStyle: 'full',
                timeStyle: 'short',
                timeZone: 'Asia/Kolkata'
            });
            lastUpdatedEl.dateTime = updatedDate.toISOString();

            const warningsMap = new Map(
                weatherData.warnings.map(d => [d.district.toUpperCase().trim(), d.color])
            );

            renderAlertSummary(weatherData.warnings);

            L.geoJson(geojsonData, {
                style(feature) {
                    const districtName = feature.properties.DISTRICT.toUpperCase().trim();
                    const warningColor = warningsMap.get(districtName) || 'None';

                    return {
                        fillColor: getColor(warningColor),
                        weight: 1.5,
                        opacity: 1,
                        color: 'white',
                        fillOpacity: 0.78
                    };
                },
                onEachFeature(feature, layer) {
                    const districtName = feature.properties.DISTRICT;
                    const lookupName = districtName.toUpperCase().trim();
                    const warningColor = warningsMap.get(lookupName) || 'No Warning';

                    layer.bindPopup(buildPopupContent(districtName, warningColor));

                    layer.on('mouseover', function () {
                        this.setStyle({ weight: 2.5, fillOpacity: 0.9 });
                    });
                    layer.on('mouseout', function () {
                        this.setStyle({ weight: 1.5, fillOpacity: 0.78 });
                    });
                }
            }).addTo(map);

            hideLoading();
            map.invalidateSize();
        })
        .catch(error => {
            showError('Could not load map data. Please ensure the scraper has run and all files are in the public folder.');
        });
});
