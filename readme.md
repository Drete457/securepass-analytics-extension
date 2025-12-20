# SecurePass Analytics - Smart Password Manager

A comprehensive smart password manager Chrome extension that provides secure storage, management, and analysis of your credentials with advanced security features, breach detection, and modern UI components.

**SecurePass Analytics** is a privacy-first, locally-encrypted password management solution designed for users who prioritize security without compromising convenience. Unlike cloud-based password managers, this extension keeps all your data on your device, encrypted with military-grade AES-256 encryption, ensuring complete privacy and control over your sensitive information.

## 🎯 What Makes SecurePass Analytics Different

### 🔐 **Privacy-First Architecture**
- **100% Local Storage**: Your passwords never leave your device - no cloud servers, no data transmission
- **Zero Telemetry**: No tracking, analytics, or data collection of any kind
- **Open Source Transparency**: Full source code available for security audits and community review
- **No Account Required**: Start using immediately without creating accounts or providing personal information

### 🛡️ **Military-Grade Security**
- **AES-256 Encryption**: Industry-standard encryption with PBKDF2 key derivation (10,000 iterations)
- **Memory Protection**: Encryption keys automatically cleared from memory when vault locks
- **Tamper Detection**: Advanced integrity validation prevents data corruption or unauthorized access
- **Session Security**: Auto-lock functionality with configurable timeouts for enhanced protection

### 📊 **Smart Security Analytics**
- **Password Health Dashboard**: Visual analytics showing password strength distribution, security scores, and risk assessment
- **Breach Detection**: Integration with HaveIBeenPwned using k-anonymity to protect your privacy while checking for compromised passwords
- **Weakness Analysis**: Intelligent detection of common password patterns, duplicates, and aging credentials
- **Security Recommendations**: Actionable insights to improve your overall password security posture

### 🚀 **Modern User Experience**
- **Native Chrome Integration**: Seamless side panel interface that doesn't interfere with your browsing
- **Smart Auto-Detection**: Automatically identifies current website for quick password suggestions
- **Advanced Search & Filtering**: Find passwords instantly with smart search across websites, usernames, categories, and tags
- **Virtual Scrolling**: High-performance rendering handles thousands of passwords without lag

### 🎲 **Advanced Password Tools**
- **Intelligent Password Generator**: Create strong passwords with customizable rules and real-time strength validation
- **QR Code Sharing**: Securely share credentials via QR codes with built-in security warnings
- **Comprehensive Backup System**: Encrypted backup files with optional additional password protection
- **Import/Export Flexibility**: Standard JSON format for easy migration from other password managers

## ✨ Core Features

### 🔐 Password Management
- ✅ **Sidebar Interface**: Modern side panel that opens when clicking the extension icon
- ✅ **Complete CRUD Operations**: Add, edit, delete, and search passwords with full functionality
- ✅ **Smart Search & Filtering**: Filter by website, username, category, or tags
- ✅ **Password Visibility Control**: Toggle password visibility with show/hide buttons
- ✅ **Copy to Clipboard**: One-click copy for usernames and passwords
- ✅ **Current Site Detection**: Automatically highlights passwords for the current website
- ✅ **Categories & Tags**: Organize passwords with categories (work, personal, shopping, social, other) and custom tags
- ✅ **Notes Support**: Add notes and additional information to password entries
- ✅ **Virtual Scrolling**: High-performance rendering for large password collections

### 🛡️ Security & Encryption
- ✅ **Master Password Protection**: AES-256 encryption with PBKDF2 key derivation (10,000 iterations)
- ✅ **Memory Protection**: Encryption keys cleared from memory when locked
- ✅ **Data Integrity Validation**: Tamper detection and data verification
- ✅ **Extension Isolation**: Secure storage isolated from other extensions
- ✅ **Local Storage Only**: No external servers, all data stays on your device

