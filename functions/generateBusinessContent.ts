import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import OpenAI from 'npm:openai@4.52.7';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { business_id, content_type, topic, platform } = body;

    if (!business_id) {
      return Response.json({ error: 'business_id is required' }, { status: 400 });
    }

    const openai = new OpenAI({
      apiKey: Deno.env.get('NVIDIA_NIM_API_KEY'),
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });

    const businesses = await base44.entities.Business.list();
    const business = businesses.find((b: any) => b.id === business_id);

    if (!business) {
      return Response.json({ error: 'Business not found' }, { status: 404 });
    }

    const typeMap: Record<string, string> = {
      'Blog Post': `Write a comprehensive, SEO-optimized blog post (800-1200 words) with headers, bullet points, and a strong CTA.`,
      'Social Media Post': `Write 5 variations of engaging social media posts with hashtags. Keep each under 280 characters for Twitter, longer for LinkedIn.`,
      'Email': `Write a professional email campaign with subject line, preview text, and body. Include personalization tokens like {first_name}.`,
      'Ad Copy': `Write 3 ad variations: short (25 chars headline + 90 chars desc), medium, and long form. Focus on benefits and urgency.`,
      'Landing Page': `Write complete landing page copy: hero headline, subheadline, 3 benefit sections, social proof section, FAQ, and CTA.`,
      'Newsletter': `Write a weekly newsletter with intro, 3 value sections, industry insight, and a clear CTA.`,
    };

    const instructions = typeMap[content_type || 'Blog Post'] || typeMap['Blog Post'];

    const response = await openai.chat.completions.create({
      model: 'meta/llama-3.3-70b-instruct',
      messages: [
        {
          role: 'system',
          content: `You are a world-class copywriter and content strategist for ${business.name}.
Business: ${business.name} - "${business.tagline}"
Value Proposition: ${business.value_proposition}
Target Audience: ${business.target_audience}
Business Model: ${business.business_model}
Write content that converts. Be specific, compelling, and actionable.`
        },
        {
          role: 'user',
          content: `${instructions}

Topic/Focus: ${topic || 'General brand awareness and lead generation'}
Platform: ${platform || 'All'}

Make it genuinely useful and on-brand for ${business.name}.`
        }
      ]
    });

    const generatedContent = response.choices[0].message.content || '';

    // Save to database
    const piece = await base44.entities.ContentPiece.create({
      business_id,
      type: content_type || 'Blog Post',
      title: topic || `${content_type} for ${business.name}`,
      body: generatedContent,
      platform: platform || 'All',
      status: 'Review',
      ai_generated: true,
      keywords: topic || ''
    });

    return Response.json({
      success: true,
      content_id: piece.id,
      content: generatedContent,
      word_count: generatedContent.split(' ').length,
      message: `✅ ${content_type || 'Content'} generated successfully`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
