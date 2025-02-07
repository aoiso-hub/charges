import React, { useState } from 'react';
import { Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import type { PriceItem, BlockContent } from '../types/price';

interface PriceTableProps {
  prices: PriceItem[];
  isLoading: boolean;
}

interface ServiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceDetails: BlockContent[];
  planName: string;
}

function ServiceDetailsModal({ isOpen, onClose, serviceDetails = [], planName }: ServiceDetailsModalProps) {
  if (!isOpen) return null;

  const [expandedToggles, setExpandedToggles] = useState<{ [key: string]: boolean }>({});

  const toggleExpand = (index: string) => {
    setExpandedToggles(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const renderChildren = (children: BlockContent[] = [], parentIndex: string) => {
    return children.map((child, idx) => 
      renderBlock(child, `${parentIndex}-${idx}`)
    );
  };

  const renderBlock = (block: BlockContent, index: string) => {
    switch (block.type) {
      case 'heading_1':
        return <h1 key={index} className="text-3xl font-bold mb-4">{block.content}</h1>;
      case 'heading_2':
        return <h2 key={index} className="text-2xl font-bold mb-3">{block.content}</h2>;
      case 'heading_3':
        return <h3 key={index} className="text-xl font-bold mb-2">{block.content}</h3>;
      case 'bulleted_list_item':
        return (
          <ul key={index} className="list-disc list-inside mb-2">
            <li className="text-gray-700">
              {block.content}
              {block.children && block.children.length > 0 && (
                <div className="ml-6">
                  {renderChildren(block.children, index)}
                </div>
              )}
            </li>
          </ul>
        );
      case 'numbered_list_item':
        return (
          <ol key={index} className="list-decimal list-inside mb-2">
            <li className="text-gray-700">
              {block.content}
              {block.children && block.children.length > 0 && (
                <div className="ml-6">
                  {renderChildren(block.children, index)}
                </div>
              )}
            </li>
          </ol>
        );
      case 'to_do':
        return (
          <div key={index} className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={block.checked}
              readOnly
              className="rounded border-gray-300"
            />
            <span className={block.checked ? 'line-through text-gray-500' : 'text-gray-700'}>
              {block.content}
            </span>
          </div>
        );
      case 'toggle':
        return (
          <div key={index} className="mb-2">
            <button
              onClick={() => toggleExpand(index)}
              className="flex items-center gap-2 w-full text-left p-2 hover:bg-gray-50 rounded"
            >
              {expandedToggles[index] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span className="text-gray-700">{block.content}</span>
            </button>
            {expandedToggles[index] && block.children && (
              <div className="ml-6 mt-2">
                {renderChildren(block.children, index)}
              </div>
            )}
          </div>
        );
      case 'code':
        return (
          <div key={index} className="mb-4">
            <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto">
              <code className={`language-${block.language}`}>{block.content}</code>
            </pre>
          </div>
        );
      case 'quote':
        return (
          <blockquote key={index} className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-700">
            {block.content}
          </blockquote>
        );
      case 'callout':
        return (
          <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-gray-700">{block.content}</p>
          </div>
        );
      case 'divider':
        return <hr key={index} className="my-4 border-gray-200" />;
      case 'image':
        return (
          <figure key={index} className="mb-4">
            {block.url && (
              <img
                src={block.url}
                alt={block.content}
                className="w-full h-auto rounded-lg shadow-md"
              />
            )}
            {block.content && (
              <figcaption className="mt-2 text-sm text-center text-gray-600">
                {block.content}
              </figcaption>
            )}
          </figure>
        );
      case 'bookmark':
      case 'link_preview':
        return (
          <a
            key={index}
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 border rounded-lg mb-4 hover:bg-gray-50"
          >
            <div className="text-blue-600 hover:underline">{block.url}</div>
            {block.content && (
              <div className="text-sm text-gray-600 mt-1">{block.content}</div>
            )}
          </a>
        );
      case 'table':
        return (
          <div key={index} className="mb-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="divide-y divide-gray-200">
                {block.children?.map((row, rowIdx) => (
                  <tr key={`${index}-row-${rowIdx}`}>
                    {row.content.split('|').map((cell, cellIdx) => (
                      <td key={`${index}-cell-${cellIdx}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'paragraph':
        return block.content ? (
          <p key={index} className="mb-4 text-gray-700">{block.content}</p>
        ) : (
          <div key={index} className="h-4" />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 relative max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
        <h3 className="text-2xl font-bold mb-6">{planName}の詳細</h3>
        <div className="prose max-w-none">
          {Array.isArray(serviceDetails) && serviceDetails.map((block, index) => 
            renderBlock(block, index.toString())
          )}
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
        serviceDetails={selectedPlan?.serviceDetails || []}
        planName={selectedPlan?.name || ''}
      />
    </>
  );
}