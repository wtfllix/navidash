import fs from 'node:fs';
import path from 'node:path';

const rounds = [
  ['australia', '澳大利亚大奖赛', 'Australian Grand Prix', '墨尔本', 'Melbourne'],
  ['china', '中国大奖赛', 'Chinese Grand Prix', '上海', 'Shanghai'],
  ['japan', '日本大奖赛', 'Japanese Grand Prix', '铃鹿', 'Suzuka'],
  ['miami', '迈阿密大奖赛', 'Miami Grand Prix', '迈阿密', 'Miami'],
  ['canada', '加拿大大奖赛', 'Canadian Grand Prix', '蒙特利尔', 'Montreal'],
  ['monaco', '摩纳哥大奖赛', 'Monaco Grand Prix', '蒙特卡洛', 'Monte Carlo'],
  [
    'barcelona-catalunya',
    '巴塞罗那-加泰罗尼亚大奖赛',
    'Barcelona-Catalunya Grand Prix',
    '巴塞罗那',
    'Barcelona',
  ],
  ['austria', '奥地利大奖赛', 'Austrian Grand Prix', '施皮尔贝格', 'Spielberg'],
  ['great-britain', '英国大奖赛', 'British Grand Prix', '银石', 'Silverstone'],
  ['belgium', '比利时大奖赛', 'Belgian Grand Prix', '斯帕', 'Spa-Francorchamps'],
  ['hungary', '匈牙利大奖赛', 'Hungarian Grand Prix', '布达佩斯', 'Budapest'],
  ['netherlands', '荷兰大奖赛', 'Dutch Grand Prix', '赞德沃特', 'Zandvoort'],
  ['italy', '意大利大奖赛', 'Italian Grand Prix', '蒙扎', 'Monza'],
  ['spain', '西班牙大奖赛', 'Spanish Grand Prix', '马德里', 'Madrid'],
  ['azerbaijan', '阿塞拜疆大奖赛', 'Azerbaijan Grand Prix', '巴库', 'Baku'],
  [
    'bahrain-malaysia-tbc',
    '巴林大奖赛（马来西亚，待确认）',
    'Bahrain Grand Prix (Malaysia, TBC)',
    '雪邦',
    'Sepang',
  ],
  ['singapore', '新加坡大奖赛', 'Singapore Grand Prix', '新加坡', 'Singapore'],
  ['united-states', '美国大奖赛', 'United States Grand Prix', '奥斯汀', 'Austin'],
  ['mexico', '墨西哥大奖赛', 'Mexico City Grand Prix', '墨西哥城', 'Mexico City'],
  ['brazil', '巴西大奖赛', 'São Paulo Grand Prix', '圣保罗', 'São Paulo'],
  ['las-vegas', '拉斯维加斯大奖赛', 'Las Vegas Grand Prix', '拉斯维加斯', 'Las Vegas'],
  ['qatar', '卡塔尔大奖赛', 'Qatar Grand Prix', '多哈', 'Doha'],
  ['abu-dhabi', '阿布扎比大奖赛', 'Abu Dhabi Grand Prix', '亚斯码头', 'Yas Marina'],
].map(([id, zhName, enName, zhLocation, enLocation]) => ({
  id,
  name: { zh: zhName, en: enName },
  location: { zh: zhLocation, en: enLocation },
}));

const sessionTypes = {
  fp1: 'practice-1',
  fp2: 'practice-2',
  fp3: 'practice-3',
  sprintQualifying: 'sprint-qualifying',
  sprint: 'sprint',
  qualifying: 'qualifying',
  gp: 'race',
};

function parseDate(value) {
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(value);
  if (!match) throw new Error(`Unsupported date: ${value}`);
  const [, year, month, day, hour, minute, second] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
}

function parseEvents(raw) {
  const unfolded = raw.replace(/\r?\n[ \t]/g, '');
  return [...unfolded.matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)\r?\nEND:VEVENT/g)].map(
    ([, body]) => {
      const properties = new Map();
      for (const line of body.split(/\r?\n/)) {
        const separator = line.indexOf(':');
        if (separator < 0) continue;
        properties.set(line.slice(0, separator), line.slice(separator + 1));
      }
      return properties;
    }
  );
}

function createSeason(raw) {
  const events = parseEvents(raw);
  const byRound = new Map();
  let sourceUpdatedAt = '';

  for (const event of events) {
    const uid = event.get('UID') ?? '';
    const uidMatch = /#GP(\d+)_2026_([A-Za-z0-9]+)$/.exec(uid);
    if (!uidMatch) throw new Error(`Unsupported event UID: ${uid}`);

    const roundIndex = Number(uidMatch[1]);
    const roundMeta = rounds[roundIndex];
    const type = sessionTypes[uidMatch[2]];
    if (!roundMeta || !type) throw new Error(`Missing mapping for ${uid}`);

    const status = (event.get('STATUS') ?? 'CONFIRMED').toLowerCase();
    const [latitude, longitude] = (event.get('GEO') ?? '').split(';').map(Number);
    const session = {
      id: uid.slice(uid.lastIndexOf('#') + 1),
      type,
      startsAt: parseDate(event.get('DTSTART') ?? ''),
      endsAt: parseDate(event.get('DTEND') ?? ''),
      status,
    };
    const existing = byRound.get(roundIndex) ?? {
      round: roundIndex + 1,
      ...roundMeta,
      coordinates: { latitude, longitude },
      status,
      sessions: [],
    };
    existing.sessions.push(session);
    if (status !== 'confirmed') existing.status = status;
    byRound.set(roundIndex, existing);

    if (!sourceUpdatedAt) {
      sourceUpdatedAt = parseDate(event.get('DTSTAMP') ?? '');
    }
  }

  const normalizedRounds = [...byRound.values()]
    .sort((left, right) => left.round - right.round)
    .map((round) => ({
      ...round,
      sessions: round.sessions.sort((left, right) => left.startsAt.localeCompare(right.startsAt)),
    }));

  for (const round of normalizedRounds) {
    if (!round.sessions.some((session) => session.type === 'race')) {
      throw new Error(`Round ${round.round} has no race session`);
    }
  }

  return {
    schemaVersion: 1,
    season: 2026,
    source: 'f1calendar.com',
    sourceUpdatedAt,
    rounds: normalizedRounds,
  };
}

const inputPath = path.resolve(process.argv[2] ?? 'resources/f1/2026.ics');
const outputPath = path.resolve(process.argv[3] ?? 'src/lib/f1Season2026.generated.ts');
const season = createSeason(fs.readFileSync(inputPath, 'utf8'));
const output = `// Generated by scripts/import-f1-ics.mjs. Do not edit manually.\nexport const F1_SEASON_2026 = ${JSON.stringify(
  season,
  null,
  2
)} as const;\n`;
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output, 'utf8');
console.log(`Generated ${season.rounds.length} rounds at ${outputPath}`);
