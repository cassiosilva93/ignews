import { fauna } from "../../../service/fauna";
import { query } from "faunadb";
import { stripe } from "../../../service/stripe";

export async function saveSubscription(
  subscriptionId: string, 
  customerId: string,
  createAction = false
) {
  const userRef = await fauna.query(
    query.Select(
      'ref',
      query.Get(
        query.Match(
          query.Index('user_by_stripe_customer_id'),
          customerId
        )
      )
    )
  )

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const subscriptionData = {
    id: subscription.id,
    userId: userRef,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
  }

  if (createAction) {
    const createSubscription = await fauna.query(
      query.Create(
        query.Collection('subscriptions'),
        { data: subscriptionData }
      )
    )

    return createSubscription;
  }

  const updateSubscription = await fauna.query(
    query.Replace(
      query.Select(
        "ref",
        query.Get(
          query.Match(
            query.Index('subscription_by_id'),
            subscriptionId
          )
        )
      ),
      { data: subscriptionData }
    )
  )

  return updateSubscription;
}