# CafePOS Frontend

A modern, responsive React frontend for the CafePOS Point of Sale system, built with TypeScript, Tailwind CSS, and Vite for optimal performance and developer experience.

## 🚀 Features

- **Modern UI/UX** with responsive design using Tailwind CSS
- **Real-time POS Operations** with intuitive product selection and cart management
- **Role-Based Access Control** with protected routes and component-level permissions
- **Advanced Search** with fuzzy matching using Fuse.js
- **Dashboard Analytics** with interactive charts and real-time metrics
- **Inventory Management** with CSV export and import capabilities
- **Order Processing** with receipt generation and refund handling
- **User Authentication** with JWT tokens and password reset flow
- **Comprehensive Testing** with Vitest and React Testing Library
- **TypeScript Support** for enhanced development experience

## 🛠 Tech Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite for fast development and optimized builds
- **Styling:** Tailwind CSS for rapid UI development
- **State Management:** React Context API for authentication and global state
- **Search:** Fuse.js for fuzzy searching capabilities
- **Testing:** Vitest + React Testing Library + Jest DOM
- **Code Coverage:** Vitest Coverage (80% threshold)
- **Development:** Hot Module Replacement with Vite

## 📋 Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager
- CafePOS Backend running on `localhost:8880`

## 🔧 Installation

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd CafePOS/CafePOS-Frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser:**
   Visit `http://localhost:3000` to see the application

### Docker Setup (Alternative)

1. **Build and run with Docker:**
   ```bash
   docker-compose up -d
   ```

The application will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
CafePOS-Frontend/
├── src/
│   ├── components/          # React components
│   │   ├── __tests__/      # Component tests
│   │   ├── AdminPanel.tsx  # Admin management interface
│   │   ├── Cart.tsx        # Shopping cart component
│   │   ├── Checkout.tsx    # Checkout process
│   │   ├── ProductMenu.tsx # Product display and selection
│   │   └── ...
│   ├── contexts/           # React Context providers
│   │   ├── AuthContext.tsx # Authentication state management
│   │   └── __tests__/     # Context tests
│   ├── hooks/              # Custom React hooks
│   │   └── useDebounce.ts  # Debouncing utility
│   ├── network/            # API communication layer
│   │   └── NetworkAdapter.js # Backend integration
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   │   ├── __tests__/     # Utility tests
│   │   ├── rbacValidation.ts    # Role-based access control
│   │   ├── passwordValidation.ts # Password strength validation
│   │   └── searchUtils.ts       # Search functionality
│   └── test/               # Test configuration
├── public/                 # Static assets
├── coverage/              # Test coverage reports
├── package.json           # Dependencies and scripts
├── tailwind.config.cjs    # Tailwind CSS configuration
├── vite.config.ts         # Vite build configuration
└── tsconfig.json          # TypeScript configuration
```

## 🎯 Key Components

### Authentication
- **LoginModal** - User login interface
- **AuthenticationForm** - Multi-step authentication flow
- **PasswordResetFlow** - Password recovery system
- **ProtectedRoute** - Route-level access control

### POS Operations
- **ProductMenu** - Product catalog with search and filtering
- **Cart** - Shopping cart with item management
- **Checkout** - Payment processing interface
- **Receipt** - Digital receipt generation

### Administration
- **AdminPanel** - Administrative dashboard
- **MenuManagement** - Product and menu administration
- **InventoryManagement** - Stock control and monitoring
- **SalesDashboard** - Analytics and reporting

### Utilities
- **RoleBasedWrapper** - Component-level access control
- **ProductSearch** - Advanced search with fuzzy matching
- **CSVImport** - Data import functionality
- **ExportModal** - Data export options

## 🧪 Testing

The project maintains comprehensive test coverage with a target of 80% across all metrics.

### Running Tests

```bash
# Run all tests
npm test
# or
yarn test

# Run tests with UI
npm run test:ui
# or
yarn test:ui

# Generate coverage report
npm run test:coverage
# or
yarn test:coverage

