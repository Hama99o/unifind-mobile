/**
 * Newsletter API — Node backend (no auth required).
 * POST /newsletter/subscribe { email } → { success: boolean; message: string }
 */

import { nodeApi } from "@/api/nodeApi";

export interface NewsletterSubscribeResponse {
  success: boolean;
  message: string;
}

/**
 * Subscribe an email address to the UniFind newsletter.
 * Uses the Node API (no Auth0 token required — public endpoint).
 */
export async function subscribeNewsletter(
  email: string
): Promise<NewsletterSubscribeResponse> {
  const response = await nodeApi.post<NewsletterSubscribeResponse>(
    "/newsletter/subscribe",
    { email }
  );
  return response.data;
}
