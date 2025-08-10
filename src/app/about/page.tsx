import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn more about my background, experience, and interests.',
}

export default function About() {
  return (
    <div className="bg-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Me</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A passionate financial analyst and developer combining traditional finance with modern technology.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Background</h2>
              <p className="text-gray-600 mb-4">
                Welcome! I'm a financial analyst with a passion for leveraging technology to make sense of complex financial data. 
                My journey began in traditional finance, but I quickly realized the power of combining analytical skills with 
                programming to create more efficient and insightful analysis tools.
              </p>
              <p className="text-gray-600">
                Currently, I work on building data-driven solutions that help investors and analysts make more informed decisions. 
                I believe that the intersection of finance and technology holds incredible potential for innovation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Experience</h2>
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-6">
                  <h3 className="text-lg font-semibold text-gray-900">Financial Analyst</h3>
                  <p className="text-blue-600 mb-2">Current Position • [Company Name]</p>
                  <p className="text-gray-600">
                    Conducting comprehensive financial analysis, building financial models, and creating 
                    data visualization tools to support investment decisions.
                  </p>
                </div>
                
                <div className="border-l-4 border-gray-300 pl-6">
                  <h3 className="text-lg font-semibold text-gray-900">Previous Role</h3>
                  <p className="text-gray-500 mb-2">[Previous Company] • [Date Range]</p>
                  <p className="text-gray-600">
                    Brief description of your previous role and key achievements.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Education</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900">Degree in Finance/Economics/Business</h3>
                <p className="text-blue-600 mb-2">University Name • Graduation Year</p>
                <p className="text-gray-600">
                  Relevant coursework, honors, or special projects you completed during your studies.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What Drives Me</h2>
              <p className="text-gray-600 mb-4">
                I'm fascinated by the stories that financial data tells and how technology can help us uncover 
                insights that might otherwise remain hidden. Whether it's analyzing SEC filings, tracking market 
                trends, or building interactive dashboards, I love turning complex data into actionable insights.
              </p>
              <p className="text-gray-600">
                When I'm not analyzing markets or coding, you can find me [add your hobbies/interests here - 
                reading financial news, hiking, playing chess, etc.].
              </p>
            </section>
          </div>

          <div className="space-y-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Tools</h3>
              
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Financial Analysis</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Financial Modeling</li>
                  <li>• Valuation Analysis</li>
                  <li>• Risk Assessment</li>
                  <li>• Market Research</li>
                </ul>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Technical Skills</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Python/R for Data Analysis</li>
                  <li>• SQL & Databases</li>
                  <li>• Excel/VBA</li>
                  <li>• JavaScript/React</li>
                  <li>• Data Visualization</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Certifications</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• CFA (if applicable)</li>
                  <li>• FRM (if applicable)</li>
                  <li>• Other relevant certifications</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Let's Connect</h3>
              <p className="text-gray-600 mb-4">
                I'm always interested in discussing financial markets, new technologies, or potential collaborations.
              </p>
              <div className="space-y-2">
                <a
                  href="mailto:your.email@example.com"
                  className="flex items-center text-blue-600 hover:text-blue-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Email Me
                </a>
                <a
                  href="https://linkedin.com/in/your-profile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                  </svg>
                  LinkedIn
                </a>
                <a
                  href="/resume.pdf"
                  target="_blank"
                  className="flex items-center text-blue-600 hover:text-blue-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Resume
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}