### 🔍 Password Analysis & Health
- ✅ **Password Health Dashboard**: Comprehensive security analysis with visual charts
- ✅ **Strength Scoring**: 5-point rating system for password quality assessment
- ✅ **Breach Detection**: Integration with HaveIBeenPwned API using k-anonymity
- ✅ **Duplicate Detection**: Identifies and reports reused passwords across accounts
- ✅ **Age Monitoring**: Tracks password creation and update dates
- ✅ **Security Recommendations**: Actionable advice for improving password security
- ✅ **Weakness Analysis**: Identifies common password patterns and vulnerabilities

### 🎲 Password Generation
- ✅ **Advanced Password Generator**: Customizable length (8-32 characters)
- ✅ **Multiple Generation Methods**: Quick generation and advanced options
- ✅ **Character Set Control**: Include/exclude uppercase, lowercase, numbers, symbols
- ✅ **Strength Validation**: Real-time strength assessment of generated passwords
- ✅ **Random Code Generator**: Generate codes with custom character sets and patterns
- ✅ **One-click Integration**: Generate and auto-fill passwords in forms

### 📱 QR Code Integration
- ✅ **QR Code Generation**: Convert password entries to QR codes for easy sharing
- ✅ **Theme-aware QR Codes**: Dark/light mode compatible QR code generation
- ✅ **Comprehensive Data Format**: QR codes include website, category, username, and password
- ✅ **Security Warnings**: Clear warnings about QR code security implications
- ✅ **Copy & Regenerate**: Copy formatted text or regenerate QR codes as needed

### 💾 Backup & Import/Export
- ✅ **Encrypted Backup System**: Create encrypted backup files with custom passwords
- ✅ **JSON Export/Import**: Standard JSON format for data portability
- ✅ **File Manager**: Comprehensive file management with encryption options
- ✅ **Automatic Backups**: Configurable automatic backup intervals
- ✅ **Data Validation**: Integrity checking during import operations

### 🎨 Modern UI & Theming
- ✅ **Theme System**: Light, dark, and auto modes with system preference detection
- ✅ **Accent Colors**: Multiple accent color options (blue, green, purple, red, orange)
- ✅ **Font Size Options**: Adjustable font sizes (small, medium, large)
- ✅ **Responsive Design**: Optimized for different screen sizes and zoom levels
- ✅ **Loading States**: Smooth loading animations and progress indicators

## 🔒 Advanced Security Features

### Master Password Protection
- **AES-256 Encryption**: All sensitive data encrypted with industry-standard encryption
- **PBKDF2 Key Derivation**: 10,000 iterations for secure key generation from master password
- **Activity Detection**: Smart activity monitoring resets timer on user interaction
- **Memory Protection**: Encryption keys completely cleared from memory when locked
- **Session Management**: Secure session handling with automatic timeout

### Password Security Analysis
- **Strength Scoring**: Comprehensive 5-point rating system for password quality
- **Breach Detection**: Real-time checking against HaveIBeenPwned database using k-anonymity
- **Duplicate Detection**: Identifies and reports reused passwords across all accounts
- **Age Monitoring**: Tracks password creation and last update dates
- **Pattern Analysis**: Detects common weak patterns (repeated chars, sequences, keyboard patterns)
- **Security Recommendations**: Actionable advice for improving overall security posture

### Data Protection & Integrity
- **Local Encryption**: All data encrypted before storage in chrome.storage.local
- **Extension Isolation**: Secure storage completely isolated from other extensions
- **No External Servers**: Zero data transmission - everything stays on your device
- **Integrity Validation**: Advanced tamper detection and data verification
- **Permission Validation**: Strict validation of extension permissions and origins
- **Backup Encryption**: Optional additional encryption layer for backup files

## 📊 Password Health Dashboard

### Overview Analytics
- **Security Score**: Overall password security rating with visual indicators
- **Strength Distribution**: Breakdown of password strengths across your vault
- **Risk Assessment**: Identification of high-risk passwords requiring immediate attention

