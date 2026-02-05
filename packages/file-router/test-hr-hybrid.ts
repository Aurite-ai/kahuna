/**
 * Test HR Hybrid Document Classification
 * Scenario: Leave Policy (Business) + HRIS Technical Setup (Technical)
 * Run with: npx tsx test-hr-hybrid.ts
 */

import { categorizeWithHybridSupport, getCategorizeStats } from './src/index.js';

// Realistic HR Hybrid Document: Leave Policy + HRIS Technical Setup
const hrHybridContent = `# Employee Leave Management Policy and System Integration

## Part 1: Leave Policy

### Overview
Acme Corporation provides a comprehensive leave policy to support employee well-being and work-life balance. This policy outlines the types of leave available, eligibility requirements, and approval processes.

### Leave Types and Allocation

**Paid Time Off (PTO)**
- Full-time employees: 20 days per year
- Part-time employees: Pro-rated based on hours worked
- Accrual: 1.67 days per month
- Maximum carryover: 5 days to next calendar year

**Sick Leave**
- 10 days per year for all employees
- No carryover to next year
- Can be used for personal illness or family care
- Doctor's note required for absences exceeding 3 consecutive days

**Parental Leave**
- Birth parent: 16 weeks paid leave
- Non-birth parent: 8 weeks paid leave
- Must be taken within 12 months of birth or adoption
- Can be taken continuously or intermittently

**Bereavement Leave**
- Immediate family: 5 days paid leave
- Extended family: 3 days paid leave
- Additional unpaid leave available upon request

### Approval Process

1. **Request Submission**: Submit leave request at least 2 weeks in advance (except emergencies)
2. **Manager Review**: Manager has 3 business days to approve/deny
3. **HR Notification**: Approved leave automatically notifies HR for records
4. **Calendar Update**: Leave is reflected in team calendar within 24 hours

### Eligibility Requirements

- PTO: Available after 90-day probationary period
- Sick Leave: Available from day 1 of employment
- Parental Leave: Must have 12 months of service
- All leave subject to manager approval and business needs

### Compliance

This policy complies with:
- Family and Medical Leave Act (FMLA)
- Americans with Disabilities Act (ADA)
- State and local leave requirements

---

## Part 2: HRIS System Integration Guide

### System Architecture

The leave management system integrates with our HRIS (BambooHR) using a RESTful API. The integration enables real-time leave balance tracking, automated approval workflows, and calendar synchronization.

### API Authentication

All API requests require OAuth 2.0 authentication:

\`\`\`
POST https://api.bamboohr.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
client_id=YOUR_CLIENT_ID
client_secret=YOUR_CLIENT_SECRET
\`\`\`

Response:
\`\`\`json
{
  "access_token": "eyJhbGciOiJSUzI1...",
  "token_type": "Bearer",
  "expires_in": 3600
}
\`\`\`

### Database Schema

\`\`\`sql
-- Leave Requests Table
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  leave_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(4,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  reason TEXT,
  manager_id UUID REFERENCES employees(id),
  approved_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Leave Balances Table
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  leave_type VARCHAR(50) NOT NULL,
  total_allocated DECIMAL(4,2) NOT NULL,
  used DECIMAL(4,2) DEFAULT 0,
  remaining DECIMAL(4,2) GENERATED ALWAYS AS (total_allocated - used) STORED,
  year INTEGER NOT NULL,
  UNIQUE(employee_id, leave_type, year)
);

-- Indexes for performance
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_balances_employee ON leave_balances(employee_id);
\`\`\`

### API Endpoints

**Submit Leave Request**
\`\`\`
POST /api/v1/leave-requests
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "employee_id": "emp_123",
  "leave_type": "PTO",
  "start_date": "2024-03-15",
  "end_date": "2024-03-20",
  "reason": "Vacation"
}
\`\`\`

**Get Leave Balance**
\`\`\`
GET /api/v1/leave-balances/{employee_id}
Authorization: Bearer {access_token}

Response:
{
  "employee_id": "emp_123",
  "balances": [
    {
      "leave_type": "PTO",
      "total": 20,
      "used": 5,
      "remaining": 15
    },
    {
      "leave_type": "Sick",
      "total": 10,
      "used": 2,
      "remaining": 8
    }
  ]
}
\`\`\`

**Approve/Deny Leave Request**
\`\`\`
PATCH /api/v1/leave-requests/{request_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "status": "approved",
  "manager_notes": "Approved for travel dates"
}
\`\`\`

### Webhook Configuration

Configure webhooks to receive real-time notifications:

\`\`\`json
{
  "webhook_url": "https://your-domain.com/webhooks/leave",
  "events": [
    "leave.requested",
    "leave.approved",
    "leave.denied",
    "leave.cancelled"
  ],
  "secret": "whsec_abc123..."
}
\`\`\`

### Error Handling

Common error codes:
- \`400\`: Invalid request parameters
- \`401\`: Authentication failed
- \`403\`: Insufficient permissions
- \`404\`: Resource not found
- \`429\`: Rate limit exceeded (100 requests/minute)
- \`500\`: Internal server error

### Security Requirements

- All API calls must use HTTPS/TLS 1.3
- Access tokens expire after 1 hour
- Refresh tokens valid for 30 days
- IP whitelisting required for production
- Audit logging enabled for all leave modifications
- Data encrypted at rest using AES-256

### Rate Limits

- Standard tier: 100 requests per minute
- Premium tier: 500 requests per minute
- Burst allowance: 150% for 10 seconds
`;

