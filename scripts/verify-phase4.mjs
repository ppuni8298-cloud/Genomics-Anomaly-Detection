// scripts/verify-phase4.mjs
// Automated verification for Phase 4: FastAPI + PySpark + Isolation Forest Backend
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

import crypto from 'node:crypto';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const AUTH_SECRET = process.env.AUTH_SECRET || 'genome_ai_secret_key_session_auth_phase2_super_secure_32b_token';

function createToken(userId = 'phase4_verify_user') {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    userId,
    email: 'phase4_evaluator@biotech.org',
    name: 'Phase 4 Evaluator',
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

const authHeader = { 'Authorization': `Bearer ${createToken()}` };

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`🧬 GenomeAI Phase 4: FastAPI & PySpark Backend Suite`);
  console.log(`Backend Target:  ${BACKEND_URL}`);
  console.log(`Frontend Target: ${FRONTEND_URL}`);
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

  // 1. Health check
  await test('FastAPI: GET /api/health returns healthy with PySpark status', async () => {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.status, 'healthy');
    assert.ok(typeof data.spark_available === 'boolean');
  });

  // 2. Real FASTA file upload
  let uploadedDatasetId = '';
  await test('Upload: POST /api/datasets/upload parses FASTA and saves record', async () => {
    const fastaContent = fs.readFileSync(path.resolve('scripts/test_genome.fasta'));
    const blob = new Blob([fastaContent], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', blob, 'test_genome.fasta');
    formData.append('description', 'Automated E. coli test sequence');

    const res = await fetch(`${BACKEND_URL}/api/datasets/upload`, {
      method: 'POST',
      headers: authHeader,
      body: formData,
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.id, 'Expected dataset ID');
    assert.strictEqual(data.format, 'fasta');
    assert.ok(data.sequenceCount >= 1);
    uploadedDatasetId = data.id;
  });

  // 3. Nucleotide Composition calculation
  await test('Composition: GET /api/datasets/:id/composition computes A, T, G, C & GC%', async () => {
    const res = await fetch(`${BACKEND_URL}/api/datasets/${uploadedDatasetId}/composition`, {
      headers: authHeader,
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.gcContent > 0, 'Expected positive GC content');
    assert.ok(data.totalBases > 0, 'Expected total bases > 0');
    assert.ok(data.adenine > 0);
  });

  // 4. Submit real PySpark & Isolation Forest analysis job
  let executedAnalysisId = '';
  await test('Spark Pipeline: POST /api/analysis/submit executes feature extraction and Isolation Forest', async () => {
    const res = await fetch(`${BACKEND_URL}/api/analysis/submit`, {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        datasetId: uploadedDatasetId,
        name: 'AUTOMATED_PYSPARK_ECOLI_RUN',
        windowSize: 250,
        kmerSize: 5,
        contaminationRate: 0.05,
      }),
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.status, 'completed');
    assert.ok(data.id, 'Expected analysis ID');
    assert.ok(typeof data.anomaliesFound === 'number');
    assert.ok(data.algorithm.includes('PySpark'));
    executedAnalysisId = data.id;
  });

  // 5. Query detected anomalies
  await test('Anomalies: GET /api/anomalies returns real detected outlier records', async () => {
    const res = await fetch(`${BACKEND_URL}/api/anomalies`, {
      headers: authHeader,
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    if (data.length > 0) {
      assert.ok(data[0].sequenceId);
      assert.ok(data[0].anomalyType);
      assert.ok(typeof data[0].score === 'number');
      assert.ok(['low', 'medium', 'high'].includes(data[0].severity));
    }
  });

  // 6. Query updated dashboard stats
  await test('Stats: GET /api/stats returns updated counts reflecting real datasets and analyses', async () => {
    const res = await fetch(`${BACKEND_URL}/api/stats`, {
      headers: authHeader,
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.totalDatasets >= 1);
    assert.ok(data.analysesCompleted >= 1);
    assert.ok(data.lastAnalysisDate !== null);
  });

  console.log(`\n======================================================`);
  console.log(`📊 Phase 4 Suite Results: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
