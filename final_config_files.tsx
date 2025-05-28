// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

// src/__tests__/setup.ts
import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/server'

// Establish API mocking before all tests
beforeAll(() => server.listen())

// Reset any request handlers that we may add during the tests
afterEach(() => server.resetHandlers())

// Clean up after the tests are finished
afterAll(() => server.close())

// src/__tests__/mocks/server.ts
import { setupServer } from 'msw/node'
import { rest } from 'msw'

// Mock handlers
export const handlers = [
  rest.get('/api/products', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: '1',
          nome: 'Tomate',
          preco_atual: 8.50,
          unidade: 'kg',
          estoque_atual: 10,
          estoque_minimo: 5,
          ativo: true,
        },
      ])
    )
  }),
]

export const server = setupServer(...handlers)

// src/__tests__/components/ProductCard.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProductCard } from '@/components/products/ProductCard'

const mockProduct = {
  id: '1',
  user_id: 'user1',
  nome: 'Tomate',
  descricao: 'Tomate fresco',
  codigo_interno: 'TOM001',
  unidade: 'kg',
  preco_atual: 8.50,
  custo_medio: 8.00,
  estoque_atual: 10,
  estoque_minimo: 5,
  data_validade: null,
  ativo: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  category_id: null,
  supplier_id: null,
  category: null,
  supplier: null,
}

describe('ProductCard', () => {
  it('renders product information', () => {
    render(<ProductCard product={mockProduct} viewMode="grid" />)
    
    expect(screen.getByText('Tomate')).toBeInTheDocument()
    expect(screen.getByText('Tomate fresco')).toBeInTheDocument()
    expect(screen.getByText('R$ 8,50/kg')).toBeInTheDocument()
    expect(screen.getByText('10 kg')).toBeInTheDocument()
  })

  it('shows low stock warning', () => {
    const lowStockProduct = {
      ...mockProduct,
      estoque_atual: 3, // Below minimum
    }
    
    render(<ProductCard product={lowStockProduct} viewMode="grid" />)
    
    expect(screen.getByText('Estoque baixo')).toBeInTheDocument()
  })
})

// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './src/__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})

// src/__tests__/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should allow user to login', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[placeholder="seu@email.com"]', 'test@example.com')
    await page.fill('[placeholder="••••••••"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/dashboard')
  })

  test('should show validation errors', async ({ page }) => {
    await page.goto('/login')
    
    await page.click('button[type="submit"]')
    
    await expect(page.getByText('Email é obrigatório')).toBeVisible()
    await expect(page.getByText('Senha é obrigatória')).toBeVisible()
  })
})

test.describe('Product Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock login
    await page.goto('/login')
    await page.fill('[placeholder="seu@email.com"]', 'test@example.com')
    await page.fill('[placeholder="••••••••"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should create a new product', async ({ page }) => {
    await page.goto('/produtos')
    await page.click('text=Novo Produto')
    
    await page.fill('[placeholder="Ex: Tomate italiano"]', 'Tomate Cherry')
    await page.selectOption('select[name="unidade"]', 'kg')
    await page.fill('input[type="number"][name="precoAtual"]', '12.50')
    
    await page.click('button[type="submit"]')
    
    await expect(page.getByText('Produto criado com sucesso!')).toBeVisible()
  })
})

// .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run type check
      run: npm run type-check
    
    - name: Run tests
      run: npm run test:coverage
    
    - name: Build application
      run: npm run build
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      if: matrix.node-version == '20.x'

  e2e:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright
      run: npx playwright install --with-deps
    
    - name: Run Playwright tests
      run: npm run test:e2e
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
    
    - uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30

# .github/workflows/cd.yml
name: CD

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'

# docs/API.md
# API Documentation

## Authentication

All API routes under `/api/` require authentication via Supabase Auth.

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

## Products API

### GET /api/products
Get all products for the authenticated user.

