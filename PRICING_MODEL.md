# NotionStruct - Freemium Pricing Model

## 💰 **Pricing Tiers**

### **Free Tier**
- **Price**: ₹0 (Free Forever)
- **Template Downloads**: Unlimited free/basic templates
- **AI Generations**: 5 (lifetime)
- **Premium Templates**: No access
- **Support**: Community support

### **Pro Tier**
- **Price**: ₹799/month (~$10/month)
- **Template Downloads**: Unlimited (all templates)
- **AI Generations**: Unlimited
- **Premium Templates**: Full access
- **Support**: Priority support
- **Extras**: Early access to new features, custom template requests

---

## 🎯 **How It Works**

### **For Free Users:**
1. Sign up and get instant access
2. Download unlimited **free/basic** templates
3. Use AI to generate **5 custom templates** (lifetime)
4. Once AI limit is reached, upgrade to Pro for unlimited

### **For Pro Users:**
1. Subscribe for ₹799/month
2. Unlock all **premium templates**
3. Generate **unlimited AI templates**
4. Get priority support and early access to features

---

## 📊 **Template Classification**

Templates are marked as either **Free** or **Pro**:

### **Free Templates** (Basic)
- Habit Tracker
- Project Tracker
- Goal Tracker
- Daily Planner
- Expense Tracker
- Budget Planner
- Workout Tracker
- Meal Planner
- Content Calendar
- And many more...

### **Pro Templates** (Premium)
- OKR Tracker
- Zettelkasten Note System
- Sprint Planner
- GTD System
- Team Wiki & Knowledge Base
- Investment Portfolio Tracker
- Invoice Manager
- YouTube Content Planner
- Social Media Planner
- And many more...

---

## 🔄 **Usage Tracking**

### **Database Fields:**
- `subscription_plan`: 'free' or 'pro'
- `subscription_status`: 'active', 'canceled', 'past_due'
- `ai_generations_lifetime`: Total AI generations used
- `subscription_id`: Razorpay subscription ID

### **Limits Enforcement:**
- Free users can download unlimited free templates
- Free users are limited to 5 AI generations (lifetime)
- Pro templates are locked for free users
- Pro users have no limits

---

## 💳 **Payment Integration**

Payments are handled through **payments.bartlabs.in** (centralized BartLabs payment portal).

### **Payment Flow:**
1. User clicks "Upgrade to Pro"
2. Redirected to payments.bartlabs.in
3. Razorpay payment gateway processes payment
4. On success, user's `subscription_plan` updated to 'pro'
5. User gets immediate access to all pro features

---

## 🚀 **Conversion Strategy**

### **Why Users Upgrade:**
1. **AI Limit Reached**: After 5 free AI generations, users need Pro for more
2. **Premium Templates**: Exclusive templates only available to Pro users
3. **Value Proposition**: ₹799/month for unlimited AI + premium templates

### **Pricing Psychology:**
- Free tier is generous enough to try the product
- AI limit (5) is enough to see value but limited enough to encourage upgrades
- ₹799/month (~$10) is affordable for Indian market
- "Unlimited" is a powerful selling point

---

## 📈 **Future Enhancements**

### **Potential Add-ons:**
- Annual plan with discount (₹7,999/year - save 2 months)
- Team plans (₹1,999/month for 5 users)
- Enterprise plans (custom pricing)
- One-time template purchases (₹99-499 per template)

### **Metrics to Track:**
- Free to Pro conversion rate
- Average AI generations before upgrade
- Most popular premium templates
- Churn rate
- Monthly recurring revenue (MRR)

---

**Last Updated:** December 11, 2025  
**Version:** 1.0.0
