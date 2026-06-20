import React, { useMemo, useState } from 'react';
import { Radar, Filter, Clock, BookOpen, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getRecentChapters, formatTimeAgo, formatWordCount, getPriorityColor } from '../utils/storage';
import { CategoryType, PriorityStatus, SortType } from '../types';

const UpdateRadar: React.FC = () => {
  const { works, radarFilter, setRadarFilter, radarSort, setRadarSort, markChapterRead, setSelectedWorkId } = useApp();
  const [isExpanded, setIsExpanded] = useState(true);

  const recentUpdates = useMemo(() => {
    let updates = getRecentChapters(works, 24);

    if (radarFilter.category) {
      updates = updates.filter((u) => u.work.category === radarFilter.category);
    }
    if (radarFilter.priority) {
      updates = updates.filter((u) => u.work.priority === radarFilter.priority);
    }
    if (radarFilter.isPaid !== undefined) {
      updates = updates.filter((u) => u.work.isPaid === radarFilter.isPaid);
    }
    if (radarFilter.minWordCount) {
      updates = updates.filter((u) => u.chapter.wordCount >= radarFilter.minWordCount!);
    }

    if (radarSort === 'time') {
      updates.sort((a, b) => b.chapter.publishTime - a.chapter.publishTime);
    } else if (radarSort === 'wordCount') {
      updates.sort((a, b) => b.chapter.wordCount - a.chapter.wordCount);
    } else if (radarSort === 'title') {
      updates.sort((a, b) => a.work.title.localeCompare(b.work.title));
    }

    return updates;
  }, [works, radarFilter, radarSort]);

  const categories: (CategoryType | 'all')[] = ['all', '玄幻', '言情', '悬疑', '同人', '科幻', '都市', '历史', '其他'];
  const priorities: (PriorityStatus | 'all')[] = ['all', 'must-read', 'feed', 'abandoned'];

  const priorityLabels: Record<string, string> = {
    all: '全部',
    'must-read': '必看',
    feed: '养肥',
    abandoned: '弃坑',
  };

  const handleWorkClick = (workId: string) => {
    setSelectedWorkId(workId);
  };

  const handleMarkRead = (e: React.MouseEvent, workId: string, chapterId: string) => {
    e.stopPropagation();
    markChapterRead(workId, chapterId);
  };

  const mustReadCount = recentUpdates.filter((u) => u.work.priority === 'must-read' && !u.chapter.isRead).length;

  return (
    <div className="update-radar">
      <div className="radar-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="radar-title">
          <Radar size={20} className="radar-icon" />
          <h2>更新雷达</h2>
          <span className="radar-badge">最近 24 小时 {recentUpdates.length} 章更新</span>
          {mustReadCount > 0 && (
            <span className="radar-must-read-badge">
              {mustReadCount} 本必看待读
            </span>
          )}
        </div>
        <button className="expand-btn">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="radar-filters">
            <div className="filter-group">
              <Filter size={16} />
              <span className="filter-label">分类:</span>
              <div className="filter-buttons">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`filter-btn ${(radarFilter.category || 'all') === cat ? 'active' : ''}`}
                    onClick={() =>
                      setRadarFilter({
                        ...radarFilter,
                        category: cat === 'all' ? undefined : (cat as CategoryType),
                      })
                    }
                  >
                    {cat === 'all' ? '全部' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <TrendingUp size={16} />
              <span className="filter-label">优先级:</span>
              <div className="filter-buttons">
                {priorities.map((p) => (
                  <button
                    key={p}
                    className={`filter-btn ${(radarFilter.priority || 'all') === p ? 'active' : ''}`}
                    onClick={() =>
                      setRadarFilter({
                        ...radarFilter,
                        priority: p === 'all' ? undefined : (p as PriorityStatus),
                      })
                    }
                  >
                    {priorityLabels[p]}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <span className="filter-label">排序:</span>
              <select
                value={radarSort}
                onChange={(e) => setRadarSort(e.target.value as SortType)}
                className="sort-select"
              >
                <option value="time">更新时间</option>
                <option value="wordCount">字数</option>
                <option value="title">作品名</option>
              </select>

              <span className="filter-label" style={{ marginLeft: '16px' }}>
                最低字数:
              </span>
              <select
                value={radarFilter.minWordCount || 0}
                onChange={(e) =>
                  setRadarFilter({
                    ...radarFilter,
                    minWordCount: Number(e.target.value) || undefined,
                  })
                }
                className="sort-select"
              >
                <option value={0}>不限</option>
                <option value={2000}>2000字</option>
                <option value={3000}>3000字</option>
                <option value={5000}>5000字</option>
              </select>
            </div>
          </div>

          <div className="radar-updates">
            {recentUpdates.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={48} />
                <p>最近 24 小时没有更新</p>
              </div>
            ) : (
              <div className="updates-grid">
                {recentUpdates.map(({ work, chapter }) => (
                  <div
                    key={`${work.id}-${chapter.id}`}
                    className={`update-card ${chapter.isRead ? 'read' : ''} ${work.priority === 'must-read' ? 'must-read' : ''}`}
                    onClick={() => handleWorkClick(work.id)}
                  >
                    <div className="update-card-header">
                      <span className="work-cover">{work.cover}</span>
                      <div className="work-info">
                        <h4 className="work-title">{work.title}</h4>
                        <span className="work-author">{work.author}</span>
                      </div>
                      <span
                        className="priority-dot"
                        style={{ backgroundColor: getPriorityColor(work.priority) }}
                      />
                    </div>
                    <div className="chapter-info">
                      <p className="chapter-title">{chapter.title}</p>
                      <div className="chapter-meta">
                        <span className="meta-item">
                          <Clock size={14} />
                          {formatTimeAgo(chapter.publishTime)}
                        </span>
                        <span className="meta-item">
                          <BookOpen size={14} />
                          {formatWordCount(chapter.wordCount)}字
                        </span>
                        <span className="meta-item category-tag">
                          {work.category}
                        </span>
                      </div>
                    </div>
                    {!chapter.isRead && (
                      <button
                        className="mark-read-btn"
                        onClick={(e) => handleMarkRead(e, work.id, chapter.id)}
                      >
                        标记已读
                      </button>
                    )}
                    {work.isPaid && <span className="paid-badge">VIP</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UpdateRadar;
