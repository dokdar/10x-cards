import { test as setup } from "@playwright/test";

// Global setup project (placeholder)
// Using project dependencies to enable global teardown after tests with proper reporting.
setup("setup: initialize test environment (noop)", async () => {
  // Optionally seed DB or verify env, kept minimal per request.
});
