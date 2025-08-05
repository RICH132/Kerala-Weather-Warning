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

![Dashboard Screenshot](./public/dashboard-screenshot.png)
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
| Step | Component             | Action                                                                | Result                                                              |
| :--- | :-------------------- | :-------------------------------------------------------------------- | :------------------------------------------------------------------ |
| 1    | **GitHub Actions** | Starts automatically every 12 hours (`cron`) or on a manual trigger.  | A new virtual machine is created to run the job.                    |
| 2    | **Playwright Scraper**| Runs via `npm run scrape`, navigates to the IMD website, and gets data. | A new `public/data.json` file is generated with the latest warnings.  |
| 3    | **GitHub Actions** | Commits the updated `data.json` file back into the repository.        | A new commit with the message "Automated data update" is pushed.    |
| 4    | **Vercel / Netlify** | Receives a webhook notification from the new push to GitHub.          | A new deployment is automatically triggered.                        |
| 5    | **Vercel / Netlify** | Pulls the latest code and the new `data.json` from the repository.    | The `public` folder is built and published to the live URL.         |
| 6    | **User's Browser** | Visits your live website URL.                                         | Loads the `index.html`, which fetches the latest `data.json` and displays the colored map. |
---

## ## Tech Stack

-   **Scraper/Automation**: Node.js, Playwright, GitHub Actions
-   **Frontend**: HTML, CSS, JavaScript, Leaflet.js, GeoJSON
-   **Hosting**: Vercel

---

## ## Local Setup and Installation

To run this project on your local machine:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/RICH132/Kerala-Weather-Warning.git](https://github.com/RICH132/Kerala-Weather-Warning.git)
    cd Kerala-Weather-Warning
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Install Playwright's browsers:**
    ```bash
    npx playwright install --with-deps
    ```

4.  **Run the scraper manually** to generate the initial `data.json` file:
    ```bash
    npm run scrape
    ```

5.  **Start the local web server** to view the map:
    ```bash
    npm run start
    ```
    Now, open `http://localhost:3000` in your browser.

---

## ## Disclaimer

This is an unofficial project created for educational purposes. The data is sourced from the IMD. For any official use, please always refer to the [official IMD website](https://mausam.imd.gov.in/).

---

## ## License

This project is licensed under the MIT License.