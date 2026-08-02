import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import { getRouter } from "@/router";

const router = getRouter();
router.update({ defaultSsr: false });

function SpaRoot() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    router
      .load({ href: window.location.href })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root element for static SPA bootstrap.");
}

createRoot(root).render(
  <StrictMode>
    <SpaRoot />
  </StrictMode>,
);
