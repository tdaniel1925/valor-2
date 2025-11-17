export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Valor Financial Specialists
          </h1>
          <h2 className="text-2xl text-gray-600 mb-8">
            Insurance Back Office Platform
          </h2>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 text-left">
            <p className="text-lg text-gray-700 leading-relaxed">
              Welcome to the unified insurance back office platform. This system consolidates
              multiple third-party systems into a single, intuitive interface for agents,
              managers, and executives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
              <h3 className="text-xl font-semibold mb-2">Single Sign-On</h3>
              <p className="text-blue-100">Access all integrated systems with one login</p>
            </div>
            <div className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl text-white">
              <h3 className="text-xl font-semibold mb-2">Real-Time Analytics</h3>
              <p className="text-indigo-100">Track production and performance metrics</p>
            </div>
            <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white">
              <h3 className="text-xl font-semibold mb-2">Streamlined Workflows</h3>
              <p className="text-purple-100">Reduce administrative time by 40%</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/auth/login"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started
            </a>
            <a
              href="/about"
              className="px-8 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Learn More
            </a>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Running on Next.js 16 • Port 3006 • TypeScript • Tailwind CSS
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
