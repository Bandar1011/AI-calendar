"use client"

export default function AuthCodeError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-lg p-6 text-center">
        <h1 className="text-2xl font-bold text-red-400 mb-4">Authentication Error</h1>
        <p className="text-gray-300 mb-6">
          There was an issue with the authentication process. This might be because:
        </p>
        <ul className="text-left text-gray-400 mb-6 space-y-2">
          <li>• Supabase environment variables are not configured</li>
          <li>• Google OAuth is not properly configured in Supabase</li>
          <li>• The redirect URL doesn't match</li>
          <li>• There was a temporary issue with the service</li>
        </ul>
        <div className="text-left text-sm text-gray-500 mb-4 p-3 bg-gray-800 rounded">
          <p className="font-semibold mb-2">To enable authentication:</p>
          <p>1. Create a Supabase project</p>
          <p>2. Set environment variables:</p>
          <p className="ml-3 font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</p>
          <p className="ml-3 font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
          <p>3. Configure Google OAuth in Supabase</p>
        </div>
        <div className="space-y-3">
          <a 
            href="/" 
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
          >
            Go Back Home
          </a>
          <button 
            onClick={() => window.location.reload()} 
            className="block w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
} 