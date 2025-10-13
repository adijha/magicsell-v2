export default function TestTailwind() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Tailwind v4 Works! 🎉
        </h1>
        <p className="text-gray-600 mb-6">
          All utility classes are working perfectly with the new CSS-first configuration.
        </p>
        <div className="flex gap-4">
          <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Primary
          </button>
          <button className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors">
            Secondary
          </button>
        </div>
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">
            ✅ Tailwind CSS v4 is configured with PostCSS
          </p>
        </div>
      </div>
    </div>
  );
}
