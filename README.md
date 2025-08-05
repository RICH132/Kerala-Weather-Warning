# Kerala Weather Warning Dashboard 🗺️🇮🇳

![Vercel Deployment Status](https://img.shields.io/badge/deployment-live-brightgreen)
![GitHub Actions Workflow Status](https://github.com/RICH132/Kerala-Weather-Warning/actions/workflows/scrape.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue)

An automated web application that scrapes district-level weather warnings for Kerala, India, from the India Meteorological Department (IMD) website and displays them on an interactive choropleth map.

---

### **➡️ Live Demo**

**[https://your-vercel-url.vercel.app/](https://your-vercel-url.vercel.app/)**

*(Replace the link above with your actual Vercel URL!)*

### **✨ Screenshot**

![Dashboard Screenshot](./path/to/your/screenshot.png)

*(To add a screenshot: take one of your dashboard, add it to your project folder, and update the path above.)*

---

## ## Features

-   **🤖 Automated Scraping**: A GitHub Action runs a Playwright script every 12 hours to fetch the latest warning data.
-   **🗺️ Interactive Map**: Uses Leaflet.js and OpenStreetMap to provide a zoomable, pannable map of Kerala.
-   **🎨 Data Visualization**: Districts are color-coded (Red, Orange, Yellow, Green, or Grey for no warning) based on the current IMD alert level.
-   **🚀 CI/CD Pipeline**: The project is fully automated. The scraper commits new data directly to the repository, and Vercel automatically deploys the updated site.

---

## ## How It Works

The project follows a modern, automated data pipeline: