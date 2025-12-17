import { PasswordEntry, PasswordDatabase } from '../types/password';
import type { SecurityService } from './master-password-service';

// Lazy import to avoid circular dependency at initialization
let _securityService: SecurityService | null = null;
const getSecurityService = async (): Promise<SecurityService> => {
  if (!_securityService) {
    const module = await import('./master-password-service');
    _securityService = module.securityService;
  }
  return _securityService;
};

class ChromeStoragePasswordService implements PasswordDatabase {
  private storageKey = 'password_manager_passwords';

  private async saveToStorage(passwords: PasswordEntry[]): Promise<void> {
    try {
      await chrome.storage.local.set({ [this.storageKey]: passwords });
    } catch (error) {
      console.error('Failed to save to chrome storage:', error);
      throw new Error('Failed to save passwords');
    }
  }

  private async loadFromStorage(): Promise<PasswordEntry[]> {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      const passwords = result[this.storageKey] || [];
      
      const processed = passwords.map((entry: any) => {
        // Validate and convert dates
        let createdAt: Date;
        let updatedAt: Date;

        try {
          createdAt = entry.createdAt ? new Date(entry.createdAt) : new Date();
          if (isNaN(createdAt.getTime())) {
            console.warn('PasswordService: Invalid createdAt date, using current date:', entry.createdAt);
            createdAt = new Date();
          }
        } catch (error) {
          console.warn('PasswordService: Error parsing createdAt, using current date:', error);
          createdAt = new Date();
        }

        try {
          updatedAt = entry.updatedAt ? new Date(entry.updatedAt) : new Date();
          if (isNaN(updatedAt.getTime())) {
            console.warn('PasswordService: Invalid updatedAt date, using current date:', entry.updatedAt);
            updatedAt = new Date();
          }
        } catch (error) {
          console.warn('PasswordService: Error parsing updatedAt, using current date:', error);
          updatedAt = new Date();
        }

        const processedEntry = {
          ...entry,
          createdAt,
          updatedAt,
          category: entry.category || 'personal',
          tags: Array.isArray(entry.tags) ? entry.tags : [],
          notes: entry.notes || undefined
        };

        return processedEntry;
      });
      
      return processed;
    } catch (error) {
      console.error('Failed to load from chrome storage:', error);
      return [];
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Encrypts sensitive data if master password is configured
   */
  private async encryptSensitiveData(entry: PasswordEntry): Promise<PasswordEntry> {
    // Check if master password is configured
    const securityService = await getSecurityService();
    const hasMasterPassword = await securityService.hasMasterPassword();
    
    if (hasMasterPassword && !(await securityService.isLocked())) {
      try {
        return {
          ...entry,
          password: securityService.encryptData(entry.password),
          username: securityService.encryptData(entry.username)
        };
      } catch (error) {
        console.warn('Failed to encrypt data, storing unencrypted:', error);
      }
    }
    return entry;
  }

  /**
   * Decrypts sensitive data if encrypted
   */
  private async decryptSensitiveData(entry: PasswordEntry): Promise<PasswordEntry> {
    // Check if master password is configured
    const securityService = await getSecurityService();
    const hasMasterPassword = await securityService.hasMasterPassword();
    
    if (hasMasterPassword && !(await securityService.isLocked())) {
      try {
        const decryptedPassword = securityService.decryptData(entry.password);
        const decryptedUsername = securityService.decryptData(entry.username);
        
        return {
          ...entry,
          password: decryptedPassword || entry.password,
          username: decryptedUsername || entry.username
        };
      } catch (error) {
        console.warn('Failed to decrypt data, returning as is:', error);
      }
    }
    return entry;
  }

  async getAll(): Promise<PasswordEntry[]> {
    const passwords = await this.loadFromStorage();
    const decryptedPasswords = await Promise.all(passwords.map(entry => this.decryptSensitiveData(entry)));
 
    return decryptedPasswords;
  }

  async getById(id: string): Promise<PasswordEntry | undefined> {
    const passwords = await this.loadFromStorage();
    const entry = passwords.find(p => p.id === id);
    return entry ? await this.decryptSensitiveData(entry) : undefined;
  }

  async add(entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const passwords = await this.loadFromStorage();
    const id = this.generateId();
    const now = new Date();
    
    const newEntry: PasswordEntry = {
      ...entry,
      id,
      createdAt: now,
      updatedAt: now
    };

    // Encrypt sensitive data before saving
    const encryptedEntry = await this.encryptSensitiveData(newEntry);
    
    passwords.push(encryptedEntry);
    await this.saveToStorage(passwords);
    
    return id;
  }

  async update(id: string, entry: Partial<Omit<PasswordEntry, 'id' | 'createdAt'>>): Promise<void> {
    const passwords = await this.loadFromStorage();
    const index = passwords.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error('Entry not found');
    }

    const updatedEntry: PasswordEntry = {
      ...passwords[index],
      ...entry,
      id,
      updatedAt: new Date()
    };

    // Encrypt sensitive data before saving
    const encryptedEntry = await this.encryptSensitiveData(updatedEntry);
    
    passwords[index] = encryptedEntry;
    await this.saveToStorage(passwords);
  }

  async delete(id: string): Promise<void> {
    const passwords = await this.loadFromStorage();
    const filteredPasswords = passwords.filter(p => p.id !== id);
    await this.saveToStorage(filteredPasswords);
  }

  /**
   * Clear all passwords (utility method)
   */
  async clearAll(): Promise<void> {
    await chrome.storage.local.remove(this.storageKey);
  }

  /**
   * Re-encrypt all existing passwords when master password is set for the first time
   */
  async encryptExistingPasswords(): Promise<void> {
    try {
      // Load raw data without decryption
      const result = await chrome.storage.local.get(this.storageKey);
      const rawPasswords = result[this.storageKey] || [];
      
      if (rawPasswords.length === 0) {
        return;
      }

      // Process each password - same logic as loadFromStorage
      const processedPasswords = [];
      for (const entry of rawPasswords) {
        // Validate and convert dates
        let createdAt: Date;
        let updatedAt: Date;

        try {
          createdAt = entry.createdAt ? new Date(entry.createdAt) : new Date();
          if (isNaN(createdAt.getTime())) {
            createdAt = new Date();
          }
        } catch (error) {
          createdAt = new Date();
        }

        try {
          updatedAt = entry.updatedAt ? new Date(entry.updatedAt) : new Date();
          if (isNaN(updatedAt.getTime())) {
            updatedAt = new Date();
          }
        } catch (error) {
          updatedAt = new Date();
        }

        const processedEntry = {
          ...entry,
          createdAt,
          updatedAt
        };

        // Encrypt the entry
        const encryptedEntry = await this.encryptSensitiveData(processedEntry);
        processedPasswords.push(encryptedEntry);
      }

      // Save encrypted passwords
      await this.saveToStorage(processedPasswords);
    } catch (error) {
      console.error('PasswordService: Failed to encrypt existing passwords:', error);
      throw new Error('Failed to encrypt existing passwords');
    }
  }
}

export const passwordService = new ChromeStoragePasswordService();
