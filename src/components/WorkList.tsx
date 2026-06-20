import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Star,
  DollarSign,
  Search,
  Flame,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getPriorityColor, getPriorityLabel, formatTimeAgo } from '../utils/storage';
import { CategoryType, PriorityStatus } from '../types';

const WorkList: React.FC = () => {
  const {
    works,
    groups,
    selectedWorkId,
    setSelectedWorkId,
    toggleGroup,
    getUnreadCount,
    listFilter,
    setListFilter,
  } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWorks = useMemo(() => {
    let result = works;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          w.title.toLowerCase().includes(query) ||
          w.author.toLowerCase().includes(query)
      );
    }

    if (listFilter.priority) {
      result = result.filter((w) => w.priority === listFilter.priority);
    }

    if (listFilter.category) {
      result = result.filter((w) => w.category === listFilter.category);
    }

    if (listFilter.isPaid !== undefined) {
      result = result.filter((w) => w.isPaid === listFilter.isPaid);
    }

    return result;
  }, [works, searchQuery, listFilter]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery && !listFilter.priority && !listFilter.category && listFilter.isPaid === undefined) {
      return groups;
    }
    const filteredIds = new Set(filteredWorks.map((w) => w.id));
    return groups
      .map((g) => ({
        ...g,
        workIds: g.workIds.filter((id) => filteredIds.has(id)),
      }))
      .filter((g) => g.workIds.length > 0);
  }, [groups, filteredWorks, searchQuery, listFilter]);

  const workMap = useMemo(() => {
    const map = new Map<string, typeof works[0]>();
    works.forEach((w) => map.set(w.id, w));
    return map;
  }, [works]);

  const stats = useMemo(() => {
    const total = works.length;
    const mustRead = works.filter((w) => w.priority === 'must-read').length;
    const feeding = works.filter((w) => w.priority === 'feed').length;
    const abandoned = works.filter((w) => w.priority === 'abandoned').length;
    const unreadTotal = works.reduce((sum, w) => sum + getUnreadCount(w.id), 0);
    return { total, mustRead, feeding, abandoned, unreadTotal };
  }, [works, getUnreadCount]);

  return (
    <div className="work-list">
      <div className="list-header">
        <h2 className="list-title">我的书架</h2>
        <div className="list-stats">
          <span className="stat-item">
            <Flame size={14} />
            {stats.mustRead} 本必看
          </span>
          <span className="stat-item">
            <Clock size={14} />
            {stats.unreadTotal} 章待读
          </span>
        </div>
      </div>

      <div className="search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="搜索书名或作者..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="list-filters">
        <select
          value={listFilter.priority || ''}
          onChange={(e) =>
            setListFilter({
              ...listFilter,
              priority: e.target.value ? (e.target.value as PriorityStatus) : undefined,
            })
          }
          className="filter-select"
        >
          <option value="">全部优先级</option>
          <option value="must-read">必看</option>
          <option value="feed">养肥</option>
          <option value="abandoned">弃坑观察</option>
        </select>

        <select
          value={listFilter.category || ''}
          onChange={(e) =>
            setListFilter({
              ...listFilter,
              category: e.target.value ? (e.target.value as CategoryType) : undefined,
            })
          }
          className="filter-select"
        >
          <option value="">全部分类</option>
          <option value="玄幻">玄幻</option>
          <option value="言情">言情</option>
          <option value="悬疑">悬疑</option>
          <option value="同人">同人</option>
          <option value="科幻">科幻</option>
          <option value="都市">都市</option>
          <option value="历史">历史</option>
          <option value="其他">其他</option>
        </select>
      </div>

      <div className="groups-container">
        {filteredGroups.length === 0 ? (
          <div className="empty-state">
            <AlertTriangle size={40} />
            <p>没有找到匹配的作品</p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.id} className="work-group">
              <div
                className="group-header"
                onClick={() => toggleGroup(group.id)}
              >
                {group.isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                <span className="group-name">{group.name}</span>
                <span className="group-count">{group.workIds.length}</span>
              </div>

              {group.isExpanded && (
                <div className="group-works">
                  {group.workIds.map((workId) => {
                    const work = workMap.get(workId);
                    if (!work) return null;
                    const unreadCount = getUnreadCount(workId);

                    return (
                      <div
                        key={work.id}
                        className={`work-item ${selectedWorkId === work.id ? 'selected' : ''}`}
                        onClick={() => setSelectedWorkId(work.id)}
                      >
                        <div className="work-cover-small">{work.cover}</div>
                        <div className="work-item-info">
                          <div className="work-item-title">
                            <span className="title-text">{work.title}</span>
                            {unreadCount > 0 && (
                              <span className="unread-badge">{unreadCount}</span>
                            )}
                          </div>
                          <div className="work-item-meta">
                            <span
                              className="priority-tag"
                              style={{
                                backgroundColor: getPriorityColor(work.priority) + '20',
                                color: getPriorityColor(work.priority),
                              }}
                            >
                              {getPriorityLabel(work.priority)}
                            </span>
                            <span className="progress-text">
                              {work.lastReadChapter}/{work.totalChapters}
                            </span>
                          </div>
                          <div className="work-item-footer">
                            <div className="expectation-stars">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  className={i < work.expectation ? 'filled' : ''}
                                />
                              ))}
                            </div>
                            {work.isPaid && (
                              <span className="paid-indicator">
                                <DollarSign size={12} />
                                付费
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          className="priority-indicator"
                          style={{ backgroundColor: getPriorityColor(work.priority) }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkList;
