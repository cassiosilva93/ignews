import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from 'stream';
import Stripe from 'stripe';
import { stripe } from '../../service/stripe';
import { saveSubscription } from "./_lib/manageSubscription";

let event: Stripe.Event;

const buffer = async (readable: Readable) => {
  const chunks = [];

  for await (const chunk of readable) {
    const bufferChecked = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    chunks.push(bufferChecked)
  }

  return Buffer.concat(chunks);
}

const manageEvents = async (type: string) => {
  switch (type) {
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      
      await saveSubscription(
        subscription.id,
        subscription.customer.toString(),
        false
      )
      break;
    case 'checkout.session.completed':
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      
      await saveSubscription(
        checkoutSession.subscription.toString(),
        checkoutSession.customer.toString(),
        true
      )
      break;
    default:
      throw new Error('Unhandled event.')
  }
}

export const config = {
  api: {
    bodyParser: false
  }
}

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
])

export default async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method !== 'POST') {
    response.setHeader("Allow", "POST");
    return response.status(405).end("Method not allowed.");
  }

  const buf = await buffer(request);
  const secret = request.headers['stripe-signature']

  try {
    event = stripe.webhooks.constructEvent(buf, secret, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    return response.status(400).send(`Webhooks error: ${error.message}`)
  }

  const { type } = event;

  if (relevantEvents.has(type)) {
    try {
      manageEvents(type)
    } catch (error) {
      return response.json({ error: 'Webhook handler failed.' })
    }
  }

  return response.json({ received: true });
}