**Query Parameters:**
- `search` (string): Filter by product name
- `category` (string): Filter by category ID
- `supplier` (string): Filter by supplier ID
- `status` (string): Filter by status (active, inactive, all)
- `lowStock` (boolean): Show only low stock products

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "nome": "Tomate",
      "preco_atual": 8.50,
      "unidade": "kg",
      "estoque_atual": 10,
      "estoque_minimo": 5,
      "category": {
        "id": "uuid",
        "nome": "Vegetais",
        "cor": "#22c55e"
      }
    }
  ]
}
```

### POST /api/products
Create a new product.

**Request Body:**
```json
{
  "nome": "Tomate",
  "descricao": "Tomate fresco",
  "unidade": "kg",
  "precoAtual": 8.50,
  "estoqueAtual": 10,
  "estoqueMinimo": 5,
  "categoryId": "uuid",
  "supplierId": "uuid"
}
```

### PUT /api/products/[id]
Update an existing product.

### DELETE /api/products/[id]
Delete a product.

## Recipes API

### GET /api/recipes
Get all recipes for the authenticated user.

### POST /api/recipes
Create a new recipe with ingredients.

**Request Body:**
```json
{
  "nome": "Pizza Margherita",
  "descricao": "Pizza clássica italiana",
  "categoria": "Pizzas",
  "tempoPreparo": 30,
  "rendimentoPorcoes": 4,
  "margemLucroDesejada": 35,
  "ingredients": [
    {
      "productId": "uuid",
      "quantidade": 0.5,
      "unidade": "kg",
      "observacoes": ""
    }
  ]
}
```

## Purchases API

### GET /api/purchases
Get all purchases for the authenticated user.

### POST /api/purchases
Create a new purchase.

**Request Body:**
```json
{
  "dataCompra": "2024-01-15",
  "supplierId": "uuid",
  "numeroNota": "12345",
  "desconto": 0,
  "impostos": 0,
  "items": [
    {
      "productId": "uuid",
      "quantidade": 10,
      "precoUnitario": 8.50
    }
  ]
}
```

## Dashboard API

### GET /api/dashboard/stats
Get dashboard statistics.

**Response:**
```json
{
  "totalProducts": 45,
  "totalRecipes": 12,
  "monthlyPurchases": 8500.00,
  "avgCMV": 28.5,
  "lowStockCount": 3
}
```

## Error Responses

All API endpoints return errors in the following format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

Common HTTP status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

# docs/DEPLOYMENT.md
# Deployment Guide

## Prerequisites

- Node.js 18+
- Supabase account
- Vercel account (recommended)

## Environment Variables

Create the following environment variables in your deployment platform:

### Required
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Optional
```env
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_analytics_id
```

## Supabase Setup

1. Create a new Supabase project
2. Run the SQL script from `database-schema.sql`
3. Configure Authentication:
   - Enable Email authentication
   - Set up email templates
   - Configure OAuth providers (optional)

## Vercel Deployment (Recommended)

1. **Connect Repository**
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all required environment variables

3. **Domain Configuration**
   - Configure custom domain (optional)
   - Set up SSL (automatic with Vercel)

## Alternative Deployment Options

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t cmv-control .
docker run -p 3000:3000 --env-file .env.production cmv-control
```

### Railway

1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Netlify

1. Build command: `npm run build`
2. Publish directory: `.next`
3. Set environment variables

## Database Migration

If updating an existing deployment:

1. Create a backup of your database
2. Run migration scripts in order
3. Test thoroughly in staging environment

## Performance Optimization

### Vercel Optimization

```javascript
// next.config.js
module.exports = {
  // Enable experimental features
  experimental: {
    optimizeCss: true,
    optimizeImages: true,
  },
  
  // Image optimization
  images: {
    domains: ['your-supabase-url.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
```

### Supabase Optimization

1. **Enable Row Level Security** (already configured)
2. **Create appropriate indexes** (included in schema)
3. **Set up connection pooling**
4. **Configure backup schedules**

## Monitoring

### Error Tracking with Sentry

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

### Analytics

- Vercel Analytics (built-in)
- Google Analytics (configured)
- Custom metrics via Supabase

## Security Checklist

- [ ] Environment variables are secure
- [ ] Database RLS is enabled
- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] API rate limiting is implemented
- [ ] Authentication is working correctly
- [ ] File uploads are restricted
- [ ] SQL injection protection is in place

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version
   - Verify environment variables
   - Review TypeScript errors

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check network connectivity
   - Review connection pooling settings

3. **Authentication Problems**
   - Verify Auth configuration
   - Check email templates
   - Review OAuth settings

### Debug Commands

```bash
# Check build locally
npm run build
npm run start

# Verify environment
npm run type-check
npm run lint

# Test database connection
# (Create a simple script to test Supabase connection)
```

## Maintenance

### Regular Tasks

1. **Weekly**
   - Monitor error rates
   - Check performance metrics
   - Review user feedback

2. **Monthly**
   - Update dependencies
   - Review security logs
   - Optimize database queries

3. **Quarterly**
   - Security audit
   - Performance review
   - Backup testing

### Updates

1. Test in staging environment
2. Create database backup
3. Deploy during low-traffic hours
4. Monitor for issues
5. Rollback if necessary

## Support

For deployment issues:
1. Check documentation
2. Review logs
3. Contact support team
4. Create GitHub issue

# docs/CONTRIBUTING.md
# Contributing Guide

Thank you for your interest in contributing to CMV Control! This guide will help you get started.

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/cmv-control-app.git
   cd cmv-control-app
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Fill in your Supabase credentials
   ```

4. **Database Setup**
   - Create a Supabase project
   - Run the SQL script from `database-schema.sql`

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## Code Standards

### TypeScript
- Use strict TypeScript settings
- Define proper types for all props and functions
- Avoid `any` type unless absolutely necessary
- Use proper interfaces for data structures

### React
- Use functional components with hooks
- Implement proper error boundaries
- Use React.memo for performance optimization when needed
- Follow the component structure pattern

### File Organization
```
src/
├── components/
│   ├── ui/           # Base UI components
│   ├── feature/      # Feature-specific components
│   └── common/       # Shared components
├── lib/
│   ├── hooks/        # Custom hooks
│   ├── utils/        # Utility functions
│   └── types/        # Type definitions
```

### Naming Conventions
- **Components**: PascalCase (`ProductCard.tsx`)
- **Files**: kebab-case for utilities (`format-currency.ts`)
- **Functions**: camelCase (`formatCurrency`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS`)

