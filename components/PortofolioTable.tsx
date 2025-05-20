import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { StockHolding } from '../pages/api/types';
import { format } from 'date-fns';

type LiveStockAPIResponse = {
  symbol: string;
  cmp: number;
  peRatio: number | null;
  earningsTimestamp: number | null;
};

type LiveStockData = {
  [symbol: string]: {
    cmp: number;
    peRatio: number | null;
    latestEarnings: string | null;
  };
};

// Interface for the component's props
interface PortfolioTableProps {
  portfolioData: StockHolding[];
  // stockData: Record<string, unknown>; 
}

const PortfolioTable: React.FC<PortfolioTableProps> = ({ portfolioData }) => {
  const [liveData, setLiveData] = useState<LiveStockData>({});
  const [selectedSector, setSelectedSector] = useState<string>('All Sectors');

  useEffect(() => {
    const fetchLiveStockAPIResponse = async () => {
      try {
        const symbols = portfolioData.map((stock) => stock.symbol);
        const response = await axios.post('/api/realTimePrice', { symbols });

        const mappedData: LiveStockData = {};
        response.data.forEach((stock: LiveStockAPIResponse) => {
          mappedData[stock.symbol] = {
            cmp: stock.cmp ?? 0,
            peRatio: stock.peRatio ?? null,
            latestEarnings:
              typeof stock.earningsTimestamp === 'number'
                ? format(new Date(stock.earningsTimestamp * 1000), 'MMM dd')
                : null,
          };
        });
        setLiveData(mappedData);
      } catch (err) {
        console.error('Error fetching live stock data:', err);
      }
    };

    fetchLiveStockAPIResponse(); 

    const interval = setInterval(fetchLiveStockAPIResponse, 6000); 
    return () => clearInterval(interval); 
  }, [portfolioData]); 

  const sectors = Array.from(new Set(portfolioData.map((stock) => stock.sector))).sort();

  const filteredPortfolioData =
    selectedSector === 'All Sectors'
      ? portfolioData
      : portfolioData.filter((stock) => stock.sector === selectedSector);

  
  const totalInvestment = filteredPortfolioData.reduce(
    (acc, stock) => acc + stock.purchasePrice * stock.quantity,
    0
  );

  return (
    <div className="max-w-screen-xl mx-auto p-4">
      {/* Navigation Bar */}
      <nav className="bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-500 text-white px-6 py-4 rounded-xl shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">📊 My Portfolio Dashboard</h1>
        <ul className="flex space-x-6 text-sm">
          <li className="hover:underline cursor-pointer">Home</li>
          <li className="hover:underline cursor-pointer">Add Stock</li>
          <li className="hover:underline cursor-pointer">Settings</li>
        </ul>
      </nav>
      <div className="mt-6">
        <label htmlFor="sector-select" className="font-medium text-gray-700 mr-3">
          Filter by Sector:
        </label>
        <select
          id="sector-select"
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 shadow-sm text-black bg-white"
        >
          <option value="All Sectors">All Sectors</option>
          {sectors.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block mt-6">
        <h2 className="text-2xl font-semibold text-blue-600 mb-4">📈 Stock Portfolio</h2>
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Stock</th>
                <th className="px-4 py-3 text-center">Price</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-center">Investment</th>
                <th className="px-4 py-3 text-center">% of Total</th>
                <th className="px-4 py-3 text-center">Exchange</th>
                <th className="px-4 py-3 text-center">CMP</th>
                <th className="px-4 py-3 text-center">Value</th>
                <th className="px-4 py-3 text-center">Gain/Loss</th>
                <th className="px-4 py-3 text-center">P/E</th>
                <th className="px-4 py-3 text-center">Earnings</th>
                {/* Removed 'History' column as historicalData state is commented out */}
                {/* <th className="px-4 py-3 text-center">History</th> */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredPortfolioData.map((stock) => {
                const investment = stock.purchasePrice * stock.quantity;
                const portfolioPercent = ((investment / totalInvestment) * 100).toFixed(2);
                const cmp = liveData[stock.symbol]?.cmp ?? 0;
                const peRatio = liveData[stock.symbol]?.peRatio ?? '-';
                const latestEarnings = liveData[stock.symbol]?.latestEarnings ?? '-';
                const presentValue = cmp * stock.quantity;
                const gainLoss = presentValue - investment;
                const gainClass = gainLoss >= 0 ? 'text-green-600' : 'text-red-600';
                // const historicalPoints = historicalData[stock.symbol]?.length ?? 0; 

                return (
                  <tr key={stock.symbol} className="hover:bg-yellow-50">
                    <td className="px-4 py-3 font-medium">{stock.stockName}</td>
                    <td className="px-4 py-3 text-center">₹{stock.purchasePrice}</td>
                    <td className="px-4 py-3 text-center">{stock.quantity}</td>
                    <td className="px-4 py-3 text-center">₹{investment.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">{portfolioPercent}%</td>
                    <td className="px-4 py-3 text-center">{stock.exchange}</td>
                    <td className="px-4 py-3 text-center">₹{cmp.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">₹{presentValue.toFixed(2)}</td>
                    <td className={`px-4 py-3 text-center font-semibold ${gainClass}`}>
                      ₹{gainLoss.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">{peRatio}</td>
                    <td className="px-4 py-3 text-center">{latestEarnings}</td>
                    {/* Removed 'History' column cell */}
                    {/* <td className="px-4 py-3 text-center">{historicalPoints}</td> */}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      
      <div className="mt-6 space-y-4 md:hidden">
        {filteredPortfolioData.map((stock) => {
          const investment = stock.purchasePrice * stock.quantity;
          const portfolioPercent = ((investment / totalInvestment) * 100).toFixed(2);
          const cmp = liveData[stock.symbol]?.cmp ?? 0;
          const peRatio = liveData[stock.symbol]?.peRatio ?? '-';
          const latestEarnings = liveData[stock.symbol]?.latestEarnings ?? '-';
          const presentValue = cmp * stock.quantity;
          const gainLoss = presentValue - investment;
          const gainClass = gainLoss >= 0 ? 'text-green-600' : 'text-red-600';
          // const historicalPoints = historicalData[stock.symbol]?.length ?? 0; 

          return (
            <div key={stock.symbol} className="border rounded-xl shadow-lg p-4 bg-white">
              <h3 className="font-semibold text-lg text-blue-600 mb-3">{stock.stockName}</h3>
              <p>
                <strong>Purchase Price:</strong> ₹{stock.purchasePrice}
              </p>
              <p>
                <strong>Quantity:</strong> {stock.quantity}
              </p>
              <p>
                <strong>Investment:</strong> ₹{investment.toFixed(2)}
              </p>
              <p>
                <strong>Portfolio %:</strong> {portfolioPercent}%
              </p>
              <p>
                <strong>Exchange:</strong> {stock.exchange}
              </p>
              <p>
                <strong>CMP:</strong> ₹{cmp.toFixed(2)}
              </p>
              <p>
                <strong>Present Value:</strong> ₹{presentValue.toFixed(2)}
              </p>
              <p className={`${gainClass} font-semibold`}>
                <strong>Gain/Loss:</strong> ₹{gainLoss.toFixed(2)}
              </p>
              <p>
                <strong>P/E Ratio:</strong> {peRatio}
              </p>
              <p>
                <strong>Latest Earnings:</strong> {latestEarnings}
              </p>
              {/* <p><strong>History Points:</strong> {historicalPoints}</p> */}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PortfolioTable;
