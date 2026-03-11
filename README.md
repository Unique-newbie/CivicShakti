# 🏛️ CivicShakti

**AI-Powered Civic Issue Reporting & Resolution Platform for India**

CivicShakti empowers citizens to report local infrastructure issues — potholes, garbage, water leaks, electrical hazards — and routes them intelligently to the correct government department using real-time AI image analysis.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.22-orange?logo=tensorflow)](https://www.tensorflow.org/js)
[![Appwrite](https://img.shields.io/badge/Appwrite-Cloud-F02E65?logo=appwrite)](https://appwrite.io)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)](https://vercel.com)

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **AI Image Analysis** | Dual-engine system — Gemini 2.0 Flash Vision + custom TensorFlow.js MobileNetV2 pipeline — auto-categorizes complaints and assigns severity scores |
| **Hierarchical Jurisdiction** | State → City → Village → Ward delegation system. Staff only see complaints in their assigned area |
| **Real-Time Status Tracking** | Citizens track changes via ticket ID. Staff update status with official remarks |
| **Browser-Based ML Training** | Staff can retrain the custom AI model directly in the browser at `/staff/train-ai` — no Python required |
| **Heatmap Visualization** | Leaflet.js-powered geographic heatmaps showing complaint density |
| **System Health Dashboard** | Public `/status` page with real-time latency checks for all backend services |

## 🏗️ Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript, React 19
- **Styling:** Tailwind CSS 4, Shadcn UI, Radix Primitives
- **Backend:** Appwrite (Auth, Database, Storage)
- **AI/ML:** Google Gemini 2.0 Flash, TensorFlow.js, COCO-SSD, MobileNet V2
- **Maps:** Leaflet.js, React-Leaflet
- **Charts:** Recharts
- **Deployment:** Vercel (Serverless)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── (public)/           # Citizen-facing pages (home, report, track, etc.)
│   ├── staff/(portal)/     # Staff dashboard, complaints, heatmap, train-ai
│   └── api/                # REST API endpoints (auth, complaints, AI, health)
├── components/             # Reusable React components (UI, forms, maps)
├── lib/                    # Core libraries
│   ├── civic-ai-model.ts   # Primary TensorFlow.js AI engine (883 lines)
│   ├── gemini.ts           # Gemini Vision API with few-shot prompting
│   ├── appwrite.ts         # Appwrite SDK configuration
│   └── jwt.ts              # JWT authentication utilities
scripts/
├── ml/                     # Local Python ML training pipeline (optional)
├── setup-appwrite.js       # Database provisioning script
└── seed-appwrite.js        # Sample data seeder
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- An [Appwrite](https://appwrite.io) project (Cloud or self-hosted)
- A [Google AI Studio](https://aistudio.google.com) API key (for Gemini)

### Installation

```bash
git clone https://github.com/Unique-newbie/CivicShakti.git
cd CivicShakti
npm install
```

### Configuration

Create a `.env` file in the project root:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_secret_api_key
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_COMPLAINTS_COLLECTION=your_complaints_collection_id
NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION=your_profiles_collection_id
NEXT_PUBLIC_APPWRITE_BUCKET_ID=your_storage_bucket_id
GEMINI_API_KEY=your_gemini_api_key
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repository on [Vercel](https://vercel.com/new).
3. Add your `.env` variables in the Vercel project settings.
4. Deploy — Vercel handles the rest automatically.

## 🤖 AI Training

CivicShakti supports two methods for training a custom image classification model:

### Option A — Browser Trainer (Recommended)
Navigate to `/staff/train-ai` in the Staff Portal. Upload categorized images, click **Start Training**, and download the resulting `model.json`. Place it in `public/models/civicshakti/` — the app detects it automatically on next load.

### Option B — Local Python Script
For larger datasets or offline training, see [`scripts/ml/README.md`](scripts/ml/README.md).

## 👥 User Roles

| Role | Scope | Can Assign |
|------|-------|------------|
| Citizen | Submit & track own complaints | — |
| Ward Manager | Manage complaints in assigned ward | — |
| Village Manager | Oversee villages, assign Ward Managers | Ward Managers |
| City Manager | Oversee cities, assign Village/Ward Managers | Village & Ward Managers |
| State Manager | Oversee states, assign City/Village/Ward Managers | City, Village & Ward Managers |
| Superadmin | Global access, system health, error logs | All roles |

> See [`CIVIC_SHAKTI_GUIDE.md`](CIVIC_SHAKTI_GUIDE.md) for the complete application guide.

## 📄 Documentation

- [`CIVIC_SHAKTI_GUIDE.md`](CIVIC_SHAKTI_GUIDE.md) — Full feature walkthrough for admins & developers
- [`AI_MODEL_TRAINING_GUIDE.md`](AI_MODEL_TRAINING_GUIDE.md) — In-depth AI/ML training pipeline documentation
- [`STAFF_ROLE_MANAGEMENT.md`](STAFF_ROLE_MANAGEMENT.md) — Staff promotion & jurisdiction setup guide
- [`scripts/ml/README.md`](scripts/ml/README.md) — Local Python training instructions

## 📜 License

This project is open source under the [MIT License](LICENSE).

---

Built with ❤️ for Digital India
