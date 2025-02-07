import express from 'express';
import { createServer } from 'vite';
import { Client } from '@notionhq/client';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 5173;

if (!process.env.VITE_NOTION_API_KEY) {
  console.error('Error: VITE_NOTION_API_KEY is not set');
  process.exit(1);
}

if (!process.env.VITE_NOTION_DATABASE_ID) {
  console.error('Error: VITE_NOTION_DATABASE_ID is not set');
  process.exit(1);
}

const notion = new Client({
  auth: process.env.VITE_NOTION_API_KEY,
});

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

async function getPageContent(pageId) {
  try {
    const response = await notion.blocks.children.list({
      block_id: pageId,
    });

    return response.results
      .map(block => {
        switch (block.type) {
          case 'paragraph':
            return block.paragraph.rich_text.map(text => text.plain_text).join('');
          case 'heading_1':
            return `# ${block.heading_1.rich_text.map(text => text.plain_text).join('')}`;
          case 'heading_2':
            return `## ${block.heading_2.rich_text.map(text => text.plain_text).join('')}`;
          case 'heading_3':
            return `### ${block.heading_3.rich_text.map(text => text.plain_text).join('')}`;
          case 'bulleted_list_item':
            return `• ${block.bulleted_list_item.rich_text.map(text => text.plain_text).join('')}`;
          case 'numbered_list_item':
            return `1. ${block.numbered_list_item.rich_text.map(text => text.plain_text).join('')}`;
          default:
            return '';
        }
      })
      .filter(text => text)
      .join('\n\n');
  } catch (error) {
    console.error('ページコンテンツの取得に失敗:', error);
    return '';
  }
}

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

    const prices = await Promise.all(response.results.map(async (page) => {
      const properties = page.properties;
      const serviceDetails = await getPageContent(page.id);
      
      return {
        id: page.id,
        name: getPropertyValue(properties, 'Name') || '',
        description: getPropertyValue(properties, 'Description') || '',
        price: getPropertyValue(properties, 'Price') || 0,
        features: getPropertyValue(properties, 'Features') || [],
        recommended: getPropertyValue(properties, 'Recommended') || false,
        serviceDetails,
      };
    }));

    res.json(prices);
  } catch (error) {
    console.error('Notionからのデータ取得に失敗しました:', error);
    res.status(500).json({ 
      error: 'データの取得に失敗しました',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'spa',
});

app.use(vite.middlewares);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});