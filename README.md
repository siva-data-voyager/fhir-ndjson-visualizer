# FHIR NDJSON Visualizer

> **Created by Siva Komaragiri (Data Voyager Team)**

A beautiful, client-side React dashboard for exploring and visualizing Synthea-generated FHIR R4 US Core 6.1.0 NDJSON data.

![Dashboard Preview](./docs/preview.png)

## Features

- **Auto-Detection**: Automatically identifies resource types from pasted NDJSON
- **Rich Visualizations**: Interactive charts for demographics, temporal trends, distributions
- **Data Table**: Sortable, searchable table with row-level JSON inspection
- **Client-Side Only**: All processing happens in your browser—no data leaves your machine
- **Dark Mode**: Toggle between light and dark themes
- **Export**: Download summary reports as JSON

### Supported Resource Types

| Resource Type | Support Level | Visualizations |
|---------------|---------------|----------------|
| **Patient** | ✅ Full | Age distribution, gender, race/ethnicity, geographic, mortality |
| **Encounter** | ✅ Full | Time series, class/type distribution, length of stay, encounters per patient |
| Other types | ⚠️ Generic | Field analysis, sample values, data quality metrics |

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or yarn/pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/fhir-ndjson-visualizer.git
cd fhir-ndjson-visualizer

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Usage

1. **Paste NDJSON**: Copy your Synthea-generated NDJSON content (one FHIR resource per line) into the text area
2. **Click Analyze**: The tool parses and validates each line
3. **Explore Dashboard**: View summary metrics, interactive charts, and the data table
4. **Export**: Download a summary report or copy individual resource JSON

### Example NDJSON Input

**Patient.ndjson:**
```json
{"resourceType":"Patient","id":"example-1","gender":"female","birthDate":"1985-03-15","address":[{"state":"MA","city":"Boston"}]}
{"resourceType":"Patient","id":"example-2","gender":"male","birthDate":"1972-08-22","address":[{"state":"MA","city":"Cambridge"}]}
```

**Encounter.ndjson:**
```json
{"resourceType":"Encounter","id":"enc-1","status":"finished","class":{"code":"AMB","display":"Ambulatory"},"period":{"start":"2024-01-15T09:00:00Z","end":"2024-01-15T09:30:00Z"},"subject":{"reference":"Patient/example-1"}}
```

## GitHub Pages Deployment

### Option 1: Using `gh-pages` Package

```bash
# Deploy to GitHub Pages
npm run deploy
```

This command:
1. Builds the project
2. Pushes the `dist` folder to the `gh-pages` branch

**First-time setup:**
1. Create a GitHub repository
2. Push your code
3. Run `npm run deploy`
4. Go to Repository Settings → Pages → Source: `gh-pages` branch

### Option 2: GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

**Important**: Update `vite.config.ts` base path to match your repository name:

```typescript
export default defineConfig({
  base: '/your-repo-name/',
  // ...
})
```

## Project Structure

```
fhir-ndjson-visualizer/
├── src/
│   ├── components/          # React components
│   │   ├── Layout.tsx       # App shell with header/footer
│   │   ├── NdjsonInput.tsx  # NDJSON paste input
│   │   ├── PatientDashboard.tsx
│   │   ├── EncounterDashboard.tsx
│   │   ├── GenericDashboard.tsx
│   │   ├── ResourceTable.tsx
│   │   ├── SummaryCard.tsx
│   │   ├── ChartPanel.tsx
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   │   ├── useTheme.tsx     # Theme (dark/light mode)
│   │   └── useLocalStorage.ts
│   ├── utils/               # Utility functions
│   │   ├── ndjsonParser.ts  # NDJSON parsing logic
│   │   ├── patientAnalytics.ts
│   │   └── encounterAnalytics.ts
│   ├── types/               # TypeScript types
│   │   ├── fhir.ts          # FHIR resource interfaces
│   │   └── analytics.ts     # Analytics data structures
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Extending Support for New Resource Types

1. **Add TypeScript types** in `src/types/fhir.ts`:
   ```typescript
   export interface FhirObservation extends FhirResource {
     resourceType: 'Observation';
     // ... fields
   }
   ```

2. **Create analytics utility** in `src/utils/observationAnalytics.ts`:
   ```typescript
   export function analyzeObservations(obs: FhirObservation[]): ObservationAnalytics {
     // Compute metrics
   }
   ```

3. **Create dashboard component** in `src/components/ObservationDashboard.tsx`

4. **Update App.tsx** to render the new dashboard

## Tech Stack

- **Vite** - Fast build tool
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Charts
- **Lucide React** - Icons

## Assumptions & Limitations

1. **Single resource type per paste**: The tool expects NDJSON for one resource type at a time. Mixed types will show a warning.

2. **Moderate data volumes**: Optimized for up to tens of thousands of records. Very large files may impact performance.

3. **FHIR R4 / US Core 6.1.0**: Designed for Synthea output conforming to these profiles.

4. **Field presence varies**: Not all fields are required. Charts gracefully handle missing data.

5. **Age calculation**: Uses `birthDate` and `deceasedDateTime` (if present). Current date used for living patients.

## Disclaimer

⚠️ **This tool is for data exploration and educational purposes only.**

- **Not a medical device** - Not for clinical decision-making
- **Not validated for compliance** - Does not ensure HIPAA or regulatory compliance
- **Synthetic data focus** - Designed for Synthea data; use real PHI at your own risk
- **Client-side processing** - No data is transmitted externally

## License

MIT License - See [LICENSE](./LICENSE) for details.

---

**Created by Siva Komaragiri (Data Voyager Team)**
