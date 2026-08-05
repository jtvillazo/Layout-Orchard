export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f5f6f2] px-6 text-center text-[#1f2a24]">
      <h1 className="text-xl font-semibold">You&apos;re offline</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-600">
        This page isn&apos;t cached yet. Open SAF Layout while online first,
        then try again.
      </p>
      <a
        href="/"
        className="mt-6 rounded-xl bg-[#2f4034] px-5 py-3 text-sm font-medium text-white"
      >
        Back to Home
      </a>
    </main>
  );
}
