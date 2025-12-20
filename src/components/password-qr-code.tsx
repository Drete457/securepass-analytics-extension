import { useState, useEffect, useCallback, FC } from 'react';
import QRCode from 'qrcode';
import { PasswordEntry } from '../types/password';
import { useTheme } from '../contexts/theme-context';

interface PasswordQRCodeProps {
  password: PasswordEntry;
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordQRCode: FC<PasswordQRCodeProps> = ({
  password,
  isOpen,
  onClose
}) => {
  const { isDark } = useTheme();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const generateQRCode = useCallback(async () => {
    setIsGenerating(true);
    setError('');

    try {
      // Enhanced format: "website|category|username|password"
      const qrData = `${password.website}|${password.category}|${password.username}|${password.password}`;

      // Generate QR code with theme-aware colors
      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: isDark ? '#FFFFFF' : '#000000',
          light: isDark ? '#1F2937' : '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      setError('Failed to generate QR code: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  }, [password, isDark]);

  const copyCredentials = async () => {
    try {
      // Include more comprehensive information
      const text = `Website: ${password.website}
Category: ${password.category}
${password.tags.length > 0 ? `Tags: ${password.tags.join(', ')}` : ''}
Username: ${password.username}
Password: ${password.password}${password.notes ? `
Notes: ${password.notes}` : ''}`;
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy credentials:', error);
    }
  };

  useEffect(() => {
    if (isOpen && password) {
      generateQRCode();
    } else {
      setQrCodeUrl('');
      setError('');
    }
  }, [isOpen, password, generateQRCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-lg shadow-xl w-full max-w-md ${isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'
              }`}>
              📱 QR Code - {password.website}
            </h2>
            <button
              onClick={onClose}
              className={`text-xl font-bold ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              ×
            </button>
          </div>

          {/* Password Details */}
          <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
            <div className="mb-2">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>Website:</span>
              <p className={isDark ? 'text-gray-100' : 'text-gray-800'}>{password.website}</p>
            </div>
            <div className="mb-2">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>Category:</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${password.category === 'work' ? 'bg-blue-100 text-blue-800' :
                password.category === 'personal' ? 'bg-green-100 text-green-800' :
                  password.category === 'shopping' ? 'bg-purple-100 text-purple-800' :
                    password.category === 'social' ? 'bg-pink-100 text-pink-800' :
                      'bg-gray-100 text-gray-800'
                }`}>
                {password.category}
              </span>
            </div>
            {password.tags && password.tags.length > 0 && (
              <div className="mb-2">
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {password.tags.map((tag, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-2">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>Username:</span>
              <p className={isDark ? 'text-gray-100' : 'text-gray-800'}>{password.username}</p>
            </div>
            <div className="mb-2">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>Password:</span>
              <div className="flex items-center">
                <p className={`flex-1 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                  {showPassword ? password.password : '••••••••'}
                </p>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className={`ml-2 text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                    }`}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            {password.notes && (
              <div className="mb-2">
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>Notes:</span>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                  {password.notes}
                </p>
              </div>
            )}
          </div>

          {/* QR Code Display */}
          {isGenerating && (
            <div className="text-center py-8">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2 ${isDark ? 'border-blue-400' : 'border-blue-600'
                }`}></div>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Generating QR Code...</p>
            </div>
          )}

          {qrCodeUrl && !isGenerating && (
            <div className="text-center mb-6">
              <div className={`p-4 rounded-lg border-2 inline-block ${isDark ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-200'
                }`}>
                <img
                  src={qrCodeUrl}
                  alt={`QR Code for ${password.website}`}
                  className="w-64 h-64 mx-auto"
                />
              </div>
              <div className="mt-4 space-y-2">
                <p className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-600'
                  }`}>
                  ✅ QR Code Generated!
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Format: website|category|username|password
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Scan to get: <code className={`px-1 rounded ${isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-800'
                    }`}>{password.website}|{password.category}|{password.username}|••••••••</code>
                </p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className={`border rounded-lg p-3 mb-4 ${isDark
              ? 'bg-red-900/20 border-red-700 text-red-400'
              : 'bg-red-50 border-red-200 text-red-700'
              }`}>
              <p className="text-sm">❌ {error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={copyCredentials}
              className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center transition-colors ${isDark
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
            >
              📋 Copy
            </button>
            <button
              onClick={generateQRCode}
              disabled={isGenerating}
              className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              {isGenerating ? '⏳' : '🔄'} Regenerate
            </button>
          </div>

          {/* Usage Instructions */}
          <div className={`mt-4 border rounded-lg p-3 ${isDark
            ? 'bg-blue-900/20 border-blue-700'
            : 'bg-blue-50 border-blue-200'
            }`}>
            <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-blue-400' : 'text-blue-800'
              }`}>
              📋 How to Use:
            </h3>
            <ul className={`text-xs space-y-1 ${isDark ? 'text-blue-300' : 'text-blue-700'
              }`}>
              <li>• Scan the QR code with any QR reader app</li>
              <li>• The scanned text format: "website|category|username|password"</li>
              <li>• Fields are separated by pipe (|) characters</li>
              <li>• Copy/paste the credentials where needed</li>
              <li>• Use "Copy" button for formatted text with all details</li>
            </ul>
          </div>

          {/* Security Warning */}
          <div className={`mt-3 border rounded-lg p-3 ${isDark
            ? 'bg-yellow-900/20 border-yellow-700'
            : 'bg-yellow-50 border-yellow-200'
            }`}>
            <h3 className={`text-sm font-medium mb-1 ${isDark ? 'text-yellow-400' : 'text-yellow-800'
              }`}>
              ⚠️ Security Warning:
            </h3>
            <p className={`text-xs ${isDark ? 'text-yellow-300' : 'text-yellow-700'
              }`}>
              QR codes contain unencrypted credentials. Only use in secure environments
              and avoid sharing screenshots of the QR code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
