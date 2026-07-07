import ProductModernCard from '@core/components/cards/product-modern-card';
import { similarProducts } from '@/data/similar-products-data';
import { routes } from '@/config/routes';
import { Title } from 'rizzui';

export default function ProductDetailsRelatedProducts() {
  return (
    <section className="mt-10 @container">
      <Title as="h3" className="mb-5 text-lg font-semibold">
        Related Products
      </Title>
      <div className="grid grid-cols-1 gap-5 @sm:grid-cols-2 @2xl:grid-cols-3 @5xl:grid-cols-4">
        {similarProducts.slice(0, 4).map((product) => (
          <ProductModernCard key={product.id} product={product} routes={routes} />
        ))}
      </div>
    </section>
  );
}
