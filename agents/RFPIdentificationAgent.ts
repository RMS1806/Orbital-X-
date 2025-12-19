import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Initialize the Google GenAI Client
// We use import.meta.env to access Vite environment variables
const apiKey = import.meta.env.VITE_GOOGLE_GENAI_API_KEY;

if (!apiKey) {
  console.error("❌ API Key missing! Make sure VITE_GOOGLE_GENAI_API_KEY is in your .env.local file.");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Use 'gemini-1.5-flash' for speed/cost or 'gemini-1.5-pro' for complex reasoning
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface RFPEvaluation {
  isRelevant: boolean;
  score: number; // 0 to 100
  reasoning: string;
}

export const analyzeRFP = async (rfpText: string): Promise<RFPEvaluation> => {
  try {
    const prompt = `
      You are an expert RFP (Request for Proposal) analyst. 
      Analyze the following RFP content and determine if it is relevant for a software development agency specializing in AI and Web Dev.
      
      RFP Content:
      "${rfpText.slice(0, 5000)}" 
      
      Respond STRICTLY in this JSON format:
      {
        "isRelevant": boolean,
        "score": number,
        "reasoning": "short explanation"
      }
    `;

    // 2. Generate Content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 3. Clean and Parse JSON (Gemini sometimes adds markdown backticks)
    const cleanedText = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanedText);

    return data;

  } catch (error) {
    console.error("Error analyzing RFP with Gemini:", error);
    return {
      isRelevant: false,
      score: 0,
      reasoning: "Error analyzing document."
    };
  }
};
