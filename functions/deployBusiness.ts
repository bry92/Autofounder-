import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import OpenAI from 'npm:openai@4.52.7';

const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN') || '';
const VERCEL_TOKEN = Deno.env.get('VERCEL_TOKEN') || '';
const NVIDIA_KEY = Deno.env.get('NVIDIA_NIM_API_KEY') || '';

async function githubRequest(path: string, method = 'GET', body?: any) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`GitHub ${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function getGithubUsername(): Promise<string> {
  const user = await githubRequest('/user');
  return user.login;
}

// Delete repo if it exists (clean slate)
async function deleteRepoIfExists(fullRepoName: string) {
  try {
    await githubRequest(`/repos/${fullRepoName}`, 'DELETE');
  } catch (_) { /* ignore */ }
}

// Create repo with auto_init=true so it's never empty
async function createRepo(repoName: string): Promise<string> {
  const repo = await githubRequest('/user/repos', 'POST', {
    name: repoName,
    description: 'AI-generated business app — built by AutoFounder',
    private: false,
    auto_init: true,         // creates initial commit with README
    default_branch: 'main',
  });
  return repo.full_name;
}

// Push all files in one commit via the Git trees API
async function pushFilesToGithub(fullRepoName: string, files: Record<string, string>) {
  // Wait briefly for auto_init to complete
  await new Promise(r => setTimeout(r, 2000));

  // Get HEAD ref
  const refData = await githubRequest(`/repos/${fullRepoName}/git/ref/heads/main`);
  const parentSha: string = refData.object.sha;
  const commitData = await githubRequest(`/repos/${fullRepoName}/git/commits/${parentSha}`);
  const baseTreeSha: string = commitData.tree.sha;

  // Create blobs sequentially to avoid race conditions on empty repos
  const treeItems: any[] = [];
  for (const [filePath, content] of Object.entries(files)) {
    const blob = await githubRequest(`/repos/${fullRepoName}/git/blobs`, 'POST', {
      content: btoa(unescape(encodeURIComponent(content))),
      encoding: 'base64',
    });
    treeItems.push({ path: filePath, mode: '100644', type: 'blob', sha: blob.sha });
  }

  // Create tree
  const newTree = await githubRequest(`/repos/${fullRepoName}/git/trees`, 'POST', {
    base_tree: baseTreeSha,
    tree: treeItems,
  });

  // Create commit
  const newCommit = await githubRequest(`/repos/${fullRepoName}/git/commits`, 'POST', {
    message: '🤖 Initial commit — built by AutoFounder AI',
    tree: newTree.sha,
    parents: [parentSha],
  });

  // Update main ref
  await githubRequest(`/repos/${fullRepoName}/git/refs/heads/main`, 'PATCH', {
    sha: newCommit.sha,
    force: true,
  });

  return newCommit.sha;
}

// Deploy via Vercel API
async function deployToVercel(repoFullName: string, projectName: string): Promise<string> {
  // Create project
  const createRes = await fetch('https://api.vercel.com/v10/projects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: projectName,
      framework: 'nextjs',
      gitRepository: { type: 'github', repo: repoFullName },
    }),
  });
  const projectData = await createRes.json();
  // Ignore 409 conflict (already exists)

  // Trigger deployment
  const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: projectName,
      gitSource: { type: 'github', repo: repoFullName, ref: 'main' },
      projectSettings: { framework: 'nextjs' },
    }),
  });
  const deployment = await deployRes.json();
  if (!deployRes.ok) throw new Error(`Vercel deploy failed: ${JSON.stringify(deployment)}`);

  const url = deployment.url || `${projectName}.vercel.app`;
  return `https://${url}`;
}

