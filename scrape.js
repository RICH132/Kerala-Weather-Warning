const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const url = "https://mausam.imd.gov.in/imd_latest/contents/districtwise-warning_mc.php?id=4";

function hexToColorName(hexColor) {
    const colorMap = {
        '#FF0000': 'Red',
        '#FFFF00': 'Yellow',
        '#00FF00': 'Green',
        '#FFA500': 'Orange'
    };
    if (!hexColor) return "Unknown";
    const upperHex = hexColor.toUpperCase();
    const matchedKey = Object.keys(colorMap).find(key => upperHex.startsWith(key));
    return matchedKey ? colorMap[matchedKey] : "Unknown";
}

async function scrapeWithPlaywright() {
    console.log("🚀 Launching browser with Playwright...");
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle' });
        console.log("Page loaded. Waiting for map data...");
        await page.waitForSelector('[aria-label]', { timeout: 20000 });
        
        const elements = await page.locator('[aria-label]').all();
        console.log(`Found ${elements.length} total map elements.`);
        
        const results = [];
        for (const el of elements) {
            const district = await el.getAttribute('aria-label');
            const colorHex = await el.getAttribute('fill');
            const colorName = hexToColorName(colorHex);

            if (colorName !== "Unknown") {
                results.push({ district: district, color: colorName });
            }
        }

        const outputData = {
            lastUpdated: new Date().toISOString(),
            warnings: results
        };

        const outputPath = path.join(__dirname, 'public', 'data.json');
        fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

        console.log(`✅ Successfully scraped and saved data to ${outputPath}`);
        console.log(`Found ${results.length} districts with active warnings.`);

    } catch (error) {
        console.error("❌ An error occurred during the Playwright scrape:", error);
    } finally {
        await browser.close();
        console.log("Browser closed.");
    }
}

scrapeWithPlaywright();