// Serverless function to serve dynamic Open Graph / Twitter Card meta tags to social media crawlers
// (WhatsApp, Facebook, Twitter, LinkedIn, Telegram, etc.) for client profiles and listings.

export default async function handler(req, res) {
  const { slug, listingId } = req.query;
  const userAgent = req.headers['user-agent'] || '';
  const isSocialCrawler = /whatsapp|facebookexternalhit|twitterbot|linkedinbot|telegrambot|slackbot|discordbot|pinterest/i.test(userAgent);

  const siteOrigin = 'https://www.mycite.in';
  const defaultTitle = 'myCite | Odisha City Guide, Durga Puja Pandals, Melas & Events';
  const defaultDesc = 'Discover top Durga Puja pandals, local melas, festive food stalls, store offers, and events across Bhubaneswar, Cuttack & Odisha on an interactive live map.';
  const defaultImage = `${siteOrigin}/icon-512.png`;

  let title = defaultTitle;
  let description = defaultDesc;
  let image = defaultImage;
  let targetUrl = siteOrigin;

  if (slug) {
    targetUrl = `${siteOrigin}/c/${slug}`;
  } else if (listingId) {
    targetUrl = `${siteOrigin}/?listingId=${listingId}`;
  }

  // If a human visitor reaches here directly, redirect immediately to the SPA
  if (!isSocialCrawler) {
    return res.redirect(302, targetUrl);
  }

  // For social crawlers, fetch live data from the backend
  let rawApiBase = process.env.VITE_API_URL || process.env.BACKEND_URL || '';
  if (rawApiBase.endsWith('/')) rawApiBase = rawApiBase.slice(0, -1);
  if (rawApiBase.endsWith('/api')) rawApiBase = rawApiBase.slice(0, -4);

  if (rawApiBase) {
    try {
      if (slug) {
        const resp = await fetch(`${rawApiBase}/api/clients/${encodeURIComponent(slug)}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (resp.ok) {
          const profile = await resp.json();
          if (profile?.businessName) {
            title = `${profile.businessName} - ${profile.city || 'Odisha'} | myCite`;
            description = profile.bio || `Explore live offers, events, and timings for ${profile.businessName} in ${profile.city || 'Odisha'} on myCite.`;
            image = profile.coverImageUrl || profile.profileImageUrl || defaultImage;
          }
        }
      } else if (listingId) {
        const resp = await fetch(`${rawApiBase}/api/listings/${encodeURIComponent(listingId)}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (resp.ok) {
          const listing = await resp.json();
          if (listing?.title) {
            title = `${listing.title} - ${listing.landmark || listing.city || 'Odisha'} | myCite`;
            description = listing.offerText || listing.description || description;
            image = listing.primaryImageUrl || defaultImage;
          }
        }
      }
    } catch {
      // Fallback gracefully to default metadata on network error
    }
  }

  // Escape HTML characters
  const escapeHtml = (str) => String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeUrl = escapeHtml(targetUrl);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="myCite" />
  <meta property="og:url" content="${safeUrl}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${safeImage}" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImage}" />

  <!-- Instant Browser Redirect -->
  <meta http-equiv="refresh" content="0;url=${safeUrl}" />
  <link rel="canonical" href="${safeUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${safeUrl}">${safeTitle}</a>...</p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  return res.status(200).send(html);
}
