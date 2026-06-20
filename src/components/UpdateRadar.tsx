import React, { useMemo, useState } from 'react';
import {
  Radar,
  Filter,
  Clock,
  BookOpen,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Folder,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getRecentChapters,
  formatTimeAgo,
  formatWordCount,
  getPriorityColor,
  formatTimeRange,
  isFeedThresholdMet,
  getFeedProgress,
  getUnreadChaptersSinceLastRead,
} from '../utils/storage';
import { CategoryType, PriorityStatus, SortType, TimeRange } from '../types';

const UpdateRadar: React.FC = () => {
  const {
    works,
    groups,
    radarFilter,
    setRadarFilter,
    radarSort,
    setRadarSort,
    markChapterRead,
    setSelectedWorkId,
    getNewChaptersCount,
  } = useApp();
  const [isExpanded, setIsExpanded] = useState(true);

  const timeRanges: TimeRange[] = [1, 6, 24, 72, 168];
  const categories: (CategoryType | 'all')[] = ['all', '玄幻', '言情', '悬疑', '同人', '科幻', '都市', '历史', '其他'];
  const priorities: (PriorityStatus | 'all')[] = ['all', 'must-read', 'feed', 'abandoned'];

  const priorityLabels: Record<string, string> = {
    all: '全部',
    'must-read': '必看',
    feed: '养肥',
    abandoned: '弃坑',
  };

  const sortLabels: Record<SortType, string> = {
    time: '更新时间（新→旧）',
    wordCount: '字数（多→少）',
    title: '作品名（A→Z）',
    category: '分类',
  };

  const currentTimeRange = radarFilter.timeRange || 24;

  const allUpdates = useMemo(() => {
    return getRecentChapters(works, currentTimeRange);
  }, [works, currentTimeRange]);

  const recentUpdates = useMemo(() => {
    let updates = [...allUpdates];

    if (radarFilter.groupId) {
      const group = groups.find((g) => g.id === radarFilter.groupId);
      if (group) {
        updates = updates.filter((u) => group.workIds.includes(u.work.id));
      }
    }

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

    if (radarFilter.hideUnmetFeedThreshold) {
      updates = updates.filter((u) => {
        if (u.work.priority === 'feed') {
          return isFeedThresholdMet(u.work);
        }
        return true;
      });
    }

    if (radarSort === 'time') {
      updates.sort((a, b) => b.chapter.publishTime - a.chapter.publishTime);
    } else if (radarSort === 'wordCount') {
      updates.sort((a, b) => b.chapter.wordCount - a.chapter.wordCount);
    } else if (radarSort === 'title') {
      updates.sort((a, b) => a.work.title.localeCompare(b.work.title, 'zh-CN'));
    } else if (radarSort === 'category') {
      updates.sort((a, b) => a.work.category.localeCompare(b.work.category, 'zh-CN'));
    }

    return updates;
  }, [allUpdates, radarFilter, radarSort, groups]);

  const groupedByWork = useMemo(() => {
    const map = new Map<string, typeof recentUpdates>();
    recentUpdates.forEach((item) => {
      const existing = map.get(item.work.id) || [];
      existing.push(item);
      map.set(item.work.id, existing);
    });
    return map;
  }, [recentUpdates]);

  const mustReadCount = recentUpdates.filter(
    (u) => u.work.priority === 'must-read' && !u.chapter.isRead
  ).length;

  const feedReadyCount = [...new Set(recentUpdates.filter((u) => u.work.priority === 'feed').map((u) => u.work.id))].length;

  const handleWorkClick = (workId: string) => {
    setSelectedWorkId(workId);
  };

  const handleMarkRead = (e: React.MouseEvent, workId: string, chapterId: string) => {
    e.stopPropagation();
    markChapterRead(workId, chapterId);
  };

  const handleMarkAllRead = (e: React.MouseEvent, workId: string) => {
    e.stopPropagation();
    const chapters = recentUpdates
      .filter((u) => u.work.id === workId && !u.chapter.isRead)
      .map((u) => u.chapter.id);
    chapters.forEach((chapterId) => markChapterRead(workId, chapterId));
  };

  return (
    <div className="update-radar">
      <div className="radar-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="radar-title">
          <Radar size={20} className="radar-icon" />
          <h2>更新雷达</h2>
          <span className="radar-badge">
            {formatTimeRange(currentTimeRange)} · {recentUpdates.length} 章更新
          </span>
          {mustReadCount > 0 && (
            <span className="radar-must-read-badge">
              <Zap size={12} />
              {mustReadCount} 本必看待读
            </span>
          )}
          {feedReadyCount > 0 && (
            <span className="radar-feed-ready-badge">
              <AlertCircle size={12} />
              {feedReadyCount} 本养肥可看
            </span>
          )}
        </div>
        <button className="expand-btn">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="radar-filter-section">
            <div className="filter-section-header">
              <Filter size={16} />
              <span className="section-title">筛选条件（缩小范围）</span>
            </div>
            <div className="filter-rows">
              <div className="filter-row">
                <span className="filter-label">时间范围:</span>
                <div className="filter-buttons">
                  {timeRanges.map((range) => (
                    <button
                      key={range}
                      className={`filter-btn time-filter ${currentTimeRange === range ? 'active' : ''}`}
                      onClick={() =>
                        setRadarFilter({
                          ...radarFilter,
                          timeRange: range,
                        })
                      }
                    >
                      <Clock size={12} />
                      {formatTimeRange(range)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-row">
                <span className="filter-label">
                  <Folder size={12} />
                  作品分组:
                </span>
                <div className="filter-buttons">
                  <button
                    className={`filter-btn ${!radarFilter.groupId ? 'active' : ''}`}
                    onClick={() =>
                      setRadarFilter({
                        ...radarFilter,
                        groupId: undefined,
                      })
                    }
                  >
                    全部分组
                  </button>
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      className={`filter-btn ${radarFilter.groupId === group.id ? 'active' : ''}`}
                      onClick={() =>
                        setRadarFilter({
                          ...radarFilter,
                          groupId: group.id,
                        })
                      }
                    >
                      {group.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-row">
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

              <div className="filter-row">
                <span className="filter-label">
                  <TrendingUp size={12} />
                  优先级:
                </span>
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

              <div className="filter-row">
                <span className="filter-label">最低字数:</span>
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
                  <option value={2000}>2000字以上</option>
                  <option value={3000}>3000字以上</option>
                  <option value={5000}>5000字以上</option>
                </select>

                <span className="filter-label" style={{ marginLeft: '20px' }}>
                  付费状态:
                </span>
                <select
                  value={radarFilter.isPaid === undefined ? 'all' : String(radarFilter.isPaid)}
                  onChange={(e) =>
                    setRadarFilter({
                      ...radarFilter,
                      isPaid: e.target.value === 'all' ? undefined : e.target.value === 'true',
                    })
                  }
                  className="sort-select"
                >
                  <option value="all">全部</option>
                  <option value="true">仅付费</option>
                  <option value="false">仅免费</option>
                </select>

                <label className="toggle-label" style={{ marginLeft: '20px' }}>
                  <input
                    type="checkbox"
                    checked={radarFilter.hideUnmetFeedThreshold !== false}
                    onChange={(e) =>
                      setRadarFilter({
                        ...radarFilter,
                        hideUnmetFeedThreshold: e.target.checked,
                      })
                    }
                  />
                  <span>隐藏未达养肥阈值的作品</span>
                </label>
              </div>
            </div>
          </div>

          <div className="radar-sort-section">
            <div className="filter-section-header">
              <ArrowUpDown size={16} />
              <span className="section-title">排序方式（调整顺序）</span>
            </div>
            <div className="sort-options">
              {(Object.keys(sortLabels) as SortType[]).map((sort) => (
                <button
                  key={sort}
                  className={`sort-btn ${radarSort === sort ? 'active' : ''}`}
                  onClick={() => setRadarSort(sort)}
                >
                  {sortLabels[sort]}
                </button>
              ))}
            </div>
          </div>

          <div className="radar-updates">
            {recentUpdates.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={48} />
                <p>当前筛选条件下没有更新</p>
                <p className="empty-hint">试试调整筛选条件或时间范围</p>
              </div>
            ) : (
              <div className="updates-grid">
                {Array.from(groupedByWork.entries()).map(([workId, items]) => {
                  const work = items[0].work;
                  const unreadCount = items.filter((i) => !i.chapter.isRead).length;
                  const newChaptersCount = getNewChaptersCount(workId);
                  const feedReady = work.priority === 'feed' && isFeedThresholdMet(work);
                  const feedProgress = getFeedProgress(work);

                  return (
                    <div
                      key={workId}
                      className={`update-card-group ${feedReady ? 'feed-ready' : ''}`}
                      onClick={() => handleWorkClick(workId)}
                    >
                      <div className="update-card-group-header">
                        <span className="work-cover">{work.cover}</span>
                        <div className="work-info">
                          <h4 className="work-title">{work.title}</h4>
                          <span className="work-author">{work.author}</span>
                        </div>
                        <span
                          className="priority-dot"
                          style={{ backgroundColor: getPriorityColor(work.priority) }}
                        />
                        {unreadCount > 0 && (
                          <span className="unread-count-badge">{unreadCount}</span>
                        )}
                      </div>

                      {feedReady && (
                        <div className="feed-ready-notice">
                          <Zap size={14} />
                          <span>
                            养肥完成！本次攒了 {newChaptersCount} 章
                            （{feedProgress.current}/{feedProgress.threshold}）
                          </span>
                        </div>
                      )}

                      {work.priority === 'feed' && !feedReady && (
                        <div className="feed-progress-bar">
                          <div className="feed-progress-label">
                            <span>养肥进度</span>
                            <span>
                              {feedProgress.current}/{feedProgress.threshold} 章
                            </span>
                          </div>
                          <div className="feed-progress-track">
                            <div
                              className="feed-progress-fill"
                              style={{ width: `${feedProgress.percentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="updates-chapter-list">
                        {items.map(({ chapter }) => (
                          <div
                            key={chapter.id}
                            className={`chapter-row ${chapter.isRead ? 'read' : ''}`}
                          >
                            <div className="chapter-row-info">
                              <p className="chapter-title">{chapter.title}</p>
                              <div className="chapter-meta">
                                <span className="meta-item">
                                  <Clock size={12} />
                                  {formatTimeAgo(chapter.publishTime)}
                                </span>
                                <span className="meta-item">
                                  <BookOpen size={12} />
                                  {formatWordCount(chapter.wordCount)}字
                                </span>
                                <span className="meta-item category-tag">
                                  {work.category}
                                </span>
                              </div>
                            </div>
                            {!chapter.isRead && (
                              <button
                                className="mark-read-btn-small"
                                onClick={(e) => handleMarkRead(e, workId, chapter.id)}
                              >
                                已读
                              </button>
                            )}
                            {chapter.isRead && (
                              <span className="read-badge-small">已读</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {unreadCount > 1 && (
                        <div className="card-group-actions">
                          <button
                            className="mark-all-read-btn"
                            onClick={(e) => handleMarkAllRead(e, workId)}
                          >
                            全部标为已读
                          </button>
                        </div>
                      )}

                      {work.isPaid && <span className="paid-badge">VIP</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UpdateRadar;
