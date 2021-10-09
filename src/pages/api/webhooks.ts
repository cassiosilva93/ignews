import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from 'stream';
import Stripe from 'stripe';
import { stripe } from '../../service/stripe';

const buffer = async (readable: Readable) => {
  const chunks = [];

  for await (const chunk of readable) {
    const bufferChecked = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    chunks.push(bufferChecked)
  }

  return Buffer.concat(chunks);
}

export const config = {
  api: {
    bodyParser: false
  }
}

const relevantEvents = new Set([
  'checkout.session.completed'
])

export default async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method === 'POST') {
    const buf = await buffer(request);
    const secret = request.headers['stripe-signature']

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, secret, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (error) {
      return response.status(400).send(`Webhooks error: ${error.message}`)
    }

    const { type } = event;

    if (relevantEvents.has(type)) {
      console.log('event: ', event);
    }

    return response.json({ received: true });
  }

  response.setHeader("Allow", "POST");
  response.status(405).end("Method not allowed.");
}