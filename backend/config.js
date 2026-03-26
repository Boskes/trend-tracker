/**
 * Trend Tracker — Configuration
 * Edit topics, subreddits, thresholds, and keywords here.
 */

export const TOPICS = [
  {
    id:       'claude-code',
    label:    'Claude Code',
    color:    '#7c6fff',
    keywords: ['claude code', 'claude.ai', 'anthropic claude'],
    subreddits: ['artificial', 'MachineLearning', 'programming', 'webdev', 'LocalLLaMA', 'ChatGPT', 'ClaudeAI'],
    youtubeQuery: 'Claude Code AI coding 2025',
  },
  {
    id:       'openclaw',
    label:    'OpenClaw',
    color:    '#00d4aa',
    keywords: ['openclaw', 'open claw'],
    subreddits: ['artificial', 'selfhosted', 'homelab', 'programming'],
    youtubeQuery: 'OpenClaw AI assistant',
  },
  {
    id:       'ai-tools',
    label:    'AI Tools',
    color:    '#f59e0b',
    keywords: ['cursor ai', 'copilot', 'windsurf', 'devin ai', 'codex openai', 'gemini code'],
    subreddits: ['artificial', 'MachineLearning', 'programming', 'ChatGPT', 'LocalLLaMA'],
    youtubeQuery: 'AI coding tools 2025 trending',
  },
  {
    id:       'anthropic',
    label:    'Anthropic',
    color:    '#ff5572',
    keywords: ['anthropic', 'claude 3', 'claude 4', 'claude sonnet', 'claude opus'],
    subreddits: ['artificial', 'MachineLearning', 'ClaudeAI', 'ChatGPT'],
    youtubeQuery: 'Anthropic Claude news 2025',
  },
];

export const THRESHOLDS = {
  reddit: {
    upvotes:  parseInt(process.env.REDDIT_UPVOTE_THRESHOLD)  || 50,
    comments: parseInt(process.env.REDDIT_COMMENT_THRESHOLD) || 20,
  },
  youtube: {
    views: parseInt(process.env.YOUTUBE_VIEW_THRESHOLD)  || 1000,
    likes: parseInt(process.env.YOUTUBE_LIKE_THRESHOLD)  || 50,
  },
};

export const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MINUTES) || 30;
