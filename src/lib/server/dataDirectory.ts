import fs from 'fs';
import path from 'path';

const DEFAULT_DIR = '/app/data';
const CWD_DATA = path.join(process.cwd(), 'data');

export const DATA_DIR =
  process.env.DATA_DIR || (fs.existsSync(DEFAULT_DIR) ? DEFAULT_DIR : CWD_DATA);
