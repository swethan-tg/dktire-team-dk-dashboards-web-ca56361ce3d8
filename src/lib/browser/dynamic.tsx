import { ComponentType, Suspense, lazy } from 'react';

type Loader<T extends ComponentType<any>> = () => Promise<{ default: T } | T>;

export default function dynamic<T extends ComponentType<any>>(
  loader: Loader<T>,
  options?: { loading?: ComponentType; ssr?: boolean }
) {
  const LazyComponent = lazy(async () => {
    const mod = await loader();
    return typeof mod === 'function' ? { default: mod } : mod;
  });

  return function DynamicComponent(props: React.ComponentProps<T>) {
    const Loading = options?.loading;

    return (
      <Suspense fallback={Loading ? <Loading /> : null}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
