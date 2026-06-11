import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

import { getPostBySlug, getRelatedPosts } from '@/services/postService';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Bài viết không tồn tại' };

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || undefined,
      images: post.thumbnailUrl ? [{ url: post.thumbnailUrl }] : [],
    },
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { slug } = await params;
  const [post, relatedPosts] = await Promise.all([
    getPostBySlug(slug),
    getRelatedPosts(slug, 3),
  ]);

  if (!post) notFound();

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  return (
    
      <main className="hs-container hs-page-main">
        <nav className="hs-breadcrumb">
          <Link href="/">Trang chủ</Link>
          <span className="hs-breadcrumb-sep">/</span>
          <Link href="/news">Tin tức</Link>
          <span className="hs-breadcrumb-sep">/</span>
          <span className="hs-breadcrumb-current">{post.title}</span>
        </nav>

        <article className="hs-post-detail">
          <header className="hs-post-detail-header">
            <h1>{post.title}</h1>
            <div className="hs-post-detail-meta">
              {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
              {typeof post.viewCount === 'number' && (
                <span>{post.viewCount} lượt xem</span>
              )}
            </div>
          </header>

          {post.thumbnailUrl && (
            <div className="hs-post-detail-hero">
              <img src={post.thumbnailUrl} alt={post.title} />
            </div>
          )}

          {post.excerpt && (
            <p className="hs-post-detail-excerpt">{post.excerpt}</p>
          )}

          {post.content && (
            <div
              className="hs-post-detail-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}
        </article>

        {relatedPosts.length > 0 && (
          <section className="hs-post-detail-related">
            <h2>Bài viết liên quan</h2>
            <div className="hs-news-grid">
              {relatedPosts.map((rp) => (
                <Link key={rp.id} href={`/news/${rp.slug}`} className="hs-news-card">
                  <div className="hs-news-card-image">
                    {rp.thumbnailUrl ? (
                      <img src={rp.thumbnailUrl} alt={rp.title} />
                    ) : (
                      <div className="hs-news-card-placeholder">Tin tức</div>
                    )}
                  </div>
                  <div className="hs-news-card-body">
                    <h3>{rp.title}</h3>
                    {rp.excerpt && <p className="hs-news-card-excerpt">{rp.excerpt}</p>}
                    <div className="hs-news-card-meta">
                      <span>{formatDate(rp.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    
  );
}
