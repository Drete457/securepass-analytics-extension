import { PasswordEntry, PasswordDatabase } from '../types/password';

class FilePasswordService implements PasswordDatabase {
  private storageKey = 'passwords_file_data';

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Export passwords to downloadable JSON file
  async exportToFile(): Promise<void> {
    try {
      const passwords = await this.getAll();
      const dataStr = JSON.stringify(passwords, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `passwords-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export passwords:', error);
      throw new Error('Failed to export passwords');
    }
  }

  // Import passwords from uploaded JSON file
  async importFromFile(file: File): Promise<void> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate data structure
      if (!Array.isArray(data)) {
        throw new Error('Invalid file format: expected array of passwords');
      }

      const passwords: PasswordEntry[] = data.map((entry: Record<string, unknown>) => ({
        id: entry.id || this.generateId(),
        website: entry.website || '',
        username: entry.username || '',
        password: entry.password || '',
        category: entry.category || 'personal',
        tags: Array.isArray(entry.tags) ? entry.tags : [],
        notes: entry.notes || undefined,
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date()
      }));

      await this.saveToStorage(passwords);
    } catch (error) {
      console.error('Failed to import passwords:', error);
      throw new Error('Failed to import passwords from file');
    }
  }

  private async saveToStorage(passwords: PasswordEntry[]): Promise<void> {
    try {
      await chrome.storage.local.set({ [this.storageKey]: passwords });
    } catch (error) {
      console.error('Failed to save to storage:', error);
      throw new Error('Failed to save passwords');
    }
  }

  private async loadFromStorage(): Promise<PasswordEntry[]> {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      const passwords = result[this.storageKey] || [];
      
      return passwords.map((entry: Record<string, unknown>) => ({
        ...entry,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt)
      }));
    } catch (error) {
      console.error('Failed to load from storage:', error);
      return [];
    }
  }

  async getAll(): Promise<PasswordEntry[]> {
    return await this.loadFromStorage();
  }

  async getById(id: string): Promise<PasswordEntry | undefined> {
    const passwords = await this.getAll();
    return passwords.find(p => p.id === id);
  }

  async add(entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const passwords = await this.getAll();
    const id = this.generateId();
    const now = new Date();
    
    const newEntry: PasswordEntry = {
      ...entry,
      id,
      createdAt: now,
      updatedAt: now
    };

    passwords.push(newEntry);
    await this.saveToStorage(passwords);
    return id;
  }

  async update(id: string, entry: Partial<Omit<PasswordEntry, 'id' | 'createdAt'>>): Promise<void> {
    const passwords = await this.getAll();
    const index = passwords.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error('Entry not found');
    }

    passwords[index] = {
      ...passwords[index],
      ...entry,
      id,
      updatedAt: new Date()
    };

    await this.saveToStorage(passwords);
  }

  async delete(id: string): Promise<void> {
    const passwords = await this.getAll();
    const filteredPasswords = passwords.filter(p => p.id !== id);
    await this.saveToStorage(filteredPasswords);
  }

  // Clear all passwords
  async clearAll(): Promise<void> {
    await chrome.storage.local.remove(this.storageKey);
  }
}

export const filePasswordService = new FilePasswordService();
