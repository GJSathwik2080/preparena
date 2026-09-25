# ⚔️ PREPARENA | Elite Serverless OA Simulator

AccenPrep is a high-performance, serverless Online Assessment (OA) platform designed to simulate enterprise-grade placement exams (like Aon/HirePro used by Accenture). Built for final-year Computer Science students, it features a premium SaaS-tier UI, strictly syllabus-aligned mock tests, competitive multiplayer arenas, and deep AI-powered analytics.

## 🏗️ Architecture & Tech Stack
- **Frontend (The Arena):** React, Vite, Tailwind CSS v4, Framer Motion, Recharts, Monaco Editor.
- **Backend (Serverless):** AWS SAM, API Gateway (HTTP & WebSockets), AWS Lambda (Node.js & Python), Amazon DynamoDB, Amazon Cognito.
- **AI Integration:** Google GenAI SDK (Gemini 3.5 Flash) for high-fidelity database seeding, real-time speech evaluation, and dynamic explanations.

## 🚀 Key Features
- **Premium Vercel-Style UI:** A highly interactive, distraction-free testing environment with fluid staggered animations, a bento-grid dashboard, and a persistent Light/Dark mode theming engine.
- **High-Fidelity Mock Tests:** AI-generated question banks strictly mapped to Accenture's Cognitive, Technical, and Coding syllabus. Questions are fetched intelligently from DynamoDB without over-fetching.
- **Battle Arena (PvP):** A real-time 1v1 multiplayer coding arena powered by AWS API Gateway WebSockets, featuring strict test-case verification and live progress tracking.
- **Coding Sandbox:** A dedicated coding environment utilizing the Monaco Editor (synchronized with the global theme), supporting JavaScript, Python, and Java execution with zero solution leaks.
- **Communication Arena:** An AI-driven speech evaluation module that records user audio, transcribes it, and grades Pronunciation, Fluency, and Vocabulary using the Gemini API, complete with playback and actionable feedback.
- **Deep Analytics:** Post-test dashboard featuring Donut and Bar charts to visualize accuracy across specific sub-topics, alongside detailed logical explanations for every mistake.

## 🛠️ Local Development Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/GJSathwik2080/preparena.git
   ```
2. Install Python dependencies and seed the AWS DynamoDB database:
   ```bash
   pip install -r scripts/requirements.txt
   python scripts/seed_db.py
   ```
3. Run the Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
