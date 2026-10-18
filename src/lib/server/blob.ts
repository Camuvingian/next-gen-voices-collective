/**
 * Is a Blob store connected? Either Vercel's newer OIDC login (BLOB_STORE_ID,
 * with the OIDC token Vercel provides at runtime, or `vercel env pull` locally)
 * or a classic read-write token. The Blob SDK finds the credentials itself.
 */
export const blobConfigured = () => !!(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
