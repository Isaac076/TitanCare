import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-gradient-to-br from-teal-400 to-cyan-500">
      <h1 className="text-4xl font-bold">TitanCare</h1>

      <p className="text-gray-500">
        Digital implant patient portal
      </p>

      <div className="flex gap-4">
        <Link
          href="/register"
          className="px-4 py-2 rounded bg-black text-white"
        >
          Register Patient
        </Link>
      </div>
    </main>
  )
}