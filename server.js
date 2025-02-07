import express from 'express';
import { createServer } from 'vite';
import { Client } from '@notionhq/client';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5173;

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

const getRichTextContent = (richText) => {
  return richText?.map(text => text.plain_text).join('') || '';
};

async function getBlockChildren(blockId) {
  try {
    const response = await notion.blocks.children.list({
      block_id: blockId,
    });
    return await Promise.all(response.results.map(block => processBlock(block)));
  } catch (error) {
    console.error('子ブロックの取得に失敗:', error);
    return [];
  }
}

async function processBlock(block) {
  const blockContent = {
    type: block.type,
    content: '',
    url: '',
    checked: false,
    children: [],
    language: '',
  };

  // 子ブロックの取得
  if (block.has_children) {
    blockContent.children = await getBlockChildren(block.id);
  }

  switch (block.type) {
    case 'paragraph':
      blockContent.content = getRichTextContent(block.paragraph.rich_text);
      break;
    case 'heading_1':
      blockContent.content = getRichTextContent(block.heading_1.rich_text);
      break;
    case 'heading_2':
      blockContent.content = getRichTextContent(block.heading_2.rich_text);
      break;
    case 'heading_3':
      blockContent.content = getRichTextContent(block.heading_3.rich_text);
      break;
    case 'bulleted_list_item':
      blockContent.content = getRichTextContent(block.bulleted_list_item.rich_text);
      break;
    case 'numbered_list_item':
      blockContent.content = getRichTextContent(block.numbered_list_item.rich_text);
      break;
    case 'to_do':
      blockContent.content = getRichTextContent(block.to_do.rich_text);
      blockContent.checked = block.to_do.checked;
      break;
    case 'toggle':
      blockContent.content = getRichTextContent(block.toggle.rich_text);
      break;
    case 'code':
      blockContent.content = getRichTextContent(block.code.rich_text);
      blockContent.language = block.code.language;
      break;
    case 'quote':
      blockContent.content = getRichTextContent(block.quote.rich_text);
      break;
    case 'callout':
      blockContent.content = getRichTextContent(block.callout.rich_text);
      break;
    case 'divider':
      blockContent.type = 'divider';
      break;
    case 'image':
      if (block.image.type === 'external') {
        blockContent.url = block.image.external.url;
      } else if (block.image.type === 'file') {
        blockContent.url = block.image.file.url;
      }
      blockContent.content = block.image.caption?.map(caption => caption.plain_text).join('') || '';
      break;
    case 'bookmark':
      blockContent.url = block.bookmark.url;
      blockContent.content = getRichTextContent(block.bookmark.caption);
      break;
    case 'link_preview':
      blockContent.url = block.link_preview.url;
      break;
    case 'table':
      // テーブルの子ブロックは自動的に取得されます
      break;
    case 'table_row':
      blockContent.content = block.table_row.cells.map(cell => 
        getRichTextContent(cell)
      ).join('|');
      break;
  }

  return blockContent;
}

async function getPageContent(pageId) {
  try {
    const response = await notion.blocks.children.list({
      block_id: pageId,
    });

    return await Promise.all(response.results.map(block => processBlock(block)));
  } catch (error) {
    console.error('ページコンテンツの取得に失敗:', error);
    return [];
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
        serviceDetails: serviceDetails || [],
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

let server;

async function startServer() {
  try {
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);

    server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

    process.on('SIGTERM', () => {
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();