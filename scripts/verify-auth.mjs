// scripts/verify-auth.mjs
// Automated verification for Phase 2: Secure Signup, Login, and Authentication
import assert from 'node:assert';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`🧬 GenomeAI Phase 2: Automated Authentication Suite`);
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

  const testUser = {
    name: 'Ada Lovelace',
    email: `ada.${Date.now()}@biotech-genome.org`,
    password: 'GenomeSecurePass123!',
  };

  let sessionCookie = '';

  // 1. Invalid Email Rejection (Signup)
  await test('Signup: Invalid Email Rejection', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bad Email',
        email: 'invalid-email-format',
        password: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!',
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400, `Expected 400 status, got ${res.status}`);
    assert.ok(data.error, 'Expected error message in response');
  });

  // 2. Password Mismatch Rejection (Signup)
  await test('Signup: Password Mismatch Rejection', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Mismatch Pass',
        email: `mismatch.${Date.now()}@biotech.org`,
        password: 'GenomePass123!',
        confirmPassword: 'DifferentPass123!',
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400, `Expected 400 status, got ${res.status}`);
    assert.ok(
      data.error.toLowerCase().includes('match') || JSON.stringify(data.details || '').toLowerCase().includes('match'),
      `Expected mismatch error message, got ${data.error}`
    );
  });

  // 3. Weak Password Rejection (Signup)
  await test('Signup: Weak Password Rejection', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Weak Pass',
        email: `weak.${Date.now()}@biotech.org`,
        password: '123',
        confirmPassword: '123',
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400, `Expected 400 status, got ${res.status}`);
  });

  // 4. Successful Signup
  await test('Signup: Successful Account Creation', async () => {
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
    const data = await res.json();
    assert.strictEqual(res.status, 201, `Expected 201 Created, got ${res.status}`);
    assert.ok(data.user, 'Expected user object in response');
    assert.strictEqual(data.user.email, testUser.email.toLowerCase());
    assert.strictEqual(data.user.name, testUser.name);
    assert.strictEqual(data.user.passwordHash, undefined, 'Password hash must never be returned');

    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Expected Set-Cookie header on successful signup');
    assert.ok(setCookie.includes('genome_session_token='), 'Cookie must contain genome_session_token');
    assert.ok(setCookie.includes('HttpOnly'), 'Cookie must be HttpOnly');
    sessionCookie = setCookie.split(';')[0];
  });

  // 5. Duplicate Email Rejection
  await test('Signup: Duplicate Email Rejection (409 Conflict)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Imposter Ada',
        email: testUser.email.toUpperCase(), // Test case-insensitivity normalization
        password: 'AnotherPassword123!',
        confirmPassword: 'AnotherPassword123!',
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 409, `Expected 409 Conflict, got ${res.status}`);
    assert.ok(
      data.error.toLowerCase().includes('already registered') ||
      data.error.toLowerCase().includes('conflict') ||
      data.error.toLowerCase().includes('already exists'),
      `Got: ${data.error}`
    );
  });

  // 6. Session Persistence & /api/auth/me Verification
  await test('Session Persistence: Authenticated /api/auth/me', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: sessionCookie },
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    assert.strictEqual(data.user.email, testUser.email.toLowerCase());
    assert.strictEqual(data.user.name, testUser.name);
  });

  // 7. Unauthorized API Access Rejection
  await test('Protected API: Unauthorized Access Rejection without Cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`);
    const data = await res.json();
    assert.strictEqual(res.status, 401, `Expected 401 Unauthorized, got ${res.status}`);
    assert.strictEqual(data.user, null);
  });

  // 8. Invalid Login: Non-existent Email
  await test('Login: Non-existent Email Rejection (Generic Message)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nobody-exists-here-999@biotech.org',
        password: 'WrongPassword123!',
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 401, `Expected 401 Unauthorized, got ${res.status}`);
    assert.strictEqual(data.error.replace(/\.$/, ''), 'Invalid email or password', 'Must return generic error without revealing account existence');
  });

  // 9. Invalid Login: Wrong Password
  await test('Login: Wrong Password Rejection (Generic Message)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: 'WrongPassword123!',
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 401, `Expected 401 Unauthorized, got ${res.status}`);
    assert.strictEqual(data.error.replace(/\.$/, ''), 'Invalid email or password');
  });

  // 10. Successful Login
  let newLoginCookie = '';
  await test('Login: Successful Authentication with Real Credentials', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie && setCookie.includes('genome_session_token='), 'Expected new session cookie on login');
    newLoginCookie = setCookie.split(';')[0];
  });

  // 11. Protected Route Middleware Check: /dashboard redirects unauthenticated users
  await test('Protected Route: Unauthenticated GET /dashboard Redirects to /login', async () => {
    const res = await fetch(`${BASE_URL}/dashboard`, {
      redirect: 'manual',
    });
    // Next.js middleware returns a 307 or 308 redirect
    assert.ok(
      res.status === 307 || res.status === 302 || res.status === 308,
      `Expected redirect status (307/302/308), got ${res.status}`
    );
    const location = res.headers.get('location');
    assert.ok(location && location.includes('/login'), `Expected redirect to /login, got ${location}`);
  });

  // 12. Authenticated Dashboard Access
  await test('Protected Route: Authenticated GET /dashboard Returns 200', async () => {
    const res = await fetch(`${BASE_URL}/dashboard`, {
      headers: { Cookie: newLoginCookie },
    });
    assert.strictEqual(res.status, 200, `Expected 200 OK for authenticated dashboard request, got ${res.status}`);
    const html = await res.text();
    assert.ok(html.includes('Genomics Anomaly Detection Using Apache Spark') || html.includes('Dashboard'), 'Expected dashboard content');
    assert.ok(html.includes(testUser.name), 'Dashboard must show authenticated user name');
  });

  // 13. Authenticated User opening /login redirects to /dashboard
  await test('Protected Route: Authenticated GET /login Redirects to /dashboard', async () => {
    const res = await fetch(`${BASE_URL}/login`, {
      headers: { Cookie: newLoginCookie },
      redirect: 'manual',
    });
    assert.ok(
      res.status === 307 || res.status === 302 || res.status === 308,
      `Expected redirect status, got ${res.status}`
    );
    const location = res.headers.get('location');
    assert.ok(location && location.includes('/dashboard'), `Expected redirect to /dashboard, got ${location}`);
  });

  // 14. Logout: Invalidate Session
  await test('Logout: Successfully Invalidates Session & Clears Cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: newLoginCookie },
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    assert.strictEqual(data.success, true);

    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Expected cleared cookie in Set-Cookie');
    const lowerCookie = setCookie.toLowerCase();
    assert.ok(
      lowerCookie.includes('max-age=0') || lowerCookie.includes('expires=') || lowerCookie.includes('genome_session=;'),
      `Cookie must be expired, got: ${setCookie}`
    );

    // Verify session is actually destroyed on subsequent /api/auth/me
    const verifyRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: newLoginCookie },
    });
    assert.strictEqual(verifyRes.status, 401, 'Subsequent request with logged-out cookie must be rejected (401)');
  });

  console.log(`\n======================================================`);
  console.log(`📊 Suite Results: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
