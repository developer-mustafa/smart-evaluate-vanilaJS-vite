import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEO Component
 * Manages meta tags and structured data for pages
 */
const SEO = ({
  title = 'স্মার্ট গ্রুপ ইভ্যালুয়েটর',
  description = 'একটি সম্পূর্ণ গ্রুপ মূল্যায়ন এবং ব্যবস্থাপনা সিস্টেম',
  keywords = 'গ্রুপ, মূল্যায়ন, শিক্ষা, ব্যবস্থাপনা',
  ogImage = '/icons/icon-512x512.png',
  ogType = 'website',
  structuredData = null,
  noindex = false,
}) => {
  const siteUrl = window.location.origin;
  const currentUrl = window.location.href;
  const fullTitle = title === 'স্মার্ট গ্রুপ ইভ্যালুয়েটর' ? title : `${title} | স্মার্ট গ্রুপ ইভ্যালুয়েটর`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Language and Charset */}
      <html lang="bn" />
      <meta charSet="utf-8" />
      
      {/* Viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* SEO */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow" />}
      <link rel="canonical" href={currentUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:locale" content="bn_BD" />
      <meta property="og:site_name" content="স্মার্ট গ্রুপ ইভ্যালুয়েটর" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
      
      {/* PWA */}
      <meta name="theme-color" content="#3b82f6" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="স্মার্ট ইভ্যালুয়েটর" />
      
      {/* Favicon */}
      <link rel="icon" type="image/svg+xml" href="/vite.svg" />
      <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      
      {/* Manifest */}

      
      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
