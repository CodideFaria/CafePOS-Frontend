import { PasswordValidation, PasswordStrengthRequirements, DEFAULT_PASSWORD_REQUIREMENTS } from '../types/passwordReset';

export class PasswordValidator {
  private requirements: PasswordStrengthRequirements;

  constructor(requirements: PasswordStrengthRequirements = DEFAULT_PASSWORD_REQUIREMENTS) {
    this.requirements = requirements;
  }

  validatePassword(password: string): PasswordValidation {
    const checks = {
      length: password.length >= this.requirements.minLength,
      uppercase: this.requirements.requireUppercase ? /[A-Z]/.test(password) : true,
      lowercase: this.requirements.requireLowercase ? /[a-z]/.test(password) : true,
      numbers: this.requirements.requireNumbers ? /[0-9]/.test(password) : true,
      specialChars: this.requirements.requireSpecialChars ? /[!@#$%^&*(),.?":{}|<>]/.test(password) : true,
    };

    const feedback: string[] = [];
    let score = 0;

    // Check each requirement and provide feedback
    if (!checks.length) {
      feedback.push(`Password must be at least ${this.requirements.minLength} characters long`);
    } else {
      score += 20;
    }

    if (this.requirements.requireUppercase && !checks.uppercase) {
      feedback.push('Password must contain at least one uppercase letter');
    } else if (checks.uppercase) {
      score += 20;
    }

    if (this.requirements.requireLowercase && !checks.lowercase) {
      feedback.push('Password must contain at least one lowercase letter');
    } else if (checks.lowercase) {
      score += 20;
    }

    if (this.requirements.requireNumbers && !checks.numbers) {
      feedback.push('Password must contain at least one number');
    } else if (checks.numbers) {
      score += 20;
    }

    if (this.requirements.requireSpecialChars && !checks.specialChars) {
      feedback.push('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
    } else if (checks.specialChars) {
      score += 20;
    }

    // Additional strength checks
    if (password.length >= 12) {
      score += 10;
      feedback.push('✓ Good length (12+ characters)');
    }

    if (/(.)\1{2,}/.test(password)) {
      score -= 10;
      feedback.push('Avoid repeating characters');
    }

    // Common password patterns
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /letmein/i,
    ];

    if (commonPatterns.some(pattern => pattern.test(password))) {
      score -= 20;
      feedback.push('Avoid common password patterns');
    }

    const isValid = Object.values(checks).every(check => check === true);
    
    let strength: 'weak' | 'medium' | 'strong';
    if (score >= 80) {
      strength = 'strong';
    } else if (score >= 60) {
      strength = 'medium';
    } else {
      strength = 'weak';
    }

    return {
      isValid,
      strength,
      score: Math.max(0, Math.min(100, score)),
      requirements: checks,
      feedback: feedback.length === 0 ? ['Password meets all requirements'] : feedback
    };
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static generateStrongPassword(length: number = 12): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*(),.?":{}|<>';
    
    const allChars = uppercase + lowercase + numbers + specialChars;
    let password = '';
    
    // Ensure at least one character from each required category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
    
    // Fill remaining positions
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }
}