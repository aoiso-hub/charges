export async function getPrices() {
  try {
    const response = await fetch('/api/prices');
    if (!response.ok) {
      throw new Error('APIリクエストに失敗しました');
    }
    return await response.json();
  } catch (error: any) {
    console.error('Notionからデータの取得に失敗しました:', {
      message: error.message,
    });
    return [];
  }
}