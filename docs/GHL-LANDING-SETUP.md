# GHL Landing Page Setup Guide

## Overview
This guide walks you through setting up the "Coming Soon" landing page in GoHighLevel with two signup forms: one for visitors and one for businesses.

---

## Step 1: Create Tags

Go to **Settings > Tags** and create these tags:

| Tag Name | Description |
|----------|-------------|
| `launch-notify` | Visitors who want to be notified at launch |
| `business-lead` | Business owners wanting to claim listings |

---

## Step 2: Create the Forms

### Form A: Visitor Signup

Go to **Sites > Forms** and create a new form:

**Form Name:** `Landing Page - Visitor Signup`

**Fields:**
| Field Label | Field Name | Type | Required |
|-------------|------------|------|----------|
| First Name | `first_name` | Text | Yes |
| Email Address | `email` | Email | Yes |
| Zip Code | `postal_code` | Text | No |

**Form Settings:**
- **Add Tag:** `launch-notify`
- **Source:** `Landing Page - Visitor`
- **Thank You Message:** "Thanks! We'll notify you when Door County Visitor launches."

---

### Form B: Business Signup

**Form Name:** `Landing Page - Business Signup`

**Fields:**
| Field Label | Field Name | Type | Required |
|-------------|------------|------|----------|
| Business Name | `company_name` | Text | Yes |
| Your Name | `first_name` | Text | Yes |
| Email Address | `email` | Email | Yes |
| Phone Number | `phone` | Phone | Yes |

**Form Settings:**
- **Add Tag:** `business-lead`
- **Source:** `Landing Page - Business`
- **Thank You Message:** "Thanks! We'll reach out within 24 hours to set up your listing."

---

## Step 3: Create Email Automations

Go to **Automation > Workflows**

### Workflow 1: Visitor Welcome

**Trigger:** Tag Added = `launch-notify`

**Actions:**
1. Wait 1 minute
2. Send Email:

```
Subject: You're on the list! 🎉

Hi {{contact.first_name}},

Thanks for signing up for Door County Visitor!

We're building the most comprehensive guide to Door County, Wisconsin -
featuring the best places to stay, eat, shop, and explore.

We'll send you one email when we launch. That's it - no spam.

See you soon,
The Door County Visitor Team
```

---

### Workflow 2: Business Lead Welcome

**Trigger:** Tag Added = `business-lead`

**Actions:**
1. Wait 1 minute
2. Send Email:

```
Subject: We received your listing request

Hi {{contact.first_name}},

Thanks for your interest in listing {{contact.company_name}} on Door County Visitor!

We're building the premier directory for Door County businesses, and we'd love
to feature your business.

Here's what happens next:
1. We'll review your request within 24 hours
2. We'll reach out to verify your business details
3. Your free listing will go live when we launch

Have questions? Just reply to this email.

Best,
The Door County Visitor Team
```

3. **Optional:** Add internal notification
   - Send Email to: your email address
   - Subject: "New Business Lead: {{contact.company_name}}"
   - Body: Business details for follow-up

---

## Step 4: Create the Landing Page

### Option A: Use GHL Page Builder

1. Go to **Sites > Funnels** (or Websites)
2. Create new funnel/page
3. Use the design from `docs/ghl-landing-page.html` as reference
4. Embed your GHL forms in the appropriate sections

### Option B: Custom HTML Page

1. Go to **Sites > Funnels**
2. Create new funnel with blank template
3. Add a "Custom HTML" element
4. Paste the contents of `docs/ghl-landing-page.html`
5. Replace the placeholder forms with GHL form embed codes

To get form embed code:
1. Go to **Sites > Forms**
2. Click on your form
3. Click "Embed" or "Share"
4. Copy the embed code (iframe or inline)

---

## Step 5: Connect Your Domain

1. Go to **Settings > Domains**
2. Add `doorcountyvisitor.com`
3. Update DNS records as directed by GHL
4. Assign domain to your landing page

---

## Step 6: Test Everything

1. Submit test entries to both forms
2. Verify contacts are created with correct tags
3. Confirm email automations trigger
4. Check mobile responsiveness

---

## Quick Reference

| Item | Value |
|------|-------|
| Location ID | `a1pjpfTVaYjMD8QJgINa` |
| Visitor Tag | `launch-notify` |
| Business Tag | `business-lead` |
| Visitor Source | `Landing Page - Visitor` |
| Business Source | `Landing Page - Business` |

---

## When Ready to Launch

1. Update DNS to point to Vercel instead of GHL
2. The GHL forms will continue to work via embed or API
3. Consider keeping the landing page as a backup/redirect
