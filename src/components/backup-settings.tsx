import { useState, useEffect, ChangeEvent } from 'react';
import { backupPasswordService } from '../services/backup-service';
import { securityService } from '../services/security-service';
import type { BackupSettings } from '../types/backup';

interface BackupSettingsProps {
  onClose: () => void;
}

export function BackupSettings({ onClose }: BackupSettingsProps) {
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showEncryptionPassword, setShowEncryptionPassword] = useState(false);
  const [showDecryptionPassword, setShowDecryptionPassword] = useState(false);
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [autoBackupPassword, setAutoBackupPassword] = useState('');
  const [autoBackupPasswordError, setAutoBackupPasswordError] = useState('');
  const [decryptionPassword, setDecryptionPassword] = useState('');
  const [autoBackups, setAutoBackups] = useState<Array<{ date: string; data: string }>>([]);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<Record<string, unknown> | null>(null);

  const loadSecurityInfo = async () => {
    try {
      const status = await securityService.checkSecurityStatus();
      const info = securityService.getSecurityInfo();
      setSecurityStatus({ ...status, ...info });
    } catch (error) {
      console.error('Failed to load security info:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const currentSettings = await backupPasswordService.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Failed to load backup settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAutoBackups = async () => {
    try {
      const backups = await backupPasswordService.getAutoBackups();
      setAutoBackups(backups);
    } catch (error) {
      console.error('Failed to load auto backups:', error);
    }
  };

  const handleSettingsChange = async (newSettings: Partial<BackupSettings>) => {
    if (!settings) return;

    try {
      setIsSaving(true);
      const updatedSettings = { ...settings, ...newSettings };
      await backupPasswordService.updateSettings(newSettings);
      setSettings(updatedSettings);

      // Clear session password if user disables encryption
      if (newSettings.encryptionEnabled === false) {
        setAutoBackupPassword('');
        backupPasswordService.setAutoBackupPassword(null);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      alert('Failed to update backup settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportWithEncryption = async () => {
    try {
      if (settings?.encryptionEnabled) {
        if (!encryptionPassword) {
          alert('Please set an encryption password to export encrypted backups.');
          return;
        }
        await backupPasswordService.exportToFile(encryptionPassword);
      } else {
        await backupPasswordService.exportToFile();
      }

      setEncryptionPassword('');
      setShowEncryptionPassword(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export backup');
    }
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (settings?.encryptionEnabled && decryptionPassword) {
        await backupPasswordService.importFromFile(file, decryptionPassword);
      } else {
        await backupPasswordService.importFromFile(file);
      }
      
      alert('Backup imported successfully!');
      setDecryptionPassword('');
      setShowDecryptionPassword(false);
      loadAutoBackups();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import backup - check password and file format');
    } finally {
      event.target.value = '';
    }
  };

  const handleRestoreAutoBackup = async (index: number) => {
    const confirmed = confirm('This will replace all current passwords with the backup. Continue?');
    if (!confirmed) return;

    try {
      if (autoBackupPassword) {
        await backupPasswordService.restoreAutoBackup(index, autoBackupPassword);
      } else {
        await backupPasswordService.restoreAutoBackup(index);
      }
      
      alert('Backup restored successfully!');
      setAutoBackupPassword('');
      backupPasswordService.setAutoBackupPassword(null);
    } catch (error) {
      console.error('Restore failed:', error);
      alert('Failed to restore backup - check password');
    }
  };

  const handleDeleteAutoBackup = async (index: number) => {
    const confirmed = confirm('Delete this backup?');
    if (!confirmed) return;

    try {
      await backupPasswordService.deleteAutoBackup(index);
      loadAutoBackups();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete backup');
    }
  };

  const handleExportAllAutoBackups = async () => {
    try {
      const allBackups = await backupPasswordService.getAutoBackups();
      if (allBackups.length === 0) {
        alert('No auto backups to export');
        return;
      }

      const exportData = {
        autoBackups: allBackups,
        exportDate: new Date().toISOString(),
        version: '1.0',
        note: 'This file contains all automatic backups from the extension'
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `auto-backups-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`Successfully exported ${allBackups.length} auto backups!`);
    } catch (error) {
      console.error('Export all backups failed:', error);
      alert('Failed to export auto backups');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getIntervalText = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  useEffect(() => {
    loadSettings();
    loadAutoBackups();
    loadSecurityInfo();
  }, []);

  if (isLoading || !settings) {
    return (
      <div className="theme-settings-container">
        <div className="flex items-center justify-center p-8">
          <div className="themed-text-secondary">Loading backup settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-settings-container">
      <div className="theme-settings-header">
        <h3 className="theme-settings-title">Backup & Export Settings</h3>
        <button
          onClick={onClose}
          className="theme-settings-close-btn"
          title="Close backup settings"
        >
          ✕
        </button>
      </div>

      <div className="theme-settings-content">
        {/* Data Loss Warning */}
        <div className="theme-settings-section">
          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              ⚠️ Important: Data Loss Prevention
            </h4>
            <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• <strong>Auto backups are lost</strong> if extension is removed/disabled</li>
              <li>• <strong>Export manually</strong> to save backups permanently</li>
              <li>• <strong>Use "Export All"</strong> to save all auto backups to file</li>
              <li>• <strong>Store files safely</strong> - they contain your passwords</li>
            </ul>
          </div>
        </div>

        {/* Security Information */}
        <div className="theme-settings-section">
          <div className="flex justify-between items-center mb-2">
            <h4 className="theme-settings-section-title">🔒 Security & Privacy</h4>
            <button
              onClick={() => setShowSecurityInfo(!showSecurityInfo)}
              className="text-xs px-3 py-1 rounded themed-accent-bg hover:themed-accent-hover text-white"
            >
              {showSecurityInfo ? 'Hide' : 'Show'} Details
            </button>
          </div>
          
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-700">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-green-600 dark:text-green-400">✅</span>
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Your backups are secure and isolated
              </span>
            </div>
            <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
              <li>• <strong>Extension isolation:</strong> Other extensions cannot access your data</li>
              <li>• <strong>Chrome storage:</strong> Protected by browser security</li>
              <li>• <strong>Encryption available:</strong> AES-256 password protection</li>
              <li>• <strong>No network access:</strong> Data stays on your device</li>
            </ul>
            
            {showSecurityInfo && securityStatus && (
              <div className="mt-3 pt-3 border-t border-green-300 dark:border-green-600">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-green-600 dark:text-green-400">Extension ID:</span>
                    <span className="text-green-800 dark:text-green-200 font-mono">
                      {String(securityStatus.extensionId).substring(0, 16)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600 dark:text-green-400">Isolation Level:</span>
                    <span className="text-green-800 dark:text-green-200">
                      {String(securityStatus.isolationLevel)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600 dark:text-green-400">Security Status:</span>
                    <span className={`font-medium ${securityStatus.isSecure ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                      {securityStatus.isSecure ? '✅ Secure' : '⚠️ Issues detected'}
                    </span>
                  </div>
                  {Array.isArray(securityStatus.warnings) && securityStatus.warnings.length > 0 && (
                    <div className="mt-2">
                      <span className="text-yellow-600 dark:text-yellow-400 text-xs">Warnings:</span>
                      <ul className="mt-1 space-y-1">
                        {(securityStatus.warnings as string[]).map((warning: string, index: number) => (
                          <li key={index} className="text-yellow-700 dark:text-yellow-300 text-xs">
                            • {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Auto Backup Settings */}
        <div className="theme-settings-section">
          <h4 className="theme-settings-section-title">🔄 Auto Backup</h4>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.autoBackupEnabled}
                onChange={(e) => handleSettingsChange({ autoBackupEnabled: e.target.checked })}
                disabled={isSaving}
                className="themed-checkbox"
              />
              <span className="themed-text-primary">Enable automatic backups</span>
            </label>

            {settings.autoBackupEnabled && settings.encryptionEnabled && !autoBackupPassword && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 border border-yellow-200">
                Auto backups paused: set session password
              </div>
            )}

            {settings.autoBackupEnabled && (
              <>
                <div>
                  <label className="block text-sm themed-text-secondary mb-2">
                    Backup interval: {getIntervalText(settings.backupInterval)}
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="1440"
                    step="15"
                    value={settings.backupInterval}
                    onChange={(e) => handleSettingsChange({ backupInterval: parseInt(e.target.value) })}
                    disabled={isSaving}
                    className="w-full themed-slider"
                  />
                  <div className="flex justify-between text-xs themed-text-secondary mt-1">
                    <span>15 min</span>
                    <span>24 hours</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm themed-text-secondary mb-2">
                    Keep up to {settings.maxBackups} backups
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="50"
                    value={settings.maxBackups}
                    onChange={(e) => handleSettingsChange({ maxBackups: parseInt(e.target.value) })}
                    disabled={isSaving}
                    className="w-full themed-slider"
                  />
                  <div className="flex justify-between text-xs themed-text-secondary mt-1">
                    <span>3 backups</span>
                    <span>50 backups</span>
                  </div>
                </div>

                {settings.encryptionEnabled && (
                  <div className="p-3 rounded-lg themed-bg-secondary themed-border space-y-2">
                    <label className="block text-sm font-medium themed-text-primary">
                      Auto-backup encryption password (session only)
                    </label>
                    <input
                      type="password"
                      value={autoBackupPassword}
                      onChange={(e) => {
                        const value = e.target.value;
                        setAutoBackupPassword(value);
                        if (value && value.length < 8) {
                          setAutoBackupPasswordError('Use at least 8 characters.');
                          backupPasswordService.setAutoBackupPassword(null);
                        } else {
                          setAutoBackupPasswordError('');
                          backupPasswordService.setAutoBackupPassword(value || null);
                        }
                      }}
                      placeholder="Enter password to encrypt auto backups"
                      className="w-full p-2 text-sm themed-border rounded-lg themed-bg-primary themed-text-primary"
                    />
                    {autoBackupPasswordError && (
                      <p className="text-xs text-red-500">{autoBackupPasswordError}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs themed-text-secondary">
                      <button
                        type="button"
                        onClick={() => {
                          setAutoBackupPassword('');
                          setAutoBackupPasswordError('');
                          backupPasswordService.setAutoBackupPassword(null);
                        }}
                        className="px-2 py-1 rounded themed-border themed-text-primary hover:themed-bg-secondary"
                      >
                        Clear session password
                      </button>
                      <span>
                        Not stored persistently. If omitted, auto backups are skipped while encryption is on.
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {settings.lastBackupDate && (
              <div className="text-sm themed-text-secondary">
                Last backup: {formatDate(settings.lastBackupDate)}
              </div>
            )}
          </div>
        </div>

        {/* Encryption Settings */}
        <div className="theme-settings-section">
          <h4 className="theme-settings-section-title">🔒 Encryption</h4>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.encryptionEnabled}
              onChange={(e) => handleSettingsChange({ encryptionEnabled: e.target.checked })}
              disabled={isSaving}
              className="themed-checkbox"
            />
            <span className="themed-text-primary">Encrypt backups with password</span>
          </label>
          
          {settings.encryptionEnabled && (
            <div className="mt-3 p-3 rounded-lg themed-bg-secondary themed-border">
              <p className="text-sm themed-text-secondary mb-2">
                ⚠️ Remember your encryption password - lost passwords cannot be recovered!
              </p>
              <p className="text-xs themed-text-secondary">
                Auto-backup passwords are kept only for this session; re-enter after reopening the extension.
              </p>
            </div>
          )}
        </div>

        {/* Manual Export */}
        <div className="theme-settings-section">
          <h4 className="theme-settings-section-title">📥 Manual Export</h4>
          
          {settings.encryptionEnabled && (
            <div className="mb-3">
              <button
                onClick={() => setShowEncryptionPassword(!showEncryptionPassword)}
                className="text-sm themed-accent-text hover:underline"
              >
                {showEncryptionPassword ? 'Hide' : 'Set'} encryption password
              </button>
              
              {showEncryptionPassword && (
                <input
                  type="password"
                  placeholder="Enter encryption password"
                  value={encryptionPassword}
                  onChange={(e) => setEncryptionPassword(e.target.value)}
                  className="w-full mt-2 p-2 text-sm themed-border rounded-lg themed-bg-primary themed-text-primary"
                />
              )}
            </div>
          )}
          
          <button
            onClick={handleExportWithEncryption}
            className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg themed-accent-bg hover:themed-accent-hover text-white transition-colors"
          >
            <span>📥</span>
            <span>Export {settings.encryptionEnabled ? 'Encrypted ' : ''}Backup</span>
          </button>
        </div>

        {/* Manual Import */}
        <div className="theme-settings-section">
          <h4 className="theme-settings-section-title">📤 Manual Import</h4>
          
          {settings.encryptionEnabled && !showDecryptionPassword && (
            <div className="mb-3">
              <button
                onClick={() => setShowDecryptionPassword(true)}
                className="text-sm themed-accent-text hover:underline"
              >
                Set decryption password
              </button>
            </div>
          )}

          {showDecryptionPassword && (
            <input
              type="password"
              placeholder="Enter decryption password"
              value={decryptionPassword}
              onChange={(e) => setDecryptionPassword(e.target.value)}
              className="w-full p-2 text-sm themed-border rounded-lg themed-bg-primary themed-text-primary"
            />
          )}

          <input
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="w-full p-2 text-sm themed-border rounded-lg themed-bg-secondary themed-text-primary file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[var(--accent-500)] file:text-white file:cursor-pointer hover:file:bg-[var(--accent-600)]"
          />
        </div>

        {/* Auto Backup History */}
        {autoBackups.length > 0 && (
          <div className="theme-settings-section">
            <div className="flex justify-between items-center mb-3">
              <h4 className="theme-settings-section-title">📋 Auto Backup History</h4>
              <button
                onClick={handleExportAllAutoBackups}
                className="text-xs px-3 py-1 rounded themed-accent-bg hover:themed-accent-hover text-white"
                title="Export all auto backups to file"
              >
                Export All
              </button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {autoBackups.map((backup, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded themed-bg-secondary themed-border">
                  <span className="text-sm themed-text-primary">
                    {formatDate(backup.date)}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRestoreAutoBackup(index)}
                      className="text-xs px-2 py-1 rounded themed-accent-bg hover:themed-accent-hover text-white"
                      title="Restore this backup"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handleDeleteAutoBackup(index)}
                      className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white"
                      title="Delete this backup"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
