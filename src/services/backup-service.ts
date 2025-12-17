import { BackupService, BackupData, BackupSettings } from '../types/backup';
import { PasswordEntry } from '../types/password';
import { passwordService } from './password-service';
import { encryptionService } from './encryption-service';

class BackupPasswordService implements BackupService {
  private readonly settingsKey = 'backup_settings';
  private readonly backupsKey = 'auto_backups';
  private backupTimer: number | null = null;
  private isAutoBackupInitialized = false;

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

  async updateSettings(settings: Partial<BackupSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      await chrome.storage.local.set({ [this.settingsKey]: newSettings });

      // Restart auto backup if settings changed
      if (settings.autoBackupEnabled !== undefined || settings.backupInterval !== undefined) {
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

      const backupData: BackupData = {
        passwords: passwords.map(p => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString()
        })),
        exportDate: new Date().toISOString(),
        version: '1.0',
        encrypted: settings.encryptionEnabled && !!encryptionPassword
      };

      let dataStr = JSON.stringify(backupData, null, 2);

      // Encrypt if enabled and password provided
      if (settings.encryptionEnabled && encryptionPassword) {
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
      const passwords: PasswordEntry[] = parsedData.passwords.map((entry: any) => ({
        id: entry.id,
        website: entry.website,
        username: entry.username,
        password: entry.password,
        category: entry.category || 'personal',
        tags: Array.isArray(entry.tags) ? entry.tags : [],
        notes: entry.notes || undefined,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt)
      }));

      // Clear existing passwords and import new ones
      await passwordService.getAll();

      // Clear all current passwords first
      await passwordService.clearAll();

      for (let i = 0; i < passwords.length; i++) {
        const password = passwords[i];

        try {
          await passwordService.add({
            website: password.website,
            username: password.username,
            password: password.password,
            category: password.category,
            tags: password.tags,
            notes: password.notes
          });
        } catch (error) {
          console.error(`Failed to import password ${i + 1}:`, error);
          throw new Error(`Failed to import password for ${password.website}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

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
      
      // CSV header
      const headers = ['website', 'username', 'password', 'category', 'tags', 'notes', 'created', 'updated'];
      
      // Escape CSV field - handles commas, quotes, and newlines
      const escapeCSV = (field: string | undefined): string => {
        if (!field) return '';
        const escaped = field.replace(/"/g, '""');
        // Wrap in quotes if contains comma, quote, or newline
        if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
          return `"${escaped}"`;
        }
        return escaped;
      };

      // Generate CSV rows
      const rows = passwords.map(p => [
        escapeCSV(p.website),
        escapeCSV(p.username),
        escapeCSV(p.password),
        escapeCSV(p.category),
        escapeCSV(p.tags.join(';')),
        escapeCSV(p.notes),
        escapeCSV(p.createdAt.toISOString()),
        escapeCSV(p.updatedAt.toISOString())
      ].join(','));

      // Combine header and rows
      const csvContent = [headers.join(','), ...rows].join('\n');
      
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
   */
  async importFromCSV(file: File): Promise<{ imported: number; skipped: number }> {
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must have a header row and at least one data row');
      }

      // Parse header
      const header = this.parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
      const websiteIndex = header.indexOf('website');
      const usernameIndex = header.indexOf('username');
      const passwordIndex = header.indexOf('password');
      const categoryIndex = header.indexOf('category');
      const tagsIndex = header.indexOf('tags');
      const notesIndex = header.indexOf('notes');

      if (websiteIndex === -1 || usernameIndex === -1 || passwordIndex === -1) {
        throw new Error('CSV must have website, username, and password columns');
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

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        
        const website = values[websiteIndex]?.trim();
        const username = values[usernameIndex]?.trim();
        const password = values[passwordIndex]?.trim();

        // Skip rows with missing required fields
        if (!website || !username || !password) {
          skipped++;
          continue;
        }

        const category = (values[categoryIndex]?.trim() || 'personal') as PasswordEntry['category'];
        const validCategories = ['work', 'personal', 'shopping', 'social', 'other'];
        const finalCategory = validCategories.includes(category) ? category : 'personal';

        const tagsString = values[tagsIndex]?.trim() || '';
        const tags = tagsString ? tagsString.split(';').map(t => t.trim()).filter(t => t) : [];

        const notes = values[notesIndex]?.trim() || undefined;

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
          console.error(`Failed to import row ${i + 1}:`, error);
          skipped++;
        }
      }

      return { imported, skipped };
    } catch (error) {
      console.error('Failed to import from CSV:', error);
      throw error instanceof Error ? error : new Error('Failed to import CSV file');
    }
  }

  /**
   * Parse a single CSV line, handling quoted fields correctly
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (inQuotes) {
        if (char === '"') {
          if (line[i + 1] === '"') {
            // Escaped quote
            current += '"';
            i++;
          } else {
            // End of quoted field
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
    }
    
    result.push(current);
    return result;
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

    const settings = await this.getSettings();

    if (!settings.autoBackupEnabled) {
      return;
    }

    // Create auto backup
    const performBackup = async () => {
      try {
        const backupData = await this.exportData();
        await this.saveAutoBackup(backupData);

        // Update last backup date
        await this.updateSettings({ lastBackupDate: new Date().toISOString() });
      } catch (error) {
        console.error('Auto backup failed:', error);
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