### Detailed Analysis Tabs
- **Weak Passwords**: List of passwords below security thresholds with improvement suggestions
- **Duplicate Passwords**: Detection and management of reused passwords
- **Old Passwords**: Identification of passwords that haven't been updated recently
- **Breached Passwords**: Integration with breach databases for compromise detection

## 🎲 Advanced Password Generation

### Generation Options
- **Length Control**: Customizable password length from 8 to 32 characters
- **Character Sets**: Granular control over included character types
- **Pattern Exclusion**: Avoid common weak patterns and sequences
- **Entropy Calculation**: Real-time entropy measurement for generated passwords
- **Multiple Algorithms**: Various generation methods for different security needs

### Integration Features
- **Strength Validation**: Immediate strength assessment of generated passwords
- **Custom Rules**: Configurable generation rules for specific requirements

## 📱 QR Code Features

### QR Code Generation
- **Comprehensive Data**: QR codes include website, category, username, password, and notes
- **Theme Integration**: Dark/light mode compatible QR code generation
- **Custom Formatting**: Structured data format for easy parsing
- **Error Correction**: Medium-level error correction for reliability
- **Size Optimization**: Optimized QR code size for readability

### Security & Usage
- **Security Warnings**: Clear warnings about unencrypted data in QR codes
- **Usage Instructions**: Detailed instructions for scanning and using QR codes
- **Copy Functions**: Copy structured text data in addition to QR codes
- **Regeneration**: Easy QR code regeneration with updated data
- **Mobile Compatibility**: QR codes optimized for mobile scanning apps

## 🚀 How to Use

### Installation & Setup
1. **Install Dependencies**: Run `npm install` to install all required packages
2. **Build Extension**: Run `npm run build` to compile the extension
3. **Load in Chrome**: 
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" toggle
   - Click "Load unpacked extension"
   - Select the `dist` folder generated by the build process
4. **Pin Extension**: Pin the extension to your toolbar for easy access

### First-Time Setup
1. **Extension Icon**: Click the password manager icon in your Chrome toolbar
2. **Master Password**: Set up a strong master password when prompted
3. **Password Requirements**: Minimum 8 characters with mixed case, numbers, and symbols
4. **Strength Validation**: Real-time feedback ensures you choose a secure master password
5. **Security Warning**: Remember that the master password cannot be recovered if forgotten

### Daily Usage Workflow
1. **Open Manager**: Click the extension icon to open the side panel
2. **Add Passwords**: Click "Add New Password" and fill in the website, username, and password
3. **Auto-detection**: The extension automatically detects the current website for new entries
4. **Categories & Tags**: Organize passwords with categories and custom tags
5. **Search & Filter**: Use the search bar to quickly find specific passwords
6. **Copy Credentials**: Use one-click copy buttons for usernames and passwords
7. **Edit Entries**: Click the pencil icon ✏️ to modify existing passwords
8. **Delete Entries**: Click the trash icon 🗑️ to remove unwanted passwords

### Advanced Security Features
1. **Health Dashboard**: Click the chart icon 📊 to analyze password security
2. **Breach Checking**: Run breach checks to identify compromised passwords
3. **Password Generation**: Use the built-in generator for strong, unique passwords
4. **QR Code Sharing**: Generate QR codes for easy credential sharing (use with caution)
5. **Backup Management**: Export encrypted backups regularly for data safety

### Master Password Management
1. **Unlock Vault**: Enter your master password when the vault is locked
2. **Change Master Password**: Access settings to change your master password
3. **Manual Lock**: Click the lock icon 🔒 to manually secure your vault
4. **Session Persistence**: Unlocked sessions persist until close or manual lock

