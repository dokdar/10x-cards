import { useEffect, useState } from "react";

export type PkceParams = {
  code?: string;
  errorCode?: string;
  errorDescription?: string;
};

/**
 * Reads PKCE-related params from the current URL's query string.
 * Returns stable values after initial mount.
 */
export function usePkceParams(): PkceParams {
  const [values, setValues] = useState<PkceParams>({});

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code") || undefined;
      const errorCode = params.get("error_code") || undefined;
      const rawError = params.get("error_description") || undefined;
      const errorDescription = rawError ? rawError.replace(/\+/g, " ") : undefined;
      setValues({ code, errorCode, errorDescription });
    } catch {
      setValues({});
    }
  }, []);

  return values;
}
