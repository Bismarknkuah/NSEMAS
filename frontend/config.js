/**
 * NSEMAS Deployment Config
 * -------------------------
 * If this frontend is served by the same server as the API (the default —
 * one Railway service running backend/server.js, which also serves this
 * frontend as static files), leave API_BASE empty: every request already
 * resolves correctly against '/api/...' on the same origin.
 *
 * If you deploy the frontend SEPARATELY (e.g. this frontend/ folder as its
 * own static site on Vercel, with the backend running as its own service
 * on Railway), set API_BASE to your backend's full URL, e.g.:
 *
 *   window.NSEMAS_CONFIG = { API_BASE: 'https://nsemas-backend.up.railway.app' };
 *
 * Also set CORS_ORIGIN on the backend (Railway environment variables) to
 * your Vercel frontend's URL so the browser is allowed to call across
 * origins, e.g. CORS_ORIGIN=https://nsemas.vercel.app
 */
window.NSEMAS_CONFIG = {
  API_BASE: '', // e.g. 'https://your-backend.up.railway.app' for a split deployment
};
