/**
 * API route to check if theme extension is enabled
 *
 * According to Shopify docs, app embed blocks appear in settings_data.json
 * https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration#detecting-app-embed-blocks
 */

import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin, session } = await authenticate.admin(request);

    // Step 1: Get the published theme ID
    const themesResponse = await admin.graphql(`
      #graphql
      query {
        themes(first: 1, roles: [MAIN]) {
          nodes {
            id
            name
            role
          }
        }
      }
    `);

    const themesData = await themesResponse.json();
    const themes = themesData.data?.themes?.nodes;

    if (!themes || themes.length === 0) {
      return {
        enabled: false,
        error: "No published theme found",
      };
    }

    const themeId = themes[0].id.split("/").pop(); // Extract numeric ID from gid

    // Step 2: Fetch settings_data.json using Asset REST API
    // This is the proper way to check if app embed is enabled according to Shopify docs
    const settingsAssetUrl = `https://${session.shop}/admin/api/2024-10/themes/${themeId}/assets.json?asset[key]=config/settings_data.json`;

    const assetResponse = await fetch(settingsAssetUrl, {
      headers: {
        "X-Shopify-Access-Token": session.accessToken!,
        "Content-Type": "application/json",
      },
    });

    if (!assetResponse.ok) {
      console.error("Failed to fetch theme asset:", assetResponse.statusText);
      return {
        enabled: false,
        error: "Failed to fetch theme configuration",
      };
    }

    const assetData = await assetResponse.json();
    const settingsData = JSON.parse(assetData.asset.value);

    // Step 3: Check if app embed block exists and is enabled
    // According to Shopify docs, app embed blocks appear in settings_data.json
    // with format: "type": "shopify://apps/<app_name>/blocks/<block_name>/<unique_ID>"
    // Note: Block type format is shopify://apps/{app-handle}/blocks/app-embed/{uid}
    // The app-handle is a slug version of the app name, not the client ID
    const blocks = settingsData?.current?.blocks || {};

    // Look for our app embed block
    // We'll check for blocks that contain "/blocks/app-embed/" and are from our app
    let appEmbedFound = false;
    let isEnabled = false;

    for (const blockId in blocks) {
      const block = blocks[blockId];
      const blockType = block.type || "";

      // Check if this is an app-embed block
      // For production apps, you should verify it's specifically YOUR app by checking:
      // - The extension UID matches your config
      // - The app handle matches your app name
      if (blockType.includes("/blocks/app-embed/")) {
        // Additional verification: check if it contains "magicsell" to ensure it's our app
        const isOurApp = blockType.toLowerCase().includes("magicsell");

        if (isOurApp) {
          appEmbedFound = true;

          // If disabled property doesn't exist or is false, the block is enabled
          // If disabled is true, the block is disabled
          isEnabled = block.disabled !== true;

          // If we found an enabled block, we can break
          if (isEnabled) {
            break;
          }
        }
      }
    }

    return {
      enabled: appEmbedFound && isEnabled,
      message: appEmbedFound
        ? isEnabled
          ? "Extension is enabled"
          : "Extension is installed but disabled"
        : "Extension not found in theme",
      themeId,
      themeName: themes[0].name,
    };
  } catch (error: any) {
    console.error("Error checking extension status:", error);

    return {
      enabled: false,
      error: error.message || "Failed to check status",
    };
  }
};
