import { useState } from 'react';
import { PasswordEntry } from '../types/password';
import { PasswordBreachIndicator } from './password-breach-indicator';
import { PasswordQRCode } from './password-qr-code';
import { Toast, useToast } from './toast';

interface PasswordListProps {
  passwords: PasswordEntry[];
  currentDomain?: string;
  onEdit: (password: PasswordEntry) => void;
  onDelete: (id: string) => void;
}

export function PasswordList({ passwords, currentDomain, onEdit, onDelete }: PasswordListProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [showQRPassword, setShowQRPassword] = useState<PasswordEntry | null>(null);
  const { toast, showToast, dismissToast } = useToast();

  const togglePasswordVisibility = (id: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisiblePasswords(newVisible);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard`, 'success');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  if (passwords.length === 0) {
    return (
      <div className="p-8 text-center themed-text-secondary">
        <div className="text-lg mb-2">No passwords found</div>
        <div className="text-sm">Add a new password to get started</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {passwords.map((password) => {
        const isCurrentDomain = currentDomain && 
          password.website.toLowerCase().includes(currentDomain.toLowerCase());
        
        return (
          <div 
            key={password.id} 
            className={`relative p-4 rounded-lg border-2 hover:shadow-md transition-all duration-200 ${
              isCurrentDomain 
                ? 'bg-[var(--accent-50)] border-[var(--accent-500)] shadow-sm' 
                : 'themed-bg-primary themed-border hover:border-[var(--border-secondary)]'
            }`}
          >
            {/* Header with website and actions */}
            <div className="flex justify-between items-start mb-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-medium themed-text-primary truncate">{password.website}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    password.category === 'work' ? 'bg-blue-100 text-blue-800' :
                    password.category === 'personal' ? 'bg-green-100 text-green-800' :
                    password.category === 'shopping' ? 'bg-purple-100 text-purple-800' :
                    password.category === 'social' ? 'bg-pink-100 text-pink-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {password.category.charAt(0).toUpperCase() + password.category.slice(1)}
                  </span>
                  {isCurrentDomain && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[var(--accent-100)] text-[var(--accent-700)] flex-shrink-0">
                      Current Site
                    </span>
                  )}
                </div>
                <p className="text-sm themed-text-secondary truncate">{password.username}</p>
                {password.tags && password.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {password.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs themed-bg-secondary themed-text-secondary"
                      >
                        #{tag}
                      </span>
                    ))}
                    {password.tags.length > 3 && (
                      <span className="text-xs themed-text-tertiary">
                        +{password.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex space-x-2 flex-shrink-0 ml-2">
                <button
                  onClick={() => setShowQRPassword(password)}
                  className="themed-accent-text hover:text-[var(--accent-600)] text-sm p-1 hover:bg-[var(--accent-50)] rounded transition-colors"
                  title="Show QR Code"
                >
                  📱
                </button>
                <button
                  onClick={() => onEdit(password)}
                  className="themed-accent-text hover:text-[var(--accent-600)] text-sm p-1 hover:bg-[var(--accent-50)] rounded transition-colors"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(password.id)}
                  className="text-red-600 hover:text-red-800 text-sm p-1 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Username section */}
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs themed-text-secondary uppercase tracking-wide">Username</span>
                <button
                  onClick={() => copyToClipboard(password.username, 'Username')}
                  className="themed-accent-text hover:text-[var(--accent-600)] text-sm p-1 hover:bg-[var(--accent-50)] rounded transition-colors"
                  title="Copy username"
                >
                  📋
                </button>
              </div>
              <div className="text-sm themed-text-primary truncate mt-1 font-mono">
                {password.username}
              </div>
            </div>

            {/* Password section */}
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs themed-text-secondary uppercase tracking-wide">Password</span>
                <div className="flex items-center space-x-1">
                  <PasswordBreachIndicator password={password.password} compact={true} />
                  <button
                    onClick={() => togglePasswordVisibility(password.id)}
                    className="themed-text-secondary hover:themed-text-primary text-sm p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
                    title={visiblePasswords.has(password.id) ? 'Hide password' : 'Show password'}
                  >
                    {visiblePasswords.has(password.id) ? '🙈' : '👁️'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(password.password, 'Password')}
                    className="themed-accent-text hover:text-[var(--accent-600)] text-sm p-1 hover:bg-[var(--accent-50)] rounded transition-colors"
                    title="Copy password"
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className="text-sm font-mono truncate mt-1 themed-text-primary">
                {visiblePasswords.has(password.id) ? password.password : '••••••••••••'}
              </div>
            </div>

            {/* Notes section */}
            {password.notes && (
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs themed-text-secondary uppercase tracking-wide">Notes</span>
                </div>
                <div className="text-sm themed-text-primary mt-1 line-clamp-2">
                  {password.notes}
                </div>
              </div>
            )}

            {/* Footer with date */}
            <div className="text-xs themed-text-tertiary pt-2 mt-2">
              Updated: {password.updatedAt.toLocaleDateString('en-US')}
            </div>
          </div>
        );
      })}
      
      {/* QR Code Modal */}
      {showQRPassword && (
        <PasswordQRCode
          password={showQRPassword}
          isOpen={!!showQRPassword}
          onClose={() => setShowQRPassword(null)}
        />
      )}

      {/* Toast notifications */}
      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  );
}