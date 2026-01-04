// src/pages/api/contact.ts
// API endpoint for contact form submissions

import type { APIRoute } from 'astro';
import { submitContactForm, submitNewsletterSignup, submitListingClaim } from '../../lib/ghl';

export const prerender = false;

interface ContactFormData {
  type: 'contact' | 'newsletter' | 'claim';
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  message?: string;
  subject?: string;
  businessName?: string;
  businessSlug?: string;
  smsConsent?: boolean;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data: ContactFormData = await request.json();

    // Validate required fields
    if (!data.email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email address' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let contact;

    switch (data.type) {
      case 'newsletter':
        contact = await submitNewsletterSignup(data.email, data.firstName);
        break;

      case 'claim':
        if (!data.businessName || !data.businessSlug) {
          return new Response(
            JSON.stringify({ success: false, error: 'Business information is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (!data.phone) {
          return new Response(
            JSON.stringify({ success: false, error: 'Phone number is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (!data.smsConsent) {
          return new Response(
            JSON.stringify({ success: false, error: 'SMS consent is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        contact = await submitListingClaim({
          firstName: data.firstName || 'Business Owner',
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          businessName: data.businessName,
          businessSlug: data.businessSlug,
          smsConsent: data.smsConsent,
        });
        break;

      case 'contact':
      default:
        if (!data.firstName) {
          return new Response(
            JSON.stringify({ success: false, error: 'First name is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        contact = await submitContactForm({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          message: data.message,
          subject: data.subject,
        });
        break;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Thank you! We\'ll be in touch soon.',
        contactId: contact.id,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Contact form error:', error);

    // Check if GHL is not configured
    if (error instanceof Error && error.message.includes('environment variables are required')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Contact form is not configured. Please try again later.',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Something went wrong. Please try again.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
