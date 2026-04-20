# Lift Log

A minimal, mobile-first workout tracking web app powered by Google Sheets as a backend.

## Features

- **Log workouts** — record exercise, sets, weight, and reps/rep ranges
- **Filter by category** — quickly switch between Upper and Lower body exercises, filtered by muscle group
- **Add custom exercises** — add new exercises with a category and muscle group on the fly
- **History** — view all past logs grouped by date, with inline edit and delete
- **Charts** — visualize volume or estimated 1RM over time, grouped by exercise or muscle group
- **Calendar** — monthly heatmap showing which days had Upper, Lower, or both workout types
- **PWA-ready** — installable on iOS/Android home screen via Apple Web App meta tags

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML, CSS, JavaScript |
| Styling | [DM Mono & DM Sans](https://fonts.google.com/) via Google Fonts |
| Charts | [Chart.js 4](https://www.chartjs.org/) |
| Backend | Google Apps Script (deployed as a web app) |
| Storage | Google Sheets |

## Project Structure

```
├── index.html      # App shell and all JavaScript
├── style.css       # All styles
└── Code.gs         # Google Apps Script backend
```

## Setup

### 1. Google Sheets & Apps Script

1. Create a new Google Sheet with two sheets named **Exercises** and **Logs**.
2. Open **Extensions → Apps Script** and paste the contents of `Code.gs`.
3. Deploy as a web app:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Copy the deployment URL.

### 2. Frontend

1. Open `index.html` and replace the `API` constant near the top of the `<script>` with your deployment URL:
   ```js
   const API = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
   ```
2. Serve the files from any static host (GitHub Pages, Netlify, etc.) or open `index.html` directly in a browser.

## Usage

| Tab | What it does |
|-----|-------------|
| **Log** | Select an exercise, enter sets/weight/reps, tap **Log exercise** |
| **History** | Browse all past entries; tap **⋯** to edit or delete a row |
| **Charts** | Switch between Volume, Est. 1RM, and Calendar views |

### Estimated 1RM formula

$$\text{1RM} = \text{weight} \times \left(1 + \frac{\text{reps}}{30}\right)$$

Rep ranges (e.g. `10–12`) are averaged before the calculation.

## License

MIT
