// scripts/verify-phase5.mjs
// Automated End-to-End Verification for Phase 5:
// Security Hardening, Multi-Tenant Isolation, Authentication & Export Verification

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

function extractSetCookie(res) {
  // Extract genome_session_token cookie
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(/genome_session_token=([^;]+)/);
  return match ? `genome_session_token=${match[1]}` : null;
}

async function runPhase5Suite() {
  console.log(`\n======================================================`);
  console.log(`🛡️  GenomeAI Phase 5: Security & Multi-Tenant Test Suite`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Backend URL:  ${BACKEND_URL}`);
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

  // ------------------------------------------------------------------------
  // 1. PUBLIC HEALTH & CLUSTER STATUS
  // ------------------------------------------------------------------------
  await test('Public Health Check: GET /api/health returns healthy without auth', async () => {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.status, 'healthy');
    assert.ok(typeof data.spark_available === 'boolean');
  });

  // ------------------------------------------------------------------------
  // 2. UNPROTECTED DIRECT ACCESS REJECTION (DIRECT FASTAPI)
  // ------------------------------------------------------------------------
  await test('Security Guard: Direct unauthenticated FastAPI requests return 401', async () => {
    const endpoints = [
      '/api/datasets',
      '/api/analysis/list',
      '/api/anomalies',
      '/api/stats',
      '/api/anomalies/export'
    ];
    for (const ep of endpoints) {
      const res = await fetch(`${BACKEND_URL}${ep}`);
      assert.strictEqual(res.status, 401, `Expected 401 for ${ep}, got ${res.status}`);
    }
  });

  await test('Security Guard: Direct requests with tampered JWT return 401', async () => {
    const res = await fetch(`${BACKEND_URL}/api/datasets`, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'
      }
    });
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
  });

  // ------------------------------------------------------------------------
  // 3. MULTI-TENANT USER ONBOARDING VIA NEXT.JS
  // ------------------------------------------------------------------------
  const timestamp = Date.now();
  const userAlphaEmail = `alpha_${timestamp}@genomics.lab`;
  const userBetaEmail = `beta_${timestamp}@genomics.lab`;
  const password = 'StrongPassword123!';

  let cookieAlpha = '';
  let cookieBeta = '';

  await test('Multi-Tenant Setup: Register Researcher Alpha via Next.js', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Alpha Turing',
        email: userAlphaEmail,
        password: password,
        confirmPassword: password,
      }),
    });
    assert.strictEqual(res.status, 201, `Registration failed: ${res.status}`);
    cookieAlpha = extractSetCookie(res);
    assert.ok(cookieAlpha, 'Expected session cookie for Alpha');
  });

  await test('Multi-Tenant Setup: Register Researcher Beta via Next.js', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Beta Franklin',
        email: userBetaEmail,
        password: password,
        confirmPassword: password,
      }),
    });
    assert.strictEqual(res.status, 201, `Registration failed: ${res.status}`);
    cookieBeta = extractSetCookie(res);
    assert.ok(cookieBeta, 'Expected session cookie for Beta');
  });

  // ------------------------------------------------------------------------
  // 4. DATASET UPLOAD & METADATA ISOLATION
  // ------------------------------------------------------------------------
  let datasetAlphaId = '';
  let datasetBetaId = '';

  await test('Dataset Isolation: Researcher Alpha uploads FASTA dataset', async () => {
    const fastaContent = fs.readFileSync(path.resolve('scripts/test_genome.fasta'));
    const blob = new Blob([fastaContent], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', blob, 'alpha_genome.fasta');
    formData.append('description', 'Alpha laboratory reference sequence');

    const res = await fetch(`${FRONTEND_URL}/api/proxy/datasets/upload`, {
      method: 'POST',
      headers: { Cookie: cookieAlpha },
      body: formData,
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.id, 'Expected dataset ID');
    datasetAlphaId = data.id;
  });

  await test('Dataset Isolation: Researcher Beta uploads FASTA dataset', async () => {
    const fastaContent = fs.readFileSync(path.resolve('scripts/test_genome.fasta'));
    const blob = new Blob([fastaContent], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', blob, 'beta_genome.fasta');
    formData.append('description', 'Beta laboratory independent sequence');

    const res = await fetch(`${FRONTEND_URL}/api/proxy/datasets/upload`, {
      method: 'POST',
      headers: { Cookie: cookieBeta },
      body: formData,
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.id, 'Expected dataset ID');
    datasetBetaId = data.id;
  });

  await test('Dataset Scoping: Alpha cannot see Beta dataset and vice versa', async () => {
    // Alpha list
    const resA = await fetch(`${FRONTEND_URL}/api/proxy/datasets`, {
      headers: { Cookie: cookieAlpha },
    });
    assert.strictEqual(resA.status, 200);
    const listA = await resA.json();
    const idsA = listA.map(d => d.id);
    assert.ok(idsA.includes(datasetAlphaId), 'Alpha must see their own dataset');
    assert.ok(!idsA.includes(datasetBetaId), 'Alpha MUST NOT see Beta dataset');

    // Beta list
    const resB = await fetch(`${FRONTEND_URL}/api/proxy/datasets`, {
      headers: { Cookie: cookieBeta },
    });
    assert.strictEqual(resB.status, 200);
    const listB = await resB.json();
    const idsB = listB.map(d => d.id);
    assert.ok(idsB.includes(datasetBetaId), 'Beta must see their own dataset');
    assert.ok(!idsB.includes(datasetAlphaId), 'Beta MUST NOT see Alpha dataset');
  });

  // ------------------------------------------------------------------------
  // 5. CROSS-TENANT ACCESS DEFENSE
  // ------------------------------------------------------------------------
  await test('Access Control: Beta blocked from reading Alpha dataset composition', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/proxy/datasets/${datasetAlphaId}/composition`, {
      headers: { Cookie: cookieBeta },
    });
    assert.strictEqual(res.status, 404, `Expected 404 for cross-tenant dataset read, got ${res.status}`);
  });

  await test('Access Control: Beta blocked from running analysis on Alpha dataset', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/proxy/analysis/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieBeta,
      },
      body: JSON.stringify({
        datasetId: datasetAlphaId,
        name: 'UNAUTHORIZED_CROSS_RUN',
        windowSize: 100,
        kmerSize: 4,
        contaminationRate: 0.05,
      }),
    });
    assert.strictEqual(res.status, 404, `Expected 404 for cross-tenant analysis submission, got ${res.status}`);
  });

  // ------------------------------------------------------------------------
  // 6. ANALYSIS EXECUTION & RESULT ISOLATION
  // ------------------------------------------------------------------------
  let analysisAlphaId = '';

  await test('Authorized Analysis: Alpha runs PySpark Isolation Forest analysis', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/proxy/analysis/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieAlpha,
      },
      body: JSON.stringify({
        datasetId: datasetAlphaId,
        name: 'ALPHA_VERIFIED_GENOMIC_RUN',
        windowSize: 100,
        kmerSize: 4,
        contaminationRate: 0.05,
      }),
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.status, 'completed');
    assert.ok(data.id);
    analysisAlphaId = data.id;
  });

  await test('Result Scoping: Beta cannot see Alpha analysis or anomalies', async () => {
    // Analysis list
    const resListB = await fetch(`${FRONTEND_URL}/api/proxy/analysis/list`, {
      headers: { Cookie: cookieBeta },
    });
    assert.strictEqual(resListB.status, 200);
    const analysesB = await resListB.json();
    assert.ok(!analysesB.some(a => a.id === analysisAlphaId), 'Alpha analysis must not leak to Beta');

    // Anomalies list
    const resAnomB = await fetch(`${FRONTEND_URL}/api/proxy/anomalies`, {
      headers: { Cookie: cookieBeta },
    });
    assert.strictEqual(resAnomB.status, 200);
    const anomB = await resAnomB.json();
    assert.ok(!anomB.some(a => a.analysisId === analysisAlphaId), 'Alpha anomalies must not leak to Beta');
  });

  // ------------------------------------------------------------------------
  // 7. CSV EXPORT AUTHORIZATION
  // ------------------------------------------------------------------------
  await test('Export Defense: Beta blocked from exporting Alpha anomalies CSV', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/proxy/anomalies/export?analysis_id=${analysisAlphaId}`, {
      headers: { Cookie: cookieBeta },
    });
    assert.strictEqual(res.status, 404, `Expected 404 for unauthorized CSV export, got ${res.status}`);
  });

  await test('Export Success: Alpha successfully exports anomalies as CSV', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/proxy/anomalies/export?analysis_id=${analysisAlphaId}`, {
      headers: { Cookie: cookieAlpha },
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const contentType = res.headers.get('content-type') || '';
    assert.ok(contentType.includes('text/csv'), `Expected text/csv, got ${contentType}`);
    const csvText = await res.text();
    assert.ok(csvText.includes('Sequence Locus'), 'CSV must contain standard headers');
    assert.ok(csvText.includes('Outlier Score'), 'CSV must contain Outlier Score header');
  });

  // ------------------------------------------------------------------------
  // 8. INPUT VALIDATION DEFENSE
  // ------------------------------------------------------------------------
  await test('Validation Defense: Invalid ML hyperparameters rejected with 422', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/proxy/analysis/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieAlpha,
      },
      body: JSON.stringify({
        datasetId: datasetAlphaId,
        name: 'INVALID_HYPERPARAMS_RUN',
        windowSize: 5, // Below minimum 10
        kmerSize: 4,
        contaminationRate: 0.99, // Exceeds max 0.5
      }),
    });
    assert.strictEqual(res.status, 422, `Expected 422 for invalid hyperparameters, got ${res.status}`);
  });

  console.log(`\n======================================================`);
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase5Suite().catch((err) => {
  console.error('Fatal suite failure:', err);
  process.exit(1);
});
