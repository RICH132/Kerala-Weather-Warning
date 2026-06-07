document.addEventListener('DOMContentLoaded', () => {
    const lastUpdatedEl = document.getElementById('last-updated');
    const mapLoadingEl = document.getElementById('map-loading');
    const mapErrorEl = document.getElementById('map-error');
    const alertSummaryEl = document.getElementById('alert-summary');
    const mapWrapperEl = document.querySelector('.map-wrapper');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const WARNING_COLORS = {
        Red: '#c62828',
        Orange: '#e65100',
        Yellow: '#f57f17',
        Green: '#2e7d32',
        None: 'oklch(0.68 0.015 230)'
    };

    const WARNING_ADVICE = {
        Red: 'Take immediate precautions. Severe weather is expected.',
        Orange: 'Prepare for heavy rain or strong winds in your area.',
        Yellow: 'Monitor updates. Weather conditions may worsen.',
        Green: 'No active warning for this district right now.',
        'No Warning': 'No active warning for this district right now.',
        None: 'Warning data is not available for this district.'
    };

    function getColor(warningColor) {
        return WARNING_COLORS[warningColor] || WARNING_COLORS.None;
    }

    function hideLoading() {
        mapLoadingEl.classList.add('is-hidden');
        mapWrapperEl.classList.add('is-ready');
    }

    function showError(title, detail) {
        hideLoading();
        mapErrorEl.hidden = false;
        mapErrorEl.innerHTML = `<strong>${title}</strong>${detail}`;
        requestAnimationFrame(() => mapErrorEl.classList.add('is-visible'));
    }

    function buildPopupContent(districtName, warningColor) {
        const levelKey = warningColor === 'No Warning' ? 'None' : warningColor;
        const swatchColor = getColor(levelKey === 'None' ? 'None' : warningColor);
        const levelClass = `popup-level--${(levelKey || 'none').toLowerCase()}`;
        const displayLevel = warningColor === 'No Warning' ? 'No warning' : `${warningColor} alert`;
        const advice = WARNING_ADVICE[warningColor] || WARNING_ADVICE.None;

        return `
            <span class="popup-district">${districtName}</span>
            <span class="popup-level ${levelClass}">
                <span class="popup-swatch" style="background-color: ${swatchColor}"></span>
                ${displayLevel}
            </span>
            <span class="popup-advice">${advice}</span>
        `;
    }

    function renderAlertSummary(warnings) {
        const counts = { Red: 0, Orange: 0, Yellow: 0, Green: 0 };
        warnings.forEach(({ color }) => {
            if (counts[color] !== undefined) counts[color]++;
        });

        const order = ['Red', 'Orange', 'Yellow', 'Green'];
        const badges = order
            .filter(level => counts[level] > 0)
            .map((level, index) => {
                const label = counts[level] === 1
                    ? `1 district · ${level}`
                    : `${counts[level]} districts · ${level}`;
                const delay = prefersReducedMotion ? 0 : index * 80;
                return `<span class="alert-badge alert-badge--${level.toLowerCase()}" style="animation-delay: ${delay}ms">${label}</span>`;
            })
            .join('');

        if (badges) {
            alertSummaryEl.innerHTML = badges;
            alertSummaryEl.hidden = false;
            if (counts.Red > 0) {
                alertSummaryEl.classList.add('alert-summary--severe');
            }
        }
    }

    function revealDistricts(layers) {
        if (prefersReducedMotion) return;

        layers.forEach((layer, index) => {
            layer.setStyle({ fillOpacity: 0 });
            setTimeout(() => {
                layer.setStyle({ fillOpacity: 0.82 });
            }, 80 + index * 35);
        });
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
            if (!warningsResponse.ok) throw new Error('data.json missing');
            if (!geojsonResponse.ok) throw new Error('geojson missing');
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

            const districtLayers = [];

            L.geoJson(geojsonData, {
                style(feature) {
                    const districtName = feature.properties.DISTRICT.toUpperCase().trim();
                    const warningColor = warningsMap.get(districtName) || 'None';

                    return {
                        fillColor: getColor(warningColor),
                        weight: 1.5,
                        opacity: 1,
                        color: 'white',
                        fillOpacity: prefersReducedMotion ? 0.82 : 0
                    };
                },
                onEachFeature(feature, layer) {
                    districtLayers.push(layer);

                    const districtName = feature.properties.DISTRICT;
                    const lookupName = districtName.toUpperCase().trim();
                    const warningColor = warningsMap.get(lookupName) || 'No Warning';

                    layer.bindPopup(buildPopupContent(districtName, warningColor));

                    layer.on('mouseover', function () {
                        this.setStyle({ weight: 2.5, fillOpacity: 0.95 });
                        this.bringToFront();
                    });
                    layer.on('mouseout', function () {
                        this.setStyle({ weight: 1.5, fillOpacity: 0.82 });
                    });
                }
            }).addTo(map);

            revealDistricts(districtLayers);
            hideLoading();
            map.invalidateSize();
        })
        .catch(() => {
            showError(
                'Map data could not load',
                'Run <code>npm run scrape</code> locally, then refresh. If you deployed recently, wait for the next automated data update.'
            );
        });
});
