interface CategoryCardProps {
  name: string;
  image: string;
  slug: string;
}

export function CategoryCard({ name, image, slug }: CategoryCardProps) {
  return (
    <a href={`/products?category=${slug}`} className="category-card">
      <img src={image} alt={name} />
      <b>{name}</b>
    </a>
  );
}
