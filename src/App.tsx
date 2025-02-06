import React, { useEffect, useState } from 'react';
import { getPrices } from './lib/notion';
import { PriceTable } from './components/PriceTable';
import type { PriceItem } from './types/price';

function App() {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPrices() {
      const data = await getPrices();
      setPrices(data);
      setIsLoading(false);
    }

    fetchPrices();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">料金プラン</h1>
        <p className="text-xl text-gray-600">
          あなたのニーズに合わせた最適なプランをお選びください
        </p>
      </div>
      <PriceTable prices={prices} isLoading={isLoading} />
    </div>
  );
}

export default App