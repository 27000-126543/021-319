import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Work, WorkGroup, FilterOptions, SortType, PriorityStatus, TimeRange } from '../types';
import { mockWorks, mockGroups } from '../data/mockData';
import {
  loadFromStorage,
  saveToStorage,
  generateId,
  getUnreadChaptersSinceLastRead,
  isFeedThresholdMet,
  getFeedProgress,
} from '../utils/storage';

interface AppContextType {
  works: Work[];
  groups: WorkGroup[];
  selectedWorkId: string | null;
  setSelectedWorkId: (id: string | null) => void;
  radarFilter: FilterOptions;
  setRadarFilter: (filter: FilterOptions) => void;
  radarSort: SortType;
  setRadarSort: (sort: SortType) => void;
  listFilter: FilterOptions;
  setListFilter: (filter: FilterOptions) => void;
  toggleGroup: (groupId: string) => void;
  markChapterRead: (workId: string, chapterId: string) => void;
  addNote: (workId: string, type: 'plot' | 'character' | 'general', content: string) => void;
  updateNote: (workId: string, noteId: string, content: string) => void;
  deleteNote: (workId: string, noteId: string) => void;
  addCharacter: (workId: string, name: string, description: string) => void;
  updateWorkPriority: (workId: string, priority: PriorityStatus) => void;
  updateWorkExpectation: (workId: string, expectation: number) => void;
  updateFeedThreshold: (workId: string, threshold: number) => void;
  getUnreadCount: (workId: string) => number;
  isFeedThresholdMet: (workId: string) => boolean;
  getFeedProgress: (workId: string) => { current: number; threshold: number; percentage: number };
  getNewChaptersCount: (workId: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [works, setWorks] = useState<Work[]>([]);
  const [groups, setGroups] = useState<WorkGroup[]>([]);
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [radarFilter, setRadarFilter] = useState<FilterOptions>({
    timeRange: 24,
    hideUnmetFeedThreshold: true,
  });
  const [radarSort, setRadarSort] = useState<SortType>('time');
  const [listFilter, setListFilter] = useState<FilterOptions>({});

  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      setWorks(stored.works);
      setGroups(stored.groups);
    } else {
      setWorks(mockWorks);
      setGroups(mockGroups);
    }
  }, []);

  useEffect(() => {
    if (works.length > 0 || groups.length > 0) {
      saveToStorage(works, groups);
    }
  }, [works, groups]);

  const toggleGroup = useCallback((groupId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, isExpanded: !g.isExpanded } : g
      )
    );
  }, []);

  const markChapterRead = useCallback((workId: string, chapterId: string) => {
    setWorks((prev) =>
      prev.map((work) => {
        if (work.id === workId) {
          const chapters = work.chapters.map((ch) =>
            ch.id === chapterId ? { ...ch, isRead: true } : ch
          );
          const readChapter = work.chapters.find((ch) => ch.id === chapterId);
          return {
            ...work,
            chapters,
            lastReadChapter: readChapter
              ? Math.max(work.lastReadChapter, readChapter.chapterNumber)
              : work.lastReadChapter,
            lastNotifiedChapter: readChapter
              ? Math.max(work.lastNotifiedChapter || 0, readChapter.chapterNumber)
              : work.lastNotifiedChapter,
          };
        }
        return work;
      })
    );
  }, []);

  const addNote = useCallback((workId: string, type: 'plot' | 'character' | 'general', content: string) => {
    const now = Date.now();
    setWorks((prev) =>
      prev.map((work) => {
        if (work.id === workId) {
          return {
            ...work,
            notes: [
              ...work.notes,
              { id: generateId(), type, content, createdAt: now, updatedAt: now },
            ],
          };
        }
        return work;
      })
    );
  }, []);

  const updateNote = useCallback((workId: string, noteId: string, content: string) => {
    const now = Date.now();
    setWorks((prev) =>
      prev.map((work) => {
        if (work.id === workId) {
          return {
            ...work,
            notes: work.notes.map((note) =>
              note.id === noteId ? { ...note, content, updatedAt: now } : note
            ),
          };
        }
        return work;
      })
    );
  }, []);

  const deleteNote = useCallback((workId: string, noteId: string) => {
    setWorks((prev) =>
      prev.map((work) => {
        if (work.id === workId) {
          return {
            ...work,
            notes: work.notes.filter((note) => note.id !== noteId),
          };
        }
        return work;
      })
    );
  }, []);

  const addCharacter = useCallback((workId: string, name: string, description: string) => {
    setWorks((prev) =>
      prev.map((work) => {
        if (work.id === workId) {
          return {
            ...work,
            characters: [
              ...work.characters,
              { id: generateId(), name, description, relations: [] },
            ],
          };
        }
        return work;
      })
    );
  }, []);

  const updateWorkPriority = useCallback((workId: string, priority: PriorityStatus) => {
    setWorks((prev) =>
      prev.map((work) =>
        work.id === workId ? { ...work, priority } : work
      )
    );
  }, []);

  const updateWorkExpectation = useCallback((workId: string, expectation: number) => {
    setWorks((prev) =>
      prev.map((work) =>
        work.id === workId ? { ...work, expectation } : work
      )
    );
  }, []);

  const updateFeedThreshold = useCallback((workId: string, threshold: number) => {
    setWorks((prev) =>
      prev.map((work) =>
        work.id === workId ? { ...work, feedThreshold: threshold } : work
      )
    );
  }, []);

  const getUnreadCount = useCallback(
    (workId: string) => {
      const work = works.find((w) => w.id === workId);
      if (!work) return 0;
      return work.chapters.filter((ch) => !ch.isRead).length;
    },
    [works]
  );

  const checkFeedThresholdMet = useCallback(
    (workId: string) => {
      const work = works.find((w) => w.id === workId);
      if (!work) return false;
      return isFeedThresholdMet(work);
    },
    [works]
  );

  const checkFeedProgress = useCallback(
    (workId: string) => {
      const work = works.find((w) => w.id === workId);
      if (!work) return { current: 0, threshold: 0, percentage: 0 };
      return getFeedProgress(work);
    },
    [works]
  );

  const getNewChaptersCount = useCallback(
    (workId: string) => {
      const work = works.find((w) => w.id === workId);
      if (!work) return 0;
      return getUnreadChaptersSinceLastRead(work).length;
    },
    [works]
  );

  const value = useMemo(
    () => ({
      works,
      groups,
      selectedWorkId,
      setSelectedWorkId,
      radarFilter,
      setRadarFilter,
      radarSort,
      setRadarSort,
      listFilter,
      setListFilter,
      toggleGroup,
      markChapterRead,
      addNote,
      updateNote,
      deleteNote,
      addCharacter,
      updateWorkPriority,
      updateWorkExpectation,
      updateFeedThreshold,
      getUnreadCount,
      isFeedThresholdMet: checkFeedThresholdMet,
      getFeedProgress: checkFeedProgress,
      getNewChaptersCount,
    }),
    [
      works,
      groups,
      selectedWorkId,
      radarFilter,
      radarSort,
      listFilter,
      toggleGroup,
      markChapterRead,
      addNote,
      updateNote,
      deleteNote,
      addCharacter,
      updateWorkPriority,
      updateWorkExpectation,
      updateFeedThreshold,
      getUnreadCount,
      checkFeedThresholdMet,
      checkFeedProgress,
      getNewChaptersCount,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
