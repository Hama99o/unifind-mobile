/**
 * Route: /(main)/find
 * Thin wrapper for the FindScreen (Programs | Institutions | Offerings sub-nav).
 *
 * Deep-link params (passed transparently to FindScreen and child screens):
 *   ?find=programs|institutions|offerings  — initial sub-tab
 *   ?level=<title>                         — pre-apply degree filter (programs)
 *   ?field=<name>                          — pre-apply field filter (programs)
 *   ?location=<city>                       — pre-apply location filter
 *   ?search=<term>                         — pre-apply search
 *   ?category=<id>                         — pre-apply category filter (offerings)
 */
export { default } from "@/screens/find/FindScreen";
