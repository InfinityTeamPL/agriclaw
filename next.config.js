/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // ssh2 i ws mają binarne `*.node` natywne bindingi — webpack ich nie
    // parsuje. Trzymamy je jako external, żeby Node.js ładował je z
    // node_modules w runtime. Potrzebne dla /api/agents/deploy (SSH)
    // i /api/chat/stream (WebSocket do OpenClaw Gateway).
    serverComponentsExternalPackages: ['ssh2', 'ws'],
  },
  // Osadzone lokalnie czcionki (src/assets/fonts) czytane w runtime przez
  // /api/treatments/export/pdf muszą trafić do bundla funkcji serverless,
  // inaczej po `next build` fs.readFile ich nie znajdzie.
  outputFileTracingIncludes: {
    '/api/treatments/export/pdf': ['./src/assets/fonts/**'],
  },
};

module.exports = nextConfig;
