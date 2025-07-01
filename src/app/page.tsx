import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <div className="absolute top-4 right-4">
      </div>
      <h1 className="text-4xl font-bold mb-8">AI Calendar Project</h1>
      <Link href="/task" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
        Go to Calendar
      </Link>
    </main>
  );
} 