# Run specific test file
npm test -- ProductMenu.test.tsx
```

### Test Categories

- **Unit Tests:** Individual component and utility testing
- **Integration Tests:** Multi-component interaction testing
- **Security Tests:** Authentication and RBAC validation
- **Performance Tests:** Loading and response time validation

### Coverage Thresholds

- **Branches:** 80%
- **Functions:** 80%
- **Lines:** 80%
- **Statements:** 80%

## 🔐 Security Features

- **Role-Based Access Control (RBAC)** with four user levels:
  - **Admin:** Full system access
  - **Manager:** Operational management
  - **Cashier:** Standard POS operations
  - **Trainee:** Limited access for learning
- **JWT Authentication** with automatic token refresh
- **Protected Routes** based on user roles
- **Input Validation** with client-side validation
- **Password Strength Requirements** with real-time feedback
- **Account Lockout Protection** after failed attempts

## 🎨 UI/UX Features

- **Responsive Design** optimized for desktop and tablet use
- **Dark/Light Theme** support (if implemented)
- **Accessibility** compliance with WCAG guidelines
- **Touch-Friendly** interface for tablet POS systems
- **Keyboard Shortcuts** for efficient operation
- **Real-time Updates** for inventory and orders
- **Smooth Animations** with Tailwind CSS transitions

## 🔌 API Integration

The frontend communicates with the CafePOS Backend through a comprehensive API:

- **Base URL:** `http://localhost:8880`
- **Authentication:** JWT Bearer tokens
- **Request/Response:** JSON format
- **Error Handling:** Centralized error management
- **Loading States:** User feedback during API calls

### Key API Endpoints Used

- Authentication: `/auth/*`
- Menu Operations: `/menu_items/*`
- Order Processing: `/orders/*`
- Inventory Management: `/inventory/*`
- User Management: `/users/*`
- Reports & Analytics: `/reports/*`

## 🚀 Build and Deployment

### Development Build

```bash
npm run build
# or
yarn build
```

### Production Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Preview the build:**
   ```bash
   npm run preview
   ```

3. **Deploy static files:**
   The `dist/` folder contains all static files ready for deployment to any web server.

### Environment Configuration

Create a `.env` file for environment-specific settings:

```env
VITE_API_BASE_URL=http://localhost:8880
VITE_APP_TITLE=CafePOS
VITE_ENABLE_MOCK_DATA=false
```

## ⚡ Performance Optimization

- **Vite Build Tool** for fast development and optimized production builds
- **Code Splitting** for efficient bundle loading
- **Tree Shaking** to eliminate unused code
- **Image Optimization** with lazy loading
- **Debounced Search** to reduce API calls
- **Memoized Components** to prevent unnecessary re-renders

## 🧩 Development Workflow

### Adding New Features

1. **Create Component:** Add new component in `src/components/`
2. **Add Types:** Define TypeScript interfaces in `src/types/`
3. **Write Tests:** Add comprehensive tests in `__tests__/` directories
4. **Update Routes:** Modify routing if needed
5. **Add RBAC:** Implement role-based access control
6. **Test Coverage:** Ensure 80% coverage threshold is maintained

### Code Quality

- **TypeScript** for type safety
- **ESLint** for code quality (if configured)
- **Prettier** for code formatting (if configured)
- **Husky** for git hooks (if configured)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Build the project: `npm run build`
7. Commit your changes: `git commit -am 'Add new feature'`
8. Push to the branch: `git push origin feature/new-feature`
9. Submit a pull request

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures:**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility

2. **API Connection Issues:**
   - Verify backend is running on `localhost:8880`
   - Check CORS configuration
   - Validate API endpoints

3. **Test Failures:**
   - Run `npm run test:coverage` to identify coverage gaps
   - Check test environment setup in `src/test/setup.ts`

4. **TypeScript Errors:**
   - Run `npx tsc --noEmit` to check type issues
   - Update type definitions as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the backend [API Documentation](../documentation/API_Documentation.md)
- Review the [project documentation](../documentation/)

---

**Built with ❤️ for modern Point of Sale operations**