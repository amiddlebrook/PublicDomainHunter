#!/bin/bash

# Public Domain Hunter - Cost Calculator
# Helps estimate monthly operational costs

echo "💰 Public Domain Hunter - Cost Calculator"
echo "========================================"
echo ""

# User input function
get_input() {
    local prompt="$1"
    local default="$2"
    read -p "$prompt [$default]: " input
    echo "${input:-$default}"
}

echo "📊 Enter your expected usage:"
echo ""

# Get user count
USER_COUNT=$(get_input "Expected monthly active users" "100")

# Get API usage
API_CALLS=$(get_input "Expected Google Trends API calls per month" "1000")

# Get email volume
EMAIL_COUNT=$(get_input "Expected emails per month" "500")

# Get deployment scale
SCALE=$(get_input "Deployment scale (small/medium/large)" "small")

echo ""
echo "🔧 Configuration Summary:"
echo "   Users: $USER_COUNT"
echo "   API Calls: $API_CALLS"
echo "   Emails: $EMAIL_COUNT"
echo "   Scale: $SCALE"
echo ""

# Calculate costs based on scale
case $SCALE in
    "small")
        INFRASTRUCTURE=25
        DATABASE=15
        ;;
    "medium")
        INFRASTRUCTURE=75
        DATABASE=40
        ;;
    "large")
        INFRASTRUCTURE=200
        DATABASE=100
        ;;
    *)
        INFRASTRUCTURE=25
        DATABASE=15
        ;;
esac

# API Costs
if [ "$API_CALLS" -lt 1000 ]; then
    GOOGLE_TRENDS=0
elif [ "$API_CALLS" -lt 10000 ]; then
    GOOGLE_TRENDS=$((API_CALLS / 1000 * 5))
else
    GOOGLE_TRENDS=$((API_CALLS / 1000 * 4))
fi

# Email Costs
if [ "$EMAIL_COUNT" -lt 2000 ]; then
    EMAIL_COST=0
else
    EMAIL_COST=$((EMAIL_COUNT / 1000 * 6))
fi

# Transaction costs (estimate)
STRIPE_FEES=5  # Base fee

# CDN and monitoring
CDN=5
MONITORING=5

# Domain and SSL
DOMAIN=2
SSL=0  # Let's Encrypt free

# Calculate totals
MONTHLY_TOTAL=$((INFRASTRUCTURE + DATABASE + GOOGLE_TRENDS + EMAIL_COST + STRIPE_FEES + CDN + MONITORING + DOMAIN + SSL))

echo "💵 Monthly Cost Breakdown:"
echo "   Infrastructure (Server): $$INFRASTRUCTURE"
echo "   Database: $$DATABASE"
echo "   Google Trends API: $$GOOGLE_TRENDS"
echo "   Email Service: $$EMAIL_COST"
echo "   Stripe Fees: $$STRIPE_FEES"
echo "   CDN: $$CDN"
echo "   Monitoring: $$MONITORING"
echo "   Domain: $$DOMAIN"
echo "   SSL: $$SSL"
echo ""
echo "   📊 Total Monthly Cost: $$MONTHLY_TOTAL"
echo ""

# Break-even analysis
if [ "$USER_COUNT" -gt 0 ]; then
    REVENUE_PER_USER=$((MONTHLY_TOTAL / USER_COUNT * 3))  # 3x cost ratio
    echo "📈 Break-even Analysis:"
    echo "   Required monthly revenue per user: $$REVENUE_PER_USER"
    echo "   For $10/month subscription: $((USER_COUNT / 10 * 10)) users needed"
    echo "   For $25/month subscription: $((USER_COUNT / 25 * 25)) users needed"
fi

echo ""
echo "💡 Cost Optimization Tips:"
echo "   1. Use DigitalOcean for cost-effective infrastructure"
echo "   2. Implement caching to reduce API calls"
echo "   3. Start with free tiers and upgrade as needed"
echo "   4. Monitor usage to avoid over-provisioning"
echo ""
echo "📖 For detailed cost analysis, see COST_GUIDE.md"
