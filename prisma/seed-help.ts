import { PrismaClient, ArticleCategory, ArticleStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function seedHelpContent() {
  console.log("🌱 Starting help content seed...");

  // Get demo user for author
  const demoUser = await prisma.user.findUnique({
    where: { id: "demo-user-id" },
  });

  if (!demoUser) {
    console.log("⚠️  Demo user not found. Please run main seed first.");
    return;
  }

  const authorId = demoUser.id;

  // Clear existing help content
  console.log("🧹 Clearing existing help content...");
  await prisma.articleFeedback.deleteMany({});
  await prisma.helpArticle.deleteMany({});
  await prisma.fAQ.deleteMany({});

  // Create Help Articles
  console.log("📚 Creating help articles...");

  const articles = [
    // GETTING_STARTED
    {
      title: "Welcome to Valor Insurance Platform",
      slug: "welcome-to-valor",
      category: ArticleCategory.GETTING_STARTED,
      tags: ["welcome", "introduction", "getting started"],
      summary:
        "Get started with the Valor Insurance Platform and learn about the features available to you.",
      content: `# Welcome to Valor Insurance Platform

Welcome to Valor Financial Specialists! This platform is designed to help insurance agents manage their business efficiently and effectively.

## What is Valor?

Valor is a comprehensive insurance back-office platform that provides:

- **Case Management**: Track applications from submission to issue
- **Commission Tracking**: Monitor earnings and payment schedules
- **Quote Generation**: Create professional insurance quotes
- **Contract Management**: Manage carrier contracts and appointments
- **Training & Certification**: Access courses and earn certifications
- **Reporting & Analytics**: Generate insights on your business performance

## Getting Started

1. **Complete Your Profile**: Add your license information and professional details
2. **Review Contracts**: Check your carrier contracts and commission levels
3. **Explore Features**: Familiarize yourself with the dashboard and navigation
4. **Take Training**: Complete required training courses
5. **Start Selling**: Begin creating quotes and submitting applications

## Need Help?

- Browse our help articles by category
- Watch video tutorials
- Contact support for assistance
- Join the community forum

Let's get started on your path to success!`,
      keywords: ["welcome", "introduction", "getting started", "overview"],
      searchableText:
        "welcome valor insurance platform getting started features case management commission tracking quote generation",
      status: ArticleStatus.PUBLISHED,
      authorId,
      publishedAt: new Date(),
    },
    {
      title: "Setting Up Your Agent Profile",
      slug: "setup-agent-profile",
      category: ArticleCategory.GETTING_STARTED,
      tags: ["profile", "setup", "license", "npn"],
      summary:
        "Learn how to complete your agent profile with license information and professional details.",
      content: `# Setting Up Your Agent Profile

Your agent profile is essential for doing business on the Valor platform. Complete all fields to ensure you can submit applications and receive commissions.

## Required Information

### License Details
- **License Number**: Your state insurance license number
- **License State**: State where you're licensed
- **License Expiration**: Keep this updated to avoid lapses
- **NPN**: National Producer Number (required for all states)

### Professional Information
- **Agency Name**: Your agency or firm name
- **Years of Experience**: Helps carriers assess your background
- **Specializations**: Products you focus on (Life, Annuities, etc.)
- **GAID**: General Agent ID (if applicable)

## Updating Your Profile

1. Click on your profile icon in the top right
2. Select "Profile Settings"
3. Complete all required fields
4. Upload a professional photo
5. Save your changes

## Verification Process

Some information may require verification:
- License numbers are validated against state databases
- NPNs are checked with NIPR
- Carrier appointments may require documentation

## Best Practices

- Keep your license information current
- Update your photo every 2-3 years
- Add new specializations as you grow
- Review your profile quarterly

**Important**: Incomplete profiles may delay application processing and commission payments.`,
      keywords: ["profile", "setup", "license", "npn", "agent information"],
      searchableText:
        "agent profile setup license npn national producer number professional information",
      status: ArticleStatus.PUBLISHED,
      authorId,
      publishedAt: new Date(),
    },
    // CASES
    {
      title: "Creating and Managing Cases",
      slug: "creating-managing-cases",
      category: ArticleCategory.CASES,
      tags: ["cases", "applications", "submission", "underwriting"],
      summary:
        "Complete guide to creating cases, submitting applications, and tracking them through the underwriting process.",
      content: `# Creating and Managing Cases

Cases represent insurance applications that you're working on. This guide covers the entire case lifecycle.

## Creating a New Case

### Step 1: Start from a Quote (Recommended)
1. Generate a quote for your client
2. Click "Convert to Case" on the quote detail page
3. Client information will auto-populate

### Step 2: Direct Case Creation
1. Navigate to Cases → New Case
2. Enter client information
3. Select carrier and product
4. Fill in application details

## Case Statuses

- **DRAFT**: Case in progress, not yet submitted
- **SUBMITTED**: Application sent to carrier
- **PENDING_REQUIREMENTS**: Awaiting additional documents
- **IN_UNDERWRITING**: Carrier is reviewing
- **APPROVED**: Application approved by carrier
- **ISSUED**: Policy has been issued
- **DECLINED**: Application was declined
- **WITHDRAWN**: Case was withdrawn

## Managing Requirements

When a case needs additional information:

1. Check the "Pending Requirements" section
2. Upload required documents
3. Add notes about what you submitted
4. Update the status when complete

## Document Management

Supported document types:
- Applications (PDF)
- Medical records
- Financial statements
- Illustrations
- Signed forms

**Tip**: Keep all documents organized by case for easy access during underwriting.

## Best Practices

- Submit cases within 24 hours of client signing
- Check for missing information before submission
- Follow up on pending requirements promptly
- Keep detailed notes of all client communications
- Update status as soon as you hear from the carrier`,
      keywords: [
        "cases",
        "applications",
        "submission",
        "underwriting",
        "status",
      ],
      searchableText:
        "cases applications submission underwriting status requirements documents",
      status: ArticleStatus.PUBLISHED,
      authorId,
      publishedAt: new Date(),
    },
    // COMMISSIONS
    {
      title: "Understanding Commission Structures",
      slug: "understanding-commission-structures",
      category: ArticleCategory.COMMISSIONS,
      tags: ["commissions", "payments", "splits", "hierarchy"],
      summary:
        "Learn how commission structures work, including first-year, renewal, override, and split commissions.",
      content: `# Understanding Commission Structures

Commissions are the lifeblood of your insurance business. Understanding how they work is crucial for financial planning.

## Commission Types

### First Year Commissions
- Paid when a policy is issued
- Typically the highest commission percentage
- Example: 90-110% of first year premium

### Renewal Commissions
- Paid annually when policy renews
- Lower percentage than first year
- Example: 2-5% of premium

### Override Commissions
- Paid to managers/uplines on downline production
- Based on organizational hierarchy
- Example: 5-10% override on agent sales

### Trail Commissions
- Ongoing payments on certain products
- Common with annuities and investment products
- Paid monthly or quarterly

### Bonus Commissions
- Performance-based incentives
- Tied to production targets
- Paid quarterly or annually

## Commission Splits

In a hierarchical organization:

**IMO** (50% of total) → **MGA** (30% of total) → **Agent** (20% of total)

Each level receives their portion when the commission is paid.

## Payment Schedules

### Life Insurance
- First year: 30-45 days after issue
- Renewals: On policy anniversary

### Annuities
- First year: 30-45 days after issue
- Trail: Monthly or quarterly

### Health Insurance
- Monthly as-earned

## Tracking Your Commissions

Use the Commissions page to:
- View pending commissions
- See payment history
- Track by carrier and product type
- Generate tax reports

## Commission Status

- **PENDING**: Commission earned but not yet paid
- **PAID**: Payment received and processed
- **ADJUSTED**: Commission amount was changed
- **DISPUTED**: Issue with commission amount

## Troubleshooting

If a commission seems incorrect:
1. Check the contract commission level
2. Verify the policy issued and is in force
3. Review any applicable splits
4. Contact support if still unclear

**Important**: Commission schedules vary by carrier. Always review your contract for specific terms.`,
      keywords: [
        "commissions",
        "payments",
        "first year",
        "renewal",
        "override",
        "splits",
      ],
      searchableText:
        "commissions payments first year renewal override splits hierarchy commission structures",
      status: ArticleStatus.PUBLISHED,
      authorId,
      publishedAt: new Date(),
    },
    // QUOTES
    {
      title: "Creating Life Insurance Quotes",
      slug: "creating-life-insurance-quotes",
      category: ArticleCategory.QUOTES,
      tags: ["quotes", "life insurance", "term", "universal life"],
      summary:
        "Step-by-step guide to creating accurate and professional life insurance quotes.",
      content: `# Creating Life Insurance Quotes

Creating accurate quotes is the first step in the sales process. This guide covers best practices for life insurance quotes.

## Types of Life Insurance

### Term Life Insurance
- **Term Length**: 10, 15, 20, 25, 30 years
- **Riders**: Return of Premium, Conversion, Waiver of Premium
- **Best For**: Temporary coverage needs

### Universal Life Insurance
- **Types**: Traditional UL, Indexed UL, Variable UL
- **Features**: Flexible premiums, cash value accumulation
- **Best For**: Permanent coverage with flexibility

### Whole Life Insurance
- **Features**: Fixed premiums, guaranteed cash value
- **Dividends**: Participating policies pay dividends
- **Best For**: Guaranteed lifetime coverage

## Creating a Quote

### Step 1: Client Information
- Name, date of birth, gender
- State of residence
- Tobacco use status
- Health class (Preferred Plus, Preferred, Standard, etc.)

### Step 2: Coverage Details
- Face amount (death benefit)
- Term length (for term insurance)
- Riders and benefits
- Payment frequency

### Step 3: Product Selection
- Choose carriers to quote
- Select specific products
- Compare multiple options

### Step 4: Review and Send
- Review quote for accuracy
- Add any notes or recommendations
- Email quote to client
- Save quote in system

## Health Classifications

### Preferred Plus (Best)
- No tobacco use
- Excellent health
- Good family history
- Ideal height/weight

### Preferred
- No tobacco use
- Very good health
- Minor health issues controlled

### Standard
- No tobacco use or stopped 12+ months
- Average health
- Some health conditions

### Tobacco/Substandard
- Current tobacco user
- Significant health issues
- May require rated premium

## Underwriting Considerations

Factors that affect pricing:
- **Age**: Older = higher premium
- **Gender**: Females typically pay less
- **Tobacco**: Doubles or triples premium
- **Health**: Chronic conditions increase rates
- **Family History**: Early deaths of parents
- **Occupation**: Hazardous jobs may add premium
- **Hobbies**: Dangerous activities (skydiving, racing)

## Best Practices

- Always get accurate health information
- Quote multiple carriers for comparison
- Include riders that benefit the client
- Explain the difference between term and permanent
- Save quotes for at least 6 months
- Follow up within 48 hours

## Common Mistakes to Avoid

- ❌ Underestimating tobacco use
- ❌ Not asking about health conditions
- ❌ Using wrong age calculation
- ❌ Forgetting to include important riders
- ❌ Not comparing multiple carriers

**Pro Tip**: Create multiple quote scenarios (different face amounts or terms) to show clients options.`,
      keywords: [
        "quotes",
        "life insurance",
        "term",
        "universal",
        "underwriting",
      ],
      searchableText:
        "life insurance quotes term universal whole underwriting health class riders",
      status: ArticleStatus.PUBLISHED,
      authorId,
      publishedAt: new Date(),
    },
    // TROUBLESHOOTING
    {
      title: "Common Technical Issues and Solutions",
      slug: "common-technical-issues",
      category: ArticleCategory.TROUBLESHOOTING,
      tags: ["troubleshooting", "errors", "technical support", "bugs"],
      summary:
        "Quick solutions to common technical issues you might encounter on the platform.",
      content: `# Common Technical Issues and Solutions

Experiencing technical difficulties? Here are solutions to the most common issues.

## Login Issues

### Can't Login
**Problem**: "Invalid credentials" error

**Solutions**:
1. Verify email address is correct
2. Use "Forgot Password" to reset
3. Check if account is active (not suspended)
4. Clear browser cache and cookies
5. Try incognito/private browsing mode

### Email Not Verified
**Problem**: "Please verify your email" message

**Solutions**:
1. Check spam/junk folder for verification email
2. Request new verification email from profile
3. Ensure email address is correct in your profile

## Performance Issues

### Slow Loading
**Problem**: Pages take a long time to load

**Solutions**:
1. Check your internet connection
2. Clear browser cache
3. Disable browser extensions temporarily
4. Try a different browser
5. Restart your computer

### Page Won't Load
**Problem**: Blank screen or error message

**Solutions**:
1. Refresh the page (F5 or Cmd+R)
2. Clear browser cache and cookies
3. Try accessing from incognito mode
4. Check if other websites load properly
5. Contact support if issue persists

## Document Upload Issues

### Upload Fails
**Problem**: Document upload doesn't complete

**Solutions**:
1. Check file size (max 10MB per file)
2. Ensure file type is supported (PDF, JPG, PNG, DOC)
3. Check file name for special characters
4. Try compressing large files
5. Use a different browser

### Document Not Appearing
**Problem**: Uploaded document doesn't show

**Solutions**:
1. Wait 30 seconds and refresh page
2. Check if upload actually completed
3. Verify file size wasn't too large
4. Re-upload the document

## Quote and Case Issues

### Quote Won't Generate
**Problem**: Error when creating quote

**Solutions**:
1. Verify all required fields are filled
2. Check age is within product limits
3. Ensure coverage amount is within carrier limits
4. Try a different product or carrier
5. Save as draft and try again later

### Can't Submit Case
**Problem**: Submit button grayed out or error

**Solutions**:
1. Complete all required fields
2. Upload required documents
3. Verify client information is valid
4. Check carrier is accepting new business
5. Review error messages carefully

## Commission Discrepancies

### Missing Commission
**Problem**: Expected commission not showing

**Solutions**:
1. Verify policy was actually issued
2. Check typical payment timeline for carrier
3. Confirm you have an active contract
4. Review commission splits in your hierarchy
5. Contact support with policy number

## Browser Compatibility

### Recommended Browsers
- Chrome (latest version)
- Firefox (latest version)
- Safari (latest version)
- Edge (Chromium-based)

### Not Recommended
- Internet Explorer (not supported)
- Outdated browser versions

## Still Having Issues?

If none of these solutions work:

1. **Take a screenshot** of the error
2. **Note the steps** that led to the issue
3. **Check system status** at status.valorfinancial.com
4. **Contact support** with all details

## Preventing Future Issues

- Keep your browser updated
- Clear cache monthly
- Use supported browsers
- Maintain stable internet connection
- Save work frequently

**Emergency Support**: For urgent issues during business hours, call support at 1-800-VALOR-HELP`,
      keywords: [
        "troubleshooting",
        "errors",
        "technical",
        "issues",
        "problems",
      ],
      searchableText:
        "troubleshooting technical issues errors problems login upload quote case commission",
      status: ArticleStatus.PUBLISHED,
      authorId,
      publishedAt: new Date(),
    },
    // COMPLIANCE
    {
      title: "Compliance and Regulatory Requirements",
      slug: "compliance-regulatory-requirements",
      category: ArticleCategory.COMPLIANCE,
      tags: ["compliance", "regulations", "legal", "requirements"],
      summary:
        "Important compliance information and regulatory requirements for insurance agents.",
      content: `# Compliance and Regulatory Requirements

Staying compliant is critical to maintaining your license and doing business ethically.

## License Requirements

### Active License
- Maintain active state license(s)
- Complete required continuing education
- Update license information immediately upon renewal
- Notify us of any license suspensions or actions

### Appointments
- Maintain active carrier appointments
- Complete carrier-specific training
- Report appointment changes promptly

## Continuing Education

### State Requirements
- Varies by state (typically 10-24 hours every 2 years)
- May include ethics requirement
- Must be completed before license expiration
- Upload CE certificates to your profile

### Carrier Training
- Complete required carrier courses
- Attend product training sessions
- Stay current on product changes

## Advertising and Marketing

### Compliance Rules
- **DO**: Use approved marketing materials
- **DO**: Include required disclosures
- **DO**: Clearly identify yourself as agent
- **DON'T**: Make misleading statements
- **DON'T**: Guarantee returns or results
- **DON'T**: Use unapproved logos or materials

### Social Media
- Follow FINRA/SEC guidelines if applicable
- Include required disclosures
- Archive all communications
- Don't make product recommendations without disclaimers

## Client Documentation

### Required Records
- Signed applications
- Client authorizations
- Needs analysis documentation
- Suitability determinations
- Replacement forms (when applicable)

### Retention Requirements
- Keep records for 5+ years (varies by state)
- Store securely (encrypted)
- Make available for audits
- Follow privacy regulations

## Privacy and Data Protection

### HIPAA Compliance
- Protect client health information
- Use secure transmission methods
- Obtain proper authorizations
- Report breaches immediately

### Data Security
- Use strong passwords
- Enable multi-factor authentication
- Don't share login credentials
- Log out on shared computers
- Report security concerns

## Prohibited Practices

### Never Do These
- ❌ Twisting (improper replacement)
- ❌ Churning (excessive replacements)
- ❌ Misrepresentation
- ❌ Rebating (illegal in most states)
- ❌ Sharing confidential information
- ❌ Forging signatures
- ❌ Backdating applications

## Replacements

When replacing existing coverage:
1. Complete replacement form
2. Provide proper disclosure
3. Document client's reasons
4. Perform suitability analysis
5. Ensure replacement is in client's best interest

## Suitability Standards

For annuity sales:
- Obtain financial information
- Assess client needs and objectives
- Document suitability
- Provide required disclosures
- Have client acknowledge understanding

## Reporting Requirements

### What to Report
- License actions or suspensions
- Criminal charges or convictions
- Civil judgments
- Regulatory actions
- Bankruptcy
- Address changes

### When to Report
- Within 30 days of occurrence
- Update in your agent profile
- Notify compliance team

## Audits and Examinations

### Be Prepared
- Keep complete records
- Organize documentation
- Be truthful and cooperative
- Provide requested materials promptly
- Consult legal counsel if needed

## Best Practices

- Put client interests first
- Document everything
- When in doubt, ask compliance
- Stay educated on regulations
- Follow company policies
- Act with integrity

## Compliance Resources

- State Department of Insurance websites
- NAIC (National Association of Insurance Commissioners)
- Carrier compliance departments
- Company compliance team
- Industry associations

**Questions?** Contact compliance@valorfinancial.com

**Reporting Concerns?** Use our anonymous ethics hotline: 1-800-ETHICS-1`,
      keywords: [
        "compliance",
        "regulations",
        "legal",
        "requirements",
        "license",
      ],
      searchableText:
        "compliance regulatory requirements license appointments continuing education advertising privacy",
      status: ArticleStatus.PUBLISHED,
      authorId,
      publishedAt: new Date(),
    },
  ];

  const createdArticles = [];
  for (const article of articles) {
    const created = await prisma.helpArticle.create({
      data: article,
    });
    createdArticles.push(created);
    console.log(`  ✓ Created: ${created.title}`);
  }

  // Create FAQs
  console.log("❓ Creating FAQs...");

  const faqs = [
    {
      question: "How do I reset my password?",
      answer: `To reset your password:

1. Click on "Forgot Password" on the login page
2. Enter your email address
3. Check your email for a reset link
4. Click the link and enter your new password
5. Confirm your new password

The reset link expires after 1 hour for security. If you don't receive the email, check your spam folder or contact support.`,
      category: "Account",
      order: 1,
    },
    {
      question: "How long does it take to process a commission payment?",
      answer: `Commission payment timing varies by carrier:

- Life Insurance: Typically 30-45 days after policy issue
- Annuities: Usually 30-60 days after contract issue
- Health Insurance: Monthly as-earned

Payments are processed on the 15th and last day of each month. If a commission is marked as "Paid" in the system, payment has been initiated and should reach your account within 2-3 business days via direct deposit or 5-7 days via check.`,
      category: ArticleCategory.COMMISSIONS,
      order: 2,
    },
    {
      question: "What file types can I upload for case documents?",
      answer: `Supported file types include:

- PDF (.pdf) - Preferred format
- Microsoft Word (.doc, .docx)
- Images (.jpg, .jpeg, .png, .gif)
- Spreadsheets (.xls, .xlsx)
- Text files (.txt)

Maximum file size is 10MB per document. For larger files, please compress them or split into multiple files. PDFs are strongly recommended for applications and signed forms to ensure formatting is preserved.`,
      category: ArticleCategory.CASES,
      order: 3,
    },
    {
      question: "How do I update my license information?",
      answer: `To update your license information:

1. Click your profile icon in the top right
2. Select "Profile Settings"
3. Navigate to the "License Information" section
4. Update your license number, state, expiration date
5. Upload a copy of your current license if required
6. Click "Save Changes"

License updates may require verification, which can take 1-2 business days. Keep your NPN (National Producer Number) current as well, as it's required for all states.`,
      category: "Profile",
      order: 4,
    },
    {
      question: "Can I quote multiple carriers at once?",
      answer: `Yes! When creating a quote:

1. Go to Quotes → New Quote
2. Enter client information
3. In the carrier selection, check multiple carriers
4. Select product types to compare
5. Click "Generate Quotes"

The system will show you quotes from all selected carriers side-by-side, making it easy to compare pricing and features. You can save and email these comparison quotes to clients.`,
      category: ArticleCategory.QUOTES,
      order: 5,
    },
    {
      question: "What's the difference between PENDING and IN_UNDERWRITING status?",
      answer: `PENDING_REQUIREMENTS means the carrier needs additional information from you or the client before they can proceed with underwriting. This might include:
- Medical records
- Financial statements
- Clarification on application questions
- Additional forms or signatures

IN_UNDERWRITING means the carrier has everything they need and is actively reviewing the case. No action is required from you unless the carrier requests something additional.

Monitor the "Pending Requirements" section to see exactly what's needed for PENDING cases.`,
      category: ArticleCategory.CASES,
      order: 6,
    },
    {
      question: "How do commission splits work in a hierarchy?",
      answer: `Commission splits are distributed hierarchically:

Example: $10,000 total commission on a case
- IMO (50%): Receives $5,000
- MGA (30%): Receives $3,000
- Agent (20%): Receives $2,000

Each organization level receives their percentage of the total commission. These percentages are defined in the organization structure and contract agreements.

Overrides work similarly - upper levels receive a percentage of downline production. You can view your commission split structure in Organization Settings.`,
      category: ArticleCategory.COMMISSIONS,
      order: 7,
    },
    {
      question: "Are training courses required?",
      answer: `Some training courses are required:

**Required Courses:**
- Platform Orientation (all new users)
- Compliance & Ethics (annual)
- Anti-Money Laundering (annual)
- Product-specific training (before selling)

**Optional Courses:**
- Advanced sales techniques
- Marketing strategies
- Client relationship management
- Product deep-dives

Required courses must be completed to maintain active status. You'll receive notifications when courses are due. Completion certificates are automatically recorded in your profile.`,
      category: "Training",
      order: 8,
    },
    {
      question: "How do I export my commission data for taxes?",
      answer: `To export commission data:

1. Go to Commissions page
2. Click the "Export" button in the top right
3. Select date range (typically full calendar year)
4. Choose format: CSV or PDF
5. Select what to include: All commissions or only paid
6. Click "Download"

The export includes all necessary information for tax reporting including carrier, policy number, amounts, dates, and split details. For Form 1099 questions, contact your tax professional. We mail 1099 forms by January 31st each year.`,
      category: "Reports",
      order: 9,
    },
    {
      question: "What browsers are supported?",
      answer: `Fully supported browsers (latest versions):
- Google Chrome ✅
- Mozilla Firefox ✅
- Apple Safari ✅
- Microsoft Edge (Chromium) ✅

Not supported:
- Internet Explorer ❌
- Outdated browser versions ❌

For best performance, we recommend Chrome or Firefox. Make sure JavaScript is enabled and cookies are allowed. If you experience issues, try clearing your cache or using an incognito/private browsing window.`,
      category: "Technical",
      order: 10,
    },
    {
      question: "Can I work offline?",
      answer: `The platform requires an internet connection for most features. However:

**Available Offline:**
- Previously loaded pages (cached)
- Downloaded PDF quotes and documents
- Mobile app has limited offline viewing

**Requires Internet:**
- Creating new cases or quotes
- Uploading documents
- Checking commission status
- Real-time updates
- Submitting applications

We recommend maintaining a stable internet connection for the best experience. Any work started offline will sync when connection is restored.`,
      category: "Technical",
      order: 11,
    },
    {
      question: "How do I add a team member to my organization?",
      answer: `To add a team member:

1. Go to Admin → Organization
2. Click "Add Member"
3. Enter their information:
   - Name and email
   - Role (Agent, Manager, etc.)
   - Commission split percentage
   - Permissions
4. Click "Send Invitation"

The team member will receive an email invitation to create their account. They'll be added to your organization once they complete registration. You can manage their permissions and commission splits at any time.

Only Administrators and Managers can add new members.`,
      category: "Admin",
      order: 12,
    },
  ];

  for (const faq of faqs) {
    const created = await prisma.fAQ.create({
      data: faq,
    });
    console.log(`  ✓ Created FAQ: ${created.question}`);
  }

  console.log("✅ Help content seed completed!");
  console.log(`\n📊 Summary:`);
  console.log(`  - Help Articles: ${createdArticles.length}`);
  console.log(`  - FAQs: ${faqs.length}`);
}

seedHelpContent()
  .catch((e) => {
    console.error("❌ Error seeding help content:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
