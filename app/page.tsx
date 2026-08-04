import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f6f2] text-[#1f2a24]">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Layout Orchard
          </h1>
          <p className="text-sm text-gray-500">
            Orchard layout management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-white">
            Settings
          </button>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dce5dc] text-sm font-medium">
            JV
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-8 pt-16 pb-20">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-[#66806b]">
            Orchard management
          </p>

          <h2 className="text-5xl font-semibold leading-tight tracking-tight">
            Design your orchard.
            <br />
            <span className="text-[#66806b]">Keep it organised.</span>
          </h2>

          <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
            Create, visualise and manage your orchard layouts in one place.
          </p>

          <div className="mt-8 flex gap-4">
            <Link
              href="/new-project"
              className="rounded-xl bg-[#2f4034] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#243329]"
            >
              + New Project
            </Link>

            <button className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
              Open Layout
            </button>
          </div>
        </div>
      </section>

      {/* Recent layouts */}
      <section className="mx-auto max-w-6xl px-8 pb-20">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold">Recent layouts</h3>
            <p className="mt-1 text-sm text-gray-500">
              Continue working on your orchards.
            </p>
          </div>

          <button className="text-sm font-medium text-[#66806b] hover:underline">
            View all →
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <LayoutCard
            name="Orchard A"
            year="2026"
            details="24 rows · 1,248 trees"
          />

          <LayoutCard
            name="Orchard B"
            year="2026"
            details="31 rows · 1,624 trees"
          />

          <LayoutCard
            name="Orchard C"
            year="2025"
            details="18 rows · 936 trees"
          />
        </div>
      </section>
    </main>
  );
}

function LayoutCard({
  name,
  year,
  details,
}: {
  name: string;
  year: string;
  details: string;
}) {
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-md">
      {/* Preview */}
      <div className="mb-5 flex h-36 items-center justify-center rounded-xl bg-[#eef1eb]">
        <div className="grid grid-cols-8 gap-2">
          {Array.from({ length: 32 }).map((_, index) => (
            <div
              key={index}
              className="h-2 w-2 rounded-full bg-[#66806b]"
            />
          ))}
        </div>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium">{name}</h4>
          <p className="mt-1 text-sm text-gray-500">{year}</p>
        </div>

        <button className="text-sm font-medium text-[#66806b] opacity-0 transition group-hover:opacity-100">
          Open →
        </button>
      </div>

      <p className="mt-4 text-sm text-gray-500">{details}</p>
    </div>
  );
}
