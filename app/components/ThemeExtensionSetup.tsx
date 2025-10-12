/**
 * Theme Extension Setup Component
 * Provides UI for enabling theme extension with deeplink and status checking
 */

import { useEffect, useState } from "react";
import { useFetcher } from "react-router";

interface ThemeExtensionSetupProps {
  shop: string;
  clientId: string;
  initialEnabled?: boolean;
}

export function ThemeExtensionSetup({
  shop,
  clientId,
  initialEnabled = false,
}: ThemeExtensionSetupProps) {
  const [deepLink, setDeepLink] = useState<string>("");
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetcher = useFetcher();

  useEffect(() => {
    if (shop && clientId) {
      // Generate deeplink with activateAppId to auto-enable the app embed
      // Format according to Shopify docs: {api_key}/{app_embed_handle}
      // The handle is the filename of the app-embed.liquid file (without .liquid)
      const activateAppId = `${clientId}/app-embed`;
      const url = `https://${shop}/admin/themes/current/editor?context=apps&activateAppId=${activateAppId}`;
      setDeepLink(url);
    }
  }, [shop, clientId]);

  // Update status when fetcher returns
  useEffect(() => {
    if (fetcher.state === "idle") {
      if (fetcher.data) {
        console.log("Fetcher data received:", fetcher.data);

        if (fetcher.data.error) {
          setError(fetcher.data.error);
        } else if (fetcher.data.enabled !== undefined) {
          setIsEnabled(fetcher.data.enabled);
          setError(null);
        }
      }
      setIsChecking(false);
    }
  }, [fetcher.state, fetcher.data]);

  const checkExtensionStatus = () => {
    setIsChecking(true);
    setError(null);
    console.log("Checking extension status...");
    // Call the loader to check extension status
    fetcher.load("/app/setup/check-status");
  };

  const handleEnableClick = () => {
    // Open theme editor to enable extension
    window.open(deepLink, "_blank");
  };

  if (!clientId) {
    return (
      <s-section heading="Theme Extension Setup">
        <s-banner tone="warning">
          <s-text>
            App configuration is missing. Please ensure your app is properly deployed.
          </s-text>
        </s-banner>
      </s-section>
    );
  }

  return (
    <s-section heading="Theme Extension">
      <s-stack direction="block" gap="base">
        {/* Error Banner */}
        {error && (
          <s-banner tone="critical">
            <s-text>{error}</s-text>
          </s-banner>
        )}

        {/* Status Banner */}
        {isEnabled ? (
          <s-banner tone="success">
            <s-stack direction="block" gap="tight">
              <s-text size="large" weight="bold">
                ✓ Theme Extension is Enabled
              </s-text>
              <s-text>
                Your MagicSell extension is active on your storefront. Customers can now see your upsell and cross-sell offers!
              </s-text>
            </s-stack>
          </s-banner>
        ) : (
          <s-banner tone="info">
            <s-stack direction="block" gap="tight">
              <s-text size="large" weight="bold">
                Theme Extension Not Enabled
              </s-text>
              <s-text>
                Enable the MagicSell extension in your theme editor to start displaying offers to your customers.
              </s-text>
            </s-stack>
          </s-banner>
        )}

        {/* Action Buttons */}
        <s-stack direction="inline" gap="base">
          {!isEnabled && (
            <s-button
              onClick={handleEnableClick}
              variant="primary"
              size="large"
            >
              Enable Now
            </s-button>
          )}

          <s-button
            onClick={checkExtensionStatus}
            variant={isEnabled ? "secondary" : "plain"}
            loading={isChecking}
          >
            {isChecking ? "Checking..." : "Check Status"}
          </s-button>

          {isEnabled && (
            <s-button
              onClick={() => {
                const themeUrl = `https://${shop}/admin/themes/current/editor?context=apps`;
                window.open(themeUrl, "_blank");
              }}
              variant="secondary"
            >
              Open Theme Editor
            </s-button>
          )}
        </s-stack>

        {/* Instructions */}
        {!isEnabled && (
          <s-section heading="How to Enable">
            <s-ordered-list>
              <s-list-item>
                Click the Enable Now button above
              </s-list-item>
              <s-list-item>
                The theme editor will open with MagicSell pre-selected in the App embeds section
              </s-list-item>
              <s-list-item>
                Toggle the switch to ON
              </s-list-item>
              <s-list-item>
                Click Save in the top right corner
              </s-list-item>
              <s-list-item>
                Return here and click Check Status to verify
              </s-list-item>
            </s-ordered-list>
          </s-section>
        )}

        {/* Extension Info */}
        <s-section heading="Extension Details">
          <s-stack direction="block" gap="base">
            <s-paragraph>
              <s-text weight="bold">Store: </s-text>
              <s-text>{shop}</s-text>
            </s-paragraph>
            <s-paragraph>
              <s-text weight="bold">Extension Type: </s-text>
              <s-text>Theme App Embed</s-text>
            </s-paragraph>
            <s-paragraph>
              <s-text weight="bold">Status: </s-text>
              <s-text tone={isEnabled ? "success" : "subdued"}>
                {isEnabled ? "Active" : "Inactive"}
              </s-text>
            </s-paragraph>
          </s-stack>
        </s-section>

        {/* Features Info */}
        {isEnabled && (
          <s-banner tone="success">
            <s-stack direction="block" gap="tight">
              <s-text weight="bold">
                What you can do now:
              </s-text>
              <s-unordered-list>
                <s-list-item>
                  Create upsell and cross-sell offers
                </s-list-item>
                <s-list-item>
                  Display product recommendations on your storefront
                </s-list-item>
                <s-list-item>
                  Customize the appearance in the theme editor
                </s-list-item>
                <s-list-item>
                  Track performance in Analytics
                </s-list-item>
              </s-unordered-list>
            </s-stack>
          </s-banner>
        )}
      </s-stack>
    </s-section>
  );
}
