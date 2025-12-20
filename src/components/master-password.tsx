import { FormEvent, useState } from 'react';
import { securityService } from '../services/master-password-service';
import { PasswordStrengthIndicator } from './password-strength-indicator';

interface MasterPasswordSetupProps {
  onComplete: () => void;
  onClose: () => void;
}

export function MasterPasswordSetup({ onComplete, onClose }: MasterPasswordSetupProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePassword = (password: string): { isValid: boolean; message: string } => {
    if (!password) {
      return { isValid: false, message: 'Password is required' };
    }

    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one special character (@$!%*?&)' };
    }

    return { isValid: true, message: 'Password is strong' };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    setIsLoading(true);
    try {
      await securityService.setMasterPassword(password);
      onComplete();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to set master password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="themed-bg-primary rounded-lg shadow-xl max-w-md w-full p-6 border themed-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white text-sm">🛡️</span>
          </div>
          <h2 className="text-xl font-semibold themed-text-primary">
            Set Master Password
          </h2>
        </div>

        <div className="mb-4 p-4 rounded-lg themed-bg-secondary border themed-border">
          <p className="text-sm themed-text-secondary">
            The master password will encrypt all your stored passwords. 
            Choose a strong password that you'll remember - it cannot be recovered if lost.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 themed-text-primary">
              Master Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border rounded-md themed-input"
                placeholder="Enter master password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded themed-text-secondary hover:themed-text-primary"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {password && (
              <div className="mt-2">
                <PasswordStrengthIndicator password={password} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 themed-text-primary">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border rounded-md themed-input"
                placeholder="Confirm master password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded themed-text-secondary hover:themed-text-primary"
              >
                {showConfirm ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md text-sm font-medium themed-border themed-text-secondary hover:themed-bg-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !password || password !== confirmPassword}
            >
              {isLoading ? 'Setting up...' : 'Set Master Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface MasterPasswordUnlockProps {
  onUnlock: () => void;
  onClose: () => void;
  onReset?: () => void;
}

export function MasterPasswordUnlock({ onUnlock, onClose, onReset }: MasterPasswordUnlockProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await securityService.unlockVault(password);
      if (success) {
        onUnlock();
      } else {
        setAttempts(prev => prev + 1);
        setError(`Invalid master password${attempts > 0 ? ` (${attempts + 1} attempts)` : ''}`);
        setPassword('');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to unlock vault');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="themed-bg-primary rounded-lg shadow-xl max-w-md w-full p-6 border themed-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
            <span className="text-white text-sm">🔒</span>
          </div>
          <h2 className="text-xl font-semibold themed-text-primary">
            Vault Locked
          </h2>
        </div>

        <div className="mb-4 p-4 rounded-lg themed-bg-secondary border themed-border">
          <p className="text-sm themed-text-secondary">
            Enter your master password to unlock the vault and access your passwords.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 themed-text-primary">
              Master Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border rounded-md themed-input"
                placeholder="Enter master password"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded themed-text-secondary hover:themed-text-primary"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {attempts >= 3 && (
            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                Multiple failed attempts detected. If you've forgotten your master password, 
                you'll need to reset the vault (this will delete all stored passwords).
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md text-sm font-medium themed-border themed-text-secondary hover:themed-bg-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !password}
            >
              {isLoading ? 'Unlocking...' : (
                <>
                  🔓 Unlock Vault
                </>
              )}
            </button>
          </div>

          {attempts >= 3 && (
            <div className="pt-4 border-t themed-border">
              <button
                type="button"
                onClick={async () => {
                  if (confirm('⚠️ WARNING: This will permanently delete ALL stored passwords and data. This action cannot be undone!\n\nAre you absolutely sure you want to proceed?')) {
                    try {
                      await securityService.resetSecurity();
                      // Call the reset callback if provided, otherwise reload
                      if (onReset) {
                        onReset();
                      } else {
                        window.location.reload();
                      }
                      onClose();
                    } catch {
                      setError('Failed to reset vault. Please try again.');
                    }
                  }
                }}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600"
              >
                🗑️ Reset Vault (Delete All Data)
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

interface MasterPasswordChangeProps {
  onComplete: () => void;
  onClose: () => void;
}

export function MasterPasswordChange({ onComplete, onClose }: MasterPasswordChangeProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePassword = (password: string): { isValid: boolean; message: string } => {
    if (!password) {
      return { isValid: false, message: 'Password is required' };
    }

    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }

    if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one special character' };
    }

    return { isValid: true, message: '' };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate current password by attempting to unlock
    try {
      const isValidCurrent = await securityService.unlockVault(currentPassword);
      if (!isValidCurrent) {
        setError('Current password is incorrect');
        return;
      }
    } catch {
      setError('Current password is incorrect');
      return;
    }

    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return;
    }

    setIsLoading(true);

    try {
      // Change the master password
      await securityService.changeMasterPassword(currentPassword, newPassword);
      onComplete();
    } catch (error) {
      console.error('Error changing master password:', error);
      setError('Failed to change master password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="themed-bg-primary rounded-lg shadow-xl w-full max-w-md mx-4 border themed-border">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold themed-text-primary">Change Master Password</h2>
            <button
              onClick={onClose}
              className="themed-text-secondary hover:themed-text-primary"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium themed-text-primary mb-2">
                Current Master Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center themed-text-secondary hover:themed-text-primary"
                >
                  {showCurrentPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium themed-text-primary mb-2">
                New Master Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center themed-text-secondary hover:themed-text-primary"
                >
                  {showNewPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {newPassword && (
                <div className="mt-2">
                  <PasswordStrengthIndicator password={newPassword} />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium themed-text-primary mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center themed-text-secondary hover:themed-text-primary"
                >
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                className="flex-1 themed-accent-bg hover:themed-accent-hover text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Changing...' : 'Change Password'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 themed-border themed-text-primary hover:themed-bg-secondary font-medium py-2 px-4 rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
