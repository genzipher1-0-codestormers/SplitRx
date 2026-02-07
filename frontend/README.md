# 🖥️ SplitRx Frontend

The user interface for the SplitRx prescription management system, built with **Next.js 16** and **TypeScript**.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API URL

# Run development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) to view the application.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **QR Codes**: QRCode.react / @zxing

## Project Structure

```
src/
├── app/          # Next.js App Router pages
├── components/   # Reusable UI components
├── lib/          # Utilities and API client
└── types/        # TypeScript type definitions
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |

---

*For complete documentation, see the main [README](../README.md) in the project root.*
