import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { z } from 'zod';
import {
  mergeWidgets,
  normalizeSettings,
  SettingsNormalizationSchema,
  SettingsSchema,
  splitWidgets,
  WidgetConfigsArraySchema,
  WidgetLayoutsArraySchema,
  WidgetLayoutsByModeSchema,
  WidgetsArraySchema,
} from '@/lib/schemas';
import { Settings, Widget, WidgetConfigEntry, WidgetLayout, WidgetLayoutsByMode } from '@/types';
import { logger } from '@/lib/logger';
import { ensureLayoutsByMode } from '@/lib/widgetLayouts';
import { DEMO_DATA_VERSION, DEMO_SETTINGS, DEMO_WIDGETS, isServerDemoMode } from '@/lib/demo';

const DATA_FILE_VERSION = 1;
const DEFAULT_DIR = '/app/data';
const CWD_DATA = path.join(process.cwd(), 'data');
const DATA_DIR = process.env.DATA_DIR || (fsSync.existsSync(DEFAULT_DIR) ? DEFAULT_DIR : CWD_DATA);
const WIDGETS_FILE = path.join(DATA_DIR, 'widgets.json');
const WIDGET_LAYOUTS_FILE = path.join(DATA_DIR, 'widget-layouts.json');
const WIDGET_CONFIGS_FILE = path.join(DATA_DIR, 'widget-configs.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// 检查是否为演示模式（兼容服务端与客户端环境变量）
const IS_DEMO_MODE = isServerDemoMode;

/**
 * 确保数据目录存在
 * 如果不存在，则递归创建目录
 * @returns {Promise<void>}
 */
async function ensureDataDir() {
  if (IS_DEMO_MODE) return;

  try {
    await fs.access(DATA_DIR);
  } catch {
    logger.info(`Creating data directory at ${DATA_DIR}`);
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

function createVersionedDataSchema(payloadSchema: z.ZodTypeAny) {
  return z.object({
    version: z.number().int().positive(),
    data: payloadSchema,
  });
}

function parseStoredJson(raw: unknown, payloadSchema: z.ZodTypeAny): unknown {
  const versionedSchema = createVersionedDataSchema(payloadSchema);
  const versionedResult = versionedSchema.safeParse(raw);

  if (versionedResult.success) {
    return versionedResult.data.data;
  }

  return payloadSchema.parse(raw);
}

async function readJsonFile(filePath: string, schema: z.ZodTypeAny): Promise<unknown | null> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return parseStoredJson(JSON.parse(data), schema);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }

    logger.error(`Failed to read or validate JSON file at ${filePath}`, error);
    return null;
  }
}

async function writeJsonFileAtomic(filePath: string, data: unknown): Promise<void> {
  const tempFilePath = `${filePath}.${process.pid}.${Date.now()}.tmp`;

  try {
    await fs.writeFile(tempFilePath, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tempFilePath, filePath);
  } catch (error) {
    await fs.rm(tempFilePath, { force: true }).catch(() => undefined);
    throw error;
  }
}

/**
 * 读取小组件配置数据
 * 从 JSON 文件中读取小组件列表，如果文件不存在则返回 null
 * @returns {Promise<Widget[] | null>} 小组件列表或 null
 */
export async function getWidgets(): Promise<Widget[] | null> {
  if (IS_DEMO_MODE) {
    logger.info('Demo mode: returning demo widgets');
    return DEMO_WIDGETS;
  }

  try {
    await ensureDataDir();
    const layouts = await readJsonFile(
      WIDGET_LAYOUTS_FILE,
      z.union([WidgetLayoutsByModeSchema, WidgetLayoutsArraySchema])
    );
    const configs = await readJsonFile(WIDGET_CONFIGS_FILE, WidgetConfigsArraySchema);

    if (layouts) {
      const layoutsByMode = ensureLayoutsByMode(layouts as WidgetLayoutsByMode | WidgetLayout[], []);

      return mergeWidgets(layoutsByMode.desktop, (configs as WidgetConfigEntry[] | null) ?? [], []);
    }

    const widgets = await readJsonFile(WIDGETS_FILE, WidgetsArraySchema);
    return widgets ? (widgets as Widget[]) : null;
  } catch (error) {
    logger.error('Failed to read widgets', error);
    return null;
  }
}

/**
 * 获取小组件文件的最后修改时间
 * @returns {Promise<number>} 时间戳 (ms)
 */
