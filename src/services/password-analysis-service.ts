export interface PasswordStrength {
  score: number; // 1-5
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
  color: string;
  percentage: number;
}

export interface PasswordHealth {
  weak: number;
  duplicated: number;
  old: number;
  total: number;
  overallScore: number;
  recommendations: string[];
}

export interface PasswordAnalytics {
  strengthDistribution: { [key: string]: number };
  averageStrength: number;
  mostCommonWeaknesses: string[];
  securityTrends: Array<{ date: string; score: number }>;
}

class PasswordAnalysisService {
  private readonly commonPasswords = new Set([
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'iloveyou'
  ]);

  private readonly commonPatterns = [
    /^(.)\1+$/, // Repeated characters
    /^(012|123|234|345|456|567|678|789|890|987|876|765|654|543|432|321|210)/, // Sequential
    /^(qwerty|asdfgh|zxcvbn)/i, // Keyboard patterns
  ];

  analyzePasswordStrength(password: string): PasswordStrength {
    let score = 0;
    const feedback: string[] = [];

    // Length analysis
    if (password.length < 8) {
      feedback.push('Use at least 8 characters');
    } else if (password.length >= 8) {
      score += 1;
    }
    
    if (password.length >= 12) {
      score += 1;
    }

    // Character variety analysis
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

    if (hasLowercase && hasUppercase) {
      score += 1;
    } else {
      feedback.push('Mix uppercase and lowercase letters');
    }

    if (hasNumbers) {
      score += 1;
    } else {
      feedback.push('Add numbers');
    }

    if (hasSymbols) {
      score += 1;
    } else {
      feedback.push('Use special characters (!@#$%^&*)');
    }

    // Check for common passwords
    if (this.commonPasswords.has(password.toLowerCase())) {
      score = Math.max(0, score - 2);
      feedback.push('Avoid common passwords');
    }

    // Check for patterns
    for (const pattern of this.commonPatterns) {
      if (pattern.test(password)) {
        score = Math.max(0, score - 1);
        feedback.push('Avoid predictable patterns');
        break;
      }
    }

    // Calculate entropy bonus
    const uniqueChars = new Set(password).size;
    if (uniqueChars > password.length * 0.7) {
      score += 1;
    }

    // Normalize score to 1-5
    score = Math.max(1, Math.min(5, score));

    const levels = ['very-weak', 'weak', 'fair', 'good', 'strong'] as const;
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
    
    return {
      score,
      level: levels[score - 1],
      feedback: feedback.slice(0, 3), // Limit to 3 most important suggestions
      color: colors[score - 1],
      percentage: (score / 5) * 100
    };
  }

  findDuplicatePasswords(passwords: Array<{ id: string; password: string; website: string }>): Array<{
    password: string;
    count: number;
    websites: string[];
    ids: string[];
  }> {
    const passwordMap = new Map<string, { websites: string[]; ids: string[] }>();

    passwords.forEach(({ id, password, website }) => {
      if (!passwordMap.has(password)) {
        passwordMap.set(password, { websites: [], ids: [] });
      }
      passwordMap.get(password)!.websites.push(website);
      passwordMap.get(password)!.ids.push(id);
    });

    return Array.from(passwordMap.entries())
      .filter(([, data]) => data.websites.length > 1)
      .map(([password, data]) => ({
        password,
        count: data.websites.length,
        websites: data.websites,
        ids: data.ids
      }));
  }

  findOldPasswords(passwords: Array<{ id: string; updatedAt: Date; website: string }>, daysOld = 365): Array<{
    id: string;
    website: string;
    daysOld: number;
  }> {
    const now = new Date();
    return passwords
      .map(({ id, updatedAt, website }) => {
        try {
          // Ensure we have a valid date
          let validUpdatedAt: Date;
          if (updatedAt instanceof Date && !isNaN(updatedAt.getTime())) {
            validUpdatedAt = updatedAt;
          } else {
            // Try to parse as string if it's not a valid Date object
            validUpdatedAt = new Date(updatedAt as string | number);
            if (isNaN(validUpdatedAt.getTime())) {
              console.warn('PasswordAnalysisService: Invalid updatedAt date for password, using current date:', updatedAt);
              validUpdatedAt = new Date(); // Fallback to current date
            }
          }

          return {
            id,
            website,
            daysOld: Math.floor((now.getTime() - validUpdatedAt.getTime()) / (1000 * 60 * 60 * 24))
          };
        } catch (error) {
          console.error('PasswordAnalysisService: Error processing updatedAt for old passwords:', error, { id, updatedAt, website });
          return {
            id,
            website,
            daysOld: 0 // Default to 0 days old if there's an error
          };
        }
      })
      .filter(item => item.daysOld > daysOld);
  }

