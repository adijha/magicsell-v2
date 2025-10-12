/**
 * Theme Extension Service
 * Handles theme extension deeplinks and configuration
 */

export interface ThemeEditorDeepLinkParams {
  shop: string;
  themeId?: string; // Optional, defaults to "current"
  template?: string; // e.g., "product", "collection", "index"
  blockHandle?: string; // Block handle (filename without .liquid)
}

export interface AppBlockDeepLinkParams {
  shop: string;
  themeId?: string;
  template?: string;
  blockHandle: string; // Required: The liquid filename without .liquid extension
  target?: string; // Where to add: "newAppsSection", "mainSection", etc.
}

/**
 * Generate a deeplink to the theme editor with the app embed auto-enabled
 *
 * For app embeds (app-embed.liquid), use blockHandle="app-embed"
 *
 * @param params - Parameters for the deeplink
 * @returns The full theme editor URL
 *
 * @example
 * const url = generateThemeEditorDeepLink({
 *   shop: "my-store.myshopify.com",
 *   template: "product",
 *   blockHandle: "app-embed"
 * });
 */
export function generateThemeEditorDeepLink(
  params: ThemeEditorDeepLinkParams
): string {
  const { shop, themeId = "current", template, blockHandle = "app-embed" } = params;

  // Base URL for theme editor
  const baseUrl = `https://${shop}/admin/themes/${themeId}/editor`;

  // Build query parameters
  const queryParams = new URLSearchParams();

  // Add template if specified
  if (template) {
    queryParams.append("template", template);
  }

  // Add context to show app embeds section
  queryParams.append("context", "apps");

  // Add activateAppId to auto-enable the app embed
  // Format according to Shopify docs: {api_key}/{app_embed_handle}
  // The handle is the filename of the liquid file without .liquid extension
  const clientId = getAppClientId();
  if (clientId && blockHandle) {
    queryParams.append("activateAppId", `${clientId}/${blockHandle}`);
  }

  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Generate a direct link to App Embeds section
 * This is the most reliable way to enable theme extensions for the first time
 */
export function generateAppEmbedsDeepLink(shop: string, themeId: string = "current"): string {
  return `https://${shop}/admin/themes/${themeId}/editor?context=apps&category=app%20embeds`;
}

/**
 * Generate a deeplink to add an app block to a specific section
 * This is used for adding blocks like star_rating.liquid to specific templates
 *
 * @param params - Parameters for the deeplink
 * @returns The full theme editor URL with add block parameters
 *
 * @example
 * // Add star_rating block to product page
 * const url = generateAddAppBlockDeepLink({
 *   shop: "my-store.myshopify.com",
 *   template: "product",
 *   blockHandle: "star_rating",
 *   target: "mainSection"
 * });
 */
export function generateAddAppBlockDeepLink(
  params: AppBlockDeepLinkParams
): string {
  const {
    shop,
    themeId = "current",
    template = "product",
    blockHandle,
    target = "newAppsSection"
  } = params;

  const clientId = getAppClientId();
  if (!clientId) {
    throw new Error("App client ID is required to generate add app block deeplink");
  }

  const baseUrl = `https://${shop}/admin/themes/${themeId}/editor`;

  // Format: {api_key}/{block_handle}
  const addAppBlockId = `${clientId}/${blockHandle}`;

  const queryParams = new URLSearchParams({
    template,
    addAppBlockId,
    target, // Options: "newAppsSection", "mainSection", "sectionGroup:header", etc.
  });

  return `${baseUrl}?${queryParams.toString()}`;
}

/**
 * Get the extension UID from environment variables
 * This UID is app-specific (different for staging vs production)
 */
export function getThemeExtensionUid(): string | undefined {
  return process.env.THEME_EXTENSION_UID;
}

/**
 * Get the app's client ID (API key) from environment variables
 */
export function getAppClientId(): string | undefined {
  return process.env.SHOPIFY_API_KEY;
}

/**
 * Generate the activateAppId parameter value
 * Format: {client_id}/{extension_uid}
 */
export function getActivateAppId(): string | undefined {
  const clientId = getAppClientId();
  const extensionUid = getThemeExtensionUid();

  if (!clientId || !extensionUid) {
    return undefined;
  }

  return `${clientId}/${extensionUid}`;
}

/**
 * Check if theme extension is configured
 */
export function isThemeExtensionConfigured(): boolean {
  return !!process.env.THEME_EXTENSION_UID;
}

/**
 * Generate a complete setup guide URL with all necessary parameters
 * This enables the app-embed block (app embeds section)
 */
export function generateSetupGuideUrl(shop: string): string {
  return generateThemeEditorDeepLink({
    shop,
    blockHandle: "app-embed", // The app-embed.liquid file
  });
}

/**
 * Generate URL to add star rating block to product pages
 */
export function generateStarRatingBlockUrl(shop: string): string {
  return generateAddAppBlockDeepLink({
    shop,
    template: "product",
    blockHandle: "star_rating",
    target: "mainSection",
  });
}
