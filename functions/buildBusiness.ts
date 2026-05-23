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
    const { idea, niche, target_audience, revenue_goal } = body;

    if (!idea) {
      return Response.json({ error: 'Business idea is required' }, { status: 400 });
    }

    const openai = new OpenAI({
      apiKey: Deno.env.get('NVIDIA_NIM_API_KEY'),
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });

    // Generate full business blueprint
    const blueprintResponse = await openai.chat.completions.create({
      model: 'meta/llama-3.3-70b-instruct',
      messages: [
        {
          role: 'system',
          content: `You are an elite AI business strategist and founder. Given a business idea, you generate a comprehensive, actionable business blueprint. Be specific, tactical, and realistic. Return valid JSON only — no markdown, no code fences, just raw JSON.`
        },
        {
          role: 'user',
          content: `Create a complete business blueprint for this idea: "${idea}"
Niche: ${niche || 'auto-detect'}
Target audience: ${target_audience || 'auto-detect'}
Monthly revenue goal: $${revenue_goal || 10000}

Return a JSON object with these exact keys:
{
  "name": "Business name",
  "tagline": "One-line tagline",
  "niche": "specific niche",
  "target_audience": "detailed target customer",
  "value_proposition": "core value prop",
  "business_model": "how it makes money",
  "brand_colors": "#HEX1, #HEX2",
  "ai_strategy": "3-paragraph AI-driven growth strategy",
  "initial_tasks": [
    {"title": "task", "category": "Marketing", "priority": "High", "description": "what to do", "impact": "expected outcome"}
  ],
  "initial_content": [
    {"type": "Blog Post", "title": "title", "platform": "Website", "keywords": "keyword1, keyword2", "cta": "call to action"}
  ],
  "automation_rules": [
    {"name": "rule name", "trigger": "Daily Morning", "action": "what AI does", "description": "explanation"}
  ],
  "health_score": 75
}`
        }
      ],
    });

    let blueprint: any = {};
    try {
      const raw = blueprintResponse.choices[0].message.content || '{}';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      blueprint = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch (e) {
      blueprint = { name: 'My Business', tagline: 'Built by AI', niche: niche || 'General', health_score: 70 };
    }

    // Create the business record
    const business = await base44.entities.Business.create({
      name: blueprint.name || 'My Business',
      idea,
      niche: blueprint.niche || niche || 'General',
      target_audience: blueprint.target_audience || target_audience || '',
      value_proposition: blueprint.value_proposition || '',
      business_model: blueprint.business_model || '',
      status: 'Generating',
      stage: 'Building',
      revenue_goal_monthly: revenue_goal || 10000,
      revenue_actual_monthly: 0,
      brand_colors: blueprint.brand_colors || '#6366F1, #8B5CF6',
      tagline: blueprint.tagline || '',
      ai_strategy: blueprint.ai_strategy || '',
      ai_last_action: 'Initial business blueprint generated',
      ai_next_action: 'Setting up initial tasks and content pipeline',
      health_score: blueprint.health_score || 75,
      tasks_completed_today: 0,
      autonomous_mode: true
    });

    // Create initial AI tasks
    const taskPromises = (blueprint.initial_tasks || []).slice(0, 8).map((task: any) =>
      base44.entities.AITask.create({
        business_id: business.id,
        title: task.title,
        description: task.description,
        category: task.category || 'Operations',
        priority: task.priority || 'Medium',
        status: 'Queued',
        assigned_to: 'AI Agent',
        auto_generated: true,
        impact: task.impact
      })
    );

    // Create initial content pieces
    const contentPromises = (blueprint.initial_content || []).slice(0, 5).map((c: any) =>
      base44.entities.ContentPiece.create({
        business_id: business.id,
        type: c.type || 'Blog Post',
        title: c.title,
        platform: c.platform || 'Website',
        status: 'Draft',
        ai_generated: true,
        keywords: c.keywords,
        cta: c.cta
      })
    );

    // Create automation rules
    const rulePromises = (blueprint.automation_rules || []).slice(0, 5).map((r: any) =>
      base44.entities.AutomationRule.create({
        business_id: business.id,
        name: r.name,
        trigger: r.trigger || 'Daily Morning',
        action: r.action,
        is_active: true,
        times_fired: 0,
        description: r.description
      })
    );

    // Log this AI decision
    const decisionLog = base44.entities.AIDecisionLog.create({
      business_id: business.id,
      decision_type: 'Strategy',
      trigger: 'User submitted business idea',
      reasoning: `Analyzed idea "${idea}" and generated comprehensive business blueprint with ${blueprint.initial_tasks?.length || 0} tasks, ${blueprint.initial_content?.length || 0} content pieces, and ${blueprint.automation_rules?.length || 0} automation rules.`,
      action_taken: 'Generated full business blueprint and populated all operational systems',
      confidence_score: 92,
      approved_by_human: false
    });

    await Promise.all([...taskPromises, ...contentPromises, ...rulePromises, decisionLog]);

    // Update business status to Active
    await base44.entities.Business.update(business.id, {
      status: 'Active',
      stage: 'Launching',
      ai_next_action: 'Begin executing queued tasks and generating content'
    });

    return Response.json({
      success: true,
      business_id: business.id,
      business_name: blueprint.name,
      blueprint,
      message: `🚀 "${blueprint.name}" has been built and is ready to launch autonomously!`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