### Password Health Monitoring
1. **Security Overview**: View overall password security score and statistics
2. **Weak Password Detection**: Identify and strengthen weak passwords
3. **Duplicate Management**: Find and eliminate password reuse across accounts
4. **Breach Alerts**: Receive notifications about compromised passwords
5. **Improvement Suggestions**: Follow actionable recommendations for better security

### Backup & Data Management
1. **Export Data**: Create JSON backups of all your passwords
2. **Encryption Options**: Choose to encrypt backup files with additional passwords
3. **Import Data**: Restore passwords from backup files or migrate from other managers
4. **File Validation**: Automatic validation ensures data integrity during import/export
5. **Automatic Backups**: Configure automatic backup intervals for convenience

## 🏗️ Project Architecture

### Directory Structure
```
src/
├── background/              # Extension service worker
│   └── background.ts       # Background script for extension lifecycle
├── components/             # React UI components
│   ├── backup-settings.tsx       # Backup configuration and management
│   ├── breach-check.tsx          # Password breach detection interface
│   ├── file-manager.tsx          # Import/export file management
│   ├── lazy-components.ts        # Lazy loading component definitions
│   ├── loading-spinner.tsx       # Loading states and animations
│   ├── master-password.tsx       # Master password setup and unlock
│   ├── password-breach-indicator.tsx  # Breach status indicators
│   ├── password-form.tsx         # Add/edit password forms
│   ├── password-health-dashboard.tsx  # Security analysis dashboard
│   ├── password-list.tsx         # Standard password list view
│   ├── password-qr-code.tsx      # QR code generation and display
│   ├── password-strength-indicator.tsx  # Password strength analysis
│   ├── random-code-generator.tsx # Advanced code generation tool
│   ├── side-panel.tsx           # Main side panel container
│   ├── theme-settings.tsx       # Theme customization interface
│   ├── virtual-password-list.tsx # High-performance virtualized list
│   └── index.ts               # Component exports
├── contexts/               # React context providers
│   └── theme-context.tsx   # Theme state management
├── hooks/                  # Custom React hooks
│   ├── useDebounce.ts      # Debounced input handling
│   ├── useVirtualScroll.ts # Virtual scrolling implementation
│   └── index.ts           # Hook exports
├── services/              # Business logic and data services
│   ├── backup-service.ts         # Backup creation and restoration
│   ├── breach-check-service.ts   # HaveIBeenPwned API integration
│   ├── encryption-service.ts     # Cryptographic operations
│   ├── file-password-service.ts  # File-based password operations
│   ├── master-password-service.ts # Master password and security
│   ├── password-analysis-service.ts # Password strength and analysis
│   ├── password-service.ts       # Core password CRUD operations
│   ├── security-service.ts       # Security validation and integrity
│   └── index.ts                # Service exports
├── side-panel/            # Side panel entry point
│   └── main.tsx          # React app initialization
├── styles/               # Styling and themes
│   └── tailwind.css      # Tailwind CSS configuration
└── types/                # TypeScript type definitions
    ├── backup.ts         # Backup-related types
    └── password.ts       # Password entry and database types
```

### Component Architecture
- **Modular Design**: Each component handles a specific feature or UI element
- **Lazy Loading**: Components are loaded on-demand for better performance
- **Virtual Scrolling**: High-performance rendering for large password lists
- **Context Management**: Centralized state management for themes and settings
- **Service Layer**: Clean separation between UI and business logic

### Security Architecture
- **Defense in Depth**: Multiple layers of security validation and protection
- **Encryption Pipeline**: Data encrypted at rest and in transit between components
- **Key Management**: Secure key derivation and memory management
- **Isolation Boundaries**: Clear boundaries between trusted and untrusted data
- **Audit Trail**: Comprehensive logging for security events and errors

## 🛠️ Technologies & Dependencies

### Core Technologies
- **React 19**: Latest React with concurrent features and improved performance
- **TypeScript 5.8**: Static typing with advanced type inference and safety
- **Tailwind CSS 3.4**: Utility-first CSS framework with custom theming
- **Vite 6.3**: Fast build tool with hot module replacement and optimization
- **Chrome Extensions API**: Native browser integration and storage

