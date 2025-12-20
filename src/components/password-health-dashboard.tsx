import { useState, useEffect, useCallback } from 'react';
import { PasswordEntry } from '../types/password';
import { passwordAnalysisService, PasswordHealth, PasswordAnalytics } from '../services/password-analysis-service';
import { PasswordStrengthIndicator } from './password-strength-indicator';

interface PasswordHealthDashboardProps {
  passwords: PasswordEntry[];
  onPasswordEdit: (password: PasswordEntry) => void;
  onClose: () => void;
}

export function PasswordHealthDashboard({ passwords, onPasswordEdit, onClose }: PasswordHealthDashboardProps) {
  const [health, setHealth] = useState<PasswordHealth | null>(null);
  const [analytics, setAnalytics] = useState<PasswordAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'weak' | 'duplicates' | 'old' | 'analytics'>('overview');
  const [weakPasswords, setWeakPasswords] = useState<PasswordEntry[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<Array<{
    password: string;
    count: number;
    websites: string[];
    ids: string[];
  }>>([]);
  const [oldPasswords, setOldPasswords] = useState<Array<{
    id: string;
    website: string;
    daysOld: number;
  }>>([]);

  const analyzePasswords = useCallback(() => {
    const healthData = passwordAnalysisService.analyzePasswordHealth(passwords);
    setHealth(healthData);

    const analyticsData = passwordAnalysisService.generatePasswordAnalytics(passwords);
    setAnalytics(analyticsData);

    // Find weak passwords
    const weak = passwords.filter(p => {
      const strength = passwordAnalysisService.analyzePasswordStrength(p.password);
      return strength.score <= 2;
    });
    setWeakPasswords(weak);

    // Find duplicates
    const duplicates = passwordAnalysisService.findDuplicatePasswords(passwords);
    setDuplicateGroups(duplicates);

    // Find old passwords
    const old = passwordAnalysisService.findOldPasswords(passwords);
    setOldPasswords(old);
  }, [passwords]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return '🛡️';
    if (score >= 60) return '⚠️';
    return '🚨';
  };

  const findPasswordById = (id: string) => passwords.find(p => p.id === id);

  useEffect(() => {
    if (passwords.length > 0) {
      analyzePasswords();
    }
  }, [passwords, analyzePasswords]);

  if (!health || !analytics) {
    return (
      <div className="theme-settings-container">
        <div className="flex items-center justify-center p-8">
          <div className="themed-text-secondary">Analyzing passwords...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-settings-container max-h-[80vh] overflow-hidden flex flex-col">
      <div className="theme-settings-header">
        <h3 className="theme-settings-title">Password Health Dashboard</h3>
        <button
          onClick={onClose}
          className="theme-settings-close-btn"
          title="Close dashboard"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b themed-border px-4">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'weak', label: `Weak (${health.weak})`, icon: '🔴' },
          { id: 'duplicates', label: `Duplicates (${duplicateGroups.length})`, icon: '👥' },
          { id: 'old', label: `Old (${health.old})`, icon: '📅' },
          { id: 'analytics', label: 'Analytics', icon: '📈' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'all' | 'weak' | 'breached' | 'duplicates' | 'old' | 'analytics')}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[var(--accent-500)] text-[var(--accent-500)]'
                : 'border-transparent themed-text-secondary hover:themed-text-primary'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="p-4 rounded-lg themed-bg-secondary themed-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium themed-text-primary">Overall Security Score</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getScoreIcon(health.overallScore)}</span>
                  <span className={`text-2xl font-bold ${getScoreColor(health.overallScore)}`}>
                    {health.overallScore}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${health.overallScore}%`,
                    backgroundColor: health.overallScore >= 80 ? '#16a34a' : health.overallScore >= 60 ? '#eab308' : '#ef4444'
                  }}
                />
              </div>
            </div>

            {/* Security Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg themed-bg-secondary themed-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm themed-text-secondary">Total Passwords</span>
                  <span className="text-xl font-bold themed-text-primary">{health.total}</span>
                </div>
                <div className="text-xs themed-text-secondary">
                  Your password collection
                </div>
              </div>

              <div className="p-4 rounded-lg themed-bg-secondary themed-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm themed-text-secondary">Average Strength</span>
                  <span className="text-xl font-bold themed-text-primary">
                    {analytics.averageStrength.toFixed(1)}/5
                  </span>
                </div>
                <div className="text-xs themed-text-secondary">
                  Based on password complexity
                </div>
              </div>

              <div className="p-4 rounded-lg themed-bg-secondary themed-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm themed-text-secondary">Weak Passwords</span>
                  <span className="text-xl font-bold text-red-600 dark:text-red-400">{health.weak}</span>
                </div>
                <div className="text-xs themed-text-secondary">
                  {health.weak > 0 ? 'Need strengthening' : 'All passwords are strong!'}
                </div>
              </div>

              <div className="p-4 rounded-lg themed-bg-secondary themed-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm themed-text-secondary">Duplicates</span>
                  <span className="text-xl font-bold text-orange-600 dark:text-orange-400">{duplicateGroups.length}</span>
                </div>
                <div className="text-xs themed-text-secondary">
                  {duplicateGroups.length > 0 ? 'Reuse detected' : 'All unique passwords!'}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="p-4 rounded-lg themed-bg-secondary themed-border">
              <h4 className="text-sm font-medium themed-text-primary mb-3">🎯 Recommendations</h4>
              <div className="space-y-2">
                {health.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-[var(--accent-500)] mt-0.5">•</span>
                    <span className="text-sm themed-text-secondary">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Strength Distribution */}
            <div className="p-4 rounded-lg themed-bg-secondary themed-border">
              <h4 className="text-sm font-medium themed-text-primary mb-3">📊 Strength Distribution</h4>
              <div className="space-y-2">
                {Object.entries(analytics.strengthDistribution).map(([level, count]) => {
                  const colors = {
                    'very-weak': '#ef4444',
                    'weak': '#f97316',
                    'fair': '#eab308',
                    'good': '#22c55e',
                    'strong': '#16a34a'
                  };
                  const percentage = (count / health.total) * 100;
                  
                  return (
                    <div key={level} className="flex items-center space-x-3">
                      <div className="w-16 text-xs themed-text-secondary capitalize">
                        {level.replace('-', ' ')}
                      </div>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: colors[level as keyof typeof colors]
                          }}
                        />
                      </div>
                      <div className="w-8 text-xs themed-text-secondary text-right">
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Weak Passwords Tab */}
        {activeTab === 'weak' && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-700">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                🔴 Weak Passwords Detected
              </h4>
              <p className="text-xs text-red-700 dark:text-red-300">
                These passwords are vulnerable and should be strengthened immediately.
              </p>
            </div>

            {weakPasswords.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🎉</div>
                <div className="text-lg font-medium themed-text-primary mb-1">Great job!</div>
                <div className="text-sm themed-text-secondary">All your passwords are strong.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {weakPasswords.map((password) => (
                  <div key={password.id} className="p-4 rounded-lg themed-bg-secondary themed-border">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium themed-text-primary">{password.website}</div>
                        <div className="text-sm themed-text-secondary">{password.username}</div>
                      </div>
                      <button
                        onClick={() => onPasswordEdit(password)}
                        className="px-3 py-1 text-xs rounded themed-accent-bg hover:themed-accent-hover text-white"
                      >
                        Edit
                      </button>
                    </div>
                    <PasswordStrengthIndicator password={password.password} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Duplicates Tab */}
        {activeTab === 'duplicates' && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-700">
              <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                👥 Duplicate Passwords Found
              </h4>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                Using the same password for multiple accounts increases security risk.
              </p>
            </div>

            {duplicateGroups.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">✨</div>
                <div className="text-lg font-medium themed-text-primary mb-1">Excellent!</div>
                <div className="text-sm themed-text-secondary">All your passwords are unique.</div>
              </div>
            ) : (
              <div className="space-y-4">
                {duplicateGroups.map((group, index) => (
                  <div key={index} className="p-4 rounded-lg themed-bg-secondary themed-border">
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-sm font-medium themed-text-primary">
                        Used by {group.count} accounts
                      </div>
                      <div className="text-xs themed-text-secondary">
                        Password: {group.password.substring(0, 8)}...
                      </div>
                    </div>
                    <div className="space-y-2">
                      {group.ids.map((id) => {
                        const password = findPasswordById(id);
                        if (!password) return null;
                        
                        return (
                          <div key={id} className="flex justify-between items-center p-2 rounded themed-bg-primary">
                            <div>
                              <div className="text-sm themed-text-primary">{password.website}</div>
                              <div className="text-xs themed-text-secondary">{password.username}</div>
                            </div>
                            <button
                              onClick={() => onPasswordEdit(password)}
                              className="px-2 py-1 text-xs rounded themed-accent-bg hover:themed-accent-hover text-white"
                            >
                              Edit
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Old Passwords Tab */}
        {activeTab === 'old' && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                📅 Old Passwords Found
              </h4>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Passwords older than 1 year should be updated for better security.
              </p>
            </div>

            {oldPasswords.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🆕</div>
                <div className="text-lg font-medium themed-text-primary mb-1">Up to date!</div>
                <div className="text-sm themed-text-secondary">All your passwords are recent.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {oldPasswords.map((oldPassword) => {
                  const password = findPasswordById(oldPassword.id);
                  if (!password) return null;
                  
                  return (
                    <div key={oldPassword.id} className="p-4 rounded-lg themed-bg-secondary themed-border">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium themed-text-primary">{password.website}</div>
                          <div className="text-sm themed-text-secondary">{password.username}</div>
                          <div className="text-xs themed-text-secondary mt-1">
                            Last updated: {oldPassword.daysOld} days ago
                          </div>
                        </div>
                        <button
                          onClick={() => onPasswordEdit(password)}
                          className="px-3 py-1 text-xs rounded themed-accent-bg hover:themed-accent-hover text-white"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="p-4 rounded-lg themed-bg-secondary themed-border">
              <h4 className="text-sm font-medium themed-text-primary mb-3">📈 Security Trends</h4>
              {analytics.securityTrends.length > 0 ? (
                <div className="space-y-2">
                  {analytics.securityTrends.map((trend, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm themed-text-secondary">{trend.date}</span>
                      <span className="text-sm font-medium themed-text-primary">
                        {trend.score.toFixed(1)}/5
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm themed-text-secondary">
                  Not enough data for trends analysis
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg themed-bg-secondary themed-border">
              <h4 className="text-sm font-medium themed-text-primary mb-3">🎯 Most Common Issues</h4>
              {analytics.mostCommonWeaknesses.length > 0 ? (
                <div className="space-y-2">
                  {analytics.mostCommonWeaknesses.map((weakness, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-amber-500">•</span>
                      <span className="text-sm themed-text-secondary">{weakness}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm themed-text-secondary">
                  No common weaknesses found! 🎉
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
