import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Star,
  DollarSign,
  Clock,
  Globe,
  Flag,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Users,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTimeAgo, formatWordCount, getPriorityLabel, getPriorityColor } from '../utils/storage';
import { PriorityStatus } from '../types';

const WorkDetail: React.FC = () => {
  const {
    selectedWorkId,
    works,
    markChapterRead,
    updateWorkPriority,
    updateWorkExpectation,
    addNote,
    updateNote,
    deleteNote,
    addCharacter,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'chapters' | 'notes' | 'characters'>('chapters');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [newNoteType, setNewNoteType] = useState<'plot' | 'character' | 'general'>('general');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharDesc, setNewCharDesc] = useState('');
  const [showAddChar, setShowAddChar] = useState(false);

  const work = useMemo(
    () => works.find((w) => w.id === selectedWorkId),
    [works, selectedWorkId]
  );

  if (!selectedWorkId || !work) {
    return (
      <div className="work-detail empty">
        <div className="empty-detail">
          <BookOpen size={64} className="empty-icon" />
          <h3>选择一本作品查看详情</h3>
          <p>从左侧书架中选择一本作品，查看更新记录、追更笔记和角色关系</p>
        </div>
      </div>
    );
  }

  const unreadCount = work.chapters.filter((ch) => !ch.isRead).length;
  const progress = (work.lastReadChapter / work.totalChapters) * 100;

  const handleAddNote = () => {
    if (newNoteContent.trim()) {
      addNote(work.id, newNoteType, newNoteContent.trim());
      setNewNoteContent('');
      setShowAddNote(false);
    }
  };

  const handleUpdateNote = (noteId: string) => {
    if (editNoteContent.trim()) {
      updateNote(work.id, noteId, editNoteContent.trim());
      setEditingNoteId(null);
    }
  };

  const handleAddCharacter = () => {
    if (newCharName.trim() && newCharDesc.trim()) {
      addCharacter(work.id, newCharName.trim(), newCharDesc.trim());
      setNewCharName('');
      setNewCharDesc('');
      setShowAddChar(false);
    }
  };

  const priorityOptions: PriorityStatus[] = ['must-read', 'feed', 'abandoned'];

  const noteTypeLabels: Record<string, string> = {
    plot: '剧情进展',
    character: '角色分析',
    general: '杂记',
  };

  return (
    <div className="work-detail">
      <div className="detail-header">
        <div className="detail-cover">{work.cover}</div>
        <div className="detail-info">
          <h2 className="detail-title">{work.title}</h2>
          <p className="detail-author">作者：{work.author}</p>
          <div className="detail-meta">
            <span className="meta-tag">
              <Globe size={14} />
              {work.sourceSite}
            </span>
            <span className="meta-tag">
              <Flag size={14} />
              {work.category}
            </span>
            {work.isPaid && (
              <span className="meta-tag paid">
                <DollarSign size={14} />
                VIP 付费
              </span>
            )}
          </div>
        </div>

        <div className="detail-actions">
          <div className="priority-selector">
            <span className="selector-label">追更优先级:</span>
            <div className="priority-options">
              {priorityOptions.map((p) => (
                <button
                  key={p}
                  className={`priority-btn ${work.priority === p ? 'active' : ''}`}
                  style={{
                    borderColor: getPriorityColor(p),
                    color: work.priority === p ? '#fff' : getPriorityColor(p),
                    backgroundColor: work.priority === p ? getPriorityColor(p) : 'transparent',
                  }}
                  onClick={() => updateWorkPriority(work.id, p)}
                >
                  {getPriorityLabel(p)}
                </button>
              ))}
            </div>
          </div>

          <div className="expectation-selector">
            <span className="selector-label">期待值:</span>
            <div className="expectation-stars-large">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={24}
                  className={`star-icon ${i < work.expectation ? 'filled' : ''}`}
                  onClick={() => updateWorkExpectation(work.id, i + 1)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="detail-stats">
        <div className="stat-card">
          <span className="stat-value">{work.lastReadChapter}</span>
          <span className="stat-label">已读章节</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{unreadCount}</span>
          <span className="stat-label">待读章节</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{work.totalChapters}</span>
          <span className="stat-label">总章节</span>
        </div>
        <div className="stat-card progress-card">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="progress-label">阅读进度 {progress.toFixed(1)}%</span>
        </div>
      </div>

      {work.priority === 'feed' && (
        <div className="feed-notice">
          <Clock size={20} />
          <span>
            养肥模式：累计 {unreadCount} 章未读 / 阈值 {work.feedThreshold} 章
          </span>
          {unreadCount >= work.feedThreshold && (
            <span className="feed-alert">已达到养肥提醒阈值！</span>
          )}
        </div>
      )}

      <div className="detail-tabs">
        <button
          className={`tab-btn ${activeTab === 'chapters' ? 'active' : ''}`}
          onClick={() => setActiveTab('chapters')}
        >
          <FileText size={18} />
          章节列表
        </button>
        <button
          className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <Edit3 size={18} />
          追更笔记
        </button>
        <button
          className={`tab-btn ${activeTab === 'characters' ? 'active' : ''}`}
          onClick={() => setActiveTab('characters')}
        >
          <Users size={18} />
          角色关系
        </button>
      </div>

      <div className="detail-content">
        {activeTab === 'chapters' && (
          <div className="chapters-panel">
            <div className="chapters-list">
              {[...work.chapters].reverse().map((chapter) => (
                <div
                  key={chapter.id}
                  className={`chapter-item ${chapter.isRead ? 'read' : 'unread'}`}
                >
                  <div className="chapter-item-info">
                    <h4 className="chapter-item-title">
                      <ChevronRight size={16} className="chapter-arrow" />
                      {chapter.title}
                    </h4>
                    <div className="chapter-item-meta">
                      <span className="meta-text">
                        <Clock size={12} />
                        {formatTimeAgo(chapter.publishTime)}
                      </span>
                      <span className="meta-text">
                        <BookOpen size={12} />
                        {formatWordCount(chapter.wordCount)}字
                      </span>
                    </div>
                  </div>
                  {!chapter.isRead && (
                    <button
                      className="mark-read-btn-small"
                      onClick={() => markChapterRead(work.id, chapter.id)}
                    >
                      标记已读
                    </button>
                  )}
                  {chapter.isRead && <span className="read-badge">已读</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="notes-panel">
            {!showAddNote ? (
              <button
                className="add-note-btn"
                onClick={() => setShowAddNote(true)}
              >
                <Plus size={18} />
                添加笔记
              </button>
            ) : (
              <div className="add-note-form">
                <div className="note-type-selector">
                  {(['plot', 'character', 'general'] as const).map((type) => (
                    <button
                      key={type}
                      className={`type-btn ${newNoteType === type ? 'active' : ''}`}
                      onClick={() => setNewNoteType(type)}
                    >
                      {noteTypeLabels[type]}
                    </button>
                  ))}
                </div>
                <textarea
                  className="note-textarea"
                  placeholder="写下你的笔记..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={4}
                />
                <div className="form-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => setShowAddNote(false)}
                  >
                    <X size={16} />
                    取消
                  </button>
                  <button
                    className="btn-save"
                    onClick={handleAddNote}
                  >
                    <Save size={16} />
                    保存
                  </button>
                </div>
              </div>
            )}

            <div className="notes-list">
              {work.notes.length === 0 ? (
                <div className="empty-notes">
                  <Edit3 size={40} />
                  <p>还没有笔记，添加一条开始记录吧</p>
                </div>
              ) : (
                work.notes.map((note) => (
                  <div key={note.id} className="note-card">
                    <div className="note-header">
                      <span className={`note-type-tag type-${note.type}`}>
                        {noteTypeLabels[note.type]}
                      </span>
                      <span className="note-date">
                        {formatTimeAgo(note.updatedAt)}更新
                      </span>
                    </div>
                    {editingNoteId === note.id ? (
                      <div className="note-edit-form">
                        <textarea
                          className="note-textarea"
                          value={editNoteContent}
                          onChange={(e) => setEditNoteContent(e.target.value)}
                          rows={3}
                        />
                        <div className="form-actions">
                          <button
                            className="btn-cancel-small"
                            onClick={() => setEditingNoteId(null)}
                          >
                            取消
                          </button>
                          <button
                            className="btn-save-small"
                            onClick={() => handleUpdateNote(note.id)}
                          >
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="note-content">{note.content}</p>
                        <div className="note-actions">
                          <button
                            className="note-action-btn"
                            onClick={() => {
                              setEditingNoteId(note.id);
                              setEditNoteContent(note.content);
                            }}
                          >
                            <Edit3 size={14} />
                            编辑
                          </button>
                          <button
                            className="note-action-btn delete"
                            onClick={() => deleteNote(work.id, note.id)}
                          >
                            <Trash2 size={14} />
                            删除
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'characters' && (
          <div className="characters-panel">
            {!showAddChar ? (
              <button
                className="add-note-btn"
                onClick={() => setShowAddChar(true)}
              >
                <Plus size={18} />
                添加角色
              </button>
            ) : (
              <div className="add-char-form">
                <input
                  type="text"
                  className="char-input"
                  placeholder="角色名"
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                />
                <textarea
                  className="note-textarea"
                  placeholder="角色描述..."
                  value={newCharDesc}
                  onChange={(e) => setNewCharDesc(e.target.value)}
                  rows={3}
                />
                <div className="form-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => setShowAddChar(false)}
                  >
                    <X size={16} />
                    取消
                  </button>
                  <button
                    className="btn-save"
                    onClick={handleAddCharacter}
                  >
                    <Save size={16} />
                    添加
                  </button>
                </div>
              </div>
            )}

            <div className="characters-list">
              {work.characters.length === 0 ? (
                <div className="empty-notes">
                  <Users size={40} />
                  <p>还没有角色记录</p>
                </div>
              ) : (
                work.characters.map((char) => (
                  <div key={char.id} className="character-card">
                    <div className="char-avatar">
                      {char.name.charAt(0)}
                    </div>
                    <div className="char-info">
                      <h4 className="char-name">{char.name}</h4>
                      <p className="char-desc">{char.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkDetail;