### Security Libraries
- **crypto-js 4.2**: AES encryption, PBKDF2, and cryptographic hashing
- **Web Crypto API**: Native browser cryptographic operations
- **Chrome Storage API**: Secure extension storage with quota management

### UI & UX Libraries
- **qrcode 1.5**: QR code generation with customizable options
- **Custom Hooks**: Optimized hooks for debouncing, virtual scrolling, and state management
- **CSS Variables**: Dynamic theming with CSS custom properties

### Development Tools
- **ESLint 9**: Code linting with React and TypeScript rules
- **TypeScript ESLint**: Enhanced TypeScript-specific linting
- **PostCSS**: CSS processing with autoprefixer
- **CRXJS Vite Plugin**: Chrome extension development with Vite
- **React DevTools**: Development debugging and profiling

### Build & Performance
- **Tree Shaking**: Automatic removal of unused code for smaller bundles
- **Code Splitting**: Dynamic imports for reduced initial load time
- **Asset Optimization**: Image and resource optimization
- **Source Maps**: Development debugging with source mapping
- **Production Builds**: Minified and optimized production bundles

## 🔧 Extension Configuration

### Manifest V3 Features
- **Service Worker**: Background processing with modern service worker architecture
- **Side Panel API**: Native Chrome side panel integration
- **Storage API**: Secure extension storage with sync and local options
- **Host Permissions**: Minimal permissions for HaveIBeenPwned API integration

### Permissions Breakdown
```json
{
  "permissions": [
    "sidePanel",    // Side panel interface
    "storage",      // Extension storage access
    "activeTab"     // Current tab information
  ],
  "host_permissions": [
    "<all_urls>",                        // Domain detection for password suggestions
    "https://api.pwnedpasswords.com/*"   // Breach checking API access
  ]
}
```

### Security Considerations
- **Minimal Permissions**: Only essential permissions requested
- **No Background Sync**: No data synchronization with external services
- **Local Processing**: All sensitive operations performed locally
- **API Security**: K-anonymity protection for breach checking
- **Content Security Policy**: Strict CSP for enhanced security

## 💻 Development

### Getting Started
```bash
# Clone the repository
git clone https://github.com/Drete457/securepass-analytics-extension.git
cd password-management

# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Lint code for errors and style issues
npm run lint

# Preview production build
npm run preview
```

### Development Workflow
1. **Setup**: Install dependencies and configure development environment
2. **Development**: Use `npm run dev` for hot reload during development
3. **Testing**: Load the `dist` folder as unpacked extension in Chrome
4. **Debugging**: Use Chrome DevTools and React DevTools for debugging
5. **Building**: Run `npm run build` for production-ready extension
6. **Linting**: Ensure code quality with `npm run lint` before commits

### Code Style & Standards
- **TypeScript**: Strict type checking enabled for enhanced safety
- **ESLint**: Enforced code style with React and TypeScript rules
- **Component Structure**: Functional components with hooks for state management
- **Service Pattern**: Business logic separated into dedicated service classes
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Performance**: Optimized components with React.memo and useMemo where appropriate

### Extension Loading for Development
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" toggle in the top right
3. Click "Load unpacked" button
4. Select the `dist` folder from your project directory
5. The extension will appear in your extensions list
6. Pin it to the toolbar for easy access during development
7. Reload the extension after each build to see changes

### Debugging Tips
- **Console Logs**: Check both extension console and browser console
- **React DevTools**: Use React DevTools extension for component inspection
- **Chrome DevTools**: Debug service worker in Chrome DevTools > Extensions
- **Network Tab**: Monitor API calls to HaveIBeenPwned service
- **Storage Inspector**: Inspect chrome.storage.local data in DevTools

## 🔒 Security & Privacy

