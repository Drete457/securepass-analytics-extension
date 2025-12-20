import { ChangeEvent, useState } from 'react';
import { backupPasswordService } from '../services/backup-service';
import { BackupSettings } from './backup-settings';

interface FileManagerProps {
  onImportComplete: () => void;
  onClose: () => void;
}

export function FileManager({ onImportComplete, onClose }: FileManagerProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string>('');
  const [showBackupSettings, setShowBackupSettings] = useState(false);
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [showEncryptionInput, setShowEncryptionInput] = useState(false);
  const [showCSVWarning, setShowCSVWarning] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await backupPasswordService.exportToFile(encryptionPassword || undefined);
      setEncryptionPassword('');
      setShowEncryptionInput(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export passwords. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    // Show warning dialog first
    setShowCSVWarning(true);
  };

  const confirmCSVExport = async () => {
    try {
      setShowCSVWarning(false);
      setIsExportingCSV(true);
      await backupPasswordService.exportToCSV();
    } catch (error) {
      console.error('CSV Export failed:', error);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setImportError('');
      
      // Check if it's a CSV file
      if (file.name.toLowerCase().endsWith('.csv')) {
        const result = await backupPasswordService.importFromCSV(file);
        onImportComplete();
        
        // Build detailed result message
        let message = `CSV Import complete!\n\n✅ Imported: ${result.imported}\n⏭️ Skipped: ${result.skipped}`;
        
        if (result.errors && result.errors.length > 0) {
          const displayErrors = result.errors.slice(0, 10);
          message += `\n\n⚠️ Issues found:\n${displayErrors.join('\n')}`;
          if (result.errors.length > 10) {
            message += `\n...and ${result.errors.length - 10} more issues`;
          }
        }
        
        alert(message);
      } else {
        await backupPasswordService.importFromFile(file, encryptionPassword || undefined);
        onImportComplete();
        alert('Passwords imported successfully!');
      }
      
      setEncryptionPassword('');
      setShowEncryptionInput(false);
      onClose();
    } catch (error) {
      console.error('Import failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      setImportError(errorMessage);
      
      // Don't close on error so user can see the error message
      if (errorMessage.includes('Vault is locked')) {
        alert('Cannot import: Vault is locked. Please unlock the vault first and try again.');
      }
    } finally {
      setIsImporting(false);
      // Reset file input
      if (event.target) {
        (event.target as HTMLInputElement).value = '';
      }
    }
  };

  // CSV Warning Modal
  if (showCSVWarning) {
    return (
      <div className="theme-settings-container">
        <div className="theme-settings-header">
          <h3 className="theme-settings-title text-red-600">
            ⚠️ Security Warning
          </h3>
        </div>
        <div className="theme-settings-content">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-red-800 font-medium mb-2">
              You are about to export your passwords in plain text!
            </p>
            <ul className="text-red-700 text-sm space-y-1 list-disc list-inside">
              <li>All passwords will be visible to anyone with access to the file</li>
              <li>The CSV file is NOT encrypted</li>
              <li>This file should be deleted after use</li>
              <li>Do not share this file or store it insecurely</li>
            </ul>
          </div>
          <p className="text-sm themed-text-secondary mb-4">
            For secure backups, use the encrypted JSON export instead.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCSVWarning(false)}
              className="flex-1 p-3 rounded-lg themed-bg-secondary themed-text-primary border themed-border hover:themed-bg-tertiary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmCSVExport}
              disabled={isExportingCSV}
              className="flex-1 p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
            >
              {isExportingCSV ? 'Exporting...' : 'I Understand, Export CSV'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showBackupSettings) {
    return (
      <BackupSettings onClose={() => setShowBackupSettings(false)} />
    );
  }

  return (
    <div className="theme-settings-container">
      <div className="theme-settings-header">
        <h3 className="theme-settings-title">
          Backup & File Management
        </h3>
        <button
          onClick={onClose}
          className="theme-settings-close-btn"
          title="Close file manager"
        >
          ✕
        </button>
      </div>

      <div className="theme-settings-content">
        {/* Backup Settings Button */}
        <div className="theme-settings-section">
          <button
            onClick={() => setShowBackupSettings(true)}
            className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg themed-accent-bg hover:themed-accent-hover text-white transition-colors"
          >
            <span>⚙️</span>
            <span>Backup Settings & Auto Backup</span>
          </button>
        </div>

        {/* Quick Export Section */}
        <div className="theme-settings-section">
          <h4 className="theme-settings-section-title">📥 Quick Export</h4>
          <p className="text-sm themed-text-secondary mb-3">
            Download all your passwords as a backup file.
          </p>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={showEncryptionInput}
                onChange={(e) => setShowEncryptionInput(e.target.checked)}
                className="themed-checkbox"
              />
              <span className="text-sm themed-text-primary">Encrypt/Decrypt with password</span>
            </label>
            
            {showEncryptionInput && (
              <input
                type="password"
                placeholder="Enter encryption/decryption password"
                value={encryptionPassword}
                onChange={(e) => setEncryptionPassword(e.target.value)}
                className="w-full p-2 text-sm themed-border rounded-lg themed-bg-primary themed-text-primary"
              />
            )}
            
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg themed-accent-bg hover:themed-accent-hover text-white transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <span className="theme-reset-spinner">⟳</span>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <span>📥</span>
                  <span>Export {showEncryptionInput ? 'Encrypted ' : ''}Backup (JSON)</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportCSV}
              disabled={isExportingCSV}
              className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg themed-bg-tertiary hover:themed-bg-secondary themed-text-primary transition-colors disabled:opacity-50 border themed-border"
            >
              {isExportingCSV ? (
                <>
                  <span className="theme-reset-spinner">⟳</span>
                  <span>Exporting CSV...</span>
                </>
              ) : (
                <>
                  <span>📊</span>
                  <span>Export as CSV (Unencrypted)</span>
                </>
              )}
            </button>

            <p className="text-xs themed-text-tertiary">
              ⚠️ CSV export is NOT encrypted. Use JSON export for secure backups.
            </p>
          </div>
        </div>

        {/* Quick Import Section */}
        <div className="theme-settings-section">
          <h4 className="theme-settings-section-title">📤 Quick Import</h4>
          <p className="text-sm themed-text-secondary mb-3">
            Upload a backup file to restore passwords. Supports JSON and CSV formats.
          </p>
          
          {importError && (
            <div className="p-3 mb-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm">
              <strong>Import Error:</strong> {importError}
            </div>
          )}

          <div className="space-y-3">
            {!showEncryptionInput && (
              <button
                onClick={() => setShowEncryptionInput(true)}
                className="text-sm themed-accent-text hover:underline"
              >
                File encrypted? Set password
              </button>
            )}
            
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleImportFile}
              disabled={isImporting}
              className="w-full p-2 text-sm themed-border rounded-lg themed-bg-secondary themed-text-primary file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[var(--accent-500)] file:text-white file:cursor-pointer hover:file:bg-[var(--accent-600)] disabled:opacity-50"
            />
            
            {isImporting && (
              <div className="flex items-center space-x-2 text-sm themed-text-secondary">
                <span className="theme-reset-spinner">⟳</span>
                <span>Importing passwords...</span>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="theme-settings-section">
          <div className="p-3 rounded-lg themed-bg-secondary themed-border">
            <h4 className="text-sm font-medium themed-text-primary mb-2">💡 Backup Features</h4>
            <ul className="text-xs themed-text-secondary space-y-1">
              <li>• 🔄 <strong>Auto Backup:</strong> Automatic periodic backups</li>
              <li>• 🔒 <strong>Encryption:</strong> AES-256 password protection</li>
              <li>• 📋 <strong>History:</strong> Keep multiple backup versions</li>
              <li>• 💾 <strong>JSON Export:</strong> Encrypted backup files</li>
              <li>• 📊 <strong>CSV Export:</strong> Compatible with other managers</li>
              <li>• 📤 <strong>Import:</strong> Restore from JSON or CSV files</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
