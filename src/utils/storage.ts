import { Work, WorkGroup, TimeRange } from '../types';

const STORAGE_KEY = 'novel-tracker-data';

interface StoredData {
  works: Work[];
  groups: WorkGroup[];
}

export const loadFromStorage = (): StoredData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load from storage', e);
  }
  return null;
};

export const saveToStorage = (works: Work[], groups: WorkGroup[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ works, groups }));
  } catch (e) {
    console.error('Failed to save to storage', e);
  }
};

export const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) {
    return `${minutes} 分钟前`;
  } else if (hours < 24) {
    return `${hours} 小时前`;
  } else if (days < 7) {
    return `${days} 天前`;
  } else {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
};

export const formatTimeRange = (range: TimeRange): string => {
  const labels: Record<TimeRange, string> = {
    1: '最近 1 小时',
    6: '最近 6 小时',
    24: '最近 24 小时',
    72: '最近 3 天',
    168: '最近 7 天',
  };
  return labels[range];
};

export const formatWordCount = (count: number): string => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return `${count}`;
};

export const getRecentChapters = (works: Work[], hours: TimeRange = 24) => {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  const result: { work: Work; chapter: typeof works[0]['chapters'][0] }[] = [];

  works.forEach((work) => {
    work.chapters.forEach((chapter) => {
      if (chapter.publishTime > cutoff) {
        result.push({ work, chapter });
      }
    });
  });

  return result.sort((a, b) => b.chapter.publishTime - a.chapter.publishTime);
};

export const getUnreadChaptersSinceLastRead = (work: Work) => {
  return work.chapters
    .filter((ch) => !ch.isRead && ch.chapterNumber > work.lastReadChapter)
    .sort((a, b) => a.chapterNumber - b.chapterNumber);
};

export const isFeedThresholdMet = (work: Work): boolean => {
  if (work.priority !== 'feed') return false;
  const unreadCount = getUnreadChaptersSinceLastRead(work).length;
  return unreadCount >= work.feedThreshold;
};

export const getFeedProgress = (work: Work): { current: number; threshold: number; percentage: number } => {
  const current = getUnreadChaptersSinceLastRead(work).length;
  const threshold = work.feedThreshold;
  return {
    current,
    threshold,
    percentage: Math.min(100, (current / threshold) * 100),
  };
};

export const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    'must-read': '必看',
    'feed': '养肥',
    'abandoned': '弃坑观察',
  };
  return labels[priority] || priority;
};

export const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    'must-read': '#ff4757',
    'feed': '#ffa502',
    'abandoned': '#a4b0be',
  };
  return colors[priority] || '#747d8c';
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const getWorksByGroup = (works: Work[], groups: WorkGroup[], groupId: string): Work[] => {
  const group = groups.find((g) => g.id === groupId);
  if (!group) return [];
  return works.filter((w) => group.workIds.includes(w.id));
};
