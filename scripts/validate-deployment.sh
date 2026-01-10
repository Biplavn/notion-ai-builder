#!/bin/bash

# Pre-Deployment Validation Script
# Run this before deploying to catch any issues

echo "🔍 NotionStruct - Pre-Deployment Validation"
echo "=========================================="
echo ""

ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

# 1. Check Node.js version
echo "1️⃣  Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    print_status 0 "Node.js version: $(node -v)"
else
    print_status 1 "Node.js version too old. Need 18+, got $(node -v)"
fi
echo ""

# 2. Check dependencies installed
echo "2️⃣  Checking dependencies..."
if [ -d "node_modules" ]; then
    print_status 0 "node_modules exists"
else
    print_status 1 "node_modules not found. Run: npm install"
fi
echo ""

# 3. Check environment variables template
echo "3️⃣  Checking environment files..."
if [ -f ".env.local" ]; then
    print_status 0 ".env.local exists"
else
    print_warning ".env.local not found (OK for production, needed for local dev)"
fi

if [ -f ".env.production.example" ]; then
    print_status 0 ".env.production.example created"
else
    print_status 1 ".env.production.example missing"
fi
echo ""

# 4. Check required files exist
echo "4️⃣  Checking new feature files..."
FILES=(
    "src/app/dashboard/page.tsx"
    "src/app/subscription/page.tsx"
    "src/app/api/webhooks/razorpay/route.ts"
    "MIGRATION_ADMIN_ENHANCEMENTS.sql"
    "vercel.json"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "$file exists"
    else
        print_status 1 "$file missing"
    fi
done
echo ""

# 5. Check for TypeScript errors
echo "5️⃣  Checking for TypeScript errors..."
if command -v tsc &> /dev/null; then
    if npx tsc --noEmit 2>/dev/null; then
        print_status 0 "No TypeScript errors"
    else
        print_warning "TypeScript errors found (check with: npm run build)"
    fi
else
    print_warning "TypeScript not found, skipping type check"
fi
echo ""

# 6. Check for common issues
echo "6️⃣  Checking for common issues..."

# Check for console.log in production code (excluding intentional webhook logs)
CONSOLE_LOGS=$(grep -r "console.log" src/ --exclude-dir=node_modules | grep -v "// Allow console" | grep -v "webhook" || true)
if [ -z "$CONSOLE_LOGS" ]; then
    print_status 0 "No unnecessary console.log statements"
else
    print_warning "Found console.log statements (review before production)"
fi

# Check for TODO comments
TODOS=$(grep -r "TODO" src/ --exclude-dir=node_modules | wc -l | tr -d ' ')
if [ "$TODOS" -eq 0 ]; then
    print_status 0 "No TODO comments"
else
    print_warning "Found $TODOS TODO comments"
fi
echo ""

# 7. Check git status
echo "7️⃣  Checking git status..."
if git diff --quiet && git diff --cached --quiet; then
    print_status 0 "No uncommitted changes"
else
    print_warning "Uncommitted changes found"
    echo "   Run: git add . && git commit -m 'message' && git push"
fi
echo ""

# 8. Check documentation
echo "8️⃣  Checking documentation..."
DOCS=(
    "README_ADMIN_SYSTEM.md"
    "QUICK_START_ADMIN.md"
    "DEPLOYMENT_INSTRUCTIONS.md"
    "ADMIN_ENHANCEMENTS_GUIDE.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        print_status 0 "$doc exists"
    else
        print_status 1 "$doc missing"
    fi
done
echo ""

# 9. Try to build
echo "9️⃣  Attempting production build..."
if npm run build > /dev/null 2>&1; then
    print_status 0 "Build successful"
else
    print_status 1 "Build failed. Run: npm run build to see errors"
fi
echo ""

# Summary
echo "=========================================="
echo "📊 Validation Summary"
echo "=========================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to deploy.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Commit and push: git add . && git commit && git push"
    echo "2. Deploy to Vercel: Follow DEPLOYMENT_INSTRUCTIONS.md"
    echo "3. Run database migration in Supabase"
    echo "4. Configure Razorpay webhook"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Validation passed with $WARNINGS warning(s).${NC}"
    echo ""
    echo "Review warnings above. You can still deploy, but fix these for production:"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Validation failed with $ERRORS error(s) and $WARNINGS warning(s).${NC}"
    echo ""
    echo "Fix the errors above before deploying."
    exit 1
fi
