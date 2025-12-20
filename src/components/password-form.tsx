import { useState, useEffect, KeyboardEvent, FormEvent } from 'react';
import { PasswordEntry } from '../types/password';
import { PasswordStrengthIndicator, PasswordGenerator } from './password-strength-indicator';

interface PasswordFormProps {
  password?: PasswordEntry | null;
  currentDomain?: string;
  onSave: (passwordData: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function PasswordForm({ password, currentDomain, onSave, onCancel }: PasswordFormProps) {
  const [website, setWebsite] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [passwordValue, setPasswordValue] = useState<string>('');
  const [category, setCategory] = useState<'work' | 'personal' | 'shopping' | 'social' | 'other'>('personal');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showGenerator, setShowGenerator] = useState<boolean>(false);

  const generatePassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const randomValues = new Uint32Array(16);
    crypto.getRandomValues(randomValues);
    const result = Array.from(randomValues, (value) => charset[value % charset.length]).join('');
    setPasswordValue(result);
  };

  const handleGeneratedPassword = (password: string) => {
    setPasswordValue(password);
    setShowGenerator(false);
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!website.trim() || !username.trim() || !passwordValue.trim()) {
      alert('Please fill in all fields');
      return;
    }

    onSave({
      website: website.trim(),
      username: username.trim(),
      password: passwordValue.trim(),
      category,
      tags,
      notes: notes.trim() || undefined
    });
  };

  useEffect(() => {
    if (password) {
      setWebsite(password.website);
      setUsername(password.username);
      setPasswordValue(password.password);
      setCategory(password.category);
      setTags(password.tags || []);
      setNotes(password.notes || '');
    } else {
      setWebsite(currentDomain || '');
      setUsername('');
      setPasswordValue('');
      setCategory('personal');
      setTags([]);
      setNotes('');
    }
  }, [password, currentDomain]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium themed-text-primary">
        {password ? 'Edit Password' : 'New Password'}
      </h3>

      <div>
        <label htmlFor="website" className="block text-sm font-medium themed-text-primary mb-1">
          Website/Application
        </label>
        <input
          type="text"
          id="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="e.g. gmail.com, facebook.com"
          className="w-full px-3 py-2 themed-border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] themed-bg-primary themed-text-primary"
          required
        />
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium themed-text-primary mb-1">
          Username/Email
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. your.email@example.com"
          className="w-full px-3 py-2 themed-border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] themed-bg-primary themed-text-primary"
          required
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium themed-text-primary mb-1">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as 'work' | 'personal' | 'shopping' | 'social' | 'other')}
          className="w-full px-3 py-2 themed-border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] themed-bg-primary themed-text-primary"
        >
          <option value="personal">🏠 Personal</option>
          <option value="work">💼 Work</option>
          <option value="shopping">🛒 Shopping</option>
          <option value="social">👥 Social</option>
          <option value="other">📂 Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium themed-text-primary mb-1">
          Tags
        </label>
        <div className="space-y-2">
          <div className="flex">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder="Add tags (press Enter)"
              className="flex-1 px-3 py-2 themed-border rounded-l-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] themed-bg-primary themed-text-primary"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 themed-accent-bg hover:themed-accent-hover text-white rounded-r-md transition-colors"
            >
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm themed-bg-secondary themed-text-primary themed-border"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-red-500 hover:text-red-700 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium themed-text-primary mb-1">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes about this password..."
          rows={3}
          className="w-full px-3 py-2 themed-border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] themed-bg-primary themed-text-primary resize-vertical"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium themed-text-primary mb-1">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={passwordValue}
            onChange={(e) => setPasswordValue(e.target.value)}
            placeholder="Enter or generate a password"
            className="w-full px-3 py-2 pr-32 themed-border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] themed-bg-primary themed-text-primary"
            required
          />
          <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="themed-text-secondary hover:themed-text-primary p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
            <button
              type="button"
              onClick={generatePassword}
              className="themed-accent-text hover:text-[var(--accent-600)] p-1 rounded hover:bg-[var(--accent-50)] transition-colors"
              title="Generate random password"
            >
              🎲
            </button>
            <button
              type="button"
              onClick={() => setShowGenerator(!showGenerator)}
              className="themed-accent-text hover:text-[var(--accent-600)] p-1 rounded hover:bg-[var(--accent-50)] transition-colors"
              title="Advanced password generator"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Password Strength Indicator */}
        {passwordValue && (
          <div className="mt-3">
            <PasswordStrengthIndicator password={passwordValue} />
          </div>
        )}

        {/* Advanced Password Generator */}
        {showGenerator && (
          <div className="mt-3 p-4 rounded-lg themed-bg-secondary themed-border">
            <PasswordGenerator onPasswordGenerated={handleGeneratedPassword} />
          </div>
        )}
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          className="flex-1 themed-accent-bg hover:themed-accent-hover text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {password ? 'Update' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 themed-bg-secondary hover:bg-[var(--bg-tertiary)] themed-text-primary font-medium py-2 px-4 rounded-md transition-colors themed-border"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
