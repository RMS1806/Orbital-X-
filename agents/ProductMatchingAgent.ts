import { BaseAgent } from './BaseAgent';
import { Product, MatchedItem, LogEntry } from '../types';
import { products } from '../data/product_database';
import { GoogleGenAI, Type } from "@google/genai";

export class ProductMatchingAgent extends BaseAgent {
  private ai: GoogleGenAI;

  constructor(onLog: (entry: LogEntry) => void) {
    super('MATCH-AGENT', onLog);
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async match(requirements: string[]): Promise<MatchedItem[]> {
    this.log('Initiating Semantic Product Matching with Vague Input Guardrails...', 'info');

    try {
      // 1. Prepare the Catalog Context
      const productContext = JSON.stringify(products.map(p => ({ 
          id: p.id, name: p.name, category: p.category, specs: p.specs 
      })));

      // 2. Standard Prompt (AI does the heavy lifting, Code does the policing)
      const prompt = `
      Act as a Technical Agent. Map requirements to products.
      
      CATALOG: 
      ${productContext}

      INPUT REQUIREMENTS: 
      ${JSON.stringify(requirements)}

      INSTRUCTIONS: 
      1. For each requirement, provide 3 recommendations (Rank 1, 2, 3) from the catalog.
      2. If it is a Service/Constraint, return empty recommendations.
      3. Estimate quantity (default 100).
      
      OUTPUT JSON Format: 
      [{ "requirement": "...", "recommendations": [{ "rank": 1, "product_id": "...", "product_name": "...", "spec_match_score": 90, "reasoning": "..." }], "estimated_quantity": 100 }]
      `;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        requirement: { type: Type.STRING },
                        recommendations: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    rank: { type: Type.INTEGER },
                                    product_id: { type: Type.STRING },
                                    product_name: { type: Type.STRING },
                                    spec_match_score: { type: Type.INTEGER },
                                    reasoning: { type: Type.STRING }
                                },
                                required: ["rank", "product_id", "product_name", "spec_match_score", "reasoning"]
                            }
                        },
                        estimated_quantity: { type: Type.INTEGER }
                    },
                    required: ["requirement", "recommendations", "estimated_quantity"]
                }
            }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");

      let rawMatches = JSON.parse(text);

      // --- THE GUARDRAIL FIX (Hybrid Logic) ---
      // We post-process the AI results to enforce strict penalties.
      const matches: MatchedItem[] = rawMatches.map((res: any) => {
        const reqLower = res.requirement.toLowerCase();
        
        // List of "Lazy/Vague" keywords that MUST fail
        const vagueKeywords = ['stuff', 'cheap', 'shiny', 'liquid', 'finish', 'paint', 'some'];
        
        // It's vague if it contains a weak keyword AND lacks specific technical terms
        const isVague = vagueKeywords.some(kw => reqLower.includes(kw)) && 
                        !reqLower.includes('emulsion') && 
                        !reqLower.includes('primer') && 
                        !reqLower.includes('enamel') &&
                        !reqLower.includes('proof');
        
        // If the input is short (< 30 chars) OR generic, CAP the score.
        // But allow short inputs if they are very specific IDs (e.g. "AP-001") - though not handled here specifically, length check usually catches "Some paint".
        if ((reqLower.length < 30 || isVague) && res.recommendations.length > 0) {
            this.log(`⚠️ Guardrail Triggered: Input "${res.requirement}" is too vague. Capping score.`, 'warning');
            
            // Overwrite the AI's optimistic score
            res.recommendations = res.recommendations.map((rec: any) => ({
                ...rec,
                spec_match_score: Math.min(rec.spec_match_score, 55), // CAP AT 55% (FAILING)
                confidence: 0.55, // Sync confidence
                reasoning: `🧠 ⚠️ FLAGGED: Input "${res.requirement}" is too vague. Lacks technical specifications (Emulsion/Enamel/Grade/Usage).`
            }));
        }

        // Standard Mapping
        const sortedRecs = res.recommendations.sort((a: any, b: any) => a.rank - b.rank);
        const rank1 = sortedRecs.length > 0 ? sortedRecs[0] : null;

        return {
          requirement: res.requirement,
          estimated_quantity: res.estimated_quantity,
          recommendations: sortedRecs.map((r: any) => ({
             ...r,
             confidence: r.spec_match_score / 100 // Ensure confidence matches score
          })),
          product_id: rank1?.product_id,
          product_name: rank1?.product_name,
          confidence: rank1 ? rank1.spec_match_score / 100 : 0,
          spec_match_score: rank1?.spec_match_score,
          reasoning: rank1?.reasoning
        };
      });

      // Logging for UI
      matches.forEach(m => {
        if (m.recommendations.length > 0) {
           const score = m.spec_match_score || 0;
           if (score < 60) {
             this.log(`Matched (Low Confidence): ${m.requirement.substring(0, 15)}... -> ${m.product_name} (${score}%)`, 'warning');
           } else {
             this.log(`Matched: ${m.requirement.substring(0, 15)}... -> ${m.product_name} (${score}%)`, 'success');
           }
        } else {
           this.log(`Identified Service/Constraint: ${m.requirement.substring(0, 20)}...`, 'info');
        }
      });

      return matches;

    } catch (error: any) {
      this.log(`Matching failed: ${error.message}`, 'error');
      throw error;
    }
  }
}