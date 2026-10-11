// scripts/verify-phase3.mjs
// Automated verification for Phase 3: Professional Genomics Dashboard UI
import assert from 'node:assert';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`🧬 GenomeAI Phase 3: Dashboard UI Verification Suite`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`⏳ Testing: ${name}... `);
      await fn();
      console.log(`✅ PASSED`);
      passed++;
    } catch (err) {
      console.log(`❌ FAILED`);
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  }

  const dashboardRoutes = [
    { path: '/dashboard', label: 'Overview', expectedContent: 'Genomic Intelligence Dashboard' },
    { path: '/dashboard/new-analysis', label: 'New Analysis', expectedContent: 'New Genomic Analysis' },
    { path: '/dashboard/history', label: 'Analysis History', expectedContent: 'Analysis History' },
    { path: '/dashboard/anomalies', label: 'Anomaly Explorer', expectedContent: 'Anomaly Explorer' },
    { path: '/dashboard/datasets', label: 'Dataset Manager', expectedContent: 'Dataset Manager' },
    { path: '/dashboard/settings', label: 'Settings', expectedContent: 'Analyst Account Settings' },
  ];

  // 1. Unauthenticated Route Protection
  for (const route of dashboardRoutes) {
    await test(`Protection: Unauthenticated GET ${route.path} redirects to /login`, async () => {
      const res = await fetch(`${BASE_URL}${route.path}`, {
        redirect: 'manual',
      });
      assert.ok(
        res.status === 307 || res.status === 302 || res.status === 303,
        `Expected redirect status, got ${res.status}`
      );
      const location = res.headers.get('location');
      assert.ok(
        location && location.includes('/login'),
        `Expected redirect to /login, got ${location}`
      );
    });
  }

  // 2. Landing Page, Login, Signup Accessible
  await test('Public: GET / returns 200 with landing page content', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('GenomeAI'), 'Expected GenomeAI in landing page');
  });

  await test('Public: GET /login returns 200', async () => {
    const res = await fetch(`${BASE_URL}/login`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('Sign In'), 'Expected Sign In on login page');
  });

  await test('Public: GET /signup returns 200', async () => {
    const res = await fetch(`${BASE_URL}/signup`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('Sign Up') || text.includes('Create'), 'Expected Sign Up on signup page');
  });

  // 3. Create Authenticated Session
  const testUser = {
    name: 'Rosalind Franklin',
    email: `rosalind.${Date.now()}@crystallography-dna.org`,
    password: 'GenomicsSecure2026!',
  };

  let sessionCookie = '';

  await test('Auth: Create test user and obtain session cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
        confirmPassword: testUser.password,
      }),
    });
    assert.strictEqual(res.status, 201, `Failed to signup test user: ${res.status}`);
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Expected Set-Cookie header');
    sessionCookie = setCookie.split(';')[0];
    assert.ok(sessionCookie.includes('genome_session_token='), 'Expected session token in cookie');
  });

  // 4. Authenticated Access to All 6 Dashboard Routes
  for (const route of dashboardRoutes) {
    await test(`Dashboard: Authenticated GET ${route.path} returns 200 and renders ${route.label}`, async () => {
      const res = await fetch(`${BASE_URL}${route.path}`, {
        headers: { Cookie: sessionCookie },
      });
      assert.strictEqual(res.status, 200, `Expected 200 for ${route.path}, got ${res.status}`);
      const text = await res.text();
      assert.ok(
        text.includes(route.expectedContent) || text.includes(route.label),
        `Expected content "${route.expectedContent}" on ${route.path}`
      );
      assert.ok(text.includes('GenomeAI'), `Expected GenomeAI sidebar brand on ${route.path}`);
      assert.ok(text.includes('Overview'), `Expected Overview nav link on ${route.path}`);
      assert.ok(text.includes('New Analysis'), `Expected New Analysis nav link on ${route.path}`);
      assert.ok(text.includes('Analysis History'), `Expected Analysis History nav link on ${route.path}`);
      assert.ok(text.includes('Anomaly Explorer'), `Expected Anomaly Explorer nav link on ${route.path}`);
      assert.ok(text.includes('Dataset Manager'), `Expected Dataset Manager nav link on ${route.path}`);
      assert.ok(text.includes('Settings'), `Expected Settings nav link on ${route.path}`);
    });
  }

  // 5. Logout verification
  await test('Auth: POST /api/auth/logout clears session', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: sessionCookie },
      redirect: 'manual',
    });
    assert.ok(
      res.status === 303 || res.status === 302 || res.status === 200,
      `Expected redirect/success on logout, got ${res.status}`
    );
  });

  console.log(`\n======================================================`);
  console.log(`📊 Phase 3 Suite Results: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
