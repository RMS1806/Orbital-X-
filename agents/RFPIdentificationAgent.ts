import { BaseAgent } from './BaseAgent';
import { RFPAnalysis, LogEntry } from '../types';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export class RFPIdentificationAgent extends BaseAgent {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(onLog: (entry: LogEntry) => void) {
    super('RFP-ID-AGENT', onLog);
    
    // 1. FIX: Use Vite's environment variable (Critical for Browser/React)
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      this.log('CRITICAL: VITE_GEMINI_API_KEY is missing.', 'error');
      throw new Error("API Key missing");
    }

    this.genAI = new GoogleGenerativeAI(apiKey);

    // 2. UPDATE: Using the model you see in Studio (gemini-2.5-flash)
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash", 
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            client_name: { type: SchemaType.STRING },
            submission_deadline: { type: SchemaType.STRING },
            contact_email: { type: SchemaType.STRING },
            product_requirements: { 
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            priority_score: { type: SchemaType.INTEGER }
          },
          required: ["client_name", "submission_deadline", "contact_email", "product_requirements", "priority_score"]
        }
      }
    });
  }

  async analyze(rfpText: string): Promise<RFPAnalysis> {
    this.log('Initializing analysis sequence...', 'info');
    
    try {
      this.log('Sending payload to Gemini 2.5 Flash...', 'info');
      
      const result = await this.model.generateContent(`
        Analyze the following RFP text and extract key details. 
        If the contact email is missing, STRICTLY return 'procurement@client.com'.
        
        RFP Text:
        ${rfpText}
      `);

      const text = result.response.text();
      if (!text) throw new Error("Empty response from AI");

      const data = JSON.parse(text) as RFPAnalysis;

      if (!data.contact_email) data.contact_email = 'procurement@client.com';

      this.log(`Identified Client: ${data.client_name}`, 'success');
      return data;

    } catch (error: any) {
      this.log(`Analysis failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // ... (Keep your scanUrl function exactly as it was) ...
  async scanUrl(url: string): Promise<RFPAnalysis> {
     // ... existing mock logic ...
     return {
        client_name: 'Nexus Health Systems',
        submission_deadline: new Date(Date.now() + 12096e5).toDateString(),
        contact_email: 'procurement@nexushealth.com',
        product_requirements: ["5000 Liters of Anti-Bacterial Interior Paint"],
        priority_score: 92
    };
  }
}
