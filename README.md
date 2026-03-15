<div align="center">

<img src="public/icon.svg" alt="EconGrapher Logo" width="120" height="120">

# EconGrapher

**Graphing AI Economics Assistant**

*Your intelligent companion for economic visualization*

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[🚀 Quick Start](#-quick-start) · [✨ Key Features](#-key-features) · [📖 Architecture](#-architecture) · [🤝 Contributing](#-contributing)

***

</div>

## 📸 Screenshot

<div align="center">

<img src="assets/screenshot.png" alt="EconGrapher Screenshot" width="100%">

*Interactive economics graphs with AI-powered assistance*

</div>

## 🎯 Overview

EconGrapher is an AI economics assistant designed for **AP Micro & Macro Economics**. Ask questions, explore concepts, and generate interactive graphs through natural language conversations.

## ✨ Key Features

### 🤖 AI-Powered Generation
- **Natural Language Input** - Ask questions in plain English, just like talking to a TA
- **Real-time Streaming** - Watch AI responses build live, no loading screens
- **Thinking Process Visibility** - See the AI's reasoning step-by-step (supports DeepSeek R1, OpenAI o1 series, etc.)
- **Thinking Model Detection** - Auto-detect and optimize for reasoning models
- **Multi-Provider Support** - 12+ built-in providers and custom OpenAI-compatible endpoints

### 🔄 Message Branching
- **Retry Generation** - Regenerate AI responses with one click
- **Edit Messages** - Modify user messages and regenerate from that point
- **Branch Navigation** - Switch between different versions of conversations
- **Version History** - Keep track of all message variations

### 📐 Smart Geometric Engine
- **Semantic Definitions** - Describe charts conceptually ("find intersection of supply and demand")
- **Auto-Calculated Coordinates** - Mathematical computations handled automatically
- **Intersection Detection** - Smart curve crossing point identification
- **Projection Handling** - Automatic dashed lines to axes with labels

### 📊 Interactive Visualization
- **Zoom & Pan** - Explore chart details with intuitive controls
- **Plotly.js Powered** - Professional, publication-quality charts
- **Analysis Cards** - Structured effect analysis alongside charts
- **Responsive Design** - Perfect on desktop, tablet, and mobile devices

### 💾 Session Management
- **Local Storage** - All data stays on your device, privacy-first
- **Multiple Sessions** - Organize conversations by topic or chapter
- **Chat History** - Full conversation preservation across sessions
- **Quick Switching** - Seamlessly jump between different workspaces

### 📤 Export & Debug
- **Chat Export** - Export conversations as Markdown or JSON
- **Debug Data** - Export raw HTTP requests for troubleshooting
- **No Server Required** - 100% client-side, no backend needed

## 📚 Supported Charts

<details>
<summary><b>🔬 Microeconomics</b></summary>

| Chart Type                | Description                     |
| ------------------------- | ------------------------------- |
| Supply & Demand           | Market equilibrium analysis     |
| Consumer/Producer Surplus | Welfare analysis                |
| Price Controls            | Ceilings and floors             |
| Elasticity                | Price, income, cross elasticity |
| Cost Curves               | MC, ATC, AVC, AFC               |
| Market Structures         | Perfect competition, monopoly   |
| Factor Markets            | Labor, capital markets          |

</details>

<details>
<summary><b>🌍 Macroeconomics</b></summary>

| Chart Type     | Description               |
| -------------- | ------------------------- |
| AD-AS Model    | Aggregate demand & supply |
| Phillips Curve | Inflation-unemployment    |
| Money Market   | Supply & demand for money |
| Loanable Funds | Investment & savings      |
| Forex Market   | Exchange rate dynamics    |
| PPC            | Production possibilities  |

</details>

## 🚀 Quick Start

### Prerequisites

```bash
node >= 18.0.0
npm or pnpm
```

### Installation

```bash
# Clone the repository
git clone https://github.com/ItsTimeTooSleep/EconGrapher.git
cd EconGrapher

# Install dependencies
npm install

# Start development server
npm run dev
```

### Configuration

<div align="center">

| Step | Action                                 |
| :--: | -------------------------------------- |
|  1️⃣ | Open the application in your browser   |
|  2️⃣ | Click **"Set API Key"** in the header  |
|  3️⃣ | Enter your API key and select provider |
|  4️⃣ | Start chatting with your AI assistant  |

</div>

### Supported AI Providers

| Provider | Endpoint | Key Models |
|----------|----------|------------|
| **OpenAI** | `api.openai.com/v1` | GPT-5.4, GPT-4.1, o4, o4-mini |
| **DeepSeek** | `api.deepseek.com/v1` | DeepSeek Chat, DeepSeek R1 (Reasoner) |
| **Anthropic** | `api.anthropic.com/v1` | Claude 4 Sonnet, Claude 4 Opus |
| **Google** | `generativelanguage.googleapis.com` | Gemini 3.1 Pro, Gemini 3.0 Flash |
| **Azure OpenAI** | Custom | GPT-5.4, o4 |
| **OpenRouter** | `openrouter.ai/api/v1` | Multi-provider gateway |
| **Together AI** | `api.together.xyz/v1` | Llama 4, Qwen 3 |
| **Groq** | `api.groq.com/openai/v1` | Llama 4 Scout, Qwen 3 |
| **Mistral** | `api.mistral.ai/v1` | Mistral Neural 7B, Mistral Large 3 |
| **Moonshot (Kimi)** | `api.moonshot.cn/v1` | Moonshot V2 |
| **Zhipu (智谱)** | `open.bigmodel.cn/api/paas/v4` | GLM-5 Pro, GLM-5 Flash |
| **Ollama (Local)** | `localhost:11434/v1` | Local LLMs |
| **Custom** | *Any OpenAI-compatible* | *Varies* |



## 🎮 Usage

### Basic Commands

```bash
/export [format]    # Export conversation (json/markdown)
/debug              # Export raw API request data
```

### Example Workflow

```
👤 User: Draw a monopoly market showing deadweight loss

🤖 AI: I'll create a monopoly diagram showing:
      • Demand curve (D)
      • Marginal Revenue (MR) 
      • Marginal Cost (MC)
      • Deadweight loss area
      
      [📊 Interactive Chart Generated]
      
      The monopoly produces where MR = MC, charges 
      price Pm, creating deadweight loss shown in red...
```

## 🏗 Architecture

### Geometric Primitive System

<div align="center">

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   AI describes   │ ──► │  System computes │ ──► │  Chart renders   │
│   semantically   │     │   coordinates    │     │   interactively  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
   "intersection"          (x: 5, y: 7)            Plotly.js trace
   "projection"            Calculated               visualization
   "area"                  automatically
```

</div>

### Chart Definition Example

```json
{
  "title": "Market Equilibrium",
  "curves": [
    { "id": "D", "label": "D", "type": "linear", "slope": -1, "intercept": 10 },
    { "id": "S", "label": "S", "type": "linear", "slope": 1, "intercept": 2 }
  ],
  "points": [
    { "id": "E", "definition": { "type": "intersection", "curve1": "D", "curve2": "S" } }
  ],
  "lines": [
    { "definition": { "type": "dashedToX", "from": "E", "xLabel": "Qe" } },
    { "definition": { "type": "dashedToY", "from": "E", "yLabel": "Pe" } }
  ],
  "areas": [
    { "points": ["D_int", "Pe", "E"], "color": "rgba(59, 130, 246, 0.3)", "label": "CS" }
  ]
}
```

### Project Structure

```
EconGrapher/
├── 📁 app/                      # Next.js App Router
│   ├── page.tsx                 # Main application page
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   └── test/                    # Test page
│
├── 📁 components/
│   ├── 📁 charts/               # Chart components
│   │   ├── EconChart.tsx        # Main chart renderer
│   │   ├── SingleChart.tsx      # Single chart wrapper
│   │   ├── 📁 builders/         # Chart builders
│   │   ├── 📁 layouts/          # Chart layouts
│   │   └── 📁 constants/        # Colors and constants
│   │
│   ├── ChatArea.tsx             # Chat interface
│   ├── ChatMessage.tsx          # Message component (with branching)
│   ├── ChatInput.tsx            # Input component
│   ├── SessionSidebar.tsx       # Session management
│   ├── SettingsModal.tsx        # API settings
│   ├── ThinkingBlock.tsx        # Thinking process display
│   ├── AnalysisCard.tsx         # Effect analysis display
│   ├── MarkdownRenderer.tsx     # Markdown rendering
│   └── 📁 ui/                   # UI components (Radix)
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       └── ...
│
├── 📁 lib/
│   ├── ai-service.ts            # AI streaming service
│   ├── storage.ts               # LocalStorage management
│   ├── export.ts                # Chat export functionality
│   ├── types.ts                 # Core TypeScript types
│   ├── model-presets.ts         # AI model presets
│   ├── provider-detector.ts     # Provider auto-detection
│   ├── provider-adapter.ts      # Provider format adapter
│   ├── api-format-adapter.ts    # API format conversion
│   ├── logger.ts                # Debug logging
│   ├── utils.ts                 # Utility functions
│   │
│   └── 📁 rule-engine/          # Geometric primitive engine
│       ├── primitive-engine.ts  # Core engine
│       ├── 📁 curve-templates/  # Curve generation
│       ├── 📁 primitives/       # Point, line, area resolvers
│       └── 📁 utils/            # Geometry utilities
│
├── 📁 hooks/
│   └── use-toast.ts             # Toast notification hook
│
├── 📁 docs/                     # Documentation
│   └── ai-chart-api-reference.md
│
└── 📁 types/                    # TypeScript definitions
    └── plotly.js-dist-min.d.ts
```

## 🛠 Development

### Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Build for production     |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |

### Tech Stack

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Plotly.js](https://img.shields.io/badge/Plotly.js-3.4.0-3F4F75?style=for-the-badge&logo=plotly)](https://plotly.com/javascript/)
[![Radix UI](https://img.shields.io/badge/Radix_UI-Latest-7C3AED?style=for-the-badge)](https://www.radix-ui.com/)

</div>

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. 🍴 Fork the repository
2. 🌿 Create your feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🎉 Open a Pull Request

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

<div align="center">

| Project                                     | Description                        |
| ------------------------------------------- | ---------------------------------- |
| [Next.js](https://nextjs.org/)              | The React Framework for Production |
| [Radix UI](https://www.radix-ui.com/)       | Unstyled, accessible UI components |
| [Plotly.js](https://plotly.com/javascript/) | Open-source graphing library       |
| [Tailwind CSS](https://tailwindcss.com/)    | Utility-first CSS framework        |

</div>

***

<div align="center">

**Made with ❤️ for economics education**

[⬆ Back to Top](#-econgrapher)

</div>
