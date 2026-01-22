// Offer Engine Edge Function
// Calculates offers based on pricing rules

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OfferRequest {
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  village_id?: number;
  village_name?: string;
}

interface OfferResult {
  amount: number;
  currency: string;
  condition: string;
  village_name?: string;
  rule_applied?: string;
  valid_until: string;
}

/**
 * Calculate offer based on pricing rules
 */
async function calculateOffer(
  supabase: any,
  request: OfferRequest
): Promise<OfferResult> {
  const { condition, village_id } = request;

  // Get applicable pricing rules
  let query = supabase
    .from('pricing_rules')
    .select('*')
    .eq('condition_type', condition)
    .eq('active', true)
    .order('priority', { ascending: false })
    .order('village_id', { ascending: false, nullsFirst: false });

  const { data: rules, error } = await query;

  if (error) {
    console.error('Error fetching pricing rules:', error);
    // Fallback to default pricing
    return getDefaultOffer(condition);
  }

  if (!rules || rules.length === 0) {
    return getDefaultOffer(condition);
  }

  // Find the most specific rule (village-specific first, then general)
  let applicableRule = rules.find((r: any) => r.village_id === village_id);
  if (!applicableRule) {
    // Use general rule (village_id is null)
    applicableRule = rules.find((r: any) => r.village_id === null);
  }

  if (!applicableRule) {
    // Fallback to first rule
    applicableRule = rules[0];
  }

  // Calculate offer
  let amount = Number(applicableRule.base_price) * Number(applicableRule.multiplier);

  // Apply min/max constraints
  if (applicableRule.min_price && amount < Number(applicableRule.min_price)) {
    amount = Number(applicableRule.min_price);
  }
  if (applicableRule.max_price && amount > Number(applicableRule.max_price)) {
    amount = Number(applicableRule.max_price);
  }

  // Round to nearest 10
  amount = Math.round(amount / 10) * 10;

  return {
    amount,
    currency: 'ZAR',
    condition,
    village_name: request.village_name,
    rule_applied: applicableRule.rule_name,
    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
  };
}

/**
 * Default offer calculation (fallback)
 */
function getDefaultOffer(condition: string): OfferResult {
  const basePrices: Record<string, number> = {
    'excellent': 800,
    'good': 600,
    'fair': 400,
    'poor': 250
  };

  const multipliers: Record<string, number> = {
    'excellent': 1.5,
    'good': 1.2,
    'fair': 0.8,
    'poor': 0.5
  };

  const basePrice = basePrices[condition] || 400;
  const multiplier = multipliers[condition] || 1.0;
  const amount = Math.round(basePrice * multiplier / 10) * 10;

  return {
    amount,
    currency: 'ZAR',
    condition,
    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === 'POST') {
      const body: OfferRequest = await req.json();

      // Validate request
      if (!body.condition || !['excellent', 'good', 'fair', 'poor'].includes(body.condition)) {
        return new Response(JSON.stringify({ error: 'Invalid condition. Must be: excellent, good, fair, or poor' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Calculate offer
      const offer = await calculateOffer(supabase, body);

      return new Response(JSON.stringify(offer), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response('Method Not Allowed', { status: 405 });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
