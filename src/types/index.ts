export type PriorityStatus = 'must-read' | 'feed' | 'abandoned';

export type CategoryType = '玄幻' | '言情' | '悬疑' | '同人' | '科幻' | '都市' | '历史' | '其他';

export type TimeRange = 1 | 6 | 24 | 72 | 168;

export interface Chapter {
  id: string;
  title: string;
  wordCount: number;
  publishTime: number;
  isRead: boolean;
  chapterNumber: number;
}

export interface Note {
  id: string;
  type: 'plot' | 'character' | 'general';
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  relations: {
    characterId: string;
    relation: string;
  }[];
}

export interface Work {
  id: string;
  title: string;
  author: string;
  cover: string;
  category: CategoryType;
  sourceSite: string;
  sourceUrl: string;
  lastReadChapter: number;
  totalChapters: number;
  expectation: number;
  isPaid: boolean;
  priority: PriorityStatus;
  feedThreshold: number;
  chapters: Chapter[];
  notes: Note[];
  characters: Character[];
  lastChecked: number;
  addedAt: number;
  lastNotifiedChapter?: number;
}

export interface WorkGroup {
  id: string;
  name: string;
  category: CategoryType;
  workIds: string[];
  isExpanded: boolean;
}

export type SortType = 'time' | 'wordCount' | 'title' | 'category';

export interface FilterOptions {
  category?: CategoryType;
  priority?: PriorityStatus;
  isPaid?: boolean;
  minWordCount?: number;
  groupId?: string;
  timeRange?: TimeRange;
  hideUnmetFeedThreshold?: boolean;
}
