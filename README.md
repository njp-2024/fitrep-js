# FitRep Calculator

A web-based tool for USMC Fitness Report (FitRep) analysis. Calculate projected Relative Values before submitting and generate Section I narrative comments using AI assistance.

**Live Demo:** [fitrep-calculator.netlify.app](https://fitrep-calculator.netlify.app)

## Project Status

**Prototype - Deployed & Operational (Untested)**

All core functionality is implemented. Testing and refinement pending.

## Features

- **RS Profile Setup** - Enter Reporting Senior averages and cumulative totals
- **Report Entry** - Add multiple FitRep reports with attribute scoring
- **RV Calculation** - See projected Relative Values (Procedural and Cumulative)
- **Narrative Generator** - Generate Section I comments via:
  - Manual mode (template-based)
  - AI mode (OpenAI GPT-4o-mini integration)
- **Session Export** - Export session summary as text file

## Structure

```
fitrep-calculator/
├── index.html              # Main HTML file
├── style.css               # Main stylesheet
├── netlify.toml            # Netlify deployment config
├── package.json            # Node.js dependencies
├── js/
│   ├── app.js              # Application entry point
│   ├── config/
│   │   ├── Config.js       # App constants (ranks, scores, attributes)
│   │   └── AIConfig.js     # AI prompt configuration
│   ├── models/             # Data models (Profile, Report)
│   ├── services/
│   │   ├── Calculator.js       # RV calculation logic
│   │   ├── Validation.js       # Input validation
│   │   ├── ManualGenerator.js  # Template-based narrative generator
│   │   ├── PromptBuilder.js    # AI prompt construction
│   │   ├── LLMService.js       # Frontend API client for AI
│   │   ├── ExportService.js    # Session export functionality
│   │   └── PrecisionService.js # Decimal precision handling
│   ├── state/
│   │   └── Store.js        # Application state (singleton)
│   └── ui/                 # UI page controllers
│       ├── Navigation.js
│       ├── Sidebar.js
│       ├── ProfilePage.js
│       ├── ReportsPage.js
│       └── NarrativesPage.js
└── netlify/
    └── functions/
        └── generate-narrative.js  # Serverless OpenAI backend
```

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+), Bootstrap 5.3
- **Backend**: Netlify Functions (Node.js serverless)
- **AI**: OpenAI GPT-4o-mini API
- **Hosting**: Netlify

## Getting Started

### Local Development

1. Clone the repository
2. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_key_here
   ```
3. Install Netlify CLI: `npm install -g netlify-cli`
4. Install dependencies: `npm install`
5. Run locally: `netlify dev`

### Static Preview (No AI)

Open `index.html` directly in a browser. Manual narrative generation will work; AI generation requires the Netlify backend.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for narrative generation |

## Deployment

The app is configured for Netlify deployment. Push to the connected Git repository to trigger automatic deploys.