export async function getWidgetsLastModified(): Promise<number> {
  if (IS_DEMO_MODE) return DEMO_DATA_VERSION;

  try {
    await ensureDataDir();
    const candidates = [WIDGET_LAYOUTS_FILE, WIDGET_CONFIGS_FILE, WIDGETS_FILE];
    const mtimes = await Promise.all(
      candidates.map(async (filePath) => {
        try {
          const stats = await fs.stat(filePath);
          return stats.mtimeMs;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 0;
          throw error;
        }
      })
    );
    return Math.max(...mtimes, 0);
  } catch (error) {
    logger.error('Failed to get widgets stats', error);
    return 0;
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
  if (IS_DEMO_MODE) {
    logger.info('Demo mode: save skipped');
    return;
  }

  try {
    await ensureDataDir();
    const parsedWidgets = WidgetsArraySchema.parse(widgets);
    const { layouts, configs } = splitWidgets(parsedWidgets);
    await writeJsonFileAtomic(WIDGET_LAYOUTS_FILE, {
      version: DATA_FILE_VERSION,
      data: WidgetLayoutsArraySchema.parse(layouts),
    });
    await writeJsonFileAtomic(WIDGET_CONFIGS_FILE, {
      version: DATA_FILE_VERSION,
      data: WidgetConfigsArraySchema.parse(configs),
    });
    logger.info('Widgets saved successfully');
  } catch (error) {
    logger.error('Failed to save widgets', error);
    throw error;
  }
}

export async function getWidgetLayouts(): Promise<WidgetLayout[] | null> {
  const layouts = await getWidgetLayoutsByMode();
  return layouts?.desktop ?? null;
}

export async function getWidgetLayoutsByMode(): Promise<WidgetLayoutsByMode | null> {
  if (IS_DEMO_MODE) {
    return ensureLayoutsByMode(splitWidgets(DEMO_WIDGETS).layouts, DEMO_WIDGETS);
  }

  try {
    await ensureDataDir();
    const layouts = await readJsonFile(
      WIDGET_LAYOUTS_FILE,
      z.union([WidgetLayoutsByModeSchema, WidgetLayoutsArraySchema])
    );

    if (layouts) {
      return ensureLayoutsByMode(layouts as WidgetLayoutsByMode | WidgetLayout[], []);
    }

    const widgets = await readJsonFile(WIDGETS_FILE, WidgetsArraySchema);
    if (!widgets) return null;
    return ensureLayoutsByMode(splitWidgets(widgets as Widget[]).layouts, []);
  } catch (error) {
    logger.error('Failed to read widget layouts', error);
    return null;
  }
}

export async function getWidgetConfigs(): Promise<WidgetConfigEntry[] | null> {
  if (IS_DEMO_MODE) {
    return splitWidgets(DEMO_WIDGETS).configs;
  }

  try {
    await ensureDataDir();
    const configs = await readJsonFile(WIDGET_CONFIGS_FILE, WidgetConfigsArraySchema);
    if (configs) return configs as WidgetConfigEntry[];

    const widgets = await readJsonFile(WIDGETS_FILE, WidgetsArraySchema);
    if (!widgets) return null;
    return splitWidgets(widgets as Widget[]).configs;
  } catch (error) {
    logger.error('Failed to read widget configs', error);
    return null;
  }
}

export async function saveWidgetLayouts(layouts: WidgetLayoutsByMode | WidgetLayout[]): Promise<void> {
  if (IS_DEMO_MODE) {
    logger.info('Demo mode: save layouts skipped');
    return;
  }

  try {
    await ensureDataDir();
    const parsedLayouts = ensureLayoutsByMode(layouts, []);
    await writeJsonFileAtomic(WIDGET_LAYOUTS_FILE, {
      version: DATA_FILE_VERSION,
      data: WidgetLayoutsByModeSchema.parse(parsedLayouts),
    });
    logger.info('Widget layouts saved successfully');
  } catch (error) {
    logger.error('Failed to save widget layouts', error);
    throw error;
  }
}

export async function saveWidgetConfigs(configs: WidgetConfigEntry[]): Promise<void> {
  if (IS_DEMO_MODE) {
    logger.info('Demo mode: save configs skipped');
    return;
  }

  try {
    await ensureDataDir();
    const parsedConfigs = WidgetConfigsArraySchema.parse(configs);
    await writeJsonFileAtomic(WIDGET_CONFIGS_FILE, {
      version: DATA_FILE_VERSION,
      data: parsedConfigs,
    });
    logger.info('Widget configs saved successfully');
  } catch (error) {
    logger.error('Failed to save widget configs', error);
    throw error;
  }
}

/**
 * 读取设置数据
 * 从 JSON 文件中读取设置，如果文件不存在则返回 null
 * @returns {Promise<Settings | null>} 设置对象或 null
 */
export async function getSettings(): Promise<Settings | null> {
  if (IS_DEMO_MODE) {
    logger.info('Demo mode: returning demo settings');
    return DEMO_SETTINGS;
  }

  try {
    await ensureDataDir();
    const settings = await readJsonFile(SETTINGS_FILE, SettingsNormalizationSchema);
    return settings ? normalizeSettings(settings) : null;
  } catch (error) {
    logger.error('Failed to read settings', error);
    return null;
  }
}

/**
 * 获取设置文件的最后修改时间
 * 用于前端轮询检查数据是否有更新
 * @returns {Promise<number>} 时间戳 (ms)
 */
export async function getSettingsLastModified(): Promise<number> {
  if (IS_DEMO_MODE) return DEMO_DATA_VERSION;

  try {
    await ensureDataDir();
    const stats = await fs.stat(SETTINGS_FILE);
    return stats.mtimeMs;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 0;
    logger.error('Failed to get settings stats', error);
    return 0;
  }
}

/**
 * 保存设置数据
 * 将设置对象写入 JSON 文件
 * @param {Settings} settings - 要保存的设置对象
 * @returns {Promise<void>}
 * @throws {Error} 如果写入失败则抛出错误
 */
export async function saveSettings(settings: Settings): Promise<void> {
  if (IS_DEMO_MODE) {
    logger.info('Demo mode: save skipped');
    return;
  }

  try {
    await ensureDataDir();
    const parsedSettings = SettingsSchema.parse(settings);
    await writeJsonFileAtomic(SETTINGS_FILE, {
      version: DATA_FILE_VERSION,
      data: parsedSettings,
    });
    logger.info('Settings saved successfully');
  } catch (error) {
    logger.error('Failed to save settings', error);
    throw error;
  }
}
