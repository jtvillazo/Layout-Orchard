import { Suspense } from "react";

import { TestGridClient } from "./TestGridClient";

export default function TestGridPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-gray-500">Loading layout...</p>
        </main>
      }
    >
      <TestGridClient />
    </Suspense>
  );
}
