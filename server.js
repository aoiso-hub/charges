import express from 'express';
import { createServer } from 'vite';
import { Client } from '@notionhq/client';
import * as dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

const app = express();
const port = 5173;

// APIキーとデータベースIDの確認
if (!process.env.VITE_NOTION_API_KEY) {
  console.error('Error: VITE_NOTION_API_KEY is not set');
  process.exit(1);
}

if (!process.env.VITE_NOTION_DATABASE_ID) {
  console.error('Error: VITE_NOTION_DATABASE_ID is not set');
  process.exit(1);
}

// Notion clientの初期化
const notion = new Client({
  auth: process.env.VITE_NOTION_API_KEY,
});

// プロパティの安全な取得のためのヘルパー関数
const getPropertyValue = (properties, propertyName) => {
  const property = properties[propertyName];
  if (!property) return null;

  switch (property.type) {
    case 'title':
    case 'rich_text':
      return property[property.type][0]?.plain_text || '';
    case 'number':
      return property.number || 0;
    case 'checkbox':
      return property.checkbox || false;
    case 'multi_select':
      return property.multi_select?.map(item => item.name) || [];
    default:
      return null;
  }
};

app.get('/api/prices', async (req, res) => {
  try {
    const response = await notion.databases.query({
      database_id: process.env.VITE_NOTION_DATABASE_ID,
      sorts: [
        {
          property: 'Price',
          direction: 'ascending',
        },
      ],
    });

    const prices = response.results.map((page) => {
      const properties = page.properties;
      return {
        id: page.id,
        name: getPropertyValue(properties, 'Name') || '',
        description: getPropertyValue(properties, 'Description') || '',
        price: getPropertyValue(properties, 'Price') || 0,
        features: getPropertyValue(properties, 'Features') || [],
        recommended: getPropertyValue(properties, 'Recommended') || false,
        serviceDetails: getPropertyValue(properties, 'ServiceDetails') || '', // Add service details
      };
    });

    res.json(prices);
  } catch (error) {
    console.error('Notionからのデータ取得に失敗しました:', error);
    res.status(500).json({ 
      error: 'データの取得に失敗しました',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Viteサーバーの設定
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'spa',
});

app.use(vite.middlewares);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});