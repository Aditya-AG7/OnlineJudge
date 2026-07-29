import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Trophy, Award, User, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './DashboardTiles.css';

export const DashboardTiles = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const tiles = [
    {
      id: 'problems',
      title: 'Practice Problems',
      description: 'Solve algorithm & data structure challenges live on the platform.',
      icon: Code2,
      badge: 'Active / Live',
      badgeClass: 'badge-live',
      active: true,
      route: '/problems',
    },
    {
      id: 'contests',
      title: 'Contests',
      description: 'Compete in real-time timed coding contests and rating rounds.',
      icon: Trophy,
      badge: 'Coming in v2',
      badgeClass: 'badge-v2',
      active: false,
      route: null,
    },
    {
      id: 'leaderboard',
      title: 'Leaderboard',
      description: 'Global rankings based on problem submissions and points.',
      icon: Award,
      badge: 'Coming soon',
      badgeClass: 'badge-soon',
      active: false,
      route: null,
    },
    {
      id: 'profile',
      title: 'My Profile',
      description: 'View your profile details, user role badge, and account metadata.',
      icon: User,
      badge: (user?.type || 'user').toUpperCase(),
      badgeClass: `badge-role role-${user?.type || 'user'}`,
      active: true,
      route: '/profile',
    },
  ];

  return (
    <div className="dashboard-tiles-wrapper">
      <div className="dashboard-tiles-header">
        <div className="header-greeting">
          <div className="greeting-badge">
            <Sparkles size={14} className="sparkle-icon" />
            <span>Navigation Workspace</span>
          </div>
          <h1 className="greeting-title">
            OnlineJudge <span className="title-red">Terminal</span>
          </h1>
          <p className="greeting-desc">
            Select a module to start practicing, review your profile, or explore platform features.
          </p>
        </div>
      </div>

      <div className="tiles-grid">
        {tiles.map((tile) => {
          const Icon = tile.icon;

          return (
            <div
              key={tile.id}
              className={`tile-card ${tile.active ? 'tile-enabled' : 'tile-disabled'}`}
              onClick={() => {
                if (tile.active && tile.route) {
                  navigate(tile.route);
                }
              }}
            >
              <div className="tile-card-header">
                <div className="tile-icon-box">
                  <Icon size={24} className="tile-icon" />
                </div>
                <span className={`tile-badge ${tile.badgeClass}`}>
                  {!tile.active && <Lock size={12} style={{ marginRight: 4 }} />}
                  {tile.badge}
                </span>
              </div>

              <div className="tile-card-body">
                <h3 className="tile-title">{tile.title}</h3>
                <p className="tile-description">{tile.description}</p>
              </div>

              <div className="tile-card-footer">
                {tile.active ? (
                  <span className="tile-action-link">
                    <span>Open Module</span>
                    <ArrowRight size={16} />
                  </span>
                ) : (
                  <span className="tile-disabled-text">Module Locked</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
