import fs from 'fs/promises';
import path from 'path';
import { Bookmark, Widget } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKMARKS_FILE = path.join(DATA_DIR, 'bookmarks.json');
const WIDGETS_FILE = path.join(DATA_DIR, 'widgets.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

export async function getBookmarks(): Promise<Bookmark[] | null> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(BOOKMARKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

export async function saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2), 'utf-8');
}

export async function getWidgets(): Promise<Widget[] | null> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(WIDGETS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

export async function saveWidgets(widgets: Widget[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(WIDGETS_FILE, JSON.stringify(widgets, null, 2), 'utf-8');
}
