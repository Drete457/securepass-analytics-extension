/**
 * Breach Check Service
 * Checks if passwords have been compromised using the HaveIBeenPwned API
 * Uses k-anonymity to protect privacy (only the first 5 characters of SHA-1)
 */

export interface BreachCheckResult {
  isBreached: boolean;
  occurrences?: number;
  error?: string;
}

export interface PasswordBreachInfo {
  password: string;
  hash: string;
  isBreached: boolean;
  occurrences: number;
  lastChecked: Date;
}

class BreachCheckService {
  private readonly API_BASE_URL = 'https://api.pwnedpasswords.com/range/';
  private cache: Map<string, PasswordBreachInfo> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Generates SHA-1 hash of a password
   */
  private async generateSHA1(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  /**
   * Checks if a password has been compromised using k-anonymity
   * Sends only the first 5 characters of the SHA-1 hash
   */
  async checkPasswordBreach(password: string): Promise<BreachCheckResult> {
    try {
      // Generate SHA-1 hash of the password
      const passwordHash = await this.generateSHA1(password);
      
      // Check cache first
      const cached = this.getCachedResult(passwordHash);
      if (cached) {
        return {
          isBreached: cached.isBreached,
          occurrences: cached.occurrences
        };
      }

      // k-anonymity: use only the first 5 characters
      const hashPrefix = passwordHash.substring(0, 5);
      const hashSuffix = passwordHash.substring(5);
      
      // Make request to the API
      const response = await fetch(`${this.API_BASE_URL}${hashPrefix}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Password-Manager-Extension',
          'Add-Padding': 'true' // To add extra security padding
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const responseText = await response.text();
      const hashes = responseText.split('\n');

      // Search for the hash suffix
      let occurrences = 0;
      let isBreached = false;

      for (const line of hashes) {
        const [suffix, count] = line.trim().split(':');
        if (suffix === hashSuffix) {
          occurrences = parseInt(count, 10);
          isBreached = true;
          break;
        }
      }

      // Cache result
      this.cacheResult(passwordHash, password, isBreached, occurrences);

      return {
        isBreached,
        occurrences: isBreached ? occurrences : 0
      };

    } catch (error) {
      console.error('Error checking password breach:', error);
      return {
        isBreached: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Checks multiple passwords in batch
   */
  async checkMultiplePasswords(passwords: string[]): Promise<Map<string, BreachCheckResult>> {
    const results = new Map<string, BreachCheckResult>();
    
    // Process in small batches to avoid overloading the API
    const batchSize = 5;
    for (let i = 0; i < passwords.length; i += batchSize) {
      const batch = passwords.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (password) => {
        const result = await this.checkPasswordBreach(password);
        return { password, result };
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(({ password, result }) => {
        results.set(password, result);
      });

      // Small delay between batches to be respectful to the API
      if (i + batchSize < passwords.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Get result from cache if still valid
   */
  private getCachedResult(hash: string): PasswordBreachInfo | null {
    const cached = this.cache.get(hash);
    if (cached) {
      const isExpired = Date.now() - cached.lastChecked.getTime() > this.CACHE_DURATION;
      if (!isExpired) {
        return cached;
      } else {
        this.cache.delete(hash);
      }
    }
    return null;
  }

  /**
   * Cache the result of the check
   */
  private cacheResult(hash: string, password: string, isBreached: boolean, occurrences: number): void {
    this.cache.set(hash, {
      password,
      hash,
      isBreached,
      occurrences,
      lastChecked: new Date()
    });

    // Limit cache size
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; breachedCount: number } {
    let breachedCount = 0;
    for (const info of this.cache.values()) {
      if (info.isBreached) {
        breachedCount++;
      }
    }
    
    return {
      size: this.cache.size,
      breachedCount
    };
  }

  /**
   * Check if a specific password is in the cache and has been compromised
   */
  isPasswordInCache(password: string): PasswordBreachInfo | null {
    for (const info of this.cache.values()) {
      if (info.password === password) {
        return info;
      }
    }
    return null;
  }
}

export const breachCheckService = new BreachCheckService();
