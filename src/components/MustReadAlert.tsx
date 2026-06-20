import React, { useState, useEffect } from 'react';
import { Bell, X, BookOpen, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTimeAgo, formatWordCount } from '../utils/storage';

interface MustReadAlertProps {
  onClose: () => void;
  workId: string;
}

const MustReadAlert: React.FC<MustReadAlertProps> = ({ onClose, workId }) => {
  const { works, setSelectedWorkId, markChapterRead } = useApp();
  const [isVisible, setIsVisible] = useState(true);

  const work = works.find((w) => w.id === workId);
  if (!work) return null;

  const unreadChapters = work.chapters.filter((ch) => !ch.isRead);

  const handleViewDetail = () => {
    setSelectedWorkId(work.id);
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleMarkAllRead = () => {
    unreadChapters.forEach((ch) => markChapterRead(work.id, ch.id));
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`alert-popup ${isVisible ? 'show' : ''}`}>
      <div className="alert-header">
        <div className="alert-icon">
          <Bell size={24} />
        </div>
        <div className="alert-title">
          <h3>必看作品更新提醒</h3>
          <p>{work.title} 有 {unreadChapters.length} 章新内容</p>
        </div>
        <button className="alert-close" onClick={() => setIsVisible(false)}>
          <X size={20} />
        </button>
      </div>

      <div className="alert-content">
        <div className="alert-work-info">
          <span className="work-cover">{work.cover}</span>
          <div>
            <h4>{work.title}</h4>
            <span className="work-author">{work.author}</span>
          </div>
        </div>

        <div className="alert-chapters">
          {unreadChapters.slice(0, 3).map((chapter) => (
            <div key={chapter.id} className="alert-chapter">
              <BookOpen size={16} />
              <span className="chapter-title">{chapter.title}</span>
              <span className="chapter-meta">
                <Clock size={12} />
                {formatTimeAgo(chapter.publishTime)}
              </span>
              <span className="chapter-words">
                {formatWordCount(chapter.wordCount)}字
              </span>
            </div>
          ))}
          {unreadChapters.length > 3 && (
            <p className="more-chapters">还有 {unreadChapters.length - 3} 章...</p>
          )}
        </div>
      </div>

      <div className="alert-actions">
        <button className="btn-secondary" onClick={handleMarkAllRead}>
          全部标为已读
        </button>
        <button className="btn-primary" onClick={handleViewDetail}>
          立即查看
        </button>
      </div>
    </div>
  );
};

const MustReadAlertManager: React.FC = () => {
  const { works } = useApp();
  const [alerts, setAlerts] = useState<string[]>([]);
  const [dismissedWorks, setDismissedWorks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const mustReadWorks = works.filter(
      (w) =>
        w.priority === 'must-read' &&
        w.chapters.some((ch) => !ch.isRead) &&
        !dismissedWorks.has(w.id)
    );

    const newAlerts = mustReadWorks
      .filter((w) => {
        const newestChapter = [...w.chapters].sort(
          (a, b) => b.publishTime - a.publishTime
        )[0];
        return newestChapter && Date.now() - newestChapter.publishTime < 24 * 60 * 60 * 1000;
      })
      .map((w) => w.id);

    setAlerts(newAlerts);
  }, [works, dismissedWorks]);

  const handleClose = (workId: string) => {
    setDismissedWorks((prev) => new Set([...prev, workId]));
    setAlerts((prev) => prev.filter((id) => id !== workId));
  };

  return (
    <div className="alert-container">
      {alerts.slice(0, 3).map((workId, index) => (
        <MustReadAlert
          key={workId}
          workId={workId}
          onClose={() => handleClose(workId)}
        />
      ))}
    </div>
  );
};

export default MustReadAlertManager;
