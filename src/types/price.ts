export interface BlockContent {
  type: string;
  content: string;
  url?: string;
  checked?: boolean;
  children?: BlockContent[];
  language?: string;
}

export interface PriceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  recommended?: boolean;
  serviceDetails: BlockContent[];
}