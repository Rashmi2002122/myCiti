import { useEffect } from 'react';

const DEFAULT_TITLE = 'myCite | Odisha City Guide, Durga Puja Pandals, Melas & Events';
const DEFAULT_DESC = 'Discover top Durga Puja pandals, local melas, festive food stalls, store offers, and events across Bhubaneswar, Cuttack & Odisha on an interactive live map.';
const DEFAULT_IMAGE = 'https://www.mycite.in/icon-512.png';
const DEFAULT_URL = 'https://www.mycite.in/';

/**
 * Custom React hook for dynamic SEO meta tags, Open Graph, Twitter cards, and JSON-LD schema.
 * Automatically synchronizes DOM head tags on route or entity change.
 */
export function useSEO({
  title,
  description,
  image,
  url,
  type = 'website',
  schema = null
} = {}) {
  useEffect(() => {
    // 1. Page Title
    const formattedTitle = title
      ? (title.includes('myCite') ? title : `${title} | myCite`)
      : DEFAULT_TITLE;
    document.title = formattedTitle;

    // Helper to create or update meta tags
    const setMetaTag = (attrName, attrValue, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const targetDesc = description || DEFAULT_DESC;
    const targetImage = image || DEFAULT_IMAGE;
    const targetUrl = url || window.location.href || DEFAULT_URL;

    // 2. Standard Description
    setMetaTag('name', 'description', targetDesc);

    // 3. Open Graph
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', targetDesc);
    setMetaTag('property', 'og:image', targetImage);
    setMetaTag('property', 'og:url', targetUrl);
    setMetaTag('property', 'og:type', type);

    // 4. Twitter Cards
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', targetDesc);
    setMetaTag('name', 'twitter:image', targetImage);

    // 5. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', targetUrl);

    // 6. Dynamic JSON-LD Structured Data
    let scriptTag = document.getElementById('dynamic-json-ld');
    if (schema) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'dynamic-json-ld';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.text = JSON.stringify(schema);
    } else if (scriptTag) {
      scriptTag.remove();
    }

    // Cleanup: restore default tags on unmount
    return () => {
      document.title = DEFAULT_TITLE;
      setMetaTag('name', 'description', DEFAULT_DESC);
      setMetaTag('property', 'og:title', DEFAULT_TITLE);
      setMetaTag('property', 'og:description', DEFAULT_DESC);
      setMetaTag('property', 'og:image', DEFAULT_IMAGE);
      setMetaTag('property', 'og:url', DEFAULT_URL);
      setMetaTag('name', 'twitter:title', DEFAULT_TITLE);
      setMetaTag('name', 'twitter:description', DEFAULT_DESC);
      setMetaTag('name', 'twitter:image', DEFAULT_IMAGE);
      if (canonical) {
        canonical.setAttribute('href', DEFAULT_URL);
      }
      const existingScript = document.getElementById('dynamic-json-ld');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [title, description, image, url, type, schema]);
}

export default useSEO;
