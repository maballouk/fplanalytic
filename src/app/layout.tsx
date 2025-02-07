import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FPL Analytics Dashboard',
  description: 'Advanced Fantasy Premier League analytics and player recommendations',
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
  themeColor: '#37003c',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="bg-premier-league-purple shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <nav className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-white text-xl font-bold">FPL Analytics</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-premier-league-green text-sm">
                    Powered by Official FPL API
                  </span>
                </div>
              </nav>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-grow">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-gray-800 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                  <p className="text-sm text-gray-300">
                    Data updates twice daily from the official Fantasy Premier League API
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-300">
                    © {new Date().getFullYear()} FPL Analytics
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}