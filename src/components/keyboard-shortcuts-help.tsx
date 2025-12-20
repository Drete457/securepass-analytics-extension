interface KeyboardShortcutsHelpProps {
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ onClose }: KeyboardShortcutsHelpProps) {
  const shortcuts = [
    { keys: 'Ctrl + N', description: 'Add new password' },
    { keys: 'Ctrl + F', description: 'Focus search box' },
    { keys: 'Ctrl + L', description: 'Lock vault' },
    { keys: 'Escape', description: 'Close modal / Cancel' },
    { keys: '?', description: 'Show this help' },
  ];

  return (
    <div className="theme-settings-container">
      <div className="theme-settings-header">
        <h3 className="theme-settings-title">
          ⌨️ Keyboard Shortcuts
        </h3>
        <button
          onClick={onClose}
          className="theme-settings-close-btn"
          title="Close"
        >
          ✕
        </button>
      </div>

      <div className="theme-settings-content">
        <div className="space-y-2">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.keys}
              className="flex items-center justify-between p-3 rounded-lg themed-bg-secondary"
            >
              <span className="themed-text-primary">{shortcut.description}</span>
              <kbd className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-sm font-mono themed-text-primary border themed-border">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-lg themed-bg-tertiary">
          <p className="text-xs themed-text-secondary">
            💡 <strong>Tip:</strong> Shortcuts work when not typing in an input field.
            Press Escape to close modals even when focused on an input.
          </p>
        </div>
      </div>
    </div>
  );
}
