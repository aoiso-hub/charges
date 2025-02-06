import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { PriceItem } from '../types/price';

interface PriceTableProps {
  prices: PriceItem[];
  isLoading: boolean;
}

interface ServiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceDetails: string;
  planName: string;
}

function ServiceDetailsModal({ isOpen, onClose, serviceDetails, planName }: ServiceDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
        <h3 className="text-2xl font-bold mb-4">{planName}の詳細</h3>
        <div className="prose max-w-none">
          {serviceDetails.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-gray-700">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PriceTable({ prices, isLoading }: PriceTableProps) {
  const [selectedPlan, setSelectedPlan] = useState<PriceItem | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
        {prices.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border p-8 shadow-sm ${
              plan.recommended
                ? 'border-blue-600 shadow-blue-100'
                : 'border-gray-200'
            }`}
          >
            {plan.recommended && (
              <div className="absolute -top-4 left-0 right-0 mx-auto w-fit px-4 py-1 rounded-full bg-blue-600 text-white text-sm font-medium">
                おすすめ
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-2 text-gray-500">{plan.description}</p>
            </div>
            
            <div className="mb-6">
              <p className="text-4xl font-bold text-gray-900">
                ¥{plan.price.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">/月</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
            
            <div className="space-y-3">
              <button
                onClick={() => setSelectedPlan(plan)}
                className={`w-full rounded-lg px-4 py-2 text-sm font-semibold ${
                  plan.recommended
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                詳細を見る
              </button>
              
              <button
                className={`w-full rounded-lg px-4 py-2 text-sm font-semibold ${
                  plan.recommended
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                プランを選択
              </button>
            </div>
          </div>
        ))}
      </div>

      <ServiceDetailsModal
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        serviceDetails={selectedPlan?.serviceDetails || ''}
        planName={selectedPlan?.name || ''}
      />
    </>
  );
}