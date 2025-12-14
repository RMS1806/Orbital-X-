import { BaseAgent } from './BaseAgent';
import { MatchedItem, PricingResult, PricingLineItem, LogEntry } from '../types';
import { products } from '../data/product_database';
import { GoogleGenAI, Type } from "@google/genai";

export class PricingAgent extends BaseAgent {
  private ai: GoogleGenAI;

  constructor(onLog: (entry: LogEntry) => void) {
    super('PRICING-AGENT', onLog);
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async calculate(matches: MatchedItem[]): Promise<PricingResult> {
    this.log('Initiating AI-driven cost analysis & market estimation...', 'info');

    try {
      const prompt = `
      Act as a Senior Pricing Analyst. Review the provided matched requirements against the Product Catalog.

      REFERENCE DATA (Product Catalog):
      ${JSON.stringify(products.map(p => ({ id: p.id, name: p.name, category: p.category, unit_price: p.unit_price })))}

      MATCHED REQUIREMENTS TO PRICE:
      ${JSON.stringify(matches)}

      PRICING RULES:
      1. **Physical Products**: 
         - Find the 'product_id' in the Reference Data.
         - Calculation: Unit Price * Quantity.
         - Discount: If Quantity > 1000, apply a 15% discount. Note this in 'discount_applied'.
         
      2. **Services & Constraints** (Items with no product_id):
         - You MUST generate a billable line item for every service constraint.
         - Estimate a realistic market price.
         - Examples: 
           - Delivery/Logistics: ~$2,500
           - Compliance/Certification: ~$750
           - Technical Support: ~$1,500
           - Extended Warranty: ~$1,000
           - Admin/Processing: ~$500
         - Reasoning: Briefly explain the cost in 'pricing_logic'.

      OUTPUT FORMAT:
      Return a JSON object containing a 'line_items' array and a 'total_cost' number.
      `;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              line_items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    quantity: { type: Type.INTEGER },
                    unit_price: { type: Type.NUMBER },
                    total_price: { type: Type.NUMBER },
                    discount_applied: { type: Type.STRING, nullable: true },
                    pricing_logic: { type: Type.STRING }
                  },
                  required: ["description", "quantity", "unit_price", "total_price", "pricing_logic"]
                }
              },
              total_cost: { type: Type.NUMBER }
            },
            required: ["line_items", "total_cost"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from Pricing AI");

      const data = JSON.parse(text);

      // Map AI response to application strict types
      const mappedItems: PricingLineItem[] = data.line_items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total_price, // Mapping total_price -> total
        note: item.discount_applied || item.pricing_logic // Show discount or logic as the note
      }));

      // --- LAB TESTING FEE LOGIC (Hackathon Requirement) ---
      const labFees: PricingLineItem[] = [];
      
      matches.forEach(match => {
        if (match.product_id) {
          const product = products.find(p => p.id === match.product_id);
          if (product) {
            // Rule: Exterior Products
            if (product.category === 'Exterior') {
               labFees.push({
                 description: `QA Lab: UV Resistance Test (${product.name})`,
                 quantity: 1,
                 unit_price: 150,
                 total: 150,
                 note: 'Mandatory for Exterior'
               });
               labFees.push({
                 description: `QA Lab: Algal Resistance Test (${product.name})`,
                 quantity: 1,
                 unit_price: 200,
                 total: 200,
                 note: 'Mandatory for Exterior'
               });
            }
            // Rule: Interior Products
            if (product.category === 'Interior') {
               labFees.push({
                 description: `QA Lab: Washability Test (${product.name})`,
                 quantity: 1,
                 unit_price: 100,
                 total: 100,
                 note: 'Mandatory for Interior'
               });
               labFees.push({
                 description: `QA Lab: VOC Compliance Check (${product.name})`,
                 quantity: 1,
                 unit_price: 300,
                 total: 300,
                 note: 'Safety Standard'
               });
            }
            // Rule: Floor / Industrial Products
            if (product.category === 'Industrial' || product.name.toLowerCase().includes('floor')) {
               labFees.push({
                 description: `QA Lab: Abrasion Resistance Test (${product.name})`,
                 quantity: 1,
                 unit_price: 250,
                 total: 250,
                 note: 'Durability Standard'
               });
            }
          }
        }
      });

      if (labFees.length > 0) {
        this.log(`Applying ${labFees.length} mandatory Lab Testing Fees...`, 'info');
      }

      const finalItems = [...mappedItems, ...labFees];
      const labTotal = labFees.reduce((sum, item) => sum + item.total, 0);
      const finalTotal = data.total_cost + labTotal;

      this.log(`Calculation Complete. Total Value: $${finalTotal.toLocaleString()}`, 'success');

      return {
        line_items: finalItems,
        total_cost: finalTotal
      };

    } catch (error: any) {
      this.log(`Pricing calculation failed: ${error.message}`, 'error');
      // Fallback to basic calculation if AI fails
      return { line_items: [], total_cost: 0 };
    }
  }
}