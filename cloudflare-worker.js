/**
 * Cloudflare Worker for shreeganeshkunj.com routing
 *
 * Routes:
 * - / (root) → Redirect to Airbnb listing
 * - /house-rules, /admin, /analytics → Proxy to Heroku app
 * - All other paths → Proxy to Heroku app
 */

const HEROKU_APP_URL = 'https://house-rules-acknowledgment-91bc2e7022ee.herokuapp.com';
const AIRBNB_LISTING_URL = 'https://airbnb.com/h/shreeganeshkunj';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Root domain redirect to Airbnb
    if (path === '/' || path === '') {
      return Response.redirect(AIRBNB_LISTING_URL, 302);
    }

    // Proxy all other paths to Heroku app
    // This includes /house-rules, /admin, /analytics, and any other routes
    const herokuUrl = new URL(request.url);
    herokuUrl.protocol = 'https:';
    herokuUrl.host = 'house-rules-acknowledgment-91bc2e7022ee.herokuapp.com';

    // Create a new request with the Heroku URL
    const modifiedRequest = new Request(herokuUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual'
    });

    // Add original host header for proper routing
    const newHeaders = new Headers(modifiedRequest.headers);
    newHeaders.set('X-Forwarded-Host', url.host);
    newHeaders.set('X-Forwarded-Proto', 'https');

    // Fetch from Heroku
    const response = await fetch(modifiedRequest, {
      headers: newHeaders
    });

    // Return the response
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }
};
