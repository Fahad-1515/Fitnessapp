import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MINUTES = 60; // 1 hour window
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per hour

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization token to identify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for rate limiting checks
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit
    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);

    const { data: rateLimitData, error: rateLimitError } = await supabase
      .from('ai_coach_rate_limits')
      .select('*')
      .eq('user_id', user.id)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .single();

    if (rateLimitError && rateLimitError.code !== 'PGRST116') {
      console.error('Rate limit check error:', rateLimitError);
    }

    let requestCount = 0;
    let rateLimitId = null;

    if (rateLimitData) {
      requestCount = rateLimitData.request_count;
      rateLimitId = rateLimitData.id;

      if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
        const resetTime = new Date(new Date(rateLimitData.window_start).getTime() + RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
        return new Response(
          JSON.stringify({ 
            error: `Rate limit exceeded. Maximum ${MAX_REQUESTS_PER_WINDOW} requests per hour. Try again after ${resetTime.toISOString()}`,
            retryAfter: resetTime.toISOString()
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              "Content-Type": "application/json",
              "Retry-After": Math.ceil((resetTime.getTime() - now.getTime()) / 1000).toString()
            } 
          }
        );
      }
    }

    // Update or create rate limit record
    if (rateLimitId) {
      await supabase
        .from('ai_coach_rate_limits')
        .update({ 
          request_count: requestCount + 1,
          updated_at: now.toISOString()
        })
        .eq('id', rateLimitId);
    } else {
      await supabase
        .from('ai_coach_rate_limits')
        .insert({
          user_id: user.id,
          request_count: 1,
          window_start: now.toISOString()
        });
    }

    // Clean up old rate limit records periodically (1% chance)
    if (Math.random() < 0.01) {
      await supabase.rpc('cleanup_old_rate_limits');
    }

    const { messages } = await req.json();

    // Validate messages input
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid messages format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate each message
    for (const msg of messages) {
      if (!msg.content || typeof msg.content !== "string") {
        return new Response(
          JSON.stringify({ error: "Invalid message content" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Validate message length (max 5000 characters)
      if (msg.content.length > 5000) {
        return new Response(
          JSON.stringify({ error: "Message too long. Maximum 5000 characters allowed." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an Advanced AI Fitness Coach and Health Tracking Expert. You provide personalized fitness advice, workout plans, nutrition guidance, and motivational support.

Your role is to:
- Analyze workout patterns and provide insights
- Suggest exercise modifications for safety and effectiveness
- Give nutrition advice based on goals
- Track progress and celebrate achievements
- Warn about overtraining and suggest rest when needed
- Provide motivation and encouragement
- Answer fitness and health-related questions

Guidelines:
- Be positive and encouraging
- Give clear, actionable advice
- Consider safety first
- Avoid medical claims or diagnoses
- Keep responses concise but helpful
- Ask clarifying questions when needed`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in ai-coach function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
