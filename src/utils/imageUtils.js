/**
 * Utility to optimize image delivery with responsive dimensions, automatic WebP/AVIF formatting,
 * and adaptive quality compression.
 */

/**
 * Returns an optimized image URL for Cloudinary or Unsplash images.
 * Falls back safely to the original URL if not from an optimizable CDN.
 *
 * @param {string} url - Original image URL
 * @param {number} width - Target width in pixels (e.g. 600)
 * @param {number} height - Target height in pixels (optional, e.g. 375)
 * @param {string} crop - Crop mode for Cloudinary (default: 'fill')
 * @returns {string} Optimized image URL
 */
export function getOptimizedImageUrl(url, width = 600, height = null, crop = 'fill') {
  if (!url || typeof url !== 'string') return '';

  // Cloudinary image transformation
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    // Avoid double transforming
    if (url.includes('/upload/w_') || url.includes('/upload/c_')) {
      return url;
    }

    const transformParams = [
      `w_${width}`,
      height ? `h_${height}` : null,
      crop ? `c_${crop}` : null,
      'q_auto', // Automatic visual quality
      'f_auto'  // Automatic modern format (AVIF / WebP depending on browser)
    ].filter(Boolean).join(',');

    return url.replace('/upload/', `/upload/${transformParams}/`);
  }

  // Unsplash image optimization
  if (url.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('w', String(width));
      if (height) parsed.searchParams.set('h', String(height));
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('q', '80');
      return parsed.toString();
    } catch {
      return url;
    }
  }

  return url;
}
