/**
 * Setup page for theme extension
 */

import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getAppClientId } from "../services/theme-extension.server";
import { ThemeExtensionSetup } from "../components/ThemeExtensionSetup";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);

  const clientId = getAppClientId();

  // Check if extension is enabled (simplified check)
  let initialEnabled = false;
  try {
    const response = await admin.graphql(`
      query {
        appInstallation {
          id
          launchUrl
        }
      }
    `);
    const data = await response.json();
    initialEnabled = !!data.data?.appInstallation;
  } catch (error) {
    console.error("Error checking extension status:", error);
  }

  return {
    shop: session.shop,
    clientId,
    initialEnabled,
  };
};

export default function SetupPage() {
  const { shop, clientId, initialEnabled } = useLoaderData<typeof loader>();

  return (
    <s-page heading="App Setup">
      <s-section heading="Welcome to MagicSell!">
        <s-paragraph>
          Enable the theme extension to start displaying upsell and cross-sell offers on your storefront.
        </s-paragraph>
        <s-paragraph>
          Once enabled, you can create offers from the Offers page and customize their appearance.
        </s-paragraph>
      </s-section>

      <ThemeExtensionSetup
        shop={shop}
        clientId={clientId}
        initialEnabled={initialEnabled}
      />

      <s-section slot="aside" heading="Quick Start Guide">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            <s-text>1. Enable the theme extension using the button above</s-text>
          </s-paragraph>
          <s-paragraph>
            <s-text>2. Create your first offer from the Offers page</s-text>
          </s-paragraph>
          <s-paragraph>
            <s-text>3. Customize the appearance in Settings</s-text>
          </s-paragraph>
          <s-paragraph>
            <s-text>4. Monitor performance in Analytics</s-text>
          </s-paragraph>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Need Help?">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            <s-link
              href="https://github.com/adijha/magicsell-v2/blob/main/docs/EXTENSIONS.md"
              target="_blank"
            >
              Extension Documentation
            </s-link>
          </s-paragraph>
          <s-paragraph>
            <s-link
              href="https://shopify.dev/docs/apps/build/online-store/theme-app-extensions"
              target="_blank"
            >
              Shopify Theme Extensions Guide
            </s-link>
          </s-paragraph>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
