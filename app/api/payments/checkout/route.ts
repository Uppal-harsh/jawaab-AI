import { NextResponse } from 'next/server';
import { stripe } from '../../../../lib/stripe';

// Validator helper
function isAuthorized(req: Request): boolean {
  const cookie = req.headers.get('cookie') || '';
  return cookie.includes('jawaab_admin_session=authenticated_token_active');
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId, tierName, billingPeriod, region } = await req.json();

    if (!userId || !tierName || !billingPeriod || !region) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Determine currency code
    let currency = 'inr';
    if (region === 'US') currency = 'usd';
    if (region === 'EU') currency = 'eur';

    // Calculate dynamic price amount in cents based on requested plans
    let amountInCents = 0;
    const isAnnual = billingPeriod === 'annual';

    if (tierName === 'Starter') {
      if (region === 'IN') {
        amountInCents = isAnnual ? 639 * 12 * 100 : 799 * 100;
      } else if (region === 'US') {
        amountInCents = isAnnual ? Math.round(11.99 * 12 * 100) : Math.round(14.99 * 100);
      } else {
        amountInCents = isAnnual ? Math.round(11.99 * 12 * 100) : Math.round(14.99 * 100); // EU
      }
    } else if (tierName === 'Growth') {
      if (region === 'IN') {
        amountInCents = isAnnual ? 1199 * 12 * 100 : 1499 * 100;
      } else if (region === 'US') {
        amountInCents = isAnnual ? Math.round(27.99 * 12 * 100) : Math.round(34.99 * 100);
      } else {
        amountInCents = isAnnual ? Math.round(27.99 * 12 * 100) : Math.round(34.99 * 100); // EU
      }
    } else {
      return NextResponse.json({ error: 'Invalid tier specified' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: `Jawaab AI - ${tierName} Plan (${isAnnual ? 'Annual' : 'Monthly'})`,
              description: `Automated WhatsApp Assistant & CRM services - ${tierName} Tier`,
            },
            unit_amount: amountInCents,
            recurring: {
              interval: isAnnual ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/dashboard?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?payment_cancelled=true`,
      metadata: {
        userId: userId,
        tierName: tierName,
        billingPeriod: billingPeriod,
        region: region,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[Stripe Checkout Session Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to create payment session' }, { status: 500 });
  }
}
