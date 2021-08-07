import { GetStaticProps } from 'next';

import { getPrismicClient } from '../services/prismic';
import Prismic from "@prismicio/client";

import commonStyles from '../styles/common.module.scss';
import Head from 'next/head'
import { Header } from '../components/Header'
import { FiCalendar, FiUser } from 'react-icons/fi';

import styles from './home.module.scss';
import Link from "next/link";
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps ) {
  const [posts, setPosts] = useState<PostPagination>(postsPagination);

  const handleLoadPosts = () => {
    fetch(posts.next_page)
    .then(response => response.json())
    .then(data => {
     const resultsFromatted = data.results.map(post => ({
        uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        { locale: ptBR }
      ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author:  post.data.author
        },
      }));

      setPosts({
        next_page: data.next_page,
        results: [...posts.results, ...resultsFromatted],
      })
    });
  }

  return (
    <>
      <Head>
      <title>Home | Spacetraveling</title>
      </Head>

      <main className={styles.contentContainer}>
        {posts.results.map((post) => (
          <div className={styles.posts} key={post.uid}>
            <Link href={`post/${post.uid}`}>
              <a href="#">
                <h2>{post.data.title}</h2>
                <p>{post.data.subtitle}</p>
                <div className={styles.infosContainer}>
                  <div className={styles.infos}>
                    <FiCalendar />
                    <time>
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      { locale: ptBR }
                    )}
                  </time>
                 </div>
                  <div className={styles.infos}>
                    <FiUser />
                    <p>{post.data.author}</p>
                  </div>
               </div>
              </a>
            </Link>
          </div>
        ))}
        {posts.next_page &&
        <button
        onClick={handleLoadPosts}
          >Carregar mais posts
        </button>
        }
      </main>
    </>
  )
}

export const getStaticProps:GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    [Prismic.predicates.at("document.type", "posts")],
    {
      pageSize: 2,
      orderings: '[document.last_publication_date desc]',
    }
  );
  const next_page = response.next_page;
  const results = response.results.map((post) => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author:  post.data.author
      },
    };
  });
  return {
    props: {
      postsPagination : {
        results,
        next_page,
      },
    },
  };
};
