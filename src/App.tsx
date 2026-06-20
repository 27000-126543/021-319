import React from 'react';
import { AppProvider } from './context/AppContext';
import UpdateRadar from './components/UpdateRadar';
import WorkList from './components/WorkList';
import WorkDetail from './components/WorkDetail';
import MustReadAlertManager from './components/MustReadAlert';
import { BookMarked } from 'lucide-react';
import './App.css';

const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="app-container">
        <header className="app-header">
          <div className="header-left">
            <BookMarked size={28} className="app-logo" />
            <h1 className="app-title">追更控制台</h1>
            <span className="app-subtitle">资深读者的网文管理工具</span>
          </div>
          <div className="header-right">
            <span className="header-time">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </span>
          </div>
        </header>

        <main className="app-main">
          <div className="radar-section">
            <UpdateRadar />
          </div>

          <div className="content-section">
            <aside className="sidebar">
              <WorkList />
            </aside>
            <section className="main-content">
              <WorkDetail />
            </section>
          </div>
        </main>

        <MustReadAlertManager />
      </div>
    </AppProvider>
  );
};

export default App;
