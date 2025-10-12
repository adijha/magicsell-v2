/**
 * Settings Page
 * Configure app settings and preferences
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

export default function SettingsPage() {
  const { shop } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Settings">
      <s-section heading="General Settings">
        <s-card>
          <s-stack direction="block" gap="base">
            <s-text>Store: {shop}</s-text>
            <s-paragraph>
              Configure your MagicSell settings and preferences.
            </s-paragraph>

            <s-banner tone="info">
              <s-text>Settings functionality coming soon!</s-text>
            </s-banner>
          </s-stack>
        </s-card>
      </s-section>

      <s-section heading="Display Settings">
        <s-card>
          <s-stack direction="block" gap="base">
            <s-text>Customize how offers appear on your storefront</s-text>
            <s-unordered-list>
              <s-list-item>Choose offer position (above/below product)</s-list-item>
              <s-list-item>Set default styles and colors</s-list-item>
              <s-list-item>Configure animation effects</s-list-item>
              <s-list-item>Adjust mobile responsiveness</s-list-item>
            </s-unordered-list>
          </s-stack>
        </s-card>
      </s-section>

      <s-section heading="Notification Settings">
        <s-card>
          <s-stack direction="block" gap="base">
            <s-text>Manage email notifications</s-text>
            <s-unordered-list>
              <s-list-item>Low performing offers</s-list-item>
              <s-list-item>Weekly performance reports</s-list-item>
              <s-list-item>New feature announcements</s-list-item>
            </s-unordered-list>
          </s-stack>
        </s-card>
      </s-section>

      <s-section slot="aside" heading="Quick Links">
        <s-stack direction="block" gap="base">
          <s-card>
            <s-text>Documentation</s-text>
            <s-paragraph>Learn how to get the most out of MagicSell</s-paragraph>
          </s-card>
          <s-card>
            <s-text>Support</s-text>
            <s-paragraph>Get help from our support team</s-paragraph>
          </s-card>
          <s-card>
            <s-text>Feature Requests</s-text>
            <s-paragraph>Suggest new features</s-paragraph>
          </s-card>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
