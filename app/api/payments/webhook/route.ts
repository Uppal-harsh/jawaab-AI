import { NextResponse } from 'next/server';
import { stripe } from '../../../../lib/stripe';
import { supabaseAdmin } from '../../../../lib/supabase';

// Disable default Next.js bodyParser for webhook raw verification
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') || '';

  let event;
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook Signature Verification Failed]:`, err.message);
    return NextResponse.json({ error: `Webhook Signature Verification Failed: ${err.message}` }, { status: 400 });
  }

  try {
    console.log(`[Stripe Webhook] Received Event:`, event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const metadata = session.metadata || {};
        const userId = metadata.userId;
        const tierName = metadata.tierName;
        const region = metadata.region;

        if (userId) {
          const subscriptionId = session.subscription;
          let currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

          // Retrieve active subscription period from Stripe
          if (subscriptionId) {
            try {
              const subObj = await stripe.subscriptions.retrieve(subscriptionId);
              currentPeriodEnd = new Date((subObj as any).current_period_end * 1000).toISOString();
            } catch (retrieveErr) {
              console.error('[Stripe Webhook] Failed to retrieve subscription details:', retrieveErr);
            }
          }

          // Update subscriptions table
          const { error: upsertErr } = await supabaseAdmin
            .from('subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: session.customer,
              stripe_subscription_id: subscriptionId,
              plan_name: tierName,
              status: 'active',
              currency: session.currency?.toUpperCase() || 'INR',
              current_period_end: currentPeriodEnd,
            }, { onConflict: 'user_id' });

          if (upsertErr) {
            console.error('[Stripe Webhook] Database upsert error:', upsertErr);
          } else {
            console.log(`[Stripe Webhook] Subscribed user ${userId} to ${tierName} plan successfully.`);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const status = subscription.status;
        const subscriptionId = subscription.id;
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

        const { error: updateErr } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: status,
            current_period_end: currentPeriodEnd,
          })
          .eq('stripe_subscription_id', subscriptionId);

        if (updateErr) {
          console.error('[Stripe Webhook] Database update error on sub update:', updateErr);
        } else {
          console.log(`[Stripe Webhook] Subscription ${subscriptionId} status updated to ${status}.`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const subscriptionId = subscription.id;

        const { error: deleteErr } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
          })
          .eq('stripe_subscription_id', subscriptionId);

        if (deleteErr) {
          console.error('[Stripe Webhook] Database status update on sub cancel error:', deleteErr);
        } else {
          console.log(`[Stripe Webhook] Subscription ${subscriptionId} status set to canceled.`);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[Stripe Webhook Handler Error]:', err);
    return NextResponse.json({ error: 'Webhook processing error occurred' }, { status: 500 });
  }
}
