import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // eslint-disable-next-line no-undef
  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    // eslint-disable-next-line no-undef
    environment: process.env.APP_ENVIRONMENT_NAME || "DEV",
  };
};

export default function App() {
  const { apiKey, environment } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Offers</s-link>
        <s-link href="/app/analytics">Analytics</s-link>
        <s-link href="/app/customization">Customization</s-link>
        <s-link href="/app/setup">Setup</s-link>
        <s-link href="/app/settings">Settings</s-link>
      </s-app-nav>
      {/* Environment Indicator */}
      {environment && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          padding: '8px 16px',
          background: '#f0f0f0',
          border: '2px solid #333',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '14px',
          zIndex: 9999,
          fontFamily: 'monospace'
        }}>
          ENV: {environment}
        </div>
      )}
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
