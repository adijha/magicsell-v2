import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  return Response.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "magicsell-v2",
      environment: process.env.APP_ENVIRONMENT_NAME || "unknown",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }
  );
}
