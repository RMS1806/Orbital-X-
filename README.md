ORBITAL-X: Autonomous Agentic AI for B2B RFP Automation 🚀

Team VelvetLeaf Cruise | Round 2 Submission

📋 Executive Summary

ORBITAL-X is an intelligent multi-agent system designed to revolutionize the B2B Sales cycle for FMCG enterprises (specifically Asian Paints). By leveraging a swarm of 4 specialized AI agents, the system automates the end-to-end lifecycle of a Request for Proposal (RFP)—from identifying opportunities to generating technically accurate, commercially viable proposals in minutes.

🏗️ System Architecture

The solution utilizes a Client-Side Agentic Architecture powered by Google Gemini 1.5 Pro.

🕵️ Sales Agent: Scans inputs (URLs/Text), identifies client entities, and strictly filters RFPs based on a 3-month deadline horizon.

🧠 Technical Agent: Uses In-Context Semantic Search to map vague requirements (e.g., "weather-proof paint") to specific internal SKUs, providing a "Top 3 Comparison" for decision support.

💰 Pricing Agent: A context-aware commercial engine that applies volume discounts and automatically detects/charges for implied services (Lab Tests, Logistics).

🛡️ Integrity Guardrail: A unique Supervisor Layer that calculates a Trust Score before generating the email. If the score is <85%, the system forces a human review.

🌟 Key Features

1. The "Top 3" Comparison Engine

Unlike standard RAG that returns one answer, ORBITAL-X ranks the Winner vs. Alternatives, visualizing the "Spec Match %" via progress bars.

2. Context-Aware Pricing

The system doesn't just look up prices. It reasons:

Detected "Exterior Paint"? -> Auto-adds "UV Resistance Lab Test" ($150).

Detected "Staggered Batches"? -> Auto-adds "Logistics Fee" ($2,500).

3. The Integrity Index (Anti-Hallucination)

We implemented a mathematical guardrail to ensure reliability:

$$Integrity = 0.4(SpecMatch) + 0.3(PricingAccuracy) + 0.3(AIConfidence)$$

Green (>85): Safe to Auto-Draft.

Red (<85): Flags vague inputs for Human Review.

🛠️ Tech Stack

Frontend: React.js (Vite) + TypeScript

Styling: Tailwind CSS (Dark Mode Enterprise UI)

AI Model: Google Gemini 1.5 Pro (via Google Generative AI SDK)

State Management: React Hooks & Context API

Icons: Lucide React

🚀 Installation & Setup

Clone the Repository

git clone [https://github.com/kshgrshrn/ORBITAL-X.git](https://github.com/kshgrshrn/ORBITAL-X.git)
cd orbital-x


Install Dependencies

npm install


Configure Environment
Create a .env file in the root directory:

VITE_GEMINI_API_KEY=your_google_gemini_key_here


Run the Application

npm run dev


👥 Team

Rajit Mohan Shrivastava - Project Lead & Integration

Kushagra Sharan - AI/ML Architect

Mahek Gupta - Strategy & Frontend

Kshitiz Goyal - Backend & Data

Anshul Das - Data Scientist
