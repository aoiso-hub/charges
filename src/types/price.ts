export interface PriceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  recommended?: boolean;
}