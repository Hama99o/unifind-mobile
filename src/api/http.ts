import axios from "axios";

/**
 * Strapi CMS (catalog, read-only): institutions, programs, offerings, degree
 * levels, study fields, campuses, languages, tags.
 *
 * AUTH_SECURITY §6 note: EXPO_PUBLIC_STRAPI_BEARER is a shared, public
 * read-only token. It is safe to include in the app bundle for read-only
 * catalog calls — it is NOT a secret, but never use it for write operations.
 * A server-side proxy is the recommended long-term fix.
 */
export const http = axios.create({
  baseURL: process.env.EXPO_PUBLIC_STRAPI_API_URL,
  headers: {
    "Content-Type": "application/json",
    ...(process.env.EXPO_PUBLIC_STRAPI_BEARER
      ? { Authorization: `Bearer ${process.env.EXPO_PUBLIC_STRAPI_BEARER}` }
      : {}),
  },
});