## Git Workflow

### Branch Naming
- `feature/add-product-search`
- `fix/login-validation-error`
- `docs/update-readme`
- `refactor/simplify-auth-flow`

### Commit Messages
Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
feat: add product search functionality
fix: resolve login validation issue
docs: update installation instructions
refactor: simplify authentication flow
test: add unit tests for ProductCard
style: format code with prettier
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write code following our standards
   - Add tests for new functionality
   - Update documentation if needed

3. **Test Your Changes**
   ```bash
   npm run lint
   npm run type-check
   npm run test
   npm run build
   ```

4. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Use the PR template
   - Link related issues
   - Request review from maintainers

## Testing Guidelines

### Unit Tests
```typescript
// Example test structure
import { render, screen } from '@testing-library/react'
import { ProductCard } from '@/components/products/ProductCard'

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    const mockProduct = {
      // ... mock data
    }
    
    render(<ProductCard product={mockProduct} />)
    
    expect(screen.getByText('Product Name')).toBeInTheDocument()
  })
})
```

### E2E Tests
```typescript
// Example E2E test
test('user can create a new product', async ({ page }) => {
  await page.goto('/products')
  await page.click('text=New Product')
  
  await page.fill('[placeholder="Product name"]', 'Test Product')
  await page.click('button[type="submit"]')
  
  await expect(page.getByText('Product created successfully')).toBeVisible()
})
```

## Component Guidelines

### Creating New Components

1. **Use TypeScript interfaces**
   ```typescript
   interface ProductCardProps {
     product: Product
     onEdit?: (id: string) => void
     className?: string
   }
   ```

2. **Implement proper error handling**
   ```typescript
   if (!product) {
     return <div>Product not found</div>
   }
   ```

3. **Add loading states**
   ```typescript
   if (isLoading) {
     return <Skeleton />
   }
   ```

4. **Use proper accessibility**
   ```typescript
   <button
     aria-label="Edit product"
     onClick={() => onEdit?.(product.id)}
   >
     Edit
   </button>
   ```

### UI Components

- Use shadcn/ui as the base
- Follow the design system colors and spacing
- Implement dark mode support
- Ensure mobile responsiveness

## Database Guidelines

### Schema Changes

1. **Create migration files**
   ```sql
   -- migration_001_add_supplier_table.sql
   CREATE TABLE suppliers (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     -- ... columns
   );
   ```

2. **Update TypeScript types**
   ```typescript
   // Update database types
   export interface Supplier {
     id: string
     nome: string
     // ... other fields
   }
   ```

3. **Add proper indexes**
   ```sql
   CREATE INDEX idx_suppliers_name ON suppliers(nome);
   ```

## Performance Guidelines

### Code Splitting
```typescript
// Lazy load components
const ProductForm = lazy(() => import('@/components/products/ProductForm'))
```

### React Query Usage
```typescript
// Use proper query keys
export const PRODUCT_QUERY_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCT_QUERY_KEYS.all, 'list'] as const,
  list: (filters: any) => [...PRODUCT_QUERY_KEYS.lists(), filters] as const,
}
```

### Image Optimization
```typescript
import Image from 'next/image'

<Image
  src={src}
  alt={alt}
  width={width}
  height={height}
  priority={priority}
/>
```

## Documentation

### Code Documentation
```typescript
/**
 * Calculates the weighted average cost of a product
 * @param currentStock - Current stock quantity
 * @param currentCost - Current cost per unit
 * @param newQuantity - New quantity being added
 * @param newCost - New cost per unit
 * @returns The weighted average cost
 */
export function calculateWeightedAverage(
  currentStock: number,
  currentCost: number,
  newQuantity: number,
  newCost: number
): number {
  // Implementation
}
```

### README Updates
- Update feature lists when adding new functionality
- Add new setup instructions if needed
- Update screenshots and examples

## Issue Reporting

### Bug Reports
Include:
- Steps to reproduce
- Expected vs actual behavior
- Browser/device information
- Screenshots/videos if applicable
- Error messages from console

### Feature Requests
Include:
- Problem statement
- Proposed solution
- Alternatives considered
- Additional context

## Code Review

### As a Reviewer
- Be constructive and helpful
- Focus on code quality and standards
- Test the changes locally
- Check for security issues
- Verify documentation updates

### As an Author
- Respond to feedback promptly
- Make requested changes
- Explain your reasoning when needed
- Update the PR description if scope changes

## Release Process

1. **Version Bump**
   ```bash
   npm version patch|minor|major
   ```

2. **Update Changelog**
   - Add new features
   - Note breaking changes
   - List bug fixes

3. **Create Release**
   - Tag the release
   - Generate release notes
   - Deploy to production

## Questions?

- Open a GitHub Discussion
- Check existing issues
- Review documentation
- Contact maintainers

Thank you for contributing to CMV Control! 🎉