### Privacy-First Design
This extension was architected with privacy and security as foundational principles:

#### Data Handling
- **Zero External Transmission**: No passwords or personal data ever leave your device
- **Local-Only Storage**: All data stored exclusively in Chrome's extension storage
- **No Analytics or Tracking**: Zero telemetry, tracking pixels, or usage analytics
- **No Third-Party Services**: Only HaveIBeenPwned for breach checking (using k-anonymity)
- **Open Source Transparency**: Complete source code available for security review

#### Encryption & Security
- **Master Password Protection**: Optional AES-256 encryption for all sensitive data
- **PBKDF2 Key Derivation**: Industry-standard key derivation with 10,000 iterations
- **Memory Safety**: Encryption keys cleared immediately when vault is locked
- **Session Management**: Automatic session timeout with configurable timing
- **Integrity Validation**: Tamper detection and data corruption prevention

#### Extension Security
- **Minimal Permissions**: Only essential Chrome permissions requested
- **Extension Isolation**: Data cannot be accessed by other extensions or websites
- **Content Security Policy**: Strict CSP prevents code injection attacks
- **Permission Validation**: Runtime validation of extension permissions and origins
- **Secure Storage**: Chrome's extension storage with built-in security features

### Breach Detection Privacy
- **K-Anonymity Protection**: Only first 5 characters of password hash sent to API
- **No Plain Text**: Passwords never transmitted in plain text
- **Hash Prefix Matching**: Local matching of hash suffixes for privacy
- **Optional Feature**: Breach checking is completely optional and user-initiated
- **API Rate Limiting**: Respectful API usage with built-in rate limiting

### Security Best Practices
- **Regular Updates**: Keep the extension updated for latest security patches
- **Strong Master Password**: Use a unique, strong master password you can remember
- **Device Security**: Ensure your computer is secure and up-to-date
- **Regular Backups**: Export encrypted backups to prevent data loss
- **Password Hygiene**: Follow security recommendations for password management

## ⚠️ Important Security Notes

### Master Password Management
- **Unrecoverable**: Master passwords cannot be recovered if forgotten
- **Choose Wisely**: Select a strong, memorable master password
- **Store Safely**: Consider secure password recovery options
- **Change Regularly**: Update master password periodically for security
- **Never Share**: Master password should never be shared or written down insecurely

### Password Security Guidelines
- **Unique Passwords**: Use unique passwords for every account
- **Regular Updates**: Update passwords identified as old or weak
- **Strength Requirements**: Follow strength indicators for optimal security
- **Breach Response**: Immediately change passwords identified in breaches
- **Category Organization**: Use categories and tags for better organization

### System Requirements & Limitations
- **Chrome/Chromium Only**: Extension requires Chrome or Chromium-based browsers
- **Local Storage**: Data tied to specific Chrome profile and computer
- **No Cloud Sync**: No cross-device synchronization (by design for security)
- **Memory Requirements**: Extension memory usage scales with password count
- **Performance**: Very large password collections (1000+) may impact performance

## 🤝 Contributing & Support

### Contributing Guidelines
- **Code Style**: Follow existing TypeScript and React patterns
- **Security Review**: All security-related changes require thorough review
- **Testing**: Test all functionality across different Chrome versions
- **Documentation**: Update README for significant feature additions
- **Privacy**: Maintain privacy-first design principles in all contributions

### Reporting Issues
- **Security Issues**: Report security vulnerabilities privately
- **Bug Reports**: Provide detailed reproduction steps and environment info
- **Feature Requests**: Describe use cases and security considerations
- **Performance Issues**: Include system specs and password collection size

---

**⚡ Quick Start**: Install dependencies → Build extension → Load in Chrome → Set master password → Start managing passwords securely!

**🔐 Remember**: This extension prioritizes your privacy and security. All data stays on your device, and the master password is your key to everything. Choose it wisely and keep your system secure!
