import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Function invoked with request');
    const { tweets } = await req.json();
    console.log('Parsed tweets:', tweets);

    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment');
      throw new Error('OpenAI API key not configured. Please check your secrets.');
    }

    console.log('OpenAI API key found, length:', openAIApiKey.length);

    if (!tweets || !Array.isArray(tweets) || tweets.length === 0) {
      throw new Error('No tweets provided');
    }

    // Filter out empty tweets and join them
    const tweetContent = tweets
      .filter(tweet => tweet && tweet.trim())
      .map((tweet, index) => `Tweet ${index + 1}: ${tweet.trim()}`)
      .join('\n\n');

    if (!tweetContent) {
      throw new Error('No valid tweet content provided');
    }

    const prompt = `You are Clive the Cat, the marketing mascot of Abstract Chain. Write a single blog-style update using the tweet content provided below. Your tone is curious, insightful, and fast-paced like a crypto newsletter. The update should summarize key insights, events, or announcements found in the tweets. Keep it concise, clear, and formatted in short paragraphs with a catchy headline. Assume your audience is familiar with crypto but not necessarily with the context of every tweet.

Tweet content:
${tweetContent}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const generatedBlog = data.choices[0].message.content;

    return new Response(JSON.stringify({ generatedBlog }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-blog-ai function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});