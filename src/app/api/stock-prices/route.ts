import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface YahooFinanceResponse {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number;
        regularMarketChangePercent: number;
        regularMarketChange: number;
        marketCap?: number;
        currency: string;
        symbol: string;
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          close: number[];
          volume: number[];
        }>;
      };
    }>;
    error?: {
      code: string;
      description: string;
    };
  };
}

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

// Helper function to get shares outstanding from quarterly data
async function getSharesOutstanding(ticker: string): Promise<number | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'stock_data', `${ticker}_quarterly_data.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Get the latest quarter data (first item in array)
    if (data.quarterly_data && data.quarterly_data.length > 0) {
      const latestQuarter = data.quarterly_data[0];
      return latestQuarter.weightedAverageShsOutDil || null;
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to read shares outstanding for ${ticker}:`, error);
    return null;
  }
}

// Helper function to get net debt from balance sheet data
async function getNetDebt(ticker: string): Promise<number | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'balance_sheet_data', `${ticker}_balance_sheet_quarter.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Get the latest quarter data (first item in array)
    if (data && data.length > 0) {
      const latestQuarter = data[0];
      return latestQuarter.netDebt || null;
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to read net debt for ${ticker}:`, error);
    return null;
  }
}

// Helper function to get analyst estimates
async function getAnalystEstimates(ticker: string) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'analyst_estimates_data', `${ticker}_analyst_estimates.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (!data || data.length === 0) return null;
    
    // Group estimates by fiscal year date and pick the most recent fetch for each FY
    const fyGroups: { [fyDate: string]: typeof data } = {};
    
    data.forEach((estimate: { date: string; fetch_timestamp: string }) => {
      const fyDate = estimate.date;
      if (!fyGroups[fyDate]) {
        fyGroups[fyDate] = [];
      }
      fyGroups[fyDate].push(estimate);
    });
    
    // For each fiscal year, get the estimate with the most recent fetch_timestamp
    const latestEstimatesByFY: { [fyDate: string]: any } = {};
    Object.keys(fyGroups).forEach(fyDate => {
      const estimates = fyGroups[fyDate];
      const latestEstimate = estimates.sort((a: { fetch_timestamp: string }, b: { fetch_timestamp: string }) => 
        new Date(b.fetch_timestamp).getTime() - new Date(a.fetch_timestamp).getTime()
      )[0];
      latestEstimatesByFY[fyDate] = latestEstimate;
    });
    
    // Sort fiscal years by date
    const sortedFYDates = Object.keys(latestEstimatesByFY).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
    
    const today = new Date();
    
    // Find current fiscal year: most recent fiscal year end date that is after today
    let currentFYData = null;
    let nextFYData = null;
    
    for (const fyDate of sortedFYDates) {
      const fyEndDate = new Date(fyDate);
      if (fyEndDate > today) {
        if (!currentFYData) {
          currentFYData = latestEstimatesByFY[fyDate]; // First FY end date after today = current FY
        } else if (!nextFYData) {
          nextFYData = latestEstimatesByFY[fyDate]; // Second FY end date after today = next FY (FY2)
          break;
        }
      }
    }
    
    // Use next fiscal year (FY2) data
    const fy2Data = nextFYData || latestEstimatesByFY[sortedFYDates[sortedFYDates.length - 1]]; // fallback to latest FY
    
    return {
      fy2Revenue: fy2Data?.revenueAvg || null,
      fy2Ebitda: fy2Data?.ebitdaAvg || null,
      fy2Eps: fy2Data?.epsAvg || null,
    };
  } catch (error) {
    console.warn(`Failed to read analyst estimates for ${ticker}:`, error);
    return null;
  }
}

// Helper function to get revenue growth data from analyst estimates
async function getRevenueGrowthData(ticker: string) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'analyst_estimates_data', `${ticker}_analyst_estimates.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (!data || data.length === 0) return null;
    
    // Group estimates by fiscal year date and pick the most recent fetch for each FY
    const fyGroups: { [fyDate: string]: typeof data } = {};
    
    data.forEach((estimate: { date: string; fetch_timestamp: string }) => {
      const fyDate = estimate.date;
      if (!fyGroups[fyDate]) {
        fyGroups[fyDate] = [];
      }
      fyGroups[fyDate].push(estimate);
    });
    
    // For each fiscal year, get the estimate with the most recent fetch_timestamp
    const latestEstimatesByFY: { [fyDate: string]: any } = {};
    Object.keys(fyGroups).forEach(fyDate => {
      const estimates = fyGroups[fyDate];
      const latestEstimate = estimates.sort((a: { fetch_timestamp: string }, b: { fetch_timestamp: string }) => 
        new Date(b.fetch_timestamp).getTime() - new Date(a.fetch_timestamp).getTime()
      )[0];
      latestEstimatesByFY[fyDate] = latestEstimate;
    });
    
    // Sort fiscal years by date
    const sortedFYDates = Object.keys(latestEstimatesByFY).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
    
    const today = new Date();
    
    // Find current fiscal year and last fiscal year
    let currentFYData = null;
    let lastFYData = null;
    
    for (let i = 0; i < sortedFYDates.length; i++) {
      const fyDate = sortedFYDates[i];
      const fyEndDate = new Date(fyDate);
      
      if (fyEndDate > today && !currentFYData) {
        currentFYData = latestEstimatesByFY[fyDate]; // First FY end date after today = current FY
        
        // Last FY is the previous one in the sorted list
        if (i > 0) {
          lastFYData = latestEstimatesByFY[sortedFYDates[i - 1]];
        }
        break;
      }
    }
    
    return {
      currentFyRevenue: currentFYData?.revenueAvg || null,
      lastFyRevenue: lastFYData?.revenueAvg || null
    };
  } catch (error) {
    console.warn(`Failed to read revenue growth data for ${ticker}:`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tickersParam = searchParams.get('tickers');
    
    if (!tickersParam) {
      return NextResponse.json(
        { error: 'Tickers parameter is required' },
        { status: 400 }
      );
    }

    const tickers = tickersParam.split(',').map(t => t.trim().toUpperCase());
    
    if (tickers.length === 0 || tickers.length > 20) {
      return NextResponse.json(
        { error: 'Please provide 1-20 valid tickers' },
        { status: 400 }
      );
    }

    // Calculate timestamps
    const thirtyDaysAgo = Math.floor((Date.now() - (30 * 24 * 60 * 60 * 1000)) / 1000);
    const twoDaysAgo = Math.floor((Date.now() - (2 * 24 * 60 * 60 * 1000)) / 1000); // For yesterday's close
    const now = Math.floor(Date.now() / 1000);

    // Fetch data for all tickers in parallel
    const pricePromises = tickers.map(async (ticker): Promise<StockPriceData> => {
      try {
        // Fetch price data and local financial data in parallel
        const [currentResponse, recentResponse, historicalResponse, sharesOutstanding, netDebt, analystEstimates, revenueGrowthData] = await Promise.all([
          // Current price data
          fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            signal: AbortSignal.timeout(10000),
          }),
          // Recent data (last 2 days to get yesterday's close)
          fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${twoDaysAgo}&period2=${now}&interval=1d`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            signal: AbortSignal.timeout(10000),
          }),
          // Historical data (30 days)
          fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${thirtyDaysAgo}&period2=${now}&interval=1d`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            signal: AbortSignal.timeout(10000),
          }),
          // Local financial data
          getSharesOutstanding(ticker),
          getNetDebt(ticker),
          getAnalystEstimates(ticker),
          getRevenueGrowthData(ticker)
        ]);

        if (!currentResponse.ok) {
          throw new Error(`HTTP ${currentResponse.status}: ${currentResponse.statusText}`);
        }

        const currentData: YahooFinanceResponse = await currentResponse.json();
        
        if (currentData.chart.error) {
          throw new Error(currentData.chart.error.description);
        }

        const currentResult = currentData.chart.result[0];
        if (!currentResult) {
          throw new Error('No current data available');
        }

        const meta = currentResult.meta;
        let t30dChangePercent: number | undefined;
        let t30dPrice: number | undefined;
        let yesterdayClose: number | undefined;
        let todayChangePercent: number | undefined;
        let marketCapCalculated: number | undefined;
        let enterpriseValue: number | undefined;

        // Process recent data for yesterday's close
        if (recentResponse.ok) {
          try {
            const recentData: YahooFinanceResponse = await recentResponse.json();
            const recentResult = recentData.chart.result[0];
            
            if (recentResult && recentResult.indicators.quote[0].close.length > 0) {
              const recentCloses = recentResult.indicators.quote[0].close;
              // Get yesterday's close (second to last, or last if only one day)
              yesterdayClose = recentCloses.length > 1 ? recentCloses[recentCloses.length - 2] : recentCloses[0];
              
              if (yesterdayClose && meta.regularMarketPrice) {
                // Calculate today's change: (current price / yesterday's close) - 1
                todayChangePercent = ((meta.regularMarketPrice / yesterdayClose) - 1) * 100;
              }
            }
          } catch (recentError) {
            console.warn(`Failed to fetch recent data for ${ticker}:`, recentError);
          }
        }

        // Process historical data if available
        if (historicalResponse.ok) {
          try {
            const historicalData: YahooFinanceResponse = await historicalResponse.json();
            const historicalResult = historicalData.chart.result[0];
            
            if (historicalResult && historicalResult.indicators.quote[0].close.length > 0) {
              // Get the first available price (30 days ago)
              const historicalClose = historicalResult.indicators.quote[0].close;
              t30dPrice = historicalClose[0]; // First price in the range
              
              if (t30dPrice && meta.regularMarketPrice) {
                t30dChangePercent = ((meta.regularMarketPrice - t30dPrice) / t30dPrice) * 100;
              }
            }
          } catch (histError) {
            console.warn(`Failed to fetch 30-day data for ${ticker}:`, histError);
          }
        }

        // Calculate market cap and EV using local data
        let evFy2Revenue: number | undefined;
        let evFy2Ebitda: number | undefined;
        let peRatio: number | undefined;
        let revenueGrowthPercent: number | undefined;
        
        if (sharesOutstanding && meta.regularMarketPrice) {
          // Market Cap = Current Price × Shares Outstanding
          marketCapCalculated = meta.regularMarketPrice * sharesOutstanding;
        }
        
        if (marketCapCalculated && netDebt !== null) {
          // Enterprise Value = Market Cap + Net Debt
          enterpriseValue = marketCapCalculated + netDebt;
        }
        
        // Calculate analyst-based metrics
        if (analystEstimates && enterpriseValue) {
          // EV / FY2 Revenue
          if (analystEstimates.fy2Revenue) {
            evFy2Revenue = enterpriseValue / analystEstimates.fy2Revenue;
          }
          
          // EV / FY2 EBITDA
          if (analystEstimates.fy2Ebitda) {
            evFy2Ebitda = enterpriseValue / analystEstimates.fy2Ebitda;
          }
          
          // P/E ratio using FY2 EPS
          if (analystEstimates.fy2Eps && meta.regularMarketPrice) {
            peRatio = meta.regularMarketPrice / analystEstimates.fy2Eps;
          }
        }
        
        // Calculate revenue growth
        if (revenueGrowthData && revenueGrowthData.currentFyRevenue && revenueGrowthData.lastFyRevenue) {
          revenueGrowthPercent = ((revenueGrowthData.currentFyRevenue / revenueGrowthData.lastFyRevenue) - 1) * 100;
        }
        
        return {
          ticker,
          price: meta.regularMarketPrice || 0,
          changePercent: todayChangePercent !== undefined ? todayChangePercent : (meta.regularMarketChangePercent || 0),
          change: meta.regularMarketChange || 0,
          marketCap: meta.marketCap || null,
          currency: meta.currency || 'USD',
          lastUpdated: new Date().toISOString(),
          success: true,
          t30dChangePercent,
          t30dPrice,
          yesterdayClose,
          marketCapCalculated,
          enterpriseValue,
          sharesOutstanding: sharesOutstanding || undefined,
          netDebt: netDebt || undefined,
          fy2Revenue: analystEstimates?.fy2Revenue,
          fy2Ebitda: analystEstimates?.fy2Ebitda,
          fy2Eps: analystEstimates?.fy2Eps,
          currentFyRevenue: revenueGrowthData?.currentFyRevenue,
          lastFyRevenue: revenueGrowthData?.lastFyRevenue,
          evFy2Revenue,
          evFy2Ebitda,
          peRatio,
          revenueGrowthPercent,
        };

      } catch (error) {
        console.error(`Error fetching data for ${ticker}:`, error);
        
        return {
          ticker,
          price: 0,
          changePercent: 0,
          change: 0,
          marketCap: null,
          currency: 'USD',
          lastUpdated: new Date().toISOString(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    const results = await Promise.all(pricePromises);
    
    // Separate successful and failed requests
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return NextResponse.json(
      {
        data: results,
        summary: {
          total: tickers.length,
          successful: successful.length,
          failed: failed.length,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', // Cache for 1 minute
        },
      }
    );

  } catch (error) {
    console.error('Stock prices API error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Handle CORS for development
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}