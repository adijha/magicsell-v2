/**
 * Customization Page
 * Customize the appearance and behavior of offers
 */

import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  return {
    shop: session.shop,
  };
};

export default function CustomizationPage() {
  const { shop } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Customization">
      <s-section heading="Design Settings">
        <s-card>
          <s-stack direction="block" gap="base">
            <s-text>Customize how your offers look on the storefront</s-text>

            <s-banner tone="info">
              <s-text>Customization tools coming soon!</s-text>
            </s-banner>

            <s-paragraph>
              Soon you will be able to customize colors, fonts, button styles, and animations
              to match your store brand.
            </s-paragraph>
          </s-stack>
        </s-card>
      </s-section>

      <s-section heading="Color Scheme">
        <s-card>
          <s-stack direction="block" gap="base">
            <s-text>Primary Color</s-text>
            <s-text>Secondary Color</s-text>
            <s-text>Accent Color</s-text>
            <s-text>Text Color</s-text>
          </s-stack>
        </s-card>
      </s-section>

      <s-section heading="Typography">
        <s-card>
          <s-stack direction="block" gap="base">
            <s-text>Font Family</s-text>
            <s-text>Font Size</s-text>
            <s-text>Font Weight</s-text>
            <s-text>Line Height</s-text>
          </s-stack>
        </s-card>
      </s-section>

      <s-section heading="Layout Options">
        <s-card>
          <s-stack direction="block" gap="base">
            <s-text>Offer Position</s-text>
            <s-unordered-list>
              <s-list-item>Above product description</s-list-item>
              <s-list-item>Below product description</s-list-item>
              <s-list-item>Sidebar</s-list-item>
              <s-list-item>Modal popup</s-list-item>
            </s-unordered-list>
          </s-stack>
        </s-card>
      </s-section>

      {/* Sidebar */}
      <s-section slot="aside" heading="Preview">
        <s-card>
          <s-stack direction="block" gap="base">
            <s-text>Live Preview</s-text>
            <s-paragraph>
              See how your customizations look on your storefront in real-time.
            </s-paragraph>
          </s-stack>
        </s-card>
      </s-section>

      <s-section slot="aside" heading="Presets">
        <s-stack direction="block" gap="base">
          <s-text>Default Theme</s-text>
          <s-text>Minimal</s-text>
          <s-text>Bold</s-text>
          <s-text>Elegant</s-text>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
