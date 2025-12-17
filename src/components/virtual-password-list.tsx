import { useState, useCallback, CSSProperties, memo } from 'react';
import { PasswordEntry } from '../types/password';
import { PasswordBreachIndicator } from './password-breach-indicator';
import { PasswordQRCode } from './password-qr-code';
import { useVirtualScroll } from '../hooks/useVirtualScroll';
import { Toast, useToast } from './toast';

interface VirtualPasswordListProps {
  passwords: PasswordEntry[];
  currentDomain?: string;
  onEdit: (password: PasswordEntry) => void;
  onDelete: (id: string) => void;
  containerHeight?: number;
}

interface PasswordItemProps {
  password: PasswordEntry;
  currentDomain?: string;
  onEdit: (password: PasswordEntry) => void;
  onDelete: (id: string) => void;
  style: CSSProperties;
  visiblePasswords: Set<string>;
  onToggleVisibility: (id: string) => void;
  onShowQR: (password: PasswordEntry) => void;
  onCopy: (text: string, label: string) => void;
}

// Memoized password item component to avoid unnecessary re-renders
const PasswordItem = memo(({ 
  password, 
  currentDomain, 
  onEdit, 
  onDelete, 
  style, 
  visiblePasswords,
  onToggleVisibility,
  onShowQR,
  onCopy
}: PasswordItemProps) => {
  const isCurrentDomain = currentDomain && 
    password.website.toLowerCase().includes(currentDomain.toLowerCase());

  return (
    <div 
      style={style}
      className={`absolute left-0 right-0 px-4 pb-4`}
    >
      <div className={`themed-bg-primary border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
        isCurrentDomain ? 'themed-border ring-2 ring-[var(--accent-500)] ring-opacity-20' : 'themed-border'
      }`}>
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium themed-text-primary truncate">
                  {password.website || 'Untitled'}
                </h3>
                {isCurrentDomain && (
                  <span className="px-2 py-1 text-xs rounded-full themed-accent-bg text-white">
                    Current site
                  </span>
                )}
              </div>
              <p className="text-sm themed-text-secondary truncate">
                {password.username}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <PasswordBreachIndicator password={password.password} compact />
                {password.category && (
                  <span className="px-2 py-1 text-xs themed-bg-secondary themed-text-secondary rounded">
                    {password.category}
                  </span>
                )}
              </div>
            </div>
            <div className="flex space-x-1 ml-2">
              <button
                onClick={() => onShowQR(password)}
                className="p-2 themed-text-secondary hover:themed-text-primary rounded transition-colors"
                title="Show QR Code"
              >
                📱
              </button>
              <button
                onClick={() => onEdit(password)}
                className="p-2 themed-text-secondary hover:themed-text-primary rounded transition-colors"
                title="Edit Password"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(password.id)}
                className="p-2 text-red-500 hover:text-red-700 rounded transition-colors"
                title="Delete Password"
              >
                🗑️
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm themed-text-secondary">Password:</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm themed-text-primary">
                  {visiblePasswords.has(password.id) ? password.password : '••••••••'}
                </span>
                <button
                  onClick={() => onToggleVisibility(password.id)}
                  className="p-1 themed-text-secondary hover:themed-text-primary rounded transition-colors"
                  title={visiblePasswords.has(password.id) ? "Hide Password" : "Show Password"}
                >
                  {visiblePasswords.has(password.id) ? '🙈' : '👁️'}
                </button>
                <button
                  onClick={() => onCopy(password.password, 'Password')}
                  className="p-1 themed-text-secondary hover:themed-text-primary rounded transition-colors"
                  title="Copy Password"
                >
                  📋
                </button>
              </div>
            </div>

            {password.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {password.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs themed-bg-secondary themed-text-secondary rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {password.notes && (
              <div className="mt-2 pt-2 border-t themed-border">
                <p className="text-sm themed-text-secondary">
                  {password.notes}
                </p>
              </div>
            )}

            <div className="flex justify-between text-xs themed-text-secondary pt-2 border-t themed-border">
              <span>Created: {new Date(password.createdAt).toLocaleDateString()}</span>
              <span>Updated: {new Date(password.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

PasswordItem.displayName = 'PasswordItem';

export function VirtualPasswordList({ 
  passwords, 
  currentDomain, 
  onEdit, 
  onDelete,
  containerHeight = 600 
}: VirtualPasswordListProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [showQRPassword, setShowQRPassword] = useState<PasswordEntry | null>(null);
  const { toast, showToast, dismissToast } = useToast();

  // Estimated height of each item (adjust as needed)
  const ITEM_HEIGHT = 200;

  const { virtualItems, containerProps, innerProps } = useVirtualScroll(
    passwords,
    {
      itemHeight: ITEM_HEIGHT,
      containerHeight,
      overscan: 3
    }
  );

  const togglePasswordVisibility = useCallback((id: string) => {
    setVisiblePasswords(prev => {
      const newVisible = new Set(prev);
      if (newVisible.has(id)) {
        newVisible.delete(id);
      } else {
        newVisible.add(id);
      }
      return newVisible;
    });
  }, []);

  const handleShowQR = useCallback((password: PasswordEntry) => {
    setShowQRPassword(password);
  }, []);

  const handleCopy = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard`, 'success');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showToast('Failed to copy to clipboard', 'error');
    }
  }, [showToast]);

  if (passwords.length === 0) {
    return (
      <div className="p-8 text-center themed-text-secondary">
        <div className="text-lg mb-2">No passwords found</div>
        <div className="text-sm">Add a new password to get started</div>
      </div>
    );
  }

  return (
    <>
      <div {...containerProps} className="password-list-container">
        <div {...innerProps}>
          {virtualItems.map((virtualItem) => (
            <PasswordItem
              key={virtualItem.item.id}
              password={virtualItem.item}
              currentDomain={currentDomain}
              onEdit={onEdit}
              onDelete={onDelete}
              style={{
                top: virtualItem.offsetTop,
                height: ITEM_HEIGHT,
              }}
              visiblePasswords={visiblePasswords}
              onToggleVisibility={togglePasswordVisibility}
              onShowQR={handleShowQR}
              onCopy={handleCopy}
            />
          ))}
        </div>
      </div>

      {showQRPassword && (
        <PasswordQRCode
          password={showQRPassword}
          isOpen={true}
          onClose={() => setShowQRPassword(null)}
        />
      )}

      {/* Toast notifications */}
      <Toast message={toast} onDismiss={dismissToast} />
    </>
  );
}
