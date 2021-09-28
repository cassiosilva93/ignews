import Head from 'next/head';
import { GetStaticProps } from 'next';
import { SubscribeButton } from '../components/SubscribeButton';
import styles from './home.module.scss';
import { stripe } from '../service/stripe';
import { formatPrice } from '../utils/format';

interface HomeProps {
  product: {
    priceId: string;
    amount: number;
  }
}

export default function Home({ product }: HomeProps) {
  return (
    <>
      <Head>
          <title>Home | ig.news</title>
      </Head>

      <main className={styles.contentContainer}>
        <section className={styles.hero}>
          <span>👏 Hey, welcome</span>
          <h1>New about the <span>React</span> world.</h1>
          <p>
            Get acess to all the publications <br />
            <span>for {product.amount} month</span>
          </p>

          <SubscribeButton priceId={product.priceId}/>
        </section>

        <img src="/images/avatar.svg" alt="Girl coding" />
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps  = async () => {
  const price = await stripe.prices.retrieve('price_1Jdy7hGlTG1cEOOqpDcWrAUo')

  const product = {
    priceId: price.id,
    amount: formatPrice(price.unit_amount / 100),
  }

  return {
    props: {
      product
    }, 
    revalidate: 60 * 60 * 24, // 24 hours
  }
}