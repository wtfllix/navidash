import { Bookmark } from '@/types';

const defaultBookmarks: Bookmark[] = [
  {
    "id": "search-ai",
    "title": "Search & AI",
    "icon": "search",
    "children": [
      { "id": "google", "title": "Google", "url": "https://google.com", "icon": "chrome" },
      { "id": "bing", "title": "Bing", "url": "https://bing.com", "icon": "globe" },
      { "id": "chatgpt", "title": "ChatGPT", "url": "https://chat.openai.com", "icon": "bot" },
      { "id": "claude", "title": "Claude", "url": "https://claude.ai", "icon": "brain" },
      { "id": "perplexity", "title": "Perplexity", "url": "https://perplexity.ai", "icon": "sparkles" }
    ]
  },
  {
    "id": "dev",
    "title": "Development",
    "icon": "code",
    "children": [
      { "id": "github", "title": "GitHub", "url": "https://github.com", "icon": "github" },
      { "id": "gitlab", "title": "GitLab", "url": "https://gitlab.com", "icon": "gitlab" },
      { "id": "stackoverflow", "title": "Stack Overflow", "url": "https://stackoverflow.com", "icon": "layers" },
      { "id": "mdn", "title": "MDN Web Docs", "url": "https://developer.mozilla.org", "icon": "book" },
      { "id": "vercel", "title": "Vercel", "url": "https://vercel.com", "icon": "server" },
      { "id": "react", "title": "React", "url": "https://react.dev", "icon": "code" },
      { "id": "nextjs", "title": "Next.js", "url": "https://nextjs.org", "icon": "cpu" }
    ]
  },
  {
    "id": "design",
    "title": "Design & Tools",
    "icon": "tool",
    "children": [
      { "id": "figma", "title": "Figma", "url": "https://figma.com", "icon": "figma" },
      { "id": "dribbble", "title": "Dribbble", "url": "https://dribbble.com", "icon": "dribbble" },
      { "id": "pinterest", "title": "Pinterest", "url": "https://pinterest.com", "icon": "image" },
      { "id": "notion", "title": "Notion", "url": "https://notion.so", "icon": "file" },
      { "id": "trello", "title": "Trello", "url": "https://trello.com", "icon": "trello" }
    ]
  },
  {
    "id": "social",
    "title": "Social Media",
    "icon": "message",
    "children": [
      { "id": "twitter", "title": "Twitter / X", "url": "https://twitter.com", "icon": "twitter" },
      { "id": "instagram", "title": "Instagram", "url": "https://instagram.com", "icon": "instagram" },
      { "id": "facebook", "title": "Facebook", "url": "https://facebook.com", "icon": "facebook" },
      { "id": "linkedin", "title": "LinkedIn", "url": "https://linkedin.com", "icon": "linkedin" },
      { "id": "reddit", "title": "Reddit", "url": "https://reddit.com", "icon": "globe" },
      { "id": "discord", "title": "Discord", "url": "https://discord.com", "icon": "gamepad" }
    ]
  },
  {
    "id": "entertainment",
    "title": "Entertainment",
    "icon": "play",
    "children": [
      { "id": "youtube", "title": "YouTube", "url": "https://youtube.com", "icon": "youtube" },
      { "id": "twitch", "title": "Twitch", "url": "https://twitch.tv", "icon": "twitch" },
      { "id": "netflix", "title": "Netflix", "url": "https://netflix.com", "icon": "tv" },
      { "id": "spotify", "title": "Spotify", "url": "https://spotify.com", "icon": "music" },
      { "id": "bilibili", "title": "Bilibili", "url": "https://bilibili.com", "icon": "tv" }
    ]
  },
  {
    "id": "shopping",
    "title": "Shopping",
    "icon": "cart",
    "children": [
      { "id": "amazon", "title": "Amazon", "url": "https://amazon.com", "icon": "box" },
      { "id": "ebay", "title": "eBay", "url": "https://ebay.com", "icon": "tag" },
      { "id": "taobao", "title": "Taobao", "url": "https://taobao.com", "icon": "cart" }
    ]
  },
  {
    "id": "news",
    "title": "News & Tech",
    "icon": "newspaper",
    "children": [
      { "id": "hackernews", "title": "Hacker News", "url": "https://news.ycombinator.com", "icon": "terminal" },
      { "id": "producthunt", "title": "Product Hunt", "url": "https://producthunt.com", "icon": "box" },
      { "id": "techcrunch", "title": "TechCrunch", "url": "https://techcrunch.com", "icon": "monitor" }
    ]
  }
];

export const initialBookmarks: Bookmark[] = process.env.NEXT_PUBLIC_DEFAULT_BOOKMARKS
  ? (() => {
      try {
        return JSON.parse(process.env.NEXT_PUBLIC_DEFAULT_BOOKMARKS);
      } catch (e) {
        console.error('Failed to parse NEXT_PUBLIC_DEFAULT_BOOKMARKS', e);
        return defaultBookmarks;
      }
    })()
  : defaultBookmarks;
