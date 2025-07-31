export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">BD Jobs Portal</h1>
        <div className="space-y-4">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl text-white mb-4">Navigation Test</h2>
            <div className="space-y-2">
              <p className="text-gray-300">✅ Home page is working</p>
              <p className="text-gray-300">Try these routes:</p>
              <ul className="space-y-1 ml-4">
                <li className="text-blue-400">• <a href="/dashboard" className="hover:underline">/dashboard</a></li>
                <li className="text-blue-400">• <a href="/test" className="hover:underline">/test</a></li>
                <li className="text-blue-400">• <a href="/company-dashboard" className="hover:underline">/company-dashboard</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
