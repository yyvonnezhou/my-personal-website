'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';

// Types
interface QuarterlyData {
  quarter_label: string;
  date: string;
  revenue: number;
  grossProfit: number;
  ebitda: number;
  netIncome: number;
  eps: number;
}

interface CompanyData {
  ticker: string;
  quarterly_data: QuarterlyData[];
  data_summary: {
    earliest_quarter: string;
    latest_quarter: string;
  };
}

interface ChartDataPoint {
  quarter: string;
  yoyGrowth?: number;
  grossMargin?: number;
  ebitdaMargin?: number;
}

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  suffix?: string;
}

interface CompanyDashboardProps {
  ticker: string;
}

// Dynamic color spectrum for ticker assignments (20 distinct colors)
const COLOR_SPECTRUM = [
  '#007aff', // Blue
  '#34a853', // Green
  '#ff9900', // Orange
  '#dc2626', // Red
  '#8b5cf6', // Purple
  '#00d4aa', // Teal
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#76b900', // Lime Green
  '#6366f1', // Indigo
  '#ef4444', // Bright Red
  '#10b981', // Emerald
  '#f97316', // Orange-Red
  '#a855f7', // Violet
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f43f5e', // Rose
  '#8b5a2b', // Brown
  '#6b7280', // Gray
  '#14b8a6', // Teal-Green
];

// Company information mapping without colors (assigned dynamically)
const COMPANIES = {
  META: { name: 'Meta Platforms' },
  GOOGL: { name: 'Alphabet Inc.' },
  AMZN: { name: 'Amazon.com' },
  AAPL: { name: 'Apple Inc.' },
  MSFT: { name: 'Microsoft Corp.' },
  NVDA: { name: 'NVIDIA Corp.' },
  TSLA: { name: 'Tesla Inc.' },
  ADBE: { name: 'Adobe Inc.' },
  AMD: { name: 'Advanced Micro Devices' },
  NFLX: { name: 'Netflix Inc.' },
  COIN: { name: 'Coinbase Global Inc.' },
  ETSY: { name: 'Etsy Inc.' },
  PINS: { name: 'Pinterest Inc.' },
  PLTR: { name: 'Palantir Technologies Inc.' },
  RKT: { name: 'Rocket Companies Inc.' },
  SHOP: { name: 'Shopify Inc.' },
  SNAP: { name: 'Snap Inc.' },
  UBER: { name: 'Uber Technologies Inc.' },
};

// Function to assign colors dynamically to tickers
const getTickerColors = (tickers: string[]) => {
  const colorMap: { [ticker: string]: string } = {};
  tickers.forEach((ticker, index) => {
    colorMap[ticker] = COLOR_SPECTRUM[index % COLOR_SPECTRUM.length];
  });
  return colorMap;
};

// Helper function to format market cap
const formatMarketCap = (marketCap: number): string => {
  // Always show in billions with commas and no decimals
  const billions = Math.round(marketCap / 1e9);
  return `$${billions.toLocaleString()}B`;
};

// Pre-defined ticker groups for different dashboard pages
const TICKER_GROUPS = {
  'Mega Cap Tech': ['AAPL', 'MSFT', 'GOOGL', 'META', 'AMZN', 'NFLX', 'TSLA', 'NVDA'],
  'Advertising': ['GOOGL', 'META', 'PINS', 'SNAP'],
  'All Companies': ['AAPL', 'MSFT', 'GOOGL', 'META', 'AMZN', 'NVDA', 'TSLA', 'NFLX', 'ADBE', 'AMD']
};

// KPI Card Component
const KPICard: React.FC<KPICardProps> = ({ title, value, change, changeType, suffix = '' }) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive': return '↗';
      case 'negative': return '↘';
      default: return '→';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <div className="flex items-baseline justify-between">
        <span className="text-3xl font-bold text-gray-900">{value}{suffix}</span>
        {change && (
          <span className={`text-sm font-medium flex items-center ${getChangeColor()}`}>
            <span className="mr-1">{getChangeIcon()}</span>
            {change}
          </span>
        )}
      </div>
    </div>
  );
};

// Chart Container Component
const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    <div className="h-80">
      {children}
    </div>
  </div>
);

// Company Selector Component
const CompanySelector: React.FC<{
  selectedTicker: string;
  onTickerChange: (ticker: string) => void;
}> = ({ selectedTicker, onTickerChange }) => (
  <div className="mb-8">
    <label htmlFor="company-select" className="block text-sm font-medium text-gray-700 mb-2">
      Select Company
    </label>
    <select
      id="company-select"
      value={selectedTicker}
      onChange={(e) => onTickerChange(e.target.value)}
      className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
    >
      {Object.entries(COMPANIES).map(([ticker, info]) => (
        <option key={ticker} value={ticker}>
          {ticker} - {info.name}
        </option>
      ))}
    </select>
  </div>
);

