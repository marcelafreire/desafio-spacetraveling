import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';
import { format } from 'date-fns';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { ptBR } from 'date-fns/locale';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  console.log(post);
  const router = useRouter();

  const readableDate = format(
    new Date(post.first_publication_date),
    `dd MMM yyyy`,
    { locale: ptBR }
  );

  const timetoRead = post.data.content.reduce((acc, content) => {
    const headingWords = content.heading.split(' ');
    const bodyWords = RichText.asText(content.body).split(' ');
    acc += headingWords.length;
    acc += bodyWords.length;

    return acc;
  }, 0);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      {
        <main className={styles.contetnContainer} >
          <figure>
            <img src={post.data.banner.url} className={styles.banner} />
          </figure>
          <div className={styles.post}>
            <h1>{post.data.title}</h1>

            <div className={styles.infosContainer}>
              <div className={styles.infos}>
                <FiCalendar />
                <time>{readableDate}</time>
              </div>
              <div className={styles.infos}>
                <FiUser />
                <p>{post.data.author}</p>
              </div>
              <div className={styles.infos}>
                <FiClock />
                <p>{Math.ceil(timetoRead / 200)} min </p>
              </div>
            </div>
            {post.data.content.map(contentPost => (
              <div key={contentPost.heading}>
                <h2>{contentPost.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(contentPost.body),
                  }}
                />
              </div>
            ))}
          </div>
        </main>
      }
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post'),
  ]);

  const params = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths: params,
    fallback: true,
  };
};
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const contents = response.data.content.map(content => {
    const contentObj = {};
    let bodies = [];
    Object.assign(contentObj, { heading: content.heading });

    bodies = content.body.map(item => {
      return {
        ...item,
      };
    });

    Object.assign(contentObj, { body: bodies });
    return contentObj;
  });

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: contents,
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
