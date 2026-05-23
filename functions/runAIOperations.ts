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
    const { business_id, operation } = body;

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

    const results: any = {};

    // OPERATION: Generate Content
    if (!operation || operation === 'generate_content') {
      const draftContent = await base44.entities.ContentPiece.filter({ business_id, status: 'Draft' });

      if (draftContent.length > 0) {
        const piece = draftContent[0];

        const contentResponse = await openai.chat.completions.create({
          model: 'meta/llama-3.3-70b-instruct',
          messages: [
            { role: 'system', content: `You are a world-class content creator for ${business.name}. Create compelling, conversion-focused content. Be specific and engaging.` },
            { role: 'user', content: `Write a complete ${piece.type} titled "${piece.title}" for ${business.name}.
Business: ${business.name} - ${business.tagline}
Value Prop: ${business.value_proposition}
Target Audience: ${business.target_audience}
Keywords: ${piece.keywords || ''}
CTA: ${piece.cta || ''}
Make it professional, engaging, and optimized for ${piece.platform}.` }
          ]
        });

        const content = contentResponse.choices[0].message.content || '';
        await base44.entities.ContentPiece.update(piece.id, {
          body: content,
          status: 'Scheduled',
          ai_generated: true
        });

        results.content_generated = { title: piece.title, type: piece.type, platform: piece.platform };
      }
    }

    // OPERATION: Work on Tasks
    if (!operation || operation === 'execute_tasks') {
      const queuedTasks = await base44.entities.AITask.filter({ business_id, status: 'Queued' });

      if (queuedTasks.length > 0) {
        const task = queuedTasks[0];
        await base44.entities.AITask.update(task.id, { status: 'In Progress' });

        const taskResponse = await openai.chat.completions.create({
          model: 'meta/llama-3.3-70b-instruct',
          messages: [
            { role: 'system', content: `You are the AI operations manager for ${business.name}. Execute tasks and provide concrete, actionable outputs.` },
            { role: 'user', content: `Execute this business task:
Task: ${task.title}
Description: ${task.description}
Category: ${task.category}
Business: ${business.name} - ${business.tagline}
Target Audience: ${business.target_audience}
Business Model: ${business.business_model}

Provide a detailed, actionable output/result for this task. Include specific steps taken, decisions made, and measurable outcomes.` }
          ]
        });

        const output = taskResponse.choices[0].message.content || '';
        const completedAt = new Date().toISOString();

        await base44.entities.AITask.update(task.id, {
          status: 'Completed',
          output,
          completed_at: completedAt
        });

        await base44.entities.AIDecisionLog.create({
          business_id,
          decision_type: task.category as any,
          trigger: `Autonomous task execution: ${task.title}`,
          reasoning: `Task was queued and prioritized as ${task.priority}. AI executed autonomously.`,
          action_taken: task.title,
          outcome: output.slice(0, 300),
          confidence_score: 88,
          approved_by_human: false
        });

        results.task_executed = { title: task.title, category: task.category };
      }
    }

    // OPERATION: Score and Qualify Leads
    if (!operation || operation === 'process_leads') {
      const newLeads = await base44.entities.Lead.filter({ business_id, status: 'New' });

      for (const lead of newLeads.slice(0, 3)) {
        const leadResponse = await openai.chat.completions.create({
          model: 'meta/llama-3.3-70b-instruct',
          messages: [
            { role: 'system', content: `You are a sales AI for ${business.name}. Analyze leads and provide scoring and recommendations. Return raw JSON only, no markdown.` },
            { role: 'user', content: `Analyze this lead for ${business.name} (${business.value_proposition}):
Name: ${lead.name}
Source: ${lead.source}
Notes: ${lead.notes || 'None'}
Deal Value: $${lead.deal_value || 0}

Return JSON: {"score": 0-100, "ai_summary": "brief analysis", "ai_recommendation": "next action"}` }
          ],
        });

        let analysis: any = { score: 50, ai_summary: 'AI analyzed lead', ai_recommendation: 'Follow up via email' };
        try {
          const raw = leadResponse.choices[0].message.content || '{}';
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          analysis = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
        } catch (_) {}

        await base44.entities.Lead.update(lead.id, {
          score: analysis.score,
          ai_summary: analysis.ai_summary,
          ai_recommendation: analysis.ai_recommendation,
          status: 'Qualified'
        });
      }

      results.leads_processed = newLeads.slice(0, 3).length;
    }

    // OPERATION: Generate new tasks if running low
    if (!operation || operation === 'generate_tasks') {
      const queuedTasks = await base44.entities.AITask.filter({ business_id, status: 'Queued' });

      if (queuedTasks.length < 3) {
        const tasksResponse = await openai.chat.completions.create({
          model: 'meta/llama-3.3-70b-instruct',
          messages: [
            { role: 'system', content: 'You are an AI business operations manager. Generate new high-impact tasks. Return raw JSON only, no markdown.' },
            { role: 'user', content: `Generate 5 new priority tasks for ${business.name}.
Business: ${business.name}
Stage: ${business.stage}
Model: ${business.business_model}
Strategy: ${(business.ai_strategy || '').slice(0, 300)}

Return JSON: {"tasks": [{"title": "", "category": "Marketing", "priority": "High", "description": "", "impact": ""}]}` }
          ],
        });

        let tasks: any[] = [];
        try {
          const raw = tasksResponse.choices[0].message.content || '{}';
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
          tasks = parsed.tasks || [];
        } catch (_) {}

        for (const task of tasks.slice(0, 5)) {
          await base44.entities.AITask.create({
            business_id,
            title: task.title,
            description: task.description,
            category: task.category || 'Operations',
            priority: task.priority || 'Medium',
            status: 'Queued',
            assigned_to: 'AI Agent',
            auto_generated: true,
            impact: task.impact
          });
        }

        results.tasks_generated = tasks.slice(0, 5).length;
      }
    }

    // Update business last action
    const actionSummary = Object.entries(results).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ');
    await base44.entities.Business.update(business_id, {
      ai_last_action: `Autonomous cycle: ${actionSummary || 'monitoring'}`,
      ai_next_action: 'Continue processing queue on next cycle'
    });

    // Record daily metrics
    const today = new Date().toISOString().split('T')[0];
    const existingMetrics = await base44.entities.BusinessMetric.filter({ business_id, date: today });

    if (existingMetrics.length === 0) {
      await base44.entities.BusinessMetric.create({
        business_id,
        date: today,
        ai_actions_taken: 1,
        tasks_completed: results.task_executed ? 1 : 0,
        leads_generated: 0,
        health_score: business.health_score || 75
      });
    }

    return Response.json({
      success: true,
      business_name: business.name,
      operations_run: results,
      message: '✅ AI autonomous operations cycle completed'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
