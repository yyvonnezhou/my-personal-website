import Link from 'next/link'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Navigation
            </h3>
            <div className="mt-4 space-y-2">
              <Link href="/" className="block text-sm text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link href="/about" className="block text-sm text-gray-600 hover:text-gray-900">
                About
              </Link>
              <Link href="/blog" className="block text-sm text-gray-600 hover:text-gray-900">
                Blog
              </Link>
              <Link href="/dashboard" className="block text-sm text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Connect
            </h3>
            <div className="mt-4 space-y-2">
              <a
                href="https://linkedin.com/in/your-profile"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-gray-600 hover:text-gray-900"
              >
                LinkedIn
              </a>
              <a
                href="https://github.com/your-username"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-gray-600 hover:text-gray-900"
              >
                GitHub
              </a>
              <a
                href="mailto:your.email@example.com"
                className="block text-sm text-gray-600 hover:text-gray-900"
              >
                Email
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              About This Site
            </h3>
            <p className="mt-4 text-sm text-gray-600">
              Built with Next.js and Tailwind CSS. Hosted on Vercel.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            © {currentYear} Your Name. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer