import { Work, WorkGroup } from '../types';

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

export const formatWordCount = (count: number): string => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return `${count}`;
};

export const getRecentChapters = (works: Work[], hours: number = 24) => {
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
