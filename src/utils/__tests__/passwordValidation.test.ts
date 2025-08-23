import { PasswordValidator } from '../passwordValidation';
import { DEFAULT_PASSWORD_REQUIREMENTS } from '../../types/passwordReset';

describe('PasswordValidator', () => {
  let validator: PasswordValidator;

  beforeEach(() => {
    validator = new PasswordValidator();
  });

  describe('Password Validation', () => {
    describe('Length Requirements', () => {
      it('should fail validation for passwords shorter than minimum length', () => {
        const result = validator.validatePassword('short');
        
        expect(result.isValid).toBe(false);
        expect(result.requirements.length).toBe(false);
        expect(result.feedback).toContain('Password must be at least 8 characters long');
      });

      it('should pass length validation for passwords meeting minimum length', () => {
        const result = validator.validatePassword('StrongP@ssw0rd123');
        
        expect(result.requirements.length).toBe(true);
      });

      it('should give bonus score for passwords 12+ characters', () => {
        const shortResult = validator.validatePassword('StrongP@1');
        const longResult = validator.validatePassword('VeryStrongP@ssw0rd123');
        
        expect(longResult.score).toBeGreaterThan(shortResult.score);
      });
    });

    describe('Character Requirements', () => {
      it('should require uppercase letters', () => {
        const result = validator.validatePassword('strongp@ssw0rd123');
        
        expect(result.requirements.uppercase).toBe(false);
        expect(result.feedback).toContain('Password must contain at least one uppercase letter');
      });

      it('should require lowercase letters', () => {
        const result = validator.validatePassword('STRONGP@SSW0RD123');
        
        expect(result.requirements.lowercase).toBe(false);
        expect(result.feedback).toContain('Password must contain at least one lowercase letter');
      });

      it('should require numbers', () => {
        const result = validator.validatePassword('StrongP@ssword');
        
        expect(result.requirements.numbers).toBe(false);
        expect(result.feedback).toContain('Password must contain at least one number');
      });

      it('should require special characters', () => {
        const result = validator.validatePassword('StrongPassword123');
        
        expect(result.requirements.specialChars).toBe(false);
        expect(result.feedback).toContain('Password must contain at least one special character');
      });
    });

    describe('Password Strength Assessment', () => {
      it('should classify weak passwords correctly', () => {
        const result = validator.validatePassword('weak');
        
        expect(result.strength).toBe('weak');
        expect(result.score).toBeLessThan(60);
      });

      it('should classify medium strength passwords correctly', () => {
        const result = validator.validatePassword('Medium1!');
        
        expect(result.strength).toBe('medium');
        expect(result.score).toBeGreaterThanOrEqual(60);
        expect(result.score).toBeLessThan(80);
      });

      it('should classify strong passwords correctly', () => {
        const result = validator.validatePassword('VeryStrongP@ssw0rd123!');
        
        expect(result.strength).toBe('strong');
        expect(result.score).toBeGreaterThanOrEqual(80);
      });
    });

    describe('Common Password Detection', () => {
      it('should penalize common passwords', () => {
        const commonResult = validator.validatePassword('password123');
        const uniqueResult = validator.validatePassword('UniqueP@ssw0rd123');
        
        expect(commonResult.score).toBeLessThan(uniqueResult.score);
        expect(commonResult.feedback).toContain('Avoid common password patterns');
      });

      it('should detect admin-related passwords', () => {
        const result = validator.validatePassword('admin123');
        
        expect(result.feedback).toContain('Avoid common password patterns');
      });

      it('should detect sequential patterns', () => {
        const result = validator.validatePassword('123456password');
        
        expect(result.feedback).toContain('Avoid common password patterns');
      });
    });

    describe('Repeated Character Detection', () => {
      it('should penalize passwords with repeated characters', () => {
        const result = validator.validatePassword('Passsssword123!');
        
        expect(result.score).toBeLessThan(80);
        expect(result.feedback).toContain('Avoid repeating characters');
      });

      it('should not penalize normal repetitions', () => {
        const result = validator.validatePassword('Strong11Password!');
        
        expect(result.feedback).not.toContain('Avoid repeating characters');
      });
    });
  });

  describe('Custom Requirements', () => {
    it('should work with custom requirements', () => {
      const customValidator = new PasswordValidator({
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: false,
        requireSpecialChars: false
      });

      const result = customValidator.validatePassword('LongPassword');
      
      expect(result.requirements.length).toBe(true);
      expect(result.requirements.uppercase).toBe(true);
      expect(result.requirements.lowercase).toBe(true);
      expect(result.requirements.numbers).toBe(true); // Should be true since not required
      expect(result.requirements.specialChars).toBe(true); // Should be true since not required
    });

    it('should allow disabling uppercase requirement', () => {
      const customValidator = new PasswordValidator({
        ...DEFAULT_PASSWORD_REQUIREMENTS,
        requireUppercase: false
      });

      const result = customValidator.validatePassword('strongpassword123!');
      
      expect(result.requirements.uppercase).toBe(true);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty passwords', () => {
      const result = validator.validatePassword('');
      
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.score).toBe(0);
    });

    it('should handle very long passwords', () => {
      const longPassword = 'A'.repeat(100) + 'a1!';
      const result = validator.validatePassword(longPassword);
      
      expect(result.requirements.length).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(20);
    });

    it('should handle special characters correctly', () => {
      const specialChars = '!@#$%^&*(),.?":{}|<>';
      for (let char of specialChars) {
        const result = validator.validatePassword(`StrongP${char}ssw0rd`);
        expect(result.requirements.specialChars).toBe(true);
      }
    });

    it('should handle unicode characters', () => {
      const result = validator.validatePassword('Str0ng©Password!');
      
      expect(result.requirements.length).toBe(true);
      expect(result.requirements.uppercase).toBe(true);
      expect(result.requirements.lowercase).toBe(true);
      expect(result.requirements.numbers).toBe(true);
      expect(result.requirements.specialChars).toBe(true);
    });
  });

  describe('Feedback Messages', () => {
    it('should provide positive feedback for valid passwords', () => {
      const result = validator.validatePassword('ExcellentP@ssw0rd123');
      
      expect(result.isValid).toBe(true);
      expect(result.feedback).toContain('Password meets all requirements');
    });

    it('should provide comprehensive feedback for invalid passwords', () => {
      const result = validator.validatePassword('weak');
      
      expect(result.feedback.length).toBeGreaterThan(3);
      expect(result.feedback.some(f => f.includes('uppercase'))).toBe(true);
      expect(result.feedback.some(f => f.includes('number'))).toBe(true);
      expect(result.feedback.some(f => f.includes('special character'))).toBe(true);
    });

    it('should mention good length for long passwords', () => {
      const result = validator.validatePassword('VeryLongStrongP@ssw0rd123');
      
      expect(result.feedback).toContain('✓ Good length (12+ characters)');
    });
  });
});

