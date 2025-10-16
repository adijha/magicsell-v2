import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  // Basic health check
  const healthData = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "magicsell-v2",
    version: "1.0.0",
    environment: process.env.APP_ENVIRONMENT_NAME || "unknown",
    node_env: process.env.NODE_ENV || "unknown",
    uptime: process.uptime(),
  };

  return Response.json(healthData, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
