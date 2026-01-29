import fs from 'fs/promises';
import path from 'path';
import { Bookmark, Widget } from '@/types';
import { logger } from '@/lib/logger';

const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKMARKS_FILE = path.join(DATA_DIR, 'bookmarks.json');
const WIDGETS_FILE = path.join(DATA_DIR, 'widgets.json');

/**
 * 确保数据目录存在
 * 如果不存在，则递归创建目录
 * @returns {Promise<void>}
 */
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    logger.info(`Creating data directory at ${DATA_DIR}`);
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

/**
 * 读取书签数据
 * 从 JSON 文件中读取书签列表，如果文件不存在则返回 null
 * @returns {Promise<Bookmark[] | null>} 书签列表或 null
 */
export async function getBookmarks(): Promise<Bookmark[] | null> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(BOOKMARKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      logger.info('Bookmarks file not found, returning null');
      return null;
    }
    logger.error('Failed to read bookmarks', error);
    return null;
  }
}

/**
 * 保存书签数据
 * 将书签列表写入 JSON 文件
 * @param {Bookmark[]} bookmarks - 要保存的书签列表
 * @returns {Promise<void>}
 * @throws {Error} 如果写入失败则抛出错误
 */
export async function saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
  try {
    await ensureDataDir();
    await fs.writeFile(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2), 'utf-8');
    logger.info('Bookmarks saved successfully');
  } catch (error) {
    logger.error('Failed to save bookmarks', error);
    throw error;
  }
}

/**
 * 读取小组件配置数据
 * 从 JSON 文件中读取小组件列表，如果文件不存在则返回 null
 * @returns {Promise<Widget[] | null>} 小组件列表或 null
 */
export async function getWidgets(): Promise<Widget[] | null> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(WIDGETS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      logger.info('Widgets file not found, returning null');
      return null;
    }
    logger.error('Failed to read widgets', error);
    return null;
  }
}

/**
 * 保存小组件配置数据
 * 将小组件列表写入 JSON 文件
 * @param {Widget[]} widgets - 要保存的小组件列表
 * @returns {Promise<void>}
 * @throws {Error} 如果写入失败则抛出错误
 */
export async function saveWidgets(widgets: Widget[]): Promise<void> {
  try {
    await ensureDataDir();
    await fs.writeFile(WIDGETS_FILE, JSON.stringify(widgets, null, 2), 'utf-8');
    logger.info('Widgets saved successfully');
  } catch (error) {
    logger.error('Failed to save widgets', error);
    throw error;
  }
}
