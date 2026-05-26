"use server";

import { logEvent } from "./logger";
import { classifyError } from "./classify-error";

export async function logClientError(
  message: string,
  digest: string | undefined,
  path: string,
): Promise<void> {
  const category = classifyError(new Error(message), path);
  await logEvent({
    category,
    level: "error",
    message: (message || "Client-side error").slice(0, 500),
    details: digest ? { digest } : undefined,
    path: path || undefined,
  });
}