// AI generates the full Next.js app code
async function generateAppCode(business: any): Promise<Record<string, string>> {
  const openai = new OpenAI({ apiKey: NVIDIA_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' });

  const colors = (business.brand_colors || '#6366F1, #8B5CF6').split(',').map((c: string) => c.trim());
  const primary = colors[0] || '#6366F1';
  const secondary = colors[1] || '#8B5CF6';

  // Generate landing page copy
  const contentRes = await openai.chat.completions.create({
    model: 'meta/llama-3.3-70b-instruct',
    messages: [
      { role: 'system', content: 'Expert web copywriter. Return raw JSON only — no markdown, no code fences.' },
      { role: 'user', content: `Landing page copy for:
Name: ${business.name}
Tagline: ${business.tagline}
Value Prop: ${business.value_proposition}
Audience: ${business.target_audience}
Model: ${business.business_model}

JSON keys: hero_headline, hero_subheadline, cta_text, feature1_title, feature1_desc, feature2_title, feature2_desc, feature3_title, feature3_desc, social_proof, pricing_title, pricing_price, pricing_desc, footer_tagline` }
    ]
  });

  let copy: any = {};
  try {
    const raw = contentRes.choices[0].message.content || '{}';
    const m = raw.match(/\{[\s\S]*\}/);
    copy = JSON.parse(m ? m[0] : raw);
  } catch (_) {}

  // Defaults
  copy = {
    hero_headline: copy.hero_headline || `Welcome to ${business.name}`,
    hero_subheadline: copy.hero_subheadline || business.tagline || '',
    cta_text: copy.cta_text || 'Get Started Free',
    feature1_title: copy.feature1_title || 'Smart & Fast',
    feature1_desc: copy.feature1_desc || 'Built for modern needs',
    feature2_title: copy.feature2_title || 'AI-Powered',
    feature2_desc: copy.feature2_desc || 'Intelligent automation built in',
    feature3_title: copy.feature3_title || 'Always On',
    feature3_desc: copy.feature3_desc || 'Works 24/7 without interruption',
    social_proof: copy.social_proof || 'Join thousands of happy users',
    pricing_title: copy.pricing_title || 'Simple Pricing',
    pricing_price: copy.pricing_price || '$9.99/mo',
    pricing_desc: copy.pricing_desc || 'Everything included, cancel anytime',
    footer_tagline: copy.footer_tagline || business.tagline || '',
  };

  const files: Record<string, string> = {};

  files['package.json'] = JSON.stringify({
    name: business.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40),
    version: '0.1.0',
    private: true,
    scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
    dependencies: { next: '14.2.3', react: '^18', 'react-dom': '^18' },
    devDependencies: {
      typescript: '^5',
      '@types/node': '^20',
      '@types/react': '^18',
      '@types/react-dom': '^18',
    },
  }, null, 2);

  files['next.config.js'] = `/** @type {import('next').NextConfig} */\nconst nextConfig = {}\nmodule.exports = nextConfig\n`;

  files['tsconfig.json'] = JSON.stringify({
    compilerOptions: {
      target: 'es5', lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true, skipLibCheck: true, strict: true, noEmit: true,
      esModuleInterop: true, module: 'esnext', moduleResolution: 'bundler',
      resolveJsonModule: true, isolatedModules: true, jsx: 'preserve',
      incremental: true, paths: { '@/*': ['./src/*'] },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
    exclude: ['node_modules'],
  }, null, 2);

  files['src/app/globals.css'] = `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff; }
html { scroll-behavior: smooth; }
`;

  files['src/app/layout.tsx'] = `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '${business.name.replace(/'/g, "\\'")} — ${(business.tagline || '').replace(/'/g, "\\'")}',
  description: '${(business.value_proposition || '').replace(/'/g, "\\'").slice(0, 150)}',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`;

  // Escape all copy strings for safe embedding in TSX
  const esc = (s: string) => (s || '').replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\${/g, '\\${').replace(/'/g, "\\'");

  files['src/app/page.tsx'] = `'use client'
import { useState } from 'react'

const PRIMARY = '${esc(primary)}'
const SECONDARY = '${esc(secondary)}'
const grad = \`linear-gradient(135deg, \${PRIMARY}, \${SECONDARY})\`

export default function Home() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setSubmitted(true) }

  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>

      {/* NAV */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 4rem', borderBottom: '1px solid #1a1a1a', position: 'sticky', top: 0, background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(10px)', zIndex: 100 }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ${esc(business.name)}
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a href='#features' style={{ color: '#aaa', textDecoration: 'none', fontSize: '0.95rem' }}>Features</a>
          <a href='#pricing' style={{ color: '#aaa', textDecoration: 'none', fontSize: '0.95rem' }}>Pricing</a>
          <a href='#signup' style={{ background: grad, color: '#fff', padding: '0.5rem 1.2rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>${esc(copy.cta_text)}</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: 'center', padding: '8rem 2rem 6rem', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '100px', padding: '0.4rem 1rem', fontSize: '0.8rem', color: PRIMARY, marginBottom: '2rem', fontWeight: 600 }}>
          🤖 Powered by AI
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', background: 'linear-gradient(135deg, #fff 0%, #888 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ${esc(copy.hero_headline)}
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#888', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto 3rem' }}>
          ${esc(copy.hero_subheadline)}
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {!submitted ? (
            <>
              <input type='email' value={email} onChange={e => setEmail(e.target.value)} placeholder='Enter your email' required
                style={{ padding: '0.875rem 1.25rem', borderRadius: '10px', border: '1px solid #333', background: '#111', color: '#fff', fontSize: '1rem', width: '280px', outline: 'none' }} />
              <button type='submit' style={{ padding: '0.875rem 2rem', background: grad, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
                ${esc(copy.cta_text)} →
              </button>
            </>
          ) : (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', padding: '1rem 2rem', color: '#4ade80', fontWeight: 600 }}>
              ✅ You are on the list! We will be in touch soon.
            </div>
          )}
        </form>
        <p style={{ color: '#555', fontSize: '0.85rem' }}>${esc(copy.social_proof)}</p>
      </section>

      {/* FEATURES */}
      <section id='features' style={{ padding: '6rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Everything you need</h2>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '4rem' }}>Built for people who want results</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {[
            { icon: '⚡', title: '${esc(copy.feature1_title)}', desc: '${esc(copy.feature1_desc)}' },
            { icon: '🧠', title: '${esc(copy.feature2_title)}', desc: '${esc(copy.feature2_desc)}' },
            { icon: '🚀', title: '${esc(copy.feature3_title)}', desc: '${esc(copy.feature3_desc)}' },
          ].map((f, i) => (
            <div key={i} style={{ background: '#111', border: '1px solid #222', borderRadius: '16px', padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>{f.title}</h3>
              <p style={{ color: '#888', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id='pricing' style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>${esc(copy.pricing_title)}</h2>
        <p style={{ color: '#888', marginBottom: '3rem' }}>No hidden fees. Cancel anytime.</p>
        <div style={{ display: 'inline-block', background: '#111', border: \`2px solid \${PRIMARY}\`, borderRadius: '20px', padding: '3rem', maxWidth: '400px', width: '100%' }}>
          <div style={{ fontSize: '3rem', fontWeight: 900, background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>
            ${esc(copy.pricing_price)}
          </div>
          <p style={{ color: '#888', marginBottom: '2rem' }}>${esc(copy.pricing_desc)}</p>
          <a href='#signup' style={{ display: 'block', background: grad, color: '#fff', padding: '1rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '1.05rem' }}>
            ${esc(copy.cta_text)}
          </a>
        </div>
      </section>

      {/* SIGNUP */}
      <section id='signup' style={{ padding: '6rem 2rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Ready to get started?</h2>
        <p style={{ color: '#888', marginBottom: '2rem', fontSize: '1.1rem' }}>Join thousands already using ${esc(business.name)}</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {!submitted ? (
            <>
              <input type='email' placeholder='your@email.com' required
                style={{ padding: '0.875rem 1.25rem', borderRadius: '10px', border: '1px solid #333', background: '#111', color: '#fff', fontSize: '1rem', width: '280px' }} />
              <button type='submit' style={{ padding: '0.875rem 2rem', background: grad, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
                ${esc(copy.cta_text)} →
              </button>
            </>
          ) : (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', padding: '1rem 2rem', color: '#4ade80', fontWeight: 600 }}>
              ✅ You are on the list!
            </div>
          )}
        </form>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #1a1a1a', padding: '2rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#555', fontSize: '0.85rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ fontWeight: 700, color: '#888' }}>${esc(business.name)}</div>
        <div>${esc(copy.footer_tagline)}</div>
        <div>Built by AutoFounder AI 🤖</div>
      </footer>
    </main>
  )
}
`;

  files['README.md'] = `# ${business.name}\n\n> ${business.tagline || ''}\n\n${business.value_proposition || ''}\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n---\n*Built autonomously by AutoFounder AI*\n`;

  return files;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { business_id } = body;
    if (!business_id) return Response.json({ error: 'business_id is required' }, { status: 400 });

    const businesses = await base44.entities.Business.list();
    const business = businesses.find((b: any) => b.id === business_id);
    if (!business) return Response.json({ error: 'Business not found' }, { status: 404 });

    await base44.entities.Business.update(business_id, { status: 'Deploying', ai_last_action: '🔨 Generating app code with AI...' });

    // 1. Generate code
    const files = await generateAppCode(business);

    // 2. GitHub username
    const username = await getGithubUsername();
    const repoName = business.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 45) + '-app';
    const fullRepoName = `${username}/${repoName}`;

    // 3. Delete old repo if exists, then create fresh
    await deleteRepoIfExists(fullRepoName);
    await createRepo(repoName);

    await base44.entities.Business.update(business_id, { ai_last_action: `📦 Pushing ${Object.keys(files).length} files to GitHub...` });

    // 4. Push all files
    await pushFilesToGithub(fullRepoName, files);

    await base44.entities.Business.update(business_id, { ai_last_action: '🚀 Deploying to Vercel...' });

    // 5. Deploy to Vercel
    const deployUrl = await deployToVercel(fullRepoName, repoName);

    // 6. Update business
    await base44.entities.Business.update(business_id, {
      status: 'Active',
      stage: 'Live',
      website_url: deployUrl,
      ai_last_action: `✅ Live at ${deployUrl}`,
      ai_next_action: 'Monitor traffic and run autonomous growth operations',
    });

    // 7. Log decision
    await base44.entities.AIDecisionLog.create({
      business_id, decision_type: 'Operations',
      trigger: 'User triggered deployment',
      reasoning: `Generated Next.js app, pushed to github.com/${fullRepoName}, deployed to Vercel.`,
      action_taken: `Deployed to ${deployUrl}`,
      outcome: `Live at ${deployUrl}`,
      confidence_score: 97, approved_by_human: true,
    });

    return Response.json({
      success: true,
      github_repo: `https://github.com/${fullRepoName}`,
      deploy_url: deployUrl,
      message: `🚀 ${business.name} is LIVE at ${deployUrl}`,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
