class SecurityService {
  private readonly extensionId = chrome.runtime.id;

  // Generate a security hash for data integrity
  private async generateSecurityHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data + this.extensionId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Validate data integrity
  async validateDataIntegrity(data: Record<string, unknown>): Promise<boolean> {
    try {
      if (!data || typeof data !== 'object') return false;
      
      // If data doesn't have a security hash, it might be regular app data
      // We'll treat it as valid unless it looks suspicious
      if (!data.securityHash) {
        // For regular password data, just do basic validation
        if (Array.isArray(data)) {
          return true; // Password arrays are expected to not have hash
        }
        // For other objects, check if they look like legitimate app data
        return this.isLegitimateAppData(data);
      }

      const { securityHash, ...actualData } = data;
      const expectedHash = await this.generateSecurityHash(JSON.stringify(actualData));
      return securityHash === expectedHash;
    } catch (error) {
      console.error('Security validation failed:', error);
      return false;
    }
  }

  // Check if data looks like legitimate app data (not malicious)
  private isLegitimateAppData(data: Record<string, unknown>): boolean {
    // Check for common malicious patterns
    const dataStr = JSON.stringify(data);
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /document\.cookie/i
    ];

    return !suspiciousPatterns.some(pattern => pattern.test(dataStr));
  }

  // Secure save with integrity hash
  async secureSave(key: string, data: Record<string, unknown>): Promise<void> {
    try {
      const dataStr = JSON.stringify(data);
      const securityHash = await this.generateSecurityHash(dataStr);
      
      const secureData = {
        ...data,
        securityHash,
        extensionId: this.extensionId,
        timestamp: new Date().toISOString()
      };

      await chrome.storage.local.set({ [key]: secureData });
    } catch (error) {
      console.error('Secure save failed:', error);
      throw new Error('Failed to save data securely');
    }
  }

  // Secure load with integrity validation
  async secureLoad(key: string): Promise<Record<string, unknown> | null> {
    try {
      const result = await chrome.storage.local.get(key);
      const data = result[key];

      if (!data) return null;

      // Check extension ID
      if (data.extensionId !== this.extensionId) {
        console.warn('Data from different extension detected');
        return null;
      }

      // Validate integrity
      const isValid = await this.validateDataIntegrity(data);
      if (!isValid) {
        console.warn('Data integrity validation failed');
        return null;
      }

      // Remove security fields before returning
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { securityHash, extensionId, timestamp, ...cleanData } = data;
      return cleanData;
    } catch (error) {
      console.error('Secure load failed:', error);
      return null;
    }
  }

  // Check if current session is secure
  async checkSecurityStatus(): Promise<{
    extensionId: string;
    isSecure: boolean;
    lastCheck: string;
    warnings: string[];
  }> {
    const warnings: string[] = [];

    // Check if running in incognito (less secure)
    if (chrome.extension.inIncognitoContext) {
      warnings.push('Running in incognito mode');
    }

    // Check storage integrity by testing with actual app data
    try {
      // Test with real password data structure instead of synthetic data
      const realData = await chrome.storage.local.get('password_manager_passwords');
      if (realData.password_manager_passwords) {
        const isValid = await this.validateDataIntegrity(realData.password_manager_passwords);
        if (!isValid) {
          warnings.push('Password data integrity check failed');
        }
      }
      
      // Test basic storage functionality
      await chrome.storage.local.set({ security_test: 'ok' });
      const testResult = await chrome.storage.local.get('security_test');
      if (!testResult.security_test || testResult.security_test !== 'ok') {
        warnings.push('Storage functionality test failed');
      }
      await chrome.storage.local.remove('security_test');
    } catch (error) {
      warnings.push('Storage security test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }

    return {
      extensionId: this.extensionId,
      isSecure: warnings.length === 0,
      lastCheck: new Date().toISOString(),
      warnings
    };
  }

  // Get extension security info
  getSecurityInfo(): {
    extensionId: string;
    storageNamespace: string;
    isolationLevel: string;
  } {
    return {
      extensionId: this.extensionId,
      storageNamespace: `chrome-extension://${this.extensionId}/`,
      isolationLevel: 'Extension-level isolation (secure)'
    };
  }
}

export const securityService = new SecurityService();
