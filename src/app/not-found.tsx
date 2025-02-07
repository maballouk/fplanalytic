export const generateViewport = () => {
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#37003c',
  }
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-premier-league-purple mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">The page you are looking for does not exist.</p>
        <a
          href="/"
          className="inline-block bg-premier-league-purple text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors"
        >
          Return Home
        </a>
      </div>
    </div>
  )
}