import Link from 'next/link';
import { CalendarDays, ChevronRight, Newspaper } from 'lucide-react';
import SiteShell from '@/components/shared/SiteShell';
import { getPublishedPosts, Post } from '@/services/postService';
import { unwrapApiList } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  const result = await getPublishedPosts({ limit: 12 });
  const posts = unwrapApiList<Post>(result);

  return (
    <SiteShell>
      <main className="hs-container hs-page-main">
        <div className="hs-breadcrumb">
          <Link href="/">Trang chủ</Link>
          <ChevronRight size={14} />
          <span>Tin tức</span>
        </div>

        <section className="hs-page-toolbar">
          <div>
            <h1>Tin tức</h1>
            <p>Các bài viết đã xuất bản từ hệ thống quản trị</p>
          </div>
        </section>

        {posts.length === 0 ? (
          <div className="hs-empty-state">
            <Newspaper size={48} strokeWidth={1.2} />
            <h2>Chưa có bài viết xuất bản</h2>
            <p>Draft hoặc hidden sẽ không hiển thị ở trang công khai.</p>
          </div>
        ) : (
          <div className="hs-products-grid">
            {posts.map((post) => (
              <article className="adm-card" key={post.id}>
                {post.thumbnailUrl && (
                  <Link href={`/news/${post.slug}`} style={{ display: 'block', marginBottom: 14 }}>
                    <img
                      src={post.thumbnailUrl}
                      alt={post.title}
                      style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 8 }}
                    />
                  </Link>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
                  <CalendarDays size={14} />
                  <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <h2 style={{ fontSize: 20, lineHeight: 1.3, marginBottom: 8 }}>
                  <Link href={`/news/${post.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {post.title}
                  </Link>
                </h2>
                {post.excerpt && <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{post.excerpt}</p>}
                <Link href={`/news/${post.slug}`} className="hs-section-link" style={{ marginTop: 14 }}>
                  Đọc tiếp <ChevronRight size={14} />
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
    </SiteShell>
  );
}
