'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

const Navigation = () => {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDashboardOpen, setIsDashboardOpen] = useState(false)
  const dashboardTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleDashboardMouseEnter = () => {
    if (dashboardTimeoutRef.current) {
      clearTimeout(dashboardTimeoutRef.current)
    }
    setIsDashboardOpen(true)
  }

  const handleDashboardMouseLeave = () => {
    dashboardTimeoutRef.current = setTimeout(() => {
      setIsDashboardOpen(false)
    }, 150) // 150ms delay
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dashboardTimeoutRef.current) {
        clearTimeout(dashboardTimeoutRef.current)
      }
    }
  }, [])

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { 
      name: 'Dashboard', 
      href: '/dashboard',
      dropdown: [
        { name: 'Mega Cap Tech', href: '/dashboard?group=mega-cap-tech' },
        { name: 'Advertising', href: '/dashboard?group=advertising' },
        { name: 'All Companies', href: '/dashboard?group=all-companies' }
      ]
    },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">Your Name</h1>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <div key={item.name} className="relative">
                {item.dropdown ? (
                  <div
                    className="relative"
                    onMouseEnter={handleDashboardMouseEnter}
                    onMouseLeave={handleDashboardMouseLeave}
                  >
                    <Link
                      href={item.href}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center ${
                        pathname.startsWith('/dashboard')
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {item.name}
                      <svg
                        className="ml-1 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </Link>
                    
                    {/* Dropdown Menu */}
                    {isDashboardOpen && (
                      <div className="absolute top-full left-0 mt-0 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                        {item.dropdown.map((dropdownItem) => (
                          <Link
                            key={dropdownItem.name}
                            href={dropdownItem.href}
                            className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          >
                            {dropdownItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      pathname === item.href
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="space-y-1">
              {navigation.map((item) => (
                <div key={item.name}>
                  {item.dropdown ? (
                    <>
                      <div
                        className={`block px-3 py-2 text-sm font-medium rounded-md ${
                          pathname.startsWith('/dashboard')
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-gray-600'
                        }`}
                      >
                        {item.name}
                      </div>
                      <div className="pl-4 space-y-1">
                        {item.dropdown.map((dropdownItem) => (
                          <Link
                            key={dropdownItem.name}
                            href={dropdownItem.href}
                            className="block px-3 py-1 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {dropdownItem.name}
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className={`block px-3 py-2 text-sm font-medium rounded-md ${
                        pathname === item.href
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navigation