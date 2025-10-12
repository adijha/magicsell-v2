/**
 * Main Offers Page - Home/Dashboard
 * Create and manage upsell and cross-sell offers
 */

import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  return {
    shop: session.shop,
  };
};

export default function OffersPage() {
  const { shop } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <s-page heading="Offers">
      {/* Header Actions */}
      <s-button
        slot="actions"
        variant="primary"
        onClick={() => {
          // TODO: Navigate to create offer page
          alert("Create offer functionality coming soon!");
        }}
      >
        Create Offer
      </s-button>

      {/* Stats Overview */}
      <s-section>
        <s-grid columns="3">
          <s-card>
            <s-stack direction="block" gap="tight">
              <s-text>Total Offers</s-text>
              <s-text>0</s-text>
              <s-text>Active offers ready to display</s-text>
            </s-stack>
          </s-card>

          <s-card>
            <s-stack direction="block" gap="tight">
              <s-text>This Month</s-text>
              <s-text>$0.00</s-text>
              <s-text>Revenue from upsells</s-text>
            </s-stack>
          </s-card>

          <s-card>
            <s-stack direction="block" gap="tight">
              <s-text>Conversion Rate</s-text>
              <s-text>0%</s-text>
              <s-text>Offer acceptance rate</s-text>
            </s-stack>
          </s-card>
        </s-grid>
      </s-section>

      {/* Getting Started / Empty State */}
      <s-section>
        <s-banner tone="info">
          <s-stack direction="block" gap="base">
            <s-text>Get started with MagicSell</s-text>
            <s-paragraph>
              Create your first upsell or cross-sell offer to start increasing your average order value.
              Our intelligent recommendation engine will help you show the right products to the right customers.
            </s-paragraph>
            <s-stack direction="inline" gap="base">
              <s-button
                variant="primary"
                onClick={() => {
                  alert("Create offer functionality coming soon!");
                }}
              >
                Create Your First Offer
              </s-button>
              <s-button
                variant="secondary"
                onClick={() => navigate("/app/setup")}
              >
                Setup Theme Extension
              </s-button>
            </s-stack>
          </s-stack>
        </s-banner>
      </s-section>

      {/* Offers List (Empty State) */}
      <s-section heading="Your Offers">
        <s-card>
          <s-stack direction="block" gap="base">
            <s-text>No offers created yet</s-text>
            <s-paragraph>
              Create your first offer to start displaying upsells and cross-sells to your customers.
            </s-paragraph>
            <s-button
              variant="primary"
              onClick={() => {
                alert("Create offer functionality coming soon!");
              }}
            >
              Create Offer
            </s-button>
          </s-stack>
        </s-card>
      </s-section>

      {/* Quick Tips Sidebar */}
      <s-section slot="aside" heading="Offer Types">
        <s-stack direction="block" gap="base">
          <s-card>
            <s-stack direction="block" gap="tight">
              <s-text>Upsell Offers</s-text>
              <s-paragraph>
                Encourage customers to purchase a higher-value version of the product they are viewing.
              </s-paragraph>
            </s-stack>
          </s-card>

          <s-card>
            <s-stack direction="block" gap="tight">
              <s-text>Cross-sell Offers</s-text>
              <s-paragraph>
                Recommend complementary products that pair well with items in the cart.
              </s-paragraph>
            </s-stack>
          </s-card>

          <s-card>
            <s-stack direction="block" gap="tight">
              <s-text>Bundle Offers</s-text>
              <s-paragraph>
                Create product bundles with special pricing to increase order value.
              </s-paragraph>
            </s-stack>
          </s-card>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Best Practices">
        <s-unordered-list>
          <s-list-item>
            Keep offers relevant to the product being viewed
          </s-list-item>
          <s-list-item>
            Use high-quality product images
          </s-list-item>
          <s-list-item>
            Test different offer positions
          </s-list-item>
          <s-list-item>
            Monitor performance in Analytics
          </s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
