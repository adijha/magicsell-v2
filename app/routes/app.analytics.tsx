/**
 * Analytics Page
 * View performance metrics and insights
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

export default function AnalyticsPage() {
  const { shop } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Analytics">
      {/* Overview Stats */}
      <s-section heading="Performance Overview">
        <s-grid columns="4">
          <s-card>
            <s-stack direction="block" gap="tight">
              <s-text>Total Revenue</s-text>
              <s-text>$0.00</s-text>
              <s-text>From upsells & cross-sells</s-text>
            </s-stack>
          </s-card>

          <s-card>
            <s-stack direction="block" gap="tight">
              <s-text>Conversion Rate</s-text>
              <s-text>0%</s-text>
              <s-text>Offer acceptance rate</s-text>
            </s-stack>
          </s-card>

          <s-card>
            <s-stack direction="block" gap="tight">
              <s-text>Avg Order Value</s-text>
              <s-text>$0.00</s-text>
              <s-text>Impact on AOV</s-text>
            </s-stack>
          </s-card>

          <s-card>
            <s-stack direction="block" gap="tight">
              <s-text>Total Orders</s-text>
              <s-text>0</s-text>
              <s-text>With accepted offers</s-text>
            </s-stack>
          </s-card>
        </s-grid>
      </s-section>

      {/* Chart Placeholder */}
      <s-section heading="Revenue Trend">
        <s-card>
          <s-stack direction="block" gap="base">
            <s-banner tone="info">
              <s-text>Analytics charts coming soon!</s-text>
            </s-banner>
            <s-paragraph>
              Track your upsell and cross-sell performance over time with detailed charts and insights.
            </s-paragraph>
          </s-stack>
        </s-card>
      </s-section>

      {/* Top Offers */}
      <s-section heading="Top Performing Offers">
        <s-card>
          <s-stack direction="block" gap="base">
            <s-text>No data available yet</s-text>
            <s-paragraph>
              Create offers to start tracking performance metrics.
            </s-paragraph>
          </s-stack>
        </s-card>
      </s-section>

      {/* Sidebar */}
      <s-section slot="aside" heading="Time Period">
        <s-stack direction="block" gap="base">
          <s-text>Last 7 days</s-text>
          <s-text>Last 30 days</s-text>
          <s-text>Last 90 days</s-text>
          <s-text>Custom range</s-text>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Metrics">
        <s-unordered-list>
          <s-list-item>Impressions</s-list-item>
          <s-list-item>Click-through rate</s-list-item>
          <s-list-item>Conversion rate</s-list-item>
          <s-list-item>Revenue generated</s-list-item>
          <s-list-item>Average order value</s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
