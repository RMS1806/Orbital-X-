import { BaseAgent } from './BaseAgent';
import { RFPAnalysis, PricingResult, LogEntry } from '../types';
import { GoogleGenAI } from "@google/genai";

export class ResponseGeneratorAgent extends BaseAgent {
  private ai: GoogleGenAI;

  constructor(onLog: (entry: LogEntry) => void) {
    super('WRITER-AGENT', onLog);
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateProposal(analysis: RFPAnalysis, pricing: PricingResult): Promise<string> {
    this.log('Drafting final proposal email...', 'info');

    try {
      const prompt = `
      Write a professional business response email (Plain Text, No HTML).
      
      Client: ${analysis.client_name}
      Deadline: ${analysis.submission_deadline}
      Contact: ${analysis.contact_email}
      
      Quote Details:
      Total Cost: $${pricing.total_cost}
      Items: ${JSON.stringify(pricing.line_items.map(i => i.description))}

      Tone: Professional, Concise, Action-oriented.
      Include the subject line at the top.
      `;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      
      const text = response.text;
      if (!text) throw new Error("No text generated");

      this.log('Draft generated successfully.', 'success');
      return text;

    } catch (error: any) {
      this.log(`Drafting failed: ${error.message}`, 'error');
      throw error;
    }
  }
}