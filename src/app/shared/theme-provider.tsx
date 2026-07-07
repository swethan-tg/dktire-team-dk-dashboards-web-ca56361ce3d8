'use client';

import { ReduxProvider } from '@/store/react-redux-atoms';
import { siteConfig } from '@/config/site.config';
// import hideRechartsConsoleError from '@core/utils/recharts-console-error';
import { ThemeProvider as NextThemeProvider } from 'next-themes';

// hideRechartsConsoleError();

export function ThemeProvider({ children }: React.PropsWithChildren<{}>) {
  return (
    <NextThemeProvider
      enableSystem={false}
      themes={['light', 'dark']}
      defaultTheme={String(siteConfig.mode)}
    >
      {children}
    </NextThemeProvider>
  );
}

export function AppReduxProvider({ children }: React.PropsWithChildren<{}>) {
  return <ReduxProvider>{children}</ReduxProvider>;
}
