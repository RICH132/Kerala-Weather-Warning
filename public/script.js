document.addEventListener('DOMContentLoaded', () => {
    const lastUpdatedEl = document.getElementById('last-updated');
    const mapLoadingEl = document.getElementById('map-loading');
    const mapErrorEl = document.getElementById('map-error');
    const alertSummaryEl = document.getElementById('alert-summary');

    const WARNING_COLORS = {
        Red: 'oklch(0.52 0.19 25)',
        Orange: 'oklch(0.62 0.18 45)',
        Yellow: 'oklch(0.76 0.16 80)',
        Green: 'oklch(0.52 0.14 145)',
        None: 'oklch(0.72 0.01 55)'
    };

    const WARNING_ADVICE = {
        Red: 'Take immediate precautions. Severe weather is expected.',
        Orange: 'Prepare for heavy rain or strong winds in your area.',
        Yellow: 'Monitor updates. Conditions may worsen.',
        Green: 'No active warning for this district.',
        'No Warning': 'No active warning for this district.',
        None: 'Warning data is not available for this district.'
    };

    const DISTRICT_STYLE = {
        weight: 1.5,
        opacity: 1,
        color: 'oklch(0.98 0.006 55)',
        fillOpacity: 0.82
    };

    const HOVER_STYLE = { weight: 2.5, fillOpacity: 0.95 };
    const BASE_STYLE = { weight: 1.5, fillOpacity: 0.82 };

    const STYLE_CACHE = Object.fromEntries(
        Object.entries(WARNING_COLORS).map(([level, fillColor]) => [
            level,
            { ...DISTRICT_STYLE, fillColor }
        ])
    );

    function getStyle(warningColor) {
        return STYLE_CACHE[warningColor] || STYLE_CACHE.None;
    }

    function hideLoading() {
        mapLoadingEl.classList.add('is-hidden');
    }

    function showError(title, detail) {
        hideLoading();
        mapErrorEl.hidden = false;
        mapErrorEl.innerHTML = `<strong>${title}</strong>${detail}`;
        requestAnimationFrame(() => mapErrorEl.classList.add('is-visible'));
    }

    function buildPopupContent(districtName, warningColor) {
        const levelKey = warningColor === 'No Warning' ? 'None' : warningColor;
        const swatchColor = WARNING_COLORS[levelKey] || WARNING_COLORS.None;
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
        for (let i = 0; i < warnings.length; i++) {
            const color = warnings[i].color;
            if (counts[color] !== undefined) counts[color]++;
        }

        const order = ['Red', 'Orange', 'Yellow', 'Green'];
        const parts = [];
        for (let i = 0; i < order.length; i++) {
            const level = order[i];
            const count = counts[level];
            if (count <= 0) continue;
            const label = count === 1 ? `1 district, ${level}` : `${count} districts, ${level}`;
            parts.push(`<span class="alert-badge alert-badge--${level.toLowerCase()}">${label}</span>`);
        }

        if (parts.length) {
            alertSummaryEl.innerHTML = parts.join('');
            alertSummaryEl.hidden = false;
            if (counts.Red > 0) alertSummaryEl.classList.add('alert-summary--severe');
        }
    }

    const map = L.map('map', {
        zoomControl: true,
        preferCanvas: true
    }).setView([10.8505, 76.2711], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        updateWhenIdle: true,
        keepBuffer: 2
    }).addTo(map);

    const dataRequest = fetch('data.json');
    const geoRequest = fetch('kerala-districts.geojson');

    Promise.all([dataRequest, geoRequest])
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

            const warningsMap = new Map();
            for (let i = 0; i < weatherData.warnings.length; i++) {
                const entry = weatherData.warnings[i];
                warningsMap.set(entry.district.toUpperCase().trim(), entry.color);
            }

            renderAlertSummary(weatherData.warnings);

            L.geoJSON(geojsonData, {
                style(feature) {
                    const districtName = feature.properties.DISTRICT.toUpperCase().trim();
                    return getStyle(warningsMap.get(districtName) || 'None');
                },
                onEachFeature(feature, layer) {
                    const districtName = feature.properties.DISTRICT;
                    const lookupName = districtName.toUpperCase().trim();
                    const warningColor = warningsMap.get(lookupName) || 'No Warning';

                    layer.bindPopup(() => buildPopupContent(districtName, warningColor));

                    layer.on('mouseover', function onMouseOver() {
                        this.setStyle(HOVER_STYLE);
                    });
                    layer.on('mouseout', function onMouseOut() {
                        this.setStyle(BASE_STYLE);
                    });
                }
            }).addTo(map);

            hideLoading();
            requestAnimationFrame(() => map.invalidateSize());
        })
        .catch(() => {
            showError(
                'Map data could not load',
                'Run <code>npm run scrape</code> locally, then refresh. If you just deployed, wait for the next automated update.'
            );
        });
});