async function runHRHybridTest() {
  console.log('='.repeat(80));
  console.log('HR HYBRID DOCUMENT TEST');
  console.log('Testing: Leave Policy (Business) + HRIS Technical Setup (Technical)');
  console.log('='.repeat(80));

  try {
    const result = await categorizeWithHybridSupport('hr-leave-policy.md', hrHybridContent);

    console.log(`\n📋 Result Type: ${result.type.toUpperCase()}\n`);

    if (result.type === 'single') {
      console.log('❌ File was classified as single category (not hybrid)');
      console.log(`Category: ${result.result.category}`);
      console.log(`Confidence: ${(result.result.confidence * 100).toFixed(1)}%`);
      console.log(`Reasoning: ${result.result.reasoning}`);
      console.log('\nNote: This may mean the system determined one category dominates (>70%)');
    } else {
      console.log('✅ HYBRID FILE DETECTED AND SPLIT!\n');
      console.log(`Split into ${result.result.splits.length} sections:\n`);

      for (const split of result.result.splits) {
        console.log('─'.repeat(80));
        console.log(`📄 Section ${split.sectionIndex}: ${split.sectionTitle}`);
        console.log('─'.repeat(80));
        console.log(`Category:    ${split.category}`);
        console.log(`Confidence:  ${(split.confidence * 100).toFixed(1)}%`);
        console.log(`Size:        ${split.content.length} characters`);
        console.log(`Lines:       ${split.startLine}-${split.endLine}`);
        console.log(`Reasoning:   ${split.reasoning}`);

        // Show a snippet of content
        const snippet = split.content.substring(0, 150).replace(/\n/g, ' ');
        console.log(`Content:     ${snippet}...`);
        console.log('');
      }

      // Show warnings if any
      if (result.result.warnings && result.result.warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:\n');
        for (const warning of result.result.warnings) {
          console.log(`  ${warning.code}: ${warning.message}`);
          if (warning.details) {
            console.log(`  Details:`, JSON.stringify(warning.details, null, 2));
          }
        }
      }

      // Show statistics
      const stats = getCategorizeStats(result);
      console.log('\n📊 STATISTICS:\n');
      console.log(`  Total Sections:      ${stats.totalSections}`);
      console.log(`  Average Confidence:  ${(stats.averageConfidence * 100).toFixed(1)}%`);
      console.log(`  Has Warnings:        ${stats.hasWarnings ? 'Yes' : 'No'}`);
      console.log('\n  Category Breakdown:');
      for (const [category, count] of Object.entries(stats.categories)) {
        const percentage = ((count / stats.totalSections) * 100).toFixed(0);
        console.log(`    • ${category}: ${count} section(s) (${percentage}%)`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST COMPLETED');
    console.log('='.repeat(80) + '\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
runHRHybridTest();
