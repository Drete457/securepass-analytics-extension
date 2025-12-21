import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { PasswordEntry } from '../types/password';
import { passwordService } from '../services/password-service';
import { securityService } from '../services/master-password-service';
import { PasswordList } from './password-list';
import { VirtualPasswordList } from './virtual-password-list';
import { PasswordForm } from './password-form';
import { LoadingSpinner, SuspenseWrapper } from './loading-spinner';
import { useDebounce, useOneTimeEffect } from '../hooks';
import {
  LazyPasswordHealthDashboard,
  LazyBreachCheckComponent,
  LazyFileManager,
  LazyThemeSettings,
  LazyRandomCodeGenerator,
  LazyMasterPasswordSetup,
  LazyMasterPasswordUnlock,
  LazyMasterPasswordChange
} from './lazy-components';
import { useTheme } from '../contexts/theme-context';
import { KeyboardShortcutsHelp } from './keyboard-shortcuts-help';
import { Toast, useToast } from './toast';

// Unified modal state type
type ModalType = 
  | 'form' 
  | 'theme' 
  | 'files' 
  | 'health' 
  | 'breach' 
  | 'masterSetup' 
  | 'masterUnlock' 
  | 'masterChange' 
  | 'codeGen' 
  | 'help'
  | null;

export function SidePanel() {
  const { isDark } = useTheme();
  const { toast, showToast, dismissToast } = useToast();
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [isVaultLocked, setIsVaultLocked] = useState<boolean>(false);
  const [hasMasterPassword, setHasMasterPassword] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Helper to check if a modal is active
  const isModalOpen = useCallback((modal: ModalType) => activeModal === modal, [activeModal]);
  
  // Helper to toggle modals
  const toggleModal = useCallback((modal: ModalType) => {
    setActiveModal(prev => prev === modal ? null : modal);
  }, []);

  const closeModal = useCallback(() => setActiveModal(null), []);

  const initializeSecurity = async () => {
    try {
      const hasMP = await securityService.hasMasterPassword();
      setHasMasterPassword(hasMP);

      if (hasMP) {
        const isLocked = await securityService.isLocked();
        setIsVaultLocked(isLocked);

        // Only show unlock if has master password AND is locked AND it's the first initialization
        if (isLocked && !isInitialized) {
          setActiveModal('masterUnlock');
        }
      } else {
        // No master password, vault is not locked
        setIsVaultLocked(false);
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing security:', error);
    }
  };

  const getCurrentDomain = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        const url = new URL(tab.url);
        const domain = url.hostname.replace('www.', '');
        setCurrentDomain(domain);
      } else {
        setCurrentDomain('');
      }
    } catch {
      setCurrentDomain('');
    }
  };

  const loadPasswords = async () => {
    try {
      setIsLoading(true);

      // Check if we have master password setup and vault is locked
      if (hasMasterPassword && await securityService.isLocked()) {
        setPasswords([]);
        return;
      }

      const allPasswords = await passwordService.getAll();
      setPasswords(allPasswords);
    } catch (error) {
      console.error('Error loading passwords:', error);
      setPasswords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPassword = async (passwordData: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await passwordService.add(passwordData);
      await loadPasswords();
      closeModal();
    } catch (error) {
      console.error('Error adding password:', error);
    }
  };

  const handleUpdatePassword = async (id: string, passwordData: Partial<Omit<PasswordEntry, 'id' | 'createdAt'>>) => {
    try {
      await passwordService.update(id, passwordData);
      await loadPasswords();
      setEditingPassword(null);
      closeModal();
    } catch (error) {
      console.error('Error updating password:', error);
    }
  };

  const handleDeletePassword = async (id: string) => {
    if (confirm('Are you sure you want to delete this password?')) {
      try {
        await passwordService.delete(id);
        await loadPasswords();
      } catch (error) {
        console.error('Error deleting password:', error);
      }
    }
  };

  const handleEditPassword = (password: PasswordEntry) => {
    setEditingPassword(password);
    setActiveModal('form');
  };

  const handleShowNewPasswordForm = useCallback(async () => {
    await getCurrentDomain();
    setActiveModal('form');
  }, []);

  const handleCancelEdit = () => {
    setEditingPassword(null);
    closeModal();
  };

  const handleSecurityIconClick = useCallback(async () => {
    const hasMP = await securityService.hasMasterPassword();

    if (!hasMP) {
      setActiveModal('masterSetup');
    } else if (isVaultLocked && await securityService.isLocked()) {
      setActiveModal('masterUnlock');
    } else {
      securityService.lockVault();
      setIsVaultLocked(true);
      closeModal();
      setEditingPassword(null);
      setPasswords([]);
    }
  }, [isVaultLocked, closeModal]);

  const handleVaultReset = () => {
    setPasswords([]);
    setHasMasterPassword(false);
    setIsVaultLocked(false);
    setActiveModal(null);
    setEditingPassword(null);
    setSearchTerm('');
    setIsInitialized(false);
    initializeSecurity();
  };

  // Memoized filtered passwords
  const filteredPasswords = useMemo(() => {
    const searchLower = debouncedSearchTerm.toLowerCase();
    return passwords.filter(password => 
      password.website.toLowerCase().includes(searchLower) ||
      password.username.toLowerCase().includes(searchLower) ||
      password.category.toLowerCase().includes(searchLower) ||
      password.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
      (password.notes && password.notes.toLowerCase().includes(searchLower))
    );
  }, [passwords, debouncedSearchTerm]);

  // Memoized sorted passwords
  const sortedPasswords = useMemo(() => {
    return [...filteredPasswords].sort((a, b) => {
      if (currentDomain) {
        const aMatchesDomain = a.website.toLowerCase().includes(currentDomain.toLowerCase());
        const bMatchesDomain = b.website.toLowerCase().includes(currentDomain.toLowerCase());
        if (aMatchesDomain && !bMatchesDomain) return -1;
        if (!aMatchesDomain && bMatchesDomain) return 1;
      }
      return a.website.toLowerCase().localeCompare(b.website.toLowerCase());
    });
  }, [filteredPasswords, currentDomain]);

  useOneTimeEffect(() => {
    let isComponentMounted = true;
    
    const initializeComponent = async () => {
      if (isComponentMounted) {
        await initializeSecurity();
        await loadPasswords();
        await getCurrentDomain();
        
        // Initialize auto backup after component is loaded
        const { backupPasswordService } = await import('../services/backup-service');
        backupPasswordService.autoBackup();

        // Warn once per session if auto backup is paused due to missing password
        try {
          const settings = await backupPasswordService.getSettings();
          const warnedKey = 'auto_backup_password_warned_session';
          const alreadyWarned = sessionStorage.getItem(warnedKey);

          if (
            settings.autoBackupEnabled &&
            settings.encryptionEnabled &&
            !backupPasswordService.hasAutoBackupPassword() &&
            !alreadyWarned
          ) {
            showToast('Auto backups are paused until you set the session password in Backup Settings.', 'info');
            sessionStorage.setItem(warnedKey, '1');
          }
        } catch (error) {
          console.error('Auto backup warning check failed:', error);
        }
      }
    };

    initializeComponent();

    // Listen for tab changes
    const handleTabChange = () => {
      if (isComponentMounted) {
        getCurrentDomain();
      }
    };

    // Listen for URL changes within the same tab
    const handleTabUpdate = (_: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      if (changeInfo.url && tab.active && isComponentMounted) {
        getCurrentDomain();
      }
    };

    // Add tab activation listener
    chrome.tabs.onActivated.addListener(handleTabChange);

    // Add tab update listener for URL changes within the same tab
    chrome.tabs.onUpdated.addListener(handleTabUpdate);

    // Cleanup listeners on component unmount
    return () => {
      isComponentMounted = false;
      chrome.tabs.onActivated.removeListener(handleTabChange);
      chrome.tabs.onUpdated.removeListener(handleTabUpdate);
    };
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // Allow Escape to close modals even when in input
        if (e.key === 'Escape' && activeModal) {
          e.preventDefault();
          closeModal();
          setEditingPassword(null);
        }
        return;
      }

      // Ctrl/Cmd + key shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'n': // New password
            e.preventDefault();
            if (!isVaultLocked) {
              handleShowNewPasswordForm();
            }
            break;
          case 'f': // Focus search
            e.preventDefault();
            if (!isVaultLocked) {
              searchInputRef.current?.focus();
            }
            break;
          case 'l': // Lock vault
            e.preventDefault();
            if (hasMasterPassword && !isVaultLocked) {
              handleSecurityIconClick();
            }
            break;
        }
      } else {
        // Single key shortcuts
        switch (e.key) {
          case 'Escape':
            if (activeModal) {
              e.preventDefault();
              closeModal();
              setEditingPassword(null);
            }
            break;
          case '?': // Help
            e.preventDefault();
            setActiveModal('help');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, isVaultLocked, hasMasterPassword, closeModal, handleSecurityIconClick, handleShowNewPasswordForm]);

  return (
    <div className="h-full themed-bg-secondary flex flex-col">
      <header className="themed-accent-bg text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-xl font-bold">Password Manager</h1>
            {currentDomain && (
              <div className="text-sm mt-1 opacity-90">
                Current site: {currentDomain}
                {(() => {
                  const domainCount = passwords.filter(p =>
                    p.website.toLowerCase().includes(currentDomain.toLowerCase())
                  ).length;
                  return domainCount > 0 ? ` (${domainCount} password${domainCount > 1 ? 's' : ''})` : '';
                })()}
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            {passwords.length > 0 && <button
              onClick={() => toggleModal('health')}
              disabled={isVaultLocked}
              className={`p-2 rounded-lg transition-colors ${isVaultLocked
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-white hover:bg-opacity-20'
                }`}
              title={isVaultLocked ? "Unlock vault to access" : "Password Health Dashboard"}
            >
              <span className="text-lg">📊</span>
            </button>}
            {passwords.length > 0 && <button
              onClick={() => toggleModal('breach')}
              disabled={isVaultLocked}
              className={`p-2 rounded-lg transition-colors ${isVaultLocked
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-white hover:bg-opacity-20'
                }`}
              title={isVaultLocked ? "Unlock vault to access" : "Check for Breached Passwords"}
            >
              <span className="text-lg">🛡️</span>
            </button>}
            <button
              onClick={() => toggleModal('files')}
              disabled={isVaultLocked}
              className={`p-2 rounded-lg transition-colors ${isVaultLocked
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-white hover:bg-opacity-20'
                }`}
              title={isVaultLocked ? "Unlock vault to access" : "File Manager"}
            >
              <span className="text-lg">📁</span>
            </button>
            {hasMasterPassword && !isVaultLocked && (
              <button
                onClick={() => setActiveModal('masterChange')}
                className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
                title="Change Master Password"
              >
                <span className="text-lg">⚙️</span>
              </button>
            )}
            <button
              onClick={handleSecurityIconClick}
              className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
              title={
                !hasMasterPassword
                  ? "Setup Master Password"
                  : isVaultLocked
                    ? "Unlock Vault"
                    : "Lock Vault (Ctrl+L)"
              }
            >
              <span className="text-lg">
                {!hasMasterPassword ? "🔐" : isVaultLocked ? "🔒" : "🔓"}
              </span>
            </button>
            <button
              onClick={() => toggleModal('theme')}
              className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
              disabled={isVaultLocked}
              title="Theme Settings"
            >
              <span className="text-lg">{isDark ? '🌙' : '☀️'}</span>
            </button>
            <button
              onClick={() => setActiveModal('help')}
              className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
              title="Keyboard Shortcuts (?)"
            >
              <span className="text-lg">❓</span>
            </button>
          </div>
        </div>
      </header>

      {isModalOpen('help') && (
        <div className="p-4 themed-bg-primary border-b themed-border">
          <KeyboardShortcutsHelp onClose={closeModal} />
        </div>
      )}

      {!isVaultLocked && isModalOpen('theme') && (
        <div className="p-4 themed-bg-primary border-b themed-border">
          <SuspenseWrapper fallback={<LoadingSpinner size="sm" />}>
            <LazyThemeSettings onClose={closeModal} />
          </SuspenseWrapper>
        </div>
      )}

      {!isVaultLocked && isModalOpen('files') && (
        <div className="p-4 themed-bg-primary border-b themed-border">
          <SuspenseWrapper fallback={<LoadingSpinner size="sm" />}>
            <LazyFileManager
              onImportComplete={loadPasswords}
              onClose={closeModal}
            />
          </SuspenseWrapper>
        </div>
      )}

      {isModalOpen('health') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh]">
            <SuspenseWrapper fallback={<LoadingSpinner />}>
              <LazyPasswordHealthDashboard
                passwords={passwords}
                onPasswordEdit={(password: PasswordEntry) => {
                  setEditingPassword(password);
                  setActiveModal('form');
                }}
                onClose={closeModal}
              />
            </SuspenseWrapper>
          </div>
        </div>
      )}

      {isModalOpen('breach') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <SuspenseWrapper fallback={<LoadingSpinner />}>
            <LazyBreachCheckComponent
              passwords={passwords}
              onClose={closeModal}
            />
          </SuspenseWrapper>
        </div>
      )}

      <div className="p-4 border-b themed-bg-primary themed-border">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder={isVaultLocked ? "Unlock vault to search..." : "Search by website, username, tag, notes... (Ctrl+F)"}
            value={isVaultLocked ? "" : searchTerm}
            onChange={(e) => !isVaultLocked && setSearchTerm(e.target.value)}
            disabled={isVaultLocked}
            className={`w-full px-3 py-2 pr-16 themed-border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] themed-bg-primary themed-text-primary ${isVaultLocked ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          />
          {!isVaultLocked && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs themed-text-tertiary">
              Ctrl+F
            </span>
          )}
        </div>
      </div>

      <div className="p-4 border-b themed-bg-primary themed-border">
        <button
          onClick={() => isModalOpen('form') ? closeModal() : handleShowNewPasswordForm()}
          disabled={isVaultLocked}
          title={isVaultLocked ? 'Vault is locked' : 'Add new password (Ctrl+N)'}
          className={`w-full font-medium py-2 px-4 rounded-md transition-colors mb-2 ${isVaultLocked
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'themed-accent-bg hover:themed-accent-hover text-white'
            }`}
        >
          {isVaultLocked ? 'Vault Locked' : isModalOpen('form') ? 'Cancel (Esc)' : 'Add New Password (Ctrl+N)'}
        </button>
        
        <button
          onClick={() => setActiveModal('codeGen')}
          disabled={isVaultLocked}
          className={`w-full font-medium py-2 px-4 rounded-md transition-colors ${isVaultLocked
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'themed-accent-bg hover:themed-accent-hover text-white'
            }`}
        >
          {isVaultLocked ? 'Vault Locked' : 'Generate Random Code'}
        </button>
      </div>

      <main className="flex-1 overflow-auto themed-bg-secondary">
        {isVaultLocked ? (
          <div className="flex items-center justify-center p-8 text-center">
            <div className="themed-text-secondary">
              <div className="text-lg mb-2">🔒 Vault is Locked</div>
              <div className="text-sm">Please unlock the vault to access your passwords</div>
            </div>
          </div>
        ) : isModalOpen('form') ? (
          <div className="p-4 themed-bg-primary border-b themed-border">
            <PasswordForm
              password={editingPassword}
              currentDomain={currentDomain}
              onSave={editingPassword ?
                (data: Partial<Omit<PasswordEntry, 'id' | 'createdAt'>>) => handleUpdatePassword(editingPassword.id, data) :
                handleAddPassword
              }
              onCancel={handleCancelEdit}
            />
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="themed-text-secondary">Loading passwords...</div>
          </div>
        ) : (
          // Use virtual scrolling for lists with many items (>50)
          sortedPasswords.length > 50 ? (
            <VirtualPasswordList
              passwords={sortedPasswords}
              currentDomain={currentDomain}
              onEdit={handleEditPassword}
              onDelete={handleDeletePassword}
              containerHeight={600}
            />
          ) : (
            <PasswordList
              passwords={sortedPasswords}
              currentDomain={currentDomain}
              onEdit={handleEditPassword}
              onDelete={handleDeletePassword}
            />
          )
        )}
      </main>

      {/* Master Password Modals */}
      {isModalOpen('masterSetup') && (
        <SuspenseWrapper fallback={<LoadingSpinner />}>
          <LazyMasterPasswordSetup
            onComplete={async () => {
              closeModal();
              setIsVaultLocked(false);
              setHasMasterPassword(true);
              loadPasswords();
            }}
            onClose={closeModal}
          />
        </SuspenseWrapper>
      )}

      {isModalOpen('masterUnlock') && (
        <SuspenseWrapper fallback={<LoadingSpinner />}>
          <LazyMasterPasswordUnlock
            onUnlock={() => {
              closeModal();
              setIsVaultLocked(false);
              loadPasswords();
            }}
            onClose={closeModal}
            onReset={handleVaultReset}
          />
        </SuspenseWrapper>
      )}

      {isModalOpen('masterChange') && (
        <SuspenseWrapper fallback={<LoadingSpinner />}>
          <LazyMasterPasswordChange
            onComplete={() => {
              closeModal();
              loadPasswords();
            }}
            onClose={closeModal}
          />
        </SuspenseWrapper>
      )}

      {isModalOpen('codeGen') && (
        <SuspenseWrapper fallback={<LoadingSpinner />}>
          <LazyRandomCodeGenerator
            onClose={closeModal}
          />
        </SuspenseWrapper>
      )}

      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  );
}
