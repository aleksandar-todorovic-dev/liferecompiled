const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

export const getAppOrigin = () => {
  const configuredOrigin = trimTrailingSlash(import.meta.env.VITE_APP_URL);
  if (configuredOrigin) return configuredOrigin;

  return trimTrailingSlash(window.location.origin);
};

export const getAuthContinueUrl = () => `${getAppOrigin()}/login`;

// Future custom email-action handler URL for Admin SDK/custom callback flows.
export const getAuthActionUrl = () => `${getAppOrigin()}/auth/action`;

export const getEmailVerificationActionSettings = () => ({
  url: getAuthContinueUrl(),
});

export const getPasswordResetActionSettings = () => ({
  url: getAuthContinueUrl(),
});
