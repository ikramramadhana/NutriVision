# NutriVision 

**AI-powered Food Nutrition Analyzer** — Snap a photo of your meal and instantly get calorie counts, macronutrient breakdown, health score, and diet compatibility.

> Built by [@ikramramadhana](https://github.com/ikramramadhana)

---

## What is NutriVision?

NutriVision is a web app that uses **Gemini Vision AI** to analyze food photos. Take a picture of any meal — from your phone camera or upload an existing photo — and the AI identifies the food, estimates portion sizes, and calculates a full nutritional breakdown in seconds.

Perfect for:
- Anyone tracking calories or macros
- People following specific diets (keto, vegan, low-carb, etc.) who want quick compatibility checks
- Curious eaters who just want to know what's in their food
- Health-conscious students and professionals

---

## Features

- 📸 **Dual input** — upload from gallery or capture directly from camera (with live viewfinder)
- 🔢 **Calorie estimation** — total calories for the entire meal, prominently displayed
- 📊 **Macronutrient breakdown** — protein, carbs, fat, fiber, sugar, and sodium
- 🍱 **Multi-food detection** — identifies multiple food items in one photo with per-item nutrition
- ❤️ **Health Score (1–10)** — overall healthiness rating with a one-line explanation
- 🥑 **Diet compatibility** — checks against keto, vegan, vegetarian, low-carb, high-protein, and Mediterranean diets
- 💡 **Benefits, warnings & suggestions** — practical, actionable nutrition tips
- 🍽️ **Meal & cuisine detection** — automatically tags meal type (breakfast/lunch/dinner/snack) and cuisine style

---

## How It Works

### Analysis Flow

```
User takes/uploads a food photo
        ↓
Image converted to base64
        ↓
Sent to Gemini 2.5 Flash (Vision) with a structured prompt
        ↓
Gemini identifies food items, estimates portions,
calculates nutrition, scores healthiness,
checks diet compatibility
        ↓
Response parsed as structured JSON
        ↓
Results rendered: calories, macros, health score, diet tags, tips
```

### Why Gemini Vision?

Unlike traditional nutrition apps that rely on manual food database lookups or barcode scanning, NutriVision uses a **multimodal LLM** that:

- Recognizes thousands of food types, including mixed dishes and regional cuisines
- Estimates portion sizes visually (no need to weigh food)
- Reasons about nutrition holistically — not just keyword matching against a database
- Returns structured, consistent JSON output ready for the UI
- Is **free** to use via Google AI Studio's free tier

No custom computer vision model training is required — Gemini's vision capabilities are used directly through its API.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) | React framework, file-based routing |
| **Styling** | Tailwind CSS | Utility-first CSS, mobile-first layout |
| **Backend** | Next.js API Routes | Serverless function for image analysis |
| **AI Model** | Gemini 2.5 Flash (Vision) | Multimodal food recognition + nutrition analysis |
| **Camera Access** | Browser MediaDevices API | Live camera capture in-browser |
| **Deployment** | Vercel | Serverless hosting, auto-deploy from GitHub |

---

## Project Structure

```
nutrivision/
├── app/
│   ├── page.tsx                  # Main UI — upload, camera, results
│   ├── layout.tsx                # Root layout + metadata
│   └── api/
│       └── analyze/route.ts      # POST — sends image to Gemini, returns analysis
├── public/
│   ├── favicon.ico                # NutriVision favicon
│   └── favicon.svg                # Scalable favicon
├── .env.local                    # Environment variables (not committed)
├── vercel.json                   # Vercel config (maxDuration 30s)
└── README.md
```

---

## Local Setup

### 1. Clone & Install

```bash
git clone https://github.com/ikramramadhana/NutriScan.git
cd NutriScan
npm install
```

### 2. Get a Gemini API Key (free)

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with Google
3. Click **Create API Key**
4. Copy the generated key

### 3. Create `.env.local`

```env
GEMINI_API_KEY=your_key_here
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "init: NutriVision — AI Food Nutrition Analyzer"
git remote add origin https://github.com/ikramramadhana/NutriScan.git
git branch -M main
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import the `NutriScan` repo from GitHub
3. Framework preset: **Next.js** (auto-detected)
4. Add **Environment Variables**:

| Name | Value |
|---|---|
| `GEMINI_API_KEY` | your Gemini API key |

5. Click **Deploy** ✅

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `GEMINI_API_KEY` | API key from [Google AI Studio](https://aistudio.google.com/app/apikey) | ✅ Yes |

---

## How Data Is Handled

- Photos are **not stored** on any server or database
- Each image is sent once to the Gemini API for analysis, then discarded
- The preview image remains visible in your browser only until you start a new scan or refresh the page
- All analysis is **stateless** — no user accounts, no history saved

---

## Limitations

- Nutrition values are **AI estimates**, not lab-measured — use as a general guide, not medical advice
- Portion size estimation accuracy depends on photo angle, lighting, and reference objects in frame
- Mixed or layered dishes (e.g. casseroles) may be harder to break down into individual components
- Camera capture requires browser permission and HTTPS (works on Vercel by default)

---

## License

MIT License — free to use and modify.

---

Built with ♥ by [@ikramramadhana](https://github.com/ikramramadhana)