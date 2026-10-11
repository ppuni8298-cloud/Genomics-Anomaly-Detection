// scripts/verify-phase6.mjs
// Automated End-to-End Verification for Phase 6:
// Advanced Genomics Analytics, Interactive Visualizations, Window Profiles, Explorer, and Dataset Comparison

import assert from 'node:assert';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

function extractSetCookie(res) {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(/genome_session_token=([^;]+)/);
  return match ? `genome_session_token=${match[1]}` : null;
}

const SAMPLE_FASTA_A = `>CHR_01_TEST Phase 6 Reference Chromosome A
AGCTTTTCATTCTGACTGCAACGGGCAATATGTCTCTGTGTGGATTAAAAAAAGAGTGTCTGATAGCAGC
TTCTGAACTGGTTACCTGCCGTGAGTAAATTAAAATTTTATTGACTTAGGTCACTAAATACTTTAACCAA
TATAGGCATAGCGCACAGACAGATAAAAATTACAGAGTACACAACATCCATGAAACGCATTAGCACCACC
ATTACCACCACCATCACCATTACCACAGGTAACGGTGCGGGCTGACGCGTACAGGAAACACAGAAAAAAGC
`;

const SAMPLE_FASTA_B = `>CHR_02_TEST Phase 6 Comparison Chromosome B
GGCCGGCCGGCCGGCCGGCCGGCCGGCCGGCCGGCCGGCCGGCCGGCCGGCCGGCCGGCCGGCCGGCC
ATATATATATATATATATATATATATATATATATATATATATATATATATATATATATATATATATATAT
CGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGC
`;

