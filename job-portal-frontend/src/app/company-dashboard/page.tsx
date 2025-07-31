'use client'

export default function CompanyDashboard() {
  return (
    <main className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Company Dashboard</h1>
          <p className="text-gray-400">Manage your company profile and job postings</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Active Jobs</h3>
            <p className="text-3xl font-bold text-yellow-400">12</p>
            <p className="text-sm text-gray-400">Currently posted</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Applications</h3>
            <p className="text-3xl font-bold text-blue-400">47</p>
            <p className="text-sm text-gray-400">This month</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Interviews</h3>
            <p className="text-3xl font-bold text-green-400">8</p>
            <p className="text-sm text-gray-400">Scheduled</p>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-gray-300">New application for Senior Developer</span>
              <span className="text-sm text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-gray-300">Job posting approved: Frontend Developer</span>
              <span className="text-sm text-gray-400">1 day ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-300">Interview scheduled with John Doe</span>
              <span className="text-sm text-gray-400">2 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
