import { BaseAgent } from './BaseAgent';
import { RFPAnalysis, LogEntry } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

export class RFPIdentificationAgent extends BaseAgent {
  private ai: GoogleGenAI;

  constructor(onLog: (entry: LogEntry) => void) {
    super('RFP-ID-AGENT', onLog);
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async analyze(rfpText: string): Promise<RFPAnalysis> {
    this.log('Initializing analysis sequence...', 'info');
    
    try {
      this.log('Sending payload to Gemini model...', 'info');
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following RFP text and extract key details. 
        If the contact email is missing, STRICTLY return 'procurement@client.com'.
        
        RFP Text:
        ${rfpText}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    client_name: { type: Type.STRING },
                    submission_deadline: { type: Type.STRING },
                    contact_email: { type: Type.STRING },
                    product_requirements: { 
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    priority_score: { type: Type.INTEGER, description: "A score from 1-100 based on urgency and value" }
                },
                required: ["client_name", "submission_deadline", "contact_email", "product_requirements", "priority_score"]
            }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");

      const data = JSON.parse(text) as RFPAnalysis;

      // Double check fallback (though AI schema should handle it, code fallback is safer)
      if (!data.contact_email || data.contact_email === '') {
        data.contact_email = 'procurement@client.com';
      }

      this.log(`Identified Client: ${data.client_name}`, 'success');
      this.log(`Extracted ${data.product_requirements.length} requirements.`, 'info');
      
      return data;
    } catch (error: any) {
      this.log(`Analysis failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async scanUrl(url: string): Promise<RFPAnalysis> {
    this.log(`Connecting to procurement portal: ${url}...`, 'info');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    this.log('Scraping active tenders...', 'info');
    const today = new Date();
    const dayMs = 1000 * 60 * 60 * 24;

    // Mock RFPs for simulation
    const mockRfps = [
        {
            id: 'RFP-WEB-101',
            client: 'Nexus Health Systems',
            deadline: new Date(today.getTime() + 14 * dayMs), // 14 days from now (Valid)
            requirements: [
                "5000 Liters of Anti-Bacterial Interior Paint",
                "200 Liters of Primer (White)",
                "Service: On-site application support"
            ],
            score: 92
        },
        {
            id: 'RFP-WEB-102',
            client: 'Global Logistics Hub',
            deadline: new Date(today.getTime() + 150 * dayMs), // 150 days from now (Invalid > 90 days)
            requirements: ["Industrial Floor Coating"],
            score: 45
        },
        {
            id: 'RFP-WEB-103',
            client: 'Metro City Station',
            deadline: new Date(today.getTime() + 30 * dayMs), // 30 days from now (Valid)
            requirements: ["Exterior Weather-Proof Emulsion"],
            score: 78
        }
    ];

    this.log(`Found ${mockRfps.length} active RFPs. Filtering by 3-Month (90 Days) Deadline Rule...`, 'info');

    let selectedRFP = null;

    for (const rfp of mockRfps) {
        const diffTime = Math.abs(rfp.deadline.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / dayMs);

        if (diffDays > 90) {
            this.log(`[REJECTED] ${rfp.id} (${rfp.client}): Due in ${diffDays} days (> 3 months).`, 'warning');
        } else {
            this.log(`[VALID] ${rfp.id} (${rfp.client}): Due in ${diffDays} days.`, 'success');
            // Select the first valid one (RFP #1) as per instructions or logic
            if (!selectedRFP && rfp.id === 'RFP-WEB-101') selectedRFP = rfp;
        }
    }

    if (!selectedRFP) {
        // Fallback if logic misses
        selectedRFP = mockRfps[0];
    }

    this.log(`Selected ${selectedRFP.id} for processing.`, 'success');

    // Construct the Analysis object
    return {
        client_name: selectedRFP.client,
        submission_deadline: selectedRFP.deadline.toDateString(),
        contact_email: 'procurement@nexushealth.com',
        product_requirements: selectedRFP.requirements,
        priority_score: selectedRFP.score
    };
  }
}
