import { BackupService, BackupData, BackupSettings } from '../types/backup';
import { PasswordEntry } from '../types/password';
import { passwordService } from './password-service';
import { encryptionService } from './encryption-service';
import Papa from 'papaparse';

/** Result of CSV import operation */
export interface CSVImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

class BackupPasswordService implements BackupService {
  private readonly settingsKey = 'backup_settings';
  private readonly backupsKey = 'auto_backups';
  private backupTimer: number | null = null;
  private isAutoBackupInitialized = false;
  private sessionAutoBackupPassword: string | null = null;
  private readonly statusKey = 'auto_backup_status';

  private defaultSettings: BackupSettings = {
    autoBackupEnabled: false,
    backupInterval: 60,
    maxBackups: 10,
    encryptionEnabled: true,
    lastBackupDate: undefined
  };

  async getSettings(): Promise<BackupSettings> {
    try {
      const result = await chrome.storage.local.get(this.settingsKey);
      return { ...this.defaultSettings, ...result[this.settingsKey] };
    } catch (error) {
      console.error('Failed to load backup settings:', error);
      return this.defaultSettings;
    }
  }

  /**
   * Sets the in-memory password used for automatic encrypted backups.
   * This value is not persisted; users must re-enter it per session.
   */
  setAutoBackupPassword(password: string | null): void {
    this.sessionAutoBackupPassword = password?.trim() || null;
  }

  hasAutoBackupPassword(): boolean {
    return !!this.sessionAutoBackupPassword;
  }

  private async publishStatus(message: string, type: 'info' | 'error'): Promise<void> {
    try {
      if (!chrome?.storage?.session) return;
      await chrome.storage.session.set({ [this.statusKey]: { message, type, ts: Date.now() } });
    } catch (error) {
      console.error('Auto backup status publish failed:', error);
    }
  }

