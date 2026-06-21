/**
 * strapiQuery — shared Strapi query helpers.
 *
 * Extracted here so institutionsApi and programsApiTypes (and any future api)
 * use ONE copy rather than a byte-identical private function in each file.
 *
 * M2 fix: institutionsApi.ts had a private copy; now both import from here.
 */

/**
 * Recursively build Strapi populate query params.
 * Mirrors the web API.service.tsx addPopulate helper.
 */
export function addPopulate(
  params: URLSearchParams,
  prefix: string,
  val:
    | string[]
    | { fields?: string[]; populate?: Record<string, unknown> }
): void {
  if (Array.isArray(val)) {
    val.forEach((field, i) =>
      params.append(`populate[${prefix}][fields][${i}]`, field)
    );
  } else {
    if (val.fields) {
      val.fields.forEach((field: string, i: number) =>
        params.append(`populate[${prefix}][fields][${i}]`, field)
      );
    }
    if (val.populate) {
      Object.entries(val.populate).forEach(([subKey, subVal]) => {
        addPopulate(
          params,
          `${prefix}][populate][${subKey}`,
          subVal as
            | string[]
            | { fields?: string[]; populate?: Record<string, unknown> }
        );
      });
    }
  }
}