// Main Company Dashboard Component
const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ ticker }) => {
  const [data, setData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/stock_data/${ticker}_quarterly_data.json`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(`Failed to load data for ${ticker}`);
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [ticker]);

  // Calculate metrics for the last 8 quarters
  const calculateMetrics = (): ChartDataPoint[] => {
    if (!data?.quarterly_data) return [];

    const sortedData = [...data.quarterly_data]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const last5Quarters = sortedData.slice(-5);
    
    return last5Quarters.map((quarter) => {
      const grossMargin = (quarter.grossProfit / quarter.revenue) * 100;
      const ebitdaMargin = (quarter.ebitda / quarter.revenue) * 100;
      
      // Calculate YoY growth (compare to same quarter previous year)
      let yoyGrowth: number | undefined;
      const yearAgoIndex = sortedData.findIndex(q => {
        const currentYear = parseInt(quarter.quarter_label.split('-')[0]);
        const currentQuarter = quarter.quarter_label.split('-')[1];
        const targetLabel = `${currentYear - 1}-${currentQuarter}`;
        return q.quarter_label === targetLabel;
      });
      
      if (yearAgoIndex !== -1) {
        const yearAgoQuarter = sortedData[yearAgoIndex];
        yoyGrowth = ((quarter.revenue - yearAgoQuarter.revenue) / yearAgoQuarter.revenue) * 100;
      }

      return {
        quarter: quarter.quarter_label,
        yoyGrowth,
        grossMargin,
        ebitdaMargin
      };
    });
  };

  // Get current quarter KPIs
  const getCurrentQuarterKPIs = () => {
    if (!data?.quarterly_data || data.quarterly_data.length === 0) {
      return { revenue: '0', grossMargin: '0', ebitdaMargin: '0', eps: '0' };
    }

    const latest = data.quarterly_data[0]; // Latest quarter is first in array
    const previous = data.quarterly_data[1]; // Previous quarter for comparison

    const currentRevenue = (latest.revenue / 1e9).toFixed(1); // Convert to billions
    const currentGrossMargin = ((latest.grossProfit / latest.revenue) * 100).toFixed(1);
    const currentEbitdaMargin = ((latest.ebitda / latest.revenue) * 100).toFixed(1);
    const currentEPS = latest.eps.toFixed(2);

    // Calculate quarter-over-quarter changes
    let revenueChange = '';
    let marginChange = '';
    let epsChange = '';
    let revenueChangeType: 'positive' | 'negative' | 'neutral' = 'neutral';
    let marginChangeType: 'positive' | 'negative' | 'neutral' = 'neutral';
    let epsChangeType: 'positive' | 'negative' | 'neutral' = 'neutral';

    if (previous) {
      const revChange = ((latest.revenue - previous.revenue) / previous.revenue) * 100;
      const prevGrossMargin = (previous.grossProfit / previous.revenue) * 100;
      const marginChangeVal = ((latest.grossProfit / latest.revenue) * 100) - prevGrossMargin;
      const epsChangeVal = ((latest.eps - previous.eps) / previous.eps) * 100;

      revenueChange = `${revChange >= 0 ? '+' : ''}${revChange.toFixed(1)}%`;
      marginChange = `${marginChangeVal >= 0 ? '+' : ''}${marginChangeVal.toFixed(1)}pp`;
      epsChange = `${epsChangeVal >= 0 ? '+' : ''}${epsChangeVal.toFixed(1)}%`;

      revenueChangeType = revChange >= 0 ? 'positive' : 'negative';
      marginChangeType = marginChangeVal >= 0 ? 'positive' : 'negative';
      epsChangeType = epsChangeVal >= 0 ? 'positive' : 'negative';
    }

    return {
      revenue: currentRevenue,
      grossMargin: currentGrossMargin,
      ebitdaMargin: currentEbitdaMargin,
      eps: currentEPS,
      revenueChange,
      marginChange,
      epsChange,
      revenueChangeType,
      marginChangeType,
      epsChangeType
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading {ticker} financial data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  const chartData = calculateMetrics();
  const kpis = getCurrentQuarterKPIs();
  const companyInfo = COMPANIES[ticker as keyof typeof COMPANIES];

  return (
    <div>
      {/* Company Header */}
      <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {ticker} - {companyInfo?.name}
            </h2>
            <p className="text-gray-600 mt-1">
              Latest Quarter: {data?.quarterly_data[0]?.quarter_label} | 
              Data Range: {data?.data_summary.earliest_quarter} to {data?.data_summary.latest_quarter}
            </p>
          </div>
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: getTickerColors([ticker])[ticker] }}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Revenue (Quarterly)"
          value={kpis.revenue}
          suffix="B"
          change={kpis.revenueChange}
          changeType={kpis.revenueChangeType}
        />
        <KPICard
          title="Gross Margin"
          value={kpis.grossMargin}
          suffix="%"
          change={kpis.marginChange}
          changeType={kpis.marginChangeType}
        />
        <KPICard
          title="EBITDA Margin"
          value={kpis.ebitdaMargin}
          suffix="%"
        />
        <KPICard
          title="Earnings Per Share"
          value={kpis.eps}
          suffix=""
          change={kpis.epsChange}
          changeType={kpis.epsChangeType}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* YoY Revenue Growth */}
        <ChartContainer title="YoY Revenue Growth (%)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="quarter" 
                stroke="#666"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#666"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
                formatter={(value) => [`${Number(value).toFixed(1)}%`, 'YoY Growth']}
              />
              <Line
                type="monotone"
                dataKey="yoyGrowth"
                stroke={getTickerColors([ticker])[ticker] || '#2563eb'}
                strokeWidth={3}
                dot={{ fill: getTickerColors([ticker])[ticker] || '#2563eb', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: getTickerColors([ticker])[ticker] || '#2563eb', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Gross Margin */}
        <ChartContainer title="Gross Margin (%)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="quarter" 
                stroke="#666"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#666"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
                formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Gross Margin']}
              />
              <Line
                type="monotone"
                dataKey="grossMargin"
                stroke="#16a34a"
                strokeWidth={3}
                dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#16a34a', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* EBITDA Margin */}
        <ChartContainer title="EBITDA Margin (%)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="quarter" 
                stroke="#666"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#666"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
                formatter={(value) => [`${Number(value).toFixed(1)}%`, 'EBITDA Margin']}
              />
              <Line
                type="monotone"
                dataKey="ebitdaMargin"
                stroke="#dc2626"
                strokeWidth={3}
                dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#dc2626', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

// Multi-Ticker Data Table Component
interface StockPriceData {
  ticker: string;
  price: number;
  changePercent: number;
  change: number;
  marketCap: number | null;
  currency: string;
  lastUpdated: string;
  success: boolean;
  error?: string;
  // Historical data
  t30dChangePercent?: number;
  t30dPrice?: number;
  yesterdayClose?: number;
  // Financial ratios
  marketCapCalculated?: number;
  enterpriseValue?: number;
  sharesOutstanding?: number;
  netDebt?: number;
  // Analyst estimates
  fy2Revenue?: number;
  fy2Ebitda?: number;
  fy2Eps?: number;
  currentFyRevenue?: number;
  lastFyRevenue?: number;
  evFy2Revenue?: number;
  evFy2Ebitda?: number;
  peRatio?: number;
  revenueGrowthPercent?: number;
}

interface StockPricesResponse {
  data: StockPriceData[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    timestamp: string;
  };
}

interface TableRowData {
  ticker: string;
  company: string;
  priceToday: number;
  priceChangeTodayPercent: number;
  t30dPriceChangePercent: number;
  marketCap: string;
  evFy2Revenue: number;
  evFy2Ebitda: number;
  peRatio: number;
  t30dEpsRevision: number | string;
  revenueGrowth2025: number;
  grossMargin: { reported: number; yoy: number };
  ebitdaMargin: { reported: number; yoy: number };
}

const DataTable: React.FC<{ 
  data: TableRowData[], 
  tickerColors: { [ticker: string]: string },
  stockPrices: { [ticker: string]: StockPriceData },
  pricesLoading: boolean
}> = ({ data, tickerColors, stockPrices, pricesLoading }) => {
  const formatChange = (value: number) => {
    const color = value >= 0 ? 'text-green-600' : 'text-red-600';
    const sign = value >= 0 ? '+' : '';
    return <span className={color}>{sign}{value.toFixed(1)}%</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Financial Metrics Overview</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Today</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Change% Today</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">T30D Price Change %</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Cap</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EV / FY2 Revenue</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EV / FY2 EBITDA</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P/E</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">T30D EPS Revision</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">2025 Revenue Growth</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Margin</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EBITDA Margin</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row) => (
              <tr key={row.ticker} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: tickerColors[row.ticker] }}
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{row.ticker}</div>
                      <div className="text-sm text-gray-500">{row.company}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center gap-2">
                    {pricesLoading ? (
                      <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                    ) : stockPrices[row.ticker]?.success ? (
                      `$${row.priceToday.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`
                    ) : (
                      <span className="text-red-500" title="Price data unavailable">
                        ${row.priceToday.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </span>
                    )}
                    {stockPrices[row.ticker]?.success && (
                      <span className="text-xs text-green-500" title="Live price">•</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {pricesLoading ? (
                    <div className="animate-pulse bg-gray-200 h-4 w-12 rounded"></div>
                  ) : (
                    formatChange(row.priceChangeTodayPercent)
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {formatChange(row.t30dPriceChangePercent)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.marketCap}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.evFy2Revenue.toFixed(1)}x
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.evFy2Ebitda.toFixed(1)}x
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.peRatio.toFixed(1)}x
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row.t30dEpsRevision === "n/a" ? "n/a" : formatChange(row.t30dEpsRevision as number)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {formatChange(row.revenueGrowth2025)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex flex-col">
                    <span>{row.grossMargin.reported.toFixed(1)}%</span>
                    <span className={`text-xs ${
                      row.grossMargin.yoy >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {row.grossMargin.yoy >= 0 ? '+' : ''}{row.grossMargin.yoy.toFixed(1)}pp YoY
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex flex-col">
                    <span>{row.ebitdaMargin.reported.toFixed(1)}%</span>
                    <span className={`text-xs ${
                      row.ebitdaMargin.yoy >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {row.ebitdaMargin.yoy >= 0 ? '+' : ''}{row.ebitdaMargin.yoy.toFixed(1)}pp YoY
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Multi-Ticker Dashboard Component
interface MultiTickerDashboardProps {
  tickers: string[];
  groupName: string;
}

const MultiTickerDashboard: React.FC<MultiTickerDashboardProps> = ({ tickers, groupName }) => {
  const [companiesData, setCompaniesData] = useState<{ [ticker: string]: CompanyData }>({});
  const [stockPrices, setStockPrices] = useState<{ [ticker: string]: StockPriceData }>({});
  const [loading, setLoading] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(true);
  
  // Get dynamic color mapping for current tickers
  const tickerColors = getTickerColors(tickers);
  
  // Determine if labels should be shown based on ticker count
  const shouldShowLabels = tickers.length < 7;

  // Function to fetch real-time stock prices
  const fetchStockPrices = async () => {
    setPricesLoading(true);
    try {
      const tickersParam = tickers.join(',');
      const response = await fetch(`/api/stock-prices?tickers=${tickersParam}`);
      
      if (!response.ok) {
        throw new Error(`Stock prices API error: ${response.status}`);
      }
      
      const result: StockPricesResponse = await response.json();
      const pricesMap: { [ticker: string]: StockPriceData } = {};
      
      result.data.forEach(stockData => {
        pricesMap[stockData.ticker] = stockData;
      });
      
      setStockPrices(pricesMap);
      console.log(`Stock prices updated: ${result.summary.successful}/${result.summary.total} successful`);
    } catch (error) {
      console.error('Error fetching stock prices:', error);
    } finally {
      setPricesLoading(false);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      
      // Load quarterly data and stock prices in parallel
      const [quarterlyResults] = await Promise.all([
        // Load quarterly data
        Promise.all(tickers.map(async (ticker) => {
          try {
            const response = await fetch(`/stock_data/${ticker}_quarterly_data.json`);
            if (!response.ok) throw new Error(`Failed to load ${ticker}`);
            const data = await response.json();
            return { ticker, data };
          } catch (error) {
            console.error(`Error loading ${ticker}:`, error);
            return { ticker, data: null };
          }
        })),
        // Load stock prices
        fetchStockPrices()
      ]);

      const newData: { [ticker: string]: CompanyData } = {};
      quarterlyResults.forEach(({ ticker, data }) => {
        if (data) newData[ticker] = data;
      });
      
      setCompaniesData(newData);
      setLoading(false);
    };

    loadAllData();
  }, [tickers]);

  // Generate all possible calendar quarters for a wider range
  const generateAllPossibleCalendarQuarters = () => {
    const quarters = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-based
    
    // Determine current calendar quarter
    let currentCalendarQuarter;
    if (currentMonth < 3) currentCalendarQuarter = 1; // Q1: Jan-Mar
    else if (currentMonth < 6) currentCalendarQuarter = 2; // Q2: Apr-Jun  
    else if (currentMonth < 9) currentCalendarQuarter = 3; // Q3: Jul-Sep
    else currentCalendarQuarter = 4; // Q4: Oct-Dec
    
    // Generate 8 quarters backwards from current (wider range to capture all possible data)
    let year = currentYear;
    let quarter = currentCalendarQuarter;
    
    for (let i = 0; i < 8; i++) {
      quarters.unshift(`${year}-Q${quarter}`);
      quarter--;
      if (quarter < 1) {
        quarter = 4;
        year--;
      }
    }
    
    return quarters;
  };

  // Get calendar quarters that have relevant data (within 1 month tolerance)
  const getValidCalendarQuarters = (companiesData: { [ticker: string]: CompanyData }, tickerFilter: string[]) => {
    const allPossibleQuarters = generateAllPossibleCalendarQuarters();
    
    return allPossibleQuarters.filter(calendarQuarter => {
      const targetDate = getCalendarQuarterEndDate(calendarQuarter);
      
      // Check if any ticker in the current group has data within 1 month of this calendar quarter
      return tickerFilter.some(ticker => {
        const data = companiesData[ticker];
        if (!data?.quarterly_data) return false;
        
        const closestQuarter = findClosestQuarter(data.quarterly_data, targetDate);
        return closestQuarter !== null; // Will be null if beyond 1 month tolerance
      });
    });
  };

  // Legacy function for backward compatibility (now uses filtered quarters)
  const generateCalendarQuarters = () => {
    return getValidCalendarQuarters(companiesData, tickers);
  };

  // Get calendar quarter end dates
  const getCalendarQuarterEndDate = (quarterLabel: string): Date => {
    const [year, q] = quarterLabel.split('-Q');
    const quarter = parseInt(q);
    const yearNum = parseInt(year);
    
    switch (quarter) {
      case 1: return new Date(yearNum, 2, 31); // March 31
      case 2: return new Date(yearNum, 5, 30); // June 30
      case 3: return new Date(yearNum, 8, 30); // September 30
      case 4: return new Date(yearNum, 11, 31); // December 31
      default: throw new Error(`Invalid quarter: ${quarter}`);
    }
  };

  // Find closest company quarter to calendar quarter end date
  const findClosestQuarter = (companyData: QuarterlyData[], targetDate: Date): QuarterlyData | null => {
    if (!companyData || companyData.length === 0) return null;
    
    let closest = companyData[0];
    let minDiff = Math.abs(new Date(closest.date).getTime() - targetDate.getTime());
    
    for (const quarter of companyData) {
      const quarterDate = new Date(quarter.date);
      const diff = Math.abs(quarterDate.getTime() - targetDate.getTime());
      
      if (diff < minDiff) {
        minDiff = diff;
        closest = quarter;
      }
    }
    
    // Only return if within 1 month of target date (strict tolerance for relevant quarters only)
    const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
    return minDiff <= oneMonthMs ? closest : null;
  };

  // Calculate dynamic Y-axis ranges with outlier detection
  const calculateYAxisRanges = (data: any[]) => {
    const yoyValues: number[] = [];
    const grossMarginValues: number[] = [];
    const ebitdaValues: number[] = [];

    data.forEach(point => {
      Object.keys(point).forEach(key => {
        if (key !== 'quarter') {
          const metrics = point[key];
          if (metrics?.yoyGrowth !== undefined) yoyValues.push(metrics.yoyGrowth);
          if (metrics?.grossMargin !== undefined) grossMarginValues.push(metrics.grossMargin);
          if (metrics?.ebitdaMargin !== undefined) ebitdaValues.push(metrics.ebitdaMargin);
        }
      });
    });

    const getOutlierAwareRange = (values: number[], padding = 0.1) => {
      if (values.length === 0) return [0, 100];
      if (values.length <= 2) {
        // Not enough data for outlier detection, use simple range
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        return [
          Math.floor(min - (range * padding)),
          Math.ceil(max + (range * padding))
        ];
      }

      // Sort values for statistical analysis
      const sortedValues = [...values].sort((a, b) => a - b);
      
      // Calculate quartiles
      const q1Index = Math.floor(sortedValues.length * 0.25);
      const q3Index = Math.floor(sortedValues.length * 0.75);
      const q1 = sortedValues[q1Index];
      const q3 = sortedValues[q3Index];
      const iqr = q3 - q1;
      
      // Define outlier thresholds using IQR method
      const lowerFence = q1 - 1.5 * iqr;
      const upperFence = q3 + 1.5 * iqr;
      
      // Filter out extreme outliers for range calculation
      const filteredValues = sortedValues.filter(v => v >= lowerFence && v <= upperFence);
      
      if (filteredValues.length === 0) {
        // If all values are outliers, use the interquartile range
        return [
          Math.floor(q1 - (iqr * padding)),
          Math.ceil(q3 + (iqr * padding))
        ];
      }
      
      // Use filtered values for range, but ensure we capture moderate outliers
      const filteredMin = Math.min(...filteredValues);
      const filteredMax = Math.max(...filteredValues);
      const range = filteredMax - filteredMin;
      
      // Add padding and ensure we don't clip too aggressively
      const paddedMin = filteredMin - (range * padding);
      const paddedMax = filteredMax + (range * padding);
      
      // Make sure range includes at least 80% of data points
      const p10Index = Math.floor(sortedValues.length * 0.1);
      const p90Index = Math.floor(sortedValues.length * 0.9);
      const p10 = sortedValues[p10Index];
      const p90 = sortedValues[p90Index];
      
      const finalMin = Math.min(paddedMin, p10 - (range * 0.05));
      const finalMax = Math.max(paddedMax, p90 + (range * 0.05));
      
      return [Math.floor(finalMin), Math.ceil(finalMax)];
    };

    return {
      yoyGrowth: getOutlierAwareRange(yoyValues, 0.15),
      grossMargin: getOutlierAwareRange(grossMarginValues, 0.1),
      ebitdaMargin: getOutlierAwareRange(ebitdaValues, 0.1)
    };
  };

  // Calculate quarter-over-quarter change for revenue growth
  const calculateQuarterOverQuarterChange = (ticker: string, currentQuarter: string): string => {
    if (!companiesData[ticker]?.quarterly_data) return '';
    
    const validCalendarQuarters = getValidCalendarQuarters(companiesData, tickers);
    const currentQuarterIndex = validCalendarQuarters.indexOf(currentQuarter);
    
    if (currentQuarterIndex <= 0) return ''; // No previous quarter to compare
    
    const previousQuarter = validCalendarQuarters[currentQuarterIndex - 1];
    const currentData = companiesData[ticker];
    
    // Get current quarter data
    const currentTargetDate = getCalendarQuarterEndDate(currentQuarter);
    const currentClosestQuarter = findClosestQuarter(currentData.quarterly_data, currentTargetDate);
    
    // Get previous quarter data
    const previousTargetDate = getCalendarQuarterEndDate(previousQuarter);
    const previousClosestQuarter = findClosestQuarter(currentData.quarterly_data, previousTargetDate);
    
    if (!currentClosestQuarter || !previousClosestQuarter) return '';
    
    // Calculate YoY growth for both quarters
    const [currentYear, currentQuarterNum] = currentQuarter.split('-Q');
    const prevYearQuarter = `${parseInt(currentYear) - 1}-Q${currentQuarterNum}`;
    const prevYearTargetDate = getCalendarQuarterEndDate(prevYearQuarter);
    const prevYearClosestQuarter = findClosestQuarter(currentData.quarterly_data, prevYearTargetDate);
    
    const [previousYear, previousQuarterNum] = previousQuarter.split('-Q');
    const prevYearPreviousQuarter = `${parseInt(previousYear) - 1}-Q${previousQuarterNum}`;
    const prevYearPreviousTargetDate = getCalendarQuarterEndDate(prevYearPreviousQuarter);
    const prevYearPreviousClosestQuarter = findClosestQuarter(currentData.quarterly_data, prevYearPreviousTargetDate);
    
    if (!prevYearClosestQuarter || !prevYearPreviousClosestQuarter) return '';
    
    const currentYoY = ((currentClosestQuarter.revenue - prevYearClosestQuarter.revenue) / prevYearClosestQuarter.revenue) * 100;
    const previousYoY = ((previousClosestQuarter.revenue - prevYearPreviousClosestQuarter.revenue) / prevYearPreviousClosestQuarter.revenue) * 100;
    
    const change = currentYoY - previousYoY;
    if (isNaN(change) || !isFinite(change)) return '';
    
    const sign = change >= 0 ? '+' : '';
    return ` (${sign}${change.toFixed(1)} pt vs Prior Q)`;
  };

  // Calculate year-over-year change for margins
  const calculateYearOverYearChange = (ticker: string, currentQuarter: string, metricType: 'grossMargin' | 'ebitdaMargin'): string => {
    if (!companiesData[ticker]?.quarterly_data) return '';
    
    const currentData = companiesData[ticker];
    
    // Get current quarter data
    const currentTargetDate = getCalendarQuarterEndDate(currentQuarter);
    const currentClosestQuarter = findClosestQuarter(currentData.quarterly_data, currentTargetDate);
    
    if (!currentClosestQuarter) return '';
    
    // Get year-ago quarter data
    const [currentYear, currentQuarterNum] = currentQuarter.split('-Q');
    const yearAgoQuarter = `${parseInt(currentYear) - 1}-Q${currentQuarterNum}`;
    const yearAgoTargetDate = getCalendarQuarterEndDate(yearAgoQuarter);
    const yearAgoClosestQuarter = findClosestQuarter(currentData.quarterly_data, yearAgoTargetDate);
    
    if (!yearAgoClosestQuarter) return '';
    
    // Calculate margins for both quarters
    const currentMargin = metricType === 'grossMargin' 
      ? (currentClosestQuarter.grossProfit / currentClosestQuarter.revenue) * 100
      : (currentClosestQuarter.ebitda / currentClosestQuarter.revenue) * 100;
    
    const yearAgoMargin = metricType === 'grossMargin'
      ? (yearAgoClosestQuarter.grossProfit / yearAgoClosestQuarter.revenue) * 100
      : (yearAgoClosestQuarter.ebitda / yearAgoClosestQuarter.revenue) * 100;
    
    const change = currentMargin - yearAgoMargin;
    if (isNaN(change) || !isFinite(change)) return '';
    
    const sign = change >= 0 ? '+' : '';
    return ` (${sign}${change.toFixed(1)} pt YoY)`;
  };

  // Generate combined chart data aligned to calendar quarters
  const generateCombinedChartData = (tickerFilter: string[] = tickers) => {
    const validCalendarQuarters = getValidCalendarQuarters(companiesData, tickerFilter);
    const tickerMetrics: { [ticker: string]: { [quarter: string]: any } } = {};

    // Process each ticker's data - ONLY for the current group
    tickerFilter.forEach(ticker => {
      const data = companiesData[ticker];
      if (!data?.quarterly_data) return;

      tickerMetrics[ticker] = {};
      
      validCalendarQuarters.forEach((calendarQuarter) => {
        const targetDate = getCalendarQuarterEndDate(calendarQuarter);
        const closestQuarter = findClosestQuarter(data.quarterly_data, targetDate);
        
        if (closestQuarter) {
          const grossMargin = (closestQuarter.grossProfit / closestQuarter.revenue) * 100;
          const ebitdaMargin = (closestQuarter.ebitda / closestQuarter.revenue) * 100;
          
          // Calculate YoY growth - find data from same calendar quarter previous year
          let yoyGrowth: number | undefined;
          const [currentYear, currentQuarterNum] = calendarQuarter.split('-Q');
          const prevYearQuarter = `${parseInt(currentYear) - 1}-Q${currentQuarterNum}`;
          const prevYearTargetDate = getCalendarQuarterEndDate(prevYearQuarter);
          const prevYearClosestQuarter = findClosestQuarter(data.quarterly_data, prevYearTargetDate);
          
          if (prevYearClosestQuarter) {
            yoyGrowth = ((closestQuarter.revenue - prevYearClosestQuarter.revenue) / prevYearClosestQuarter.revenue) * 100;
          }

          tickerMetrics[ticker][calendarQuarter] = {
            yoyGrowth,
            grossMargin,
            ebitdaMargin
          };
        }
      });
    });

    // Convert to chart format - store original values for labels
    const chartPoints = validCalendarQuarters.map(quarter => {
      const dataPoint: any = { quarter };
      tickerFilter.forEach(ticker => {
        const metrics = tickerMetrics[ticker]?.[quarter];
        if (metrics) {
          dataPoint[ticker] = {
            yoyGrowth: metrics.yoyGrowth,
            grossMargin: metrics.grossMargin,
            ebitdaMargin: metrics.ebitdaMargin,
            // Store actual values for tooltips (before capping)
            yoyGrowthActual: metrics.yoyGrowth,
            grossMarginActual: metrics.grossMargin,
            ebitdaMarginActual: metrics.ebitdaMargin
          };
        }
      });
      return dataPoint;
    });

    return chartPoints;
  };

  // Generate table data with real stock prices and quarterly data
  const generateTableData = (): TableRowData[] => {
    const validCalendarQuarters = getValidCalendarQuarters(companiesData, tickers);
    if (validCalendarQuarters.length === 0) {
      // Fallback if no valid quarters found - use real prices if available
      return tickers.map(ticker => {
        const stockPrice = stockPrices[ticker];
        return {
          ticker,
          company: COMPANIES[ticker as keyof typeof COMPANIES]?.name || ticker,
          priceToday: stockPrice?.price || 0,
          priceChangeTodayPercent: stockPrice?.changePercent || 0,
          t30dPriceChangePercent: 0, // Still placeholder for 30-day
          marketCap: stockPrice?.marketCapCalculated ? formatMarketCap(stockPrice.marketCapCalculated) : '$100B',
          evFy2Revenue: stockPrice?.evFy2Revenue || 10.0,
          evFy2Ebitda: stockPrice?.evFy2Ebitda || 25.0,
          peRatio: 30.0,
          t30dEpsRevision: "n/a",
          revenueGrowth2025: 10.0,
          grossMargin: { reported: 50.0, yoy: 0 },
          ebitdaMargin: { reported: 25.0, yoy: 0 }
        };
      });
    }
    
    const latestCalendarQuarter = validCalendarQuarters[validCalendarQuarters.length - 1];
    const latestCalendarQuarterEndDate = getCalendarQuarterEndDate(latestCalendarQuarter);
    
    return tickers.map(ticker => {
      const companyInfo = COMPANIES[ticker as keyof typeof COMPANIES];
      const data = companiesData[ticker];
      const stockPrice = stockPrices[ticker];

      // Use real stock price data when available
      const priceToday = stockPrice?.success ? stockPrice.price : 0;
      const priceChangeTodayPercent = stockPrice?.success ? stockPrice.changePercent : 0;
      const realTimeMarketCap = stockPrice?.marketCapCalculated ? formatMarketCap(stockPrice.marketCapCalculated) : null;
      
      // Use real 30-day price change when available, otherwise placeholder
      const t30dPriceChangePercent = stockPrice?.t30dChangePercent !== undefined 
        ? stockPrice.t30dChangePercent
        : {
            AAPL: 8.5, MSFT: -3.2, GOOGL: 12.1, META: -7.8, AMZN: 5.6,
            NVDA: 18.9, TSLA: -12.3, NFLX: 9.7, ADBE: -2.1, AMD: 15.4
          }[ticker] || 0;

      // Placeholder valuation metrics
      const placeholderEVRevenue: { [key: string]: number } = {
        AAPL: 7.2, MSFT: 12.8, GOOGL: 5.1, META: 6.9, AMZN: 2.8,
        NVDA: 22.4, TSLA: 8.7, NFLX: 4.6, ADBE: 13.2, AMD: 9.1
      };

      const placeholderEVEbitda: { [key: string]: number } = {
        AAPL: 18.5, MSFT: 22.1, GOOGL: 14.2, META: 12.8, AMZN: 24.6,
        NVDA: 45.3, TSLA: 28.9, NFLX: 16.7, ADBE: 31.4, AMD: 19.8
      };

      const placeholderPERatio: { [key: string]: number } = {
        AAPL: 28.4, MSFT: 32.1, GOOGL: 22.8, META: 24.5, AMZN: 45.2,
        NVDA: 67.3, TSLA: 52.1, NFLX: 34.6, ADBE: 41.2, AMD: 29.7
      };

      const placeholderT30dEpsRevision: { [key: string]: number } = {
        AAPL: 2.1, MSFT: -1.2, GOOGL: 3.4, META: -0.8, AMZN: 1.7,
        NVDA: 5.2, TSLA: -3.1, NFLX: 2.8, ADBE: -0.5, AMD: 4.1
      };

      const placeholder2025RevenueGrowth: { [key: string]: number } = {
        AAPL: 5.2, MSFT: 12.8, GOOGL: 8.9, META: 15.6, AMZN: 9.4,
        NVDA: 22.3, TSLA: 18.7, NFLX: 7.1, ADBE: 11.2, AMD: 16.8
      };

      let grossMarginReported = 0, grossMarginYoY = 0;
      let ebitdaMarginReported = 0, ebitdaMarginYoY = 0;

      if (data?.quarterly_data) {
        // Find the closest quarter to the latest calendar quarter end date
        const latestQuarter = findClosestQuarter(data.quarterly_data, latestCalendarQuarterEndDate);
        
        if (latestQuarter) {
          grossMarginReported = (latestQuarter.grossProfit / latestQuarter.revenue) * 100;
          ebitdaMarginReported = (latestQuarter.ebitda / latestQuarter.revenue) * 100;
          
          // Calculate YoY margin changes using calendar quarter logic
          const [currentYear, currentQuarter] = latestCalendarQuarter.split('-Q');
          const prevYearCalendarQuarter = `${parseInt(currentYear) - 1}-Q${currentQuarter}`;
          const prevYearEndDate = getCalendarQuarterEndDate(prevYearCalendarQuarter);
          const prevYearQuarter = findClosestQuarter(data.quarterly_data, prevYearEndDate);
          
          if (prevYearQuarter) {
            const prevYearGrossMargin = (prevYearQuarter.grossProfit / prevYearQuarter.revenue) * 100;
            const prevYearEbitdaMargin = (prevYearQuarter.ebitda / prevYearQuarter.revenue) * 100;
            
            grossMarginYoY = grossMarginReported - prevYearGrossMargin;
            ebitdaMarginYoY = ebitdaMarginReported - prevYearEbitdaMargin;
          }
        }
      } else {
        // Use placeholder values when no data available
        grossMarginReported = ticker === 'AAPL' ? 46.2 : ticker === 'MSFT' ? 68.4 : ticker === 'GOOGL' ? 57.1 : ticker === 'META' ? 81.5 : ticker === 'AMZN' ? 48.9 : ticker === 'NVDA' ? 78.2 : ticker === 'TSLA' ? 19.8 : ticker === 'NFLX' ? 45.6 : ticker === 'ADBE' ? 85.7 : 52.3;
        ebitdaMarginReported = ticker === 'AAPL' ? 32.1 : ticker === 'MSFT' ? 42.8 : ticker === 'GOOGL' ? 28.9 : ticker === 'META' ? 35.4 : ticker === 'AMZN' ? 14.7 : ticker === 'NVDA' ? 52.6 : ticker === 'TSLA' ? 8.2 : ticker === 'NFLX' ? 23.1 : ticker === 'ADBE' ? 38.9 : 25.4;
        
        // Placeholder YoY changes
        grossMarginYoY = (Math.random() - 0.5) * 6; // Random between -3 and +3 percentage points
        ebitdaMarginYoY = (Math.random() - 0.5) * 8; // Random between -4 and +4 percentage points
      }

      return {
        ticker,
        company: companyInfo?.name || ticker,
        priceToday,
        priceChangeTodayPercent,
        t30dPriceChangePercent,
        marketCap: realTimeMarketCap || '$100B',
        evFy2Revenue: stockPrice?.evFy2Revenue || placeholderEVRevenue[ticker] || 10.0,
        evFy2Ebitda: stockPrice?.evFy2Ebitda || placeholderEVEbitda[ticker] || 25.0,
        peRatio: stockPrice?.peRatio || placeholderPERatio[ticker] || 30.0,
        t30dEpsRevision: "n/a",
        revenueGrowth2025: stockPrice?.revenueGrowthPercent || placeholder2025RevenueGrowth[ticker] || 10.0,
        grossMargin: {
          reported: grossMarginReported,
          yoy: grossMarginYoY
        },
        ebitdaMargin: {
          reported: ebitdaMarginReported,
          yoy: ebitdaMarginYoY
        }
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading {groupName} data...</div>
      </div>
    );
  }

  // Sort tickers by latest quarterly YoY revenue growth (highest to lowest)
  const getSortedTickers = () => {
    if (!companiesData || Object.keys(companiesData).length === 0) {
      return tickers; // Return original order if no data yet
    }

    const validCalendarQuarters = getValidCalendarQuarters(companiesData, tickers);
    if (validCalendarQuarters.length === 0) {
      return tickers; // Return original order if no valid quarters
    }

    const tickerGrowthData: { ticker: string; yoyGrowth: number }[] = [];
    
    tickers.forEach(ticker => {
      const data = companiesData[ticker];
      if (data?.quarterly_data) {
        const latestCalendarQuarter = validCalendarQuarters[validCalendarQuarters.length - 1];
        const latestCalendarQuarterEndDate = getCalendarQuarterEndDate(latestCalendarQuarter);
        
        // Find the closest quarter to the latest calendar quarter end date
        const latestQuarter = findClosestQuarter(data.quarterly_data, latestCalendarQuarterEndDate);
        
        if (latestQuarter) {
          // Calculate YoY growth using calendar quarter logic
          const [currentYear, currentQuarter] = latestCalendarQuarter.split('-Q');
          const prevYearCalendarQuarter = `${parseInt(currentYear) - 1}-Q${currentQuarter}`;
          const prevYearEndDate = getCalendarQuarterEndDate(prevYearCalendarQuarter);
          const prevYearQuarter = findClosestQuarter(data.quarterly_data, prevYearEndDate);
          
          let yoyGrowth = 0;
          if (prevYearQuarter) {
            yoyGrowth = ((latestQuarter.revenue - prevYearQuarter.revenue) / prevYearQuarter.revenue) * 100;
          }
          
          tickerGrowthData.push({ ticker, yoyGrowth });
        } else {
          tickerGrowthData.push({ ticker, yoyGrowth: 0 });
        }
      } else {
        tickerGrowthData.push({ ticker, yoyGrowth: 0 });
        }
    });

    // Sort by YoY growth (highest to lowest)
    return tickerGrowthData
      .sort((a, b) => b.yoyGrowth - a.yoyGrowth)
      .map(item => item.ticker);
  };

  // Only sort tickers when we have data, otherwise use original order
  const sortedTickers = companiesData && Object.keys(companiesData).length > 0 
    ? getSortedTickers() 
    : tickers;
  
  // Debug: Log the sorting results
  console.log('Original tickers:', tickers);
  console.log('Companies data loaded:', !!companiesData && Object.keys(companiesData).length > 0);
  console.log('Sorted tickers by YoY growth:', sortedTickers);
  
  // Generate chart data using SORTED tickers instead of original order
  const rawChartData = generateCombinedChartData(sortedTickers);
  const yAxisRanges = calculateYAxisRanges(rawChartData);
  
  // Create single data structure with both actual and capped values
  const chartData = rawChartData.map(point => {
    const combinedPoint = { ...point };
    Object.keys(point).forEach(key => {
      if (key !== 'quarter') {
        const metrics = point[key];
        if (metrics) {
          combinedPoint[key] = {
            // Actual values for labels
            yoyGrowthActual: metrics.yoyGrowth,
            grossMarginActual: metrics.grossMargin,
            ebitdaMarginActual: metrics.ebitdaMargin,
            // Capped values for chart positioning
            yoyGrowth: metrics.yoyGrowth ? Math.max(yAxisRanges.yoyGrowth[0], Math.min(yAxisRanges.yoyGrowth[1], metrics.yoyGrowth)) : metrics.yoyGrowth,
            grossMargin: metrics.grossMargin, // Don't cap gross margin as it rarely has extreme outliers
            ebitdaMargin: metrics.ebitdaMargin ? Math.max(yAxisRanges.ebitdaMargin[0], Math.min(yAxisRanges.ebitdaMargin[1], metrics.ebitdaMargin)) : metrics.ebitdaMargin
          };
        }
      }
    });
    return combinedPoint;
  });
  
  const tableData = generateTableData();
  
  // Re-sort table data to match chart order
  const sortedTableData = sortedTickers.map(ticker => {
    const tableRow = tableData.find(row => row.ticker === ticker);
    return tableRow || tableData[0]; // Fallback if not found
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{groupName} Dashboard</h2>
            <p className="text-gray-600">
              Comparative analysis for: {tickers.join(', ')}
            </p>
            {Object.keys(stockPrices).length > 0 && (
              <p className="text-sm text-green-600 mt-1">
                ✓ Live prices updated: {new Date(Object.values(stockPrices)[0]?.lastUpdated).toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={fetchStockPrices}
            disabled={pricesLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              pricesLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {pricesLoading ? 'Updating...' : 'Refresh Prices'}
          </button>
        </div>
      </div>

      {/* Combined Charts */}
      <div className="space-y-8">
        {/* YoY Revenue Growth Chart */}
        <ChartContainer title="YoY Revenue Growth (%)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData}
              margin={{ top: 60, right: 20, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="quarter" 
                stroke="#666" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#666" 
                tick={{ fontSize: 12 }}
                width={50}
                tickFormatter={(value) => `${value}%`}
                domain={yAxisRanges.yoyGrowth}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', zIndex: 1000 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  
                  // Get the quarter label
                  const quarter = String(label);
                  
                  // Create a map of ticker to value for this quarter
                  const tickerValues: { [ticker: string]: number } = {};
                  payload.forEach(item => {
                    if (item.dataKey && typeof item.dataKey === 'string') {
                      const ticker = item.dataKey.split('.')[0]; // Extract ticker from "TICKER.yoyGrowth"
                      const value = item.value;
                      if (value !== undefined) {
                        tickerValues[ticker] = Number(value);
                      }
                    }
                  });
                  
                  // Sort tickers by their values (highest to lowest) for this quarter
                  const sortedTickersForQuarter = Object.entries(tickerValues)
                    .sort(([, a], [, b]) => (b || 0) - (a || 0))
                    .map(([ticker]) => ticker);
                  
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                      <div className="font-semibold text-gray-900 mb-3">{quarter}</div>
                      <div className="space-y-2">
                        {sortedTickersForQuarter.map(ticker => {
                          const value = tickerValues[ticker];
                          const tickerColor = tickerColors[ticker];
                          const actualValue = chartData.find(point => point.quarter === quarter)?.[ticker]?.yoyGrowthActual;
                          
                          return (
                            <div key={ticker} className="flex items-center justify-between min-w-[200px]">
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: tickerColor }}
                                />
                                <span className="text-sm font-medium text-gray-700">{ticker}</span>
                              </div>
                              <span className="text-sm text-gray-900 ml-8 text-right">
                                {actualValue !== undefined ? `${actualValue.toFixed(1)}%` : `${value?.toFixed(1)}%`}
                                {quarter ? calculateQuarterOverQuarterChange(ticker, quarter) : ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
              />
              <Legend 
                verticalAlign="top"
                height={50}
                iconType="line"
                wrapperStyle={{ paddingBottom: '20px', paddingTop: '10px' }}
                content={({ payload }) => (
                  <div className="flex flex-wrap justify-center gap-4 mb-4">
                    {sortedTickers.map(ticker => {
                      const tickerColor = tickerColors[ticker];
                      return (
                        <div key={ticker} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tickerColor }}
                          />
                          <span className="text-sm text-gray-700">{ticker}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              />
              {sortedTickers.map((ticker, index) => {
                const tickerColor = tickerColors[ticker];
                
                return (
                  <Line
                    key={`${ticker}_yoyGrowth`}
                    type="monotone"
                    dataKey={`${ticker}.yoyGrowth`}
                    name={ticker}
                    stroke={tickerColor}
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    connectNulls={false}
                  >
                    {shouldShowLabels && (
                      <LabelList 
                        dataKey={`${ticker}.yoyGrowthActual`}
                        position="top"
                        style={{ fontSize: '10px', fill: tickerColor }}
                        formatter={(value: any) => {
                          if (!value && value !== 0) return '';
                          return `${Number(value).toFixed(0)}%`;
                        }}
                      />
                    )}
                  </Line>
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Gross Margin Chart */}
        <ChartContainer title="Gross Margin (%)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData}
              margin={{ top: 80, right: 20, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="quarter" 
                stroke="#666" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#666" 
                tick={{ fontSize: 12 }}
                width={50}
                tickFormatter={(value) => `${value}%`}
                domain={yAxisRanges.grossMargin}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', zIndex: 1000 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  
                  const quarter = String(label);
                  const tickerValues: { [ticker: string]: number } = {};
                  payload.forEach(item => {
                    if (item.dataKey && typeof item.dataKey === 'string') {
                      const ticker = item.dataKey.split('.')[0];
                      const value = item.value;
                      if (value !== undefined) {
                        tickerValues[ticker] = Number(value);
                      }
                    }
                  });
                  
                  const sortedTickersForQuarter = Object.entries(tickerValues)
                    .sort(([, a], [, b]) => (b || 0) - (a || 0))
                    .map(([ticker]) => ticker);
                  
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                      <div className="font-semibold text-gray-900 mb-3">{quarter}</div>
                      <div className="space-y-2">
                        {sortedTickersForQuarter.map(ticker => {
                          const value = tickerValues[ticker];
                          const tickerColor = tickerColors[ticker];
                          const actualValue = chartData.find(point => point.quarter === quarter)?.[ticker]?.grossMarginActual;
                          
                          return (
                            <div key={ticker} className="flex items-center justify-between min-w-[200px]">
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: tickerColor }}
                                />
                                <span className="text-sm font-medium text-gray-700">{ticker}</span>
                              </div>
                              <span className="text-sm text-gray-900 ml-8 text-right">
                                {actualValue !== undefined ? `${actualValue.toFixed(1)}%` : `${value?.toFixed(1)}%`}
                                {calculateYearOverYearChange(ticker, quarter, 'grossMargin')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
              />
              <Legend 
                verticalAlign="top"
                height={36}
                iconType="line"
                wrapperStyle={{ paddingBottom: '10px' }}
              />
              {sortedTickers.map((ticker, index) => {
                const tickerColor = tickerColors[ticker];
                
                return (
                  <Line
                    key={`${ticker}_grossMargin`}
                    type="monotone"
                    dataKey={`${ticker}.grossMargin`}
                    name={ticker}
                    stroke={tickerColor}
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    connectNulls={false}
                  >
                    {shouldShowLabels && (
                      <LabelList 
                        dataKey={`${ticker}.grossMarginActual`}
                        position="top"
                        style={{ fontSize: '10px', fill: tickerColor }}
                        formatter={(value: any) => {
                          if (!value && value !== 0) return '';
                          return `${Number(value).toFixed(0)}%`;
                        }}
                      />
                    )}
                  </Line>
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* EBITDA Margin Chart */}
        <ChartContainer title="EBITDA Margin (%)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData}
              margin={{ top: 80, right: 20, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="quarter" 
                stroke="#666" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#666" 
                tick={{ fontSize: 12 }}
                width={50}
                tickFormatter={(value) => `${value}%`}
                domain={yAxisRanges.ebitdaMargin}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', zIndex: 1000 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  
                  const quarter = String(label);
                  const tickerValues: { [ticker: string]: number } = {};
                  payload.forEach(item => {
                    if (item.dataKey && typeof item.dataKey === 'string') {
                      const ticker = item.dataKey.split('.')[0];
                      const value = item.value;
                      if (value !== undefined) {
                        tickerValues[ticker] = Number(value);
                      }
                    }
                  });
                  
                  const sortedTickersForQuarter = Object.entries(tickerValues)
                    .sort(([, a], [, b]) => (b || 0) - (a || 0))
                    .map(([ticker]) => ticker);
                  
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                      <div className="font-semibold text-gray-900 mb-3">{quarter}</div>
                      <div className="space-y-2">
                        {sortedTickersForQuarter.map(ticker => {
                          const value = tickerValues[ticker];
                          const tickerColor = tickerColors[ticker];
                          const actualValue = chartData.find(point => point.quarter === quarter)?.[ticker]?.ebitdaMarginActual;
                          
                          return (
                            <div key={ticker} className="flex items-center justify-between min-w-[200px]">
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-sm font-medium text-gray-700">{ticker}</span>
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: tickerColor }}
                                />
                              </div>
                              <span className="text-sm text-gray-900 ml-8 text-right">
                                {actualValue !== undefined ? `${actualValue.toFixed(1)}%` : `${value?.toFixed(1)}%`}
                                {calculateYearOverYearChange(ticker, quarter, 'ebitdaMargin')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
              />
              <Legend 
                verticalAlign="top"
                height={36}
                iconType="line"
                wrapperStyle={{ paddingBottom: '10px' }}
              />
              {sortedTickers.map((ticker, index) => {
                const tickerColor = tickerColors[ticker];
                
                return (
                  <Line
                    key={`${ticker}_ebitdaMargin`}
                    type="monotone"
                    dataKey={`${ticker}.ebitdaMargin`}
                    name={ticker}
                    stroke={tickerColor}
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    connectNulls={false}
                  >
                    {shouldShowLabels && (
                      <LabelList 
                        dataKey={`${ticker}.ebitdaMarginActual`}
                        position="top"
                        style={{ fontSize: '10px', fill: tickerColor }}
                        formatter={(value: any) => {
                          if (!value && value !== 0) return '';
                          return `${Number(value).toFixed(0)}%`;
                        }}
                      />
                    )}
                  </Line>
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Data Table */}
      <DataTable 
        data={sortedTableData} 
        tickerColors={tickerColors} 
        stockPrices={stockPrices}
        pricesLoading={pricesLoading}
      />
    </div>
  );
};

// Main Dashboard with Group Selection
export default function MultiCompanyFinancialDashboard() {
  const searchParams = useSearchParams();
  const groupParam = searchParams.get('group');
  
  const groupMapping: { [key: string]: string } = {
    'mega-cap-tech': 'Mega Cap Tech',
    'advertising': 'Advertising',
    'all-companies': 'All Companies'
  };
  
  // Get selected group from URL params, default to 'Mega Cap Tech'
  const selectedGroup = (groupParam && groupMapping[groupParam]) ? groupMapping[groupParam] : 'Mega Cap Tech';

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Dashboard</h1>
          <p className="text-gray-600">
            Multi-company comparative financial analysis
          </p>
        </div>


        {/* Multi-Ticker Dashboard */}
        <MultiTickerDashboard 
          tickers={TICKER_GROUPS[selectedGroup as keyof typeof TICKER_GROUPS]} 
          groupName={selectedGroup}
        />
      </div>
    </div>
  );
}