  async updateSettings(settings: Partial<BackupSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      await chrome.storage.local.set({ [this.settingsKey]: newSettings });

      // Clear session password if encryption turned off
      if (settings.encryptionEnabled === false) {
        this.sessionAutoBackupPassword = null;
      }
      // Restart auto backup if settings changed
      if (
        settings.autoBackupEnabled !== undefined ||
        settings.backupInterval !== undefined ||
        settings.encryptionEnabled !== undefined
      ) {
        this.startAutoBackup();
      }
    } catch (error) {
      console.error('Failed to update backup settings:', error);
      throw new Error('Failed to update backup settings');
    }
  }

  async exportData(encryptionPassword?: string): Promise<string> {
    try {
      const passwords = await passwordService.getAll();
      const settings = await this.getSettings();

      const backupData = {
        passwords: passwords.map(p => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString()
        })),
        version: '1.0.0',
        appName: 'SecurePass Analytics',
        exportDate: new Date().toISOString(),
        encrypted: settings.encryptionEnabled && !!encryptionPassword
      };

      let dataStr = JSON.stringify(backupData, null, 2);

      // Encrypt if enabled and password provided
      if (settings.encryptionEnabled) {
        if (!encryptionPassword) {
          throw new Error('Encryption is enabled for backups. Please provide an encryption password.');
        }
        dataStr = await encryptionService.encrypt(dataStr, encryptionPassword);
      }

      return dataStr;
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('Failed to export backup data');
    }
  }

  async importData(data: string, decryptionPassword?: string): Promise<void> {
    try {
      let parsedData: BackupData;

      // Try to parse as JSON first
      try {
        parsedData = JSON.parse(data);
      } catch {
        // If parsing fails, assume it's encrypted
        if (!decryptionPassword) {
          throw new Error('Data appears to be encrypted but no password provided');
        }
        const decryptedData = await encryptionService.decrypt(data, decryptionPassword);
        parsedData = JSON.parse(decryptedData);
      }

      // Validate backup data structure
      if (!parsedData.passwords || !Array.isArray(parsedData.passwords)) {
        throw new Error('Invalid backup file format');
      }

      // Check if vault is locked and throw error if needed
      const { securityService } = await import('./master-password-service');
      const hasMasterPassword = await securityService.hasMasterPassword();

      // Only check if vault is locked when there's a master password configured
      if (hasMasterPassword) {
        const isLocked = await securityService.isLocked();
        if (isLocked) {
          throw new Error('Vault is locked. Please unlock the vault before importing passwords.');
        }
      }

      // Convert back to PasswordEntry objects
      const passwords: PasswordEntry[] = (parsedData.passwords as unknown[]).map((entry) => {
        const e = entry as Record<string, unknown>;
        return {
          id: e.id as string,
          website: e.website as string,
          username: e.username as string,
          password: e.password as string,
          category: (e.category as PasswordEntry['category']) || 'personal',
          tags: Array.isArray(e.tags) ? e.tags as string[] : [],
          notes: (e.notes as string) || undefined,
          createdAt: new Date(e.createdAt as string | number),
          updatedAt: new Date(e.updatedAt as string | number)
        };
      });

      // Replace all stored passwords in one operation to preserve ids and timestamps
      await passwordService.replaceAll(passwords);

    } catch (error) {
      console.error('Failed to import data:', error);
      throw error instanceof Error ? error : new Error('Failed to import backup data');
    }
  }

  async exportToFile(encryptionPassword?: string): Promise<void> {
    try {
      const dataStr = await this.exportData(encryptionPassword);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const settings = await this.getSettings();
      const encrypted = settings.encryptionEnabled && !!encryptionPassword;
      const filename = `passwords-backup-${new Date().toISOString().split('T')[0]}${encrypted ? '-encrypted' : ''}.json`;

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export to file:', error);
      throw new Error('Failed to export backup file');
    }
  }

  /**
   * Export passwords to CSV format for compatibility with other password managers
   * WARNING: CSV export is NOT encrypted - handle with care
   */
  async exportToCSV(): Promise<void> {
    try {
      const passwords = await passwordService.getAll();
      
      // Prepare data for papaparse
      const data = passwords.map(p => ({
        website: p.website,
        username: p.username,
        password: p.password,
        category: p.category,
        tags: p.tags.join(';'),
        notes: p.notes || '',
        created: p.createdAt.toISOString(),
        updated: p.updatedAt.toISOString()
      }));

      // Use papaparse to generate CSV
      const csvContent = Papa.unparse(data, {
        header: true,
        quotes: true // Always quote fields for safety
      });
      
      // Add BOM for Excel compatibility with UTF-8
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const filename = `passwords-export-${new Date().toISOString().split('T')[0]}.csv`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export to CSV:', error);
      throw new Error('Failed to export CSV file');
    }
  }

  /**
   * Import passwords from CSV file
   * Expects columns: website, username, password, category (optional), tags (optional), notes (optional)
   * Returns detailed import results including specific error messages
   */
  async importFromCSV(file: File): Promise<CSVImportResult> {
    const errors: string[] = [];
    
    try {
      const text = await file.text();
      
      // Use papaparse for robust CSV parsing
      const parseResult = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.toLowerCase().trim()
      });

      // Check for parsing errors
      if (parseResult.errors.length > 0) {
        const parseErrors = parseResult.errors.slice(0, 5).map(e => 
          `Row ${e.row !== undefined ? e.row + 2 : '?'}: ${e.message}`
        );
        if (parseResult.errors.length > 5) {
          parseErrors.push(`...and ${parseResult.errors.length - 5} more parsing errors`);
        }
        errors.push(...parseErrors);
      }

      const data = parseResult.data;
      
      if (data.length === 0) {
        throw new Error('CSV file is empty or has no valid data rows');
      }

      // Validate required columns exist
      const firstRow = data[0];
      const hasWebsite = 'website' in firstRow;
      const hasUsername = 'username' in firstRow;
      const hasPassword = 'password' in firstRow;

      if (!hasWebsite || !hasUsername || !hasPassword) {
        const missing = [];
        if (!hasWebsite) missing.push('website');
        if (!hasUsername) missing.push('username');
        if (!hasPassword) missing.push('password');
        throw new Error(`CSV is missing required columns: ${missing.join(', ')}`);
      }

      // Check vault lock status
      const { securityService } = await import('./master-password-service');
      const hasMasterPassword = await securityService.hasMasterPassword();
      if (hasMasterPassword) {
        const isLocked = await securityService.isLocked();
        if (isLocked) {
          throw new Error('Vault is locked. Please unlock the vault before importing passwords.');
        }
      }

      let imported = 0;
      let skipped = 0;
      const validCategories = ['work', 'personal', 'shopping', 'social', 'other'];

      // Process each row
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 2; // +2 because of 0-index and header row
        
        const website = row.website?.trim();
        const username = row.username?.trim();
        const password = row.password?.trim();

        // Validate required fields
        if (!website) {
          errors.push(`Row ${rowNum}: Missing website`);
          skipped++;
          continue;
        }
        if (!username) {
          errors.push(`Row ${rowNum}: Missing username for ${website}`);
          skipped++;
          continue;
        }
        if (!password) {
          errors.push(`Row ${rowNum}: Missing password for ${website}`);
          skipped++;
          continue;
        }

        const category = row.category?.trim() || 'personal';
        const finalCategory = validCategories.includes(category) 
          ? category as PasswordEntry['category'] 
          : 'personal';

        const tagsString = row.tags?.trim() || '';
        const tags = tagsString ? tagsString.split(';').map(t => t.trim()).filter(t => t) : [];

        const notes = row.notes?.trim() || undefined;

        try {
          await passwordService.add({
            website,
            username,
            password,
            category: finalCategory,
            tags,
            notes
          });
          imported++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Row ${rowNum}: Failed to import ${website} - ${errorMsg}`);
          skipped++;
        }
      }

      return { imported, skipped, errors };
    } catch (error) {
      console.error('Failed to import from CSV:', error);
      throw error instanceof Error ? error : new Error('Failed to import CSV file');
    }
  }

  async importFromFile(file: File, decryptionPassword?: string): Promise<void> {
    try {
      const text = await file.text();
      await this.importData(text, decryptionPassword);
    } catch (error) {
      console.error('Failed to import from file:', error);
      throw new Error('Failed to import backup file');
    }
  }

  autoBackup(): void {
    // Prevent multiple initializations in development mode
    if (this.isAutoBackupInitialized) {
      return;
    }

    this.isAutoBackupInitialized = true;
    this.startAutoBackup();
  }

  private async startAutoBackup(): Promise<void> {
    // Clear existing timer
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }

    const initialSettings = await this.getSettings();

    if (!initialSettings.autoBackupEnabled) {
      return;
    }

    // Create auto backup
    const performBackup = async () => {
      try {
        const settings = await this.getSettings();

        if (!settings.autoBackupEnabled) {
          return;
        }

        if (settings.encryptionEnabled && !this.sessionAutoBackupPassword) {
          console.warn('Auto backup skipped: encryption is enabled but no password was provided.');
          await this.publishStatus('Auto backup paused: set the session password in Backup Settings.', 'info');
          return;
        }

        // Skip if vault is locked and master password exists
        try {
          const { securityService } = await import('./master-password-service');
          const hasMP = await securityService.hasMasterPassword();
          if (hasMP && await securityService.isLocked()) {
            await this.publishStatus('Auto backup skipped: vault is locked.', 'info');
            return;
          }
        } catch (error) {
          console.error('Auto backup lock check failed:', error);
        }

        const backupData = settings.encryptionEnabled && this.sessionAutoBackupPassword
          ? await this.exportData(this.sessionAutoBackupPassword)
          : await this.exportData();

        await this.saveAutoBackup(backupData);

        // Update last backup date
        await this.updateSettings({ lastBackupDate: new Date().toISOString() });
      } catch (error) {
        console.error('Auto backup failed:', error);
        await this.publishStatus('Auto backup failed. See console for details.', 'error');
      }
    };

    // Perform initial backup
    await performBackup();

    // Set up recurring backup
    this.backupTimer = window.setInterval(
      performBackup,
      settings.backupInterval * 60 * 1000
    );
  }

  private async saveAutoBackup(data: string): Promise<void> {
    try {
      const settings = await this.getSettings();
      const result = await chrome.storage.local.get(this.backupsKey);
      const backups: Array<{ date: string; data: string }> = result[this.backupsKey] || [];

      // Add new backup
      backups.push({
        date: new Date().toISOString(),
        data
      });

      // Keep only the latest maxBackups
      if (backups.length > settings.maxBackups) {
        backups.splice(0, backups.length - settings.maxBackups);
      }

      await chrome.storage.local.set({ [this.backupsKey]: backups });
    } catch (error) {
      console.error('Failed to save auto backup:', error);
      throw new Error('Failed to save auto backup');
    }
  }

  async getAutoBackups(): Promise<Array<{ date: string; data: string }>> {
    try {
      const result = await chrome.storage.local.get(this.backupsKey);
      return result[this.backupsKey] || [];
    } catch (error) {
      console.error('Failed to load auto backups:', error);
      return [];
    }
  }

  async restoreAutoBackup(backupIndex: number, decryptionPassword?: string): Promise<void> {
    try {
      const backups = await this.getAutoBackups();
      if (backupIndex < 0 || backupIndex >= backups.length) {
        throw new Error('Invalid backup index');
      }

      await this.importData(backups[backupIndex].data, decryptionPassword);
    } catch (error) {
      console.error('Failed to restore auto backup:', error);
      throw new Error('Failed to restore backup');
    }
  }

  async deleteAutoBackup(backupIndex: number): Promise<void> {
    try {
      const backups = await this.getAutoBackups();
      if (backupIndex < 0 || backupIndex >= backups.length) {
        throw new Error('Invalid backup index');
      }

      backups.splice(backupIndex, 1);
      await chrome.storage.local.set({ [this.backupsKey]: backups });
    } catch (error) {
      console.error('Failed to delete auto backup:', error);
      throw new Error('Failed to delete backup');
    }
  }

  stopAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
  }
}

export const backupPasswordService = new BackupPasswordService();
