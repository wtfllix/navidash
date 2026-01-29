
import { saveWidgets, getWidgets } from './src/lib/server/storage';
import { Widget } from './src/types';

async function test() {
  console.log('Testing getWidgets...');
  const widgets = await getWidgets();
  console.log('Current widgets:', widgets);

  console.log('Testing saveWidgets...');
  const newWidgets: Widget[] = widgets || [];
  // Add a dummy widget or just save the same
  try {
    await saveWidgets(newWidgets);
    console.log('Save successful');
  } catch (error) {
    console.error('Save failed:', error);
  }
}

test();