async function runPhase6Suite() {
  console.log(`\n======================================================`);
  console.log(`🧬  GenomeAI Phase 6: Advanced Analytics & Visualizations`);
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

  // 1. DIRECT BACKEND HEALTH
  await test('Direct Backend Health Check: GET /api/health returns 200', async () => {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'healthy');
  });

  // 2. USER AUTHENTICATION & SECURE SESSION
  const timestamp = Date.now();
  const user1Email = `dr_curie_${timestamp}@genomics.org`;
  const user2Email = `dr_franklin_${timestamp}@genomics.org`;
  let user1Cookie = '';
  let user2Cookie = '';

  await test('User 1 Signup & Session Creation via Next.js Proxy', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user1Email,
        password: 'Password@123!',
        confirmPassword: 'Password@123!',
        name: 'Dr. Marie Curie',
        institution: 'Curie Genomics Institute',
      }),
    });
    assert.strictEqual(res.status, 201);
    user1Cookie = extractSetCookie(res);
    assert.ok(user1Cookie, 'Session cookie must be set');
  });

  await test('User 2 Signup & Session Creation for Multi-Tenant Isolation', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user2Email,
        password: 'Password@123!',
        confirmPassword: 'Password@123!',
        name: 'Dr. Rosalind Franklin',
        institution: 'King\'s College London',
      }),
    });
    assert.strictEqual(res.status, 201);
    user2Cookie = extractSetCookie(res);
    assert.ok(user2Cookie, 'Session cookie must be set');
  });

  // 3. UPLOAD DATASET A & B FOR USER 1
  let ds1Id = '';
  let ds2Id = '';

  await test('User 1 Uploads Dataset A (with total bases extraction)', async () => {
    const formData = new FormData();
    const blob = new Blob([SAMPLE_FASTA_A], { type: 'text/plain' });
    formData.append('file', blob, 'sample_a.fasta');
    formData.append('description', 'User 1 Reference A');

    const res = await fetch(`${FRONTEND_URL}/api/proxy/datasets/upload`, {
      method: 'POST',
      headers: { Cookie: user1Cookie },
      body: formData,
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    ds1Id = data.id;
    assert.ok(data.id);
    assert.ok(data.totalBases > 0, `Total bases must be counted, got: ${data.totalBases}`);
  });

  await test('User 1 Uploads Dataset B', async () => {
    const formData = new FormData();
    const blob = new Blob([SAMPLE_FASTA_B], { type: 'text/plain' });
    formData.append('file', blob, 'sample_b.fasta');
    formData.append('description', 'User 1 Reference B');

    const res = await fetch(`${FRONTEND_URL}/api/proxy/datasets/upload`, {
      method: 'POST',
      headers: { Cookie: user1Cookie },
      body: formData,
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    ds2Id = data.id;
    assert.ok(data.id);
  });

  // 4. SUBMIT ANALYSIS WITH PHASE 6 PARAMETERS
  let analysis1Id = '';

  await test('User 1 Submits Analysis with Phase 6 Parameters (windowStep & randomSeed)', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/proxy/analysis/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: user1Cookie,
      },
      body: JSON.stringify({
        datasetId: ds1Id,
        name: 'Curie_EColi_Phase6_Scan',
        windowSize: 100,
        windowStep: 50,
        kmerSize: 5,
        contaminationRate: 0.10,
        randomSeed: 42,
      }),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.status, 'completed');
    analysis1Id = data.id;
  });

  // 5. ENHANCED ANALYSIS DETAILS ENDPOINT
  await test('User 1 Fetches Analysis Details: GET /api/proxy/analysis/{id}/details', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/proxy/analysis/${analysis1Id}/details`, {
      headers: { Cookie: user1Cookie },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.id, analysis1Id);
    assert.strictEqual(data.datasetId, ds1Id);
    assert.ok(data.totalWindows > 0, 'Must report total windows analyzed');
    assert.ok(typeof data.anomalyPercentage === 'number', 'Must compute anomaly percentage');
    assert.ok(typeof data.highSeverityCount === 'number');
    assert.ok(typeof data.mediumSeverityCount === 'number');
    assert.ok(typeof data.lowSeverityCount === 'number');
    assert.ok(typeof data.normalWindowsCount === 'number');
    assert.strictEqual(data.windowSize, 100);
    assert.strictEqual(data.windowStep, 50);
    assert.strictEqual(data.randomSeed, 42);
    assert.ok(data.featureSummary, 'Must include normal vs anomalous feature summary');
  });

  // 6. INTERACTIVE VISUALIZATIONS ENDPOINT
  await test('User 1 Fetches Visualizations: GET /api/proxy/analysis/{id}/visualizations', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/proxy/analysis/${analysis1Id}/visualizations`, {
      headers: { Cookie: user1Cookie },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.analysisId, analysis1Id);
    assert.ok(data.severityDistribution);
    assert.ok(Array.isArray(data.windowsMap) && data.windowsMap.length > 0, 'Must have windows map points');
    assert.ok(Array.isArray(data.gcProfile) && data.gcProfile.length > 0, 'Must have GC profile points');
    assert.ok(data.scientificDisclaimer, 'Must include scientific disclaimer banner');
    assert.ok(data.featureComparison, 'Must include feature comparison data');

    // Verify first window point structure
    const p = data.windowsMap[0];
    assert.ok(typeof p.score === 'number');
    assert.ok(typeof p.gcContent === 'number');
    assert.ok(typeof p.positionLabel === 'string');
  });

  // 7. DOWNLOADABLE ANALYSIS SUMMARY REPORT (MARKDOWN)
  await test('User 1 Downloads Markdown Analysis Report: GET /api/proxy/analysis/{id}/report', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/proxy/analysis/${analysis1Id}/report`, {
      headers: { Cookie: user1Cookie },
    });
    assert.strictEqual(res.status, 200);
    const contentType = res.headers.get('content-type') || '';
    assert.ok(contentType.includes('text/markdown'), 'Must return text/markdown');
    const text = await res.text();
    assert.ok(text.includes('Genomic Anomaly Analysis Summary Report'));
    assert.ok(text.includes('Scientific & Computational Interpretation Guidelines'));
    assert.ok(text.includes('**Sliding Window Size:** 100 bp'));
  });

  // 8. ANOMALY EXPLORER PAGINATED QUERY
  await test('User 1 Queries Anomalies with Search, Filter & Pagination: GET /api/proxy/anomalies/query', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/proxy/anomalies/query?page=1&limit=5&sort_by=score&sort_order=desc`, {
      headers: { Cookie: user1Cookie },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.items));
    assert.ok(typeof data.total === 'number');
    assert.strictEqual(data.page, 1);
    assert.strictEqual(data.limit, 5);
    assert.ok(typeof data.totalPages === 'number');
  });

  // 9. DATASET COMPARISON WORKFLOW
  await test('User 1 Compares Dataset A and Dataset B: GET /api/proxy/datasets/compare', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/proxy/datasets/compare?dataset1_id=${ds1Id}&dataset2_id=${ds2Id}`, {
      headers: { Cookie: user1Cookie },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.dataset1);
    assert.ok(data.dataset2);
    assert.strictEqual(data.dataset1.id, ds1Id);
    assert.strictEqual(data.dataset2.id, ds2Id);
    assert.strictEqual(data.dataset1.hasAnalysis, true);
    assert.strictEqual(data.dataset2.hasAnalysis, false);
  });

  // 10. MULTI-TENANT ISOLATION DEFENSE CHECKS
  await test('Isolation Defense: User 2 is rejected from accessing User 1 analysis details (404)', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/proxy/analysis/${analysis1Id}/details`, {
      headers: { Cookie: user2Cookie },
    });
    assert.strictEqual(res.status, 404);
  });

  await test('Isolation Defense: User 2 is rejected from accessing User 1 visualizations (404)', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/proxy/analysis/${analysis1Id}/visualizations`, {
      headers: { Cookie: user2Cookie },
    });
    assert.strictEqual(res.status, 404);
  });

  await test('Isolation Defense: User 2 is rejected from downloading User 1 report (404)', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/proxy/analysis/${analysis1Id}/report`, {
      headers: { Cookie: user2Cookie },
    });
    assert.strictEqual(res.status, 404);
  });

  await test('Isolation Defense: User 2 is rejected from comparing User 1 datasets (404)', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/proxy/datasets/compare?dataset1_id=${ds1Id}&dataset2_id=${ds2Id}`, {
      headers: { Cookie: user2Cookie },
    });
    assert.strictEqual(res.status, 404);
  });

  console.log(`\n======================================================`);
  console.log(`📊 Phase 6 Verification Results: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase6Suite().catch((err) => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
