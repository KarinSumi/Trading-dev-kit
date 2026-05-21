# Workspace Instructions

## Build & Test Commands
- **Install Dependencies**: `npm install`
- **TypeScript Verification**: `npx tsc --noEmit`
- **Production Build**: `npm run build`
- **Development Server**: `npm run dev` (Listening on `http://localhost:5173`)

## Code Guidelines & Preferences
- **Language**: React 19 + TypeScript (Strict module syntax).
- **Styling**: Vanilla CSS (custom cyber-terminal variables, responsive grid).
- **AI Integration**: Use NVIDIA NIM endpoint for LLM checks (`meta/llama3-70b-instruct`).
- **Broker Interface**: Integrate with MetaTrader 5 (MT5) Desktop client on Windows for Vantage.

## Presentation Preference (Critical)
- **Format**: Always generate implementation plans, reviews, and walkthroughs as styled, interactive **HTML files** (`.html`) in the artifacts directory.
- **Reference**: Provide the direct local `file:///` URL links to the generated HTML documents in the chat responses instead of standard `.md` summaries.
