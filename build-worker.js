// build-worker.js
// Bundle the Cloudflare Worker code for Pages deployment
const esbuild = require('esbuild');
const path = require('path');

esbuild.build({
    entryPoints: ['cloudflare/worker.ts'],
    bundle: true,
    format: 'esm',
    target: 'esnext',
    outfile: 'frontend/out/_worker.js',
    platform: 'neutral',
    conditions: ['worker', 'browser'],
    external: ['__STATIC_CONTENT_MANIFEST', 'fs', 'path', 'crypto', 'node:crypto', 'qs', 'stripe'],
    minify: false, // Set to true for production
    sourcemap: false,
    logLevel: 'info',
}).then(() => {
    console.log('✅ Worker bundled successfully to frontend/out/_worker.js');
}).catch((error) => {
    console.error('❌ Worker bundling failed:', error);
    process.exit(1);
});