describe('PasswordValidator Static Methods', () => {
  describe('Email Validation', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_name@sub.example.org',
        'user123@example123.com'
      ];

      validEmails.forEach(email => {
        expect(PasswordValidator.isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@example.com',
        'user@',
        'user..name@example.com',
        'user@example',
        'user @example.com',
        'user@exam ple.com',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(PasswordValidator.isValidEmail(email)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(PasswordValidator.isValidEmail('a@b.co')).toBe(true);
      expect(PasswordValidator.isValidEmail('very-long-email-address@very-long-domain-name.com')).toBe(true);
    });
  });

  describe('Password Generation', () => {
    it('should generate passwords of correct length', () => {
      const lengths = [8, 12, 16, 20];
      
      lengths.forEach(length => {
        const password = PasswordValidator.generateStrongPassword(length);
        expect(password).toHaveLength(length);
      });
    });

    it('should generate passwords with all required character types', () => {
      const password = PasswordValidator.generateStrongPassword(12);
      
      expect(/[A-Z]/.test(password)).toBe(true); // Uppercase
      expect(/[a-z]/.test(password)).toBe(true); // Lowercase
      expect(/[0-9]/.test(password)).toBe(true); // Numbers
      expect(/[!@#$%^&*(),.?":{}|<>]/.test(password)).toBe(true); // Special chars
    });

    it('should generate different passwords each time', () => {
      const passwords = Array.from({ length: 10 }, () => 
        PasswordValidator.generateStrongPassword(12)
      );
      
      const uniquePasswords = new Set(passwords);
      expect(uniquePasswords.size).toBe(passwords.length);
    });

    it('should generate valid strong passwords', () => {
      const validator = new PasswordValidator();
      
      for (let i = 0; i < 5; i++) {
        const password = PasswordValidator.generateStrongPassword();
        const validation = validator.validatePassword(password);
        
        expect(validation.isValid).toBe(true);
        expect(validation.strength).toBe('strong');
      }
    });

    it('should handle default length parameter', () => {
      const password = PasswordValidator.generateStrongPassword();
      
      expect(password).toHaveLength(12);
    });
  });
});