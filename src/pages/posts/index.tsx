import { GetStaticProps } from 'next';
import Head from 'next/head';
import { getPrismicClient } from '../../service/prismic';
import { RichText } from 'prismic-dom'
import Prismic from '@prismicio/client';
import Link from 'next/link';
import styles from './styles.module.scss'

type Post = {
  slug: string;
  title: string;
  abstract: string;
  updatedAt: string;
}

interface PostsProps {
  posts: Post[]
}

export default function Posts({ posts }: PostsProps) {
  return (
    <>
      <Head>
        <title>Posts | ig.news</title>
      </Head>

      <main className={styles.container}>
        <div className={styles.posts}>
          { posts.map(post => (
              <Link href={`/posts/${post.slug}`} key={post.slug}>
                <a key={post.slug}>
                  <time>{post.updatedAt}</time>
                  <strong>{post.title}</strong>
                  <p>{post.abstract}</p>
                </a>
              </Link>
            )
          )}
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient()

  const response = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.content'],
    pageSize: 100,
  })

  const posts = response.results.map(post => {
    const absctract = post.data.content.find(content => content.type === 'paragraph')?.text ?? '';

    const dateFormatted = new Date(post.last_publication_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })

    return {
      slug: post.uid,
      title: RichText.asText(post.data.title),
      abstract: absctract,
      updatedAt: dateFormatted,
    }
  });
  
  return {
    props: {
      posts
    }
  }
}