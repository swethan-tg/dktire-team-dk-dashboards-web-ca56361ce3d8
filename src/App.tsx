import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppReduxProvider, ThemeProvider } from '@/app/shared/theme-provider';
import GlobalDrawer from '@/app/shared/drawer-views/container';
import GlobalModal from '@/app/shared/modal-views/container';
import HydrogenRouteLayout from '@/app/(hydrogen)/layout';
import OtherPagesLayout from '@/app/(other-pages)/layout';
import MultiStepLayout from '@/app/multi-step/layout';
import MultiStep2Layout from '@/app/multi-step-2/layout';

type PageModule = {
  default: React.ComponentType;
};

const pageModules = import.meta.glob<PageModule>('./app/**/page.tsx');

function toRoutePath(filePath: string) {
  const withoutPrefix = filePath
    .replace('./app/', '')
    .replace(/\/page\.tsx$/, '')
    .replace(/\\/g, '/');

  const segments = withoutPrefix
    .split('/')
    .filter((segment) => !segment.startsWith('(') || !segment.endsWith(')'))
    .map((segment) => {
      if (segment.startsWith('[') && segment.endsWith(']')) {
        return `:${segment.slice(1, -1).replace('...', '')}`;
      }
      return segment;
    })
    .filter(Boolean);

  return `/${segments.join('/')}`.replace(/\/$/, '') || '/';
}

function withRouteLayout(filePath: string, page: React.ReactNode) {
  if (filePath.includes('/(hydrogen)/')) {
    return <HydrogenRouteLayout>{page}</HydrogenRouteLayout>;
  }

  if (filePath.includes('/(other-pages)/')) {
    return <OtherPagesLayout>{page}</OtherPagesLayout>;
  }

  if (filePath.includes('/multi-step/')) {
    return <MultiStepLayout>{page}</MultiStepLayout>;
  }

  if (filePath.includes('/multi-step-2/')) {
    return <MultiStep2Layout>{page}</MultiStep2Layout>;
  }

  return page;
}

const routes = Object.entries(pageModules)
  .map(([filePath, loader]) => {
    const Page = lazy(loader);
    return {
      filePath,
      path: toRoutePath(filePath),
      element: withRouteLayout(
        filePath,
        <Suspense fallback={null}>
          <Page />
        </Suspense>
      ),
    };
  })
  .sort((a, b) => b.path.length - a.path.length);

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppReduxProvider>
          <Routes>
            {routes.map((route) => (
              <Route
                key={`${route.filePath}:${route.path}`}
                path={route.path}
                element={route.element}
              />
            ))}
            <Route path="/signin" element={<Navigate to="/auth/sign-in-1" replace />} />
            <Route path="*" element={<Navigate to="/not-found" replace />} />
          </Routes>
          <Toaster />
          <GlobalDrawer />
          <GlobalModal />
        </AppReduxProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