  analyzePasswordHealth(passwords: Array<{
    id: string;
    password: string;
    website: string;
    updatedAt: Date;
  }>): PasswordHealth {

    if (!passwords || passwords.length === 0) {
      return {
        weak: 0,
        duplicated: 0,
        old: 0,
        total: 0,
        overallScore: 0,
        recommendations: ['No passwords found. Add some passwords to see health analysis.']
      };
    }

    const strengthAnalysis = passwords.map(p => this.analyzePasswordStrength(p.password));
    const duplicates = this.findDuplicatePasswords(passwords);
    const oldPasswords = this.findOldPasswords(passwords);

    const weak = strengthAnalysis.filter(s => s.score <= 2).length;
    const duplicated = duplicates.reduce((acc, dup) => acc + dup.count, 0);
    const old = oldPasswords.length;
    const total = passwords.length;

    // Calculate overall score (0-100)
    const strengthScore = strengthAnalysis.reduce((acc, s) => acc + s.score, 0) / (total * 5) * 100;
    const duplicateScore = Math.max(0, 100 - (duplicated / total) * 100);
    const ageScore = Math.max(0, 100 - (old / total) * 100);
    
    const overallScore = Math.round((strengthScore + duplicateScore + ageScore) / 3);

    const recommendations: string[] = [];
    
    if (weak > 0) {
      recommendations.push(`Strengthen ${weak} weak password${weak > 1 ? 's' : ''}`);
    }
    
    if (duplicated > 0) {
      recommendations.push(`Replace ${duplicated} duplicate password${duplicated > 1 ? 's' : ''}`);
    }
    
    if (old > 0) {
      recommendations.push(`Update ${old} old password${old > 1 ? 's' : ''} (>1 year)`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Your passwords are in great shape! 🎉');
    }

    const result = {
      weak,
      duplicated,
      old,
      total,
      overallScore,
      recommendations
    };

    return result;
  }

  generatePasswordAnalytics(passwords: Array<{
    id: string;
    password: string;
    website: string;
    updatedAt: Date;
    createdAt: Date;
  }>): PasswordAnalytics {
    
    if (!passwords || passwords.length === 0) {
      return {
        strengthDistribution: {},
        averageStrength: 0,
        mostCommonWeaknesses: [],
        securityTrends: []
      };
    }

    const strengthAnalysis = passwords.map(p => this.analyzePasswordStrength(p.password));
    
    // Strength distribution
    const strengthDistribution = strengthAnalysis.reduce((acc, analysis) => {
      acc[analysis.level] = (acc[analysis.level] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Average strength
    const averageStrength = strengthAnalysis.reduce((acc, s) => acc + s.score, 0) / strengthAnalysis.length;

    // Most common weaknesses
    const allFeedback = strengthAnalysis.flatMap(s => s.feedback);
    const feedbackCount = allFeedback.reduce((acc, feedback) => {
      acc[feedback] = (acc[feedback] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const mostCommonWeaknesses = Object.entries(feedbackCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([feedback]) => feedback);

    // Security trends (simplified - based on creation dates)
    const securityTrends = this.calculateSecurityTrends(passwords);

    const result = {
      strengthDistribution,
      averageStrength,
      mostCommonWeaknesses,
      securityTrends
    };

    return result;
  }

  private calculateSecurityTrends(passwords: Array<{
    password: string;
    createdAt: Date;
  }>): Array<{ date: string; score: number }> {
    // Group passwords by month and calculate average strength
    const monthlyData = new Map<string, { scores: number[]; count: number }>();

    passwords.forEach(password => {
      try {
        // Ensure we have a valid date
        let createdAt: Date;
        if (password.createdAt instanceof Date && !isNaN(password.createdAt.getTime())) {
          createdAt = password.createdAt;
        } else {
          // Try to parse as string if it's not a valid Date object
          createdAt = new Date(password.createdAt as string | number);
          if (isNaN(createdAt.getTime())) {
            console.warn('PasswordAnalysisService: Invalid date for password, using current date:', password.createdAt);
            createdAt = new Date(); // Fallback to current date
          }
        }

        const month = createdAt.toISOString().substring(0, 7); // YYYY-MM
        const strength = this.analyzePasswordStrength(password.password);
        
        if (!monthlyData.has(month)) {
          monthlyData.set(month, { scores: [], count: 0 });
        }
        
        monthlyData.get(month)!.scores.push(strength.score);
        monthlyData.get(month)!.count++;
      } catch (error) {
        console.error('PasswordAnalysisService: Error processing date for security trends:', error, password);
      }
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        date: month,
        score: data.scores.reduce((acc, score) => acc + score, 0) / data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-6); // Last 6 months
  }

  generateSecurePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    
    // Ensure at least one character from each category
    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

export const passwordAnalysisService = new PasswordAnalysisService();
