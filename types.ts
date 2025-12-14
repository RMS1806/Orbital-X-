export interface Product {
  id: string;
  name: string;
  category: string;
  unit_price: number;
  specs: string[];
}

export interface RFPAnalysis {
  client_name: string;
  submission_deadline: string;
  contact_email: string;
  product_requirements: string[];
  priority_score: number;
}

export interface Recommendation {
  rank: number;
  product_id: string;
  product_name: string;
  confidence: number;
  spec_match_score: number; // New: 0-100 based on feature overlap
  reasoning: string;
}

export interface MatchedItem {
  requirement: string;
  
  // Top-level fields derived from Rank 1 (for Pricing Agent compatibility)
  product_id?: string;
  product_name?: string;
  confidence?: number;
  spec_match_score?: number; // New: Top level score
  reasoning?: string;
  
  estimated_quantity: number;
  
  // New: Top 3 Recommendations
  recommendations: Recommendation[];
}

export interface PricingLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  note?: string;
}

export interface PricingResult {
  line_items: PricingLineItem[];
  total_cost: number;
}

export interface LogEntry {
  timestamp: string;
  agent: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}