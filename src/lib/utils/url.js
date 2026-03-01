export const getBaseUrl = () => {
  if (typeof window !== 'undefined') return window.location.origin

  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel
    'http://localhost:3000'
  
  // Make sure to include `https://` when not localhost
  url = url.includes('http') ? url : `https://${url}`
  
  // Remove trailing slash
  url = url.replace(/\/$/, '')
  
  return url
}
