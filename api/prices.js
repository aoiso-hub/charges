import { Client } from '@notionhq/client';

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

// ページコンテンツの取得
async function getPageContent(pageId) {
  try {
    const response = await notion.blocks.children.list({
      block_id: pageId,
    });

    return response.results
      .map(block => {
        if (block.type === 'paragraph') {
          return block.paragraph.rich_text.map(text => text.plain_text).join('');
        }
        return '';
      })
      .filter(text => text)
      .join('\n\n');
  } catch (error) {
    console.error('ページコンテンツの取得に失敗:', error);
    return '';
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    res.status(200).json(prices);
  } catch (error) {
    console.error('Notionからのデータ取得に失敗しました:', error);
    res.status(500).json({ 
      error: 'データの取得に失敗しました',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}