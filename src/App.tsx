import React, { Component, Suspense, lazy, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { ConsentProvider, useConsent } from './context/ConsentContext';
import { AuthLeadGateModal } from './components/AuthLeadGateModal';
import { BreadcrumbNav } from './components/BreadcrumbNav';
import { CartDrawer } from './components/CartDrawer';
import { ConsentBanner } from './components/ConsentBanner';
import { Footer, HeaderShell, MobileBottomNav, SearchModal } from './components/NavbarAndFooter';
import { initTelemetryObservers } from './utils/telemetry';

const HomeView = lazy(() => import('./views/HomeView').then((m) => ({ default: m.HomeView })));
const ShopView = lazy(() => import('./views/ShopView').then((m) => ({ default: m.ShopView })));
const ProductView = lazy(() => import('./views/ProductView').then((m) => ({ default: m.ProductView })));
const CheckoutView = lazy(() =>
  import('./views/CheckoutAndAccountView').then((m) => ({ default: m.CheckoutView }))
);
const AccountView = lazy(() =>
  import('./views/CheckoutAndAccountView').then((m) => ({ default: m.AccountView }))
);
const WishlistView = lazy(() => import('./views/WishlistView').then((m) => ({ default: m.WishlistView })));
const B2BView = lazy(() => import('./views/B2BView').then((m) => ({ default: m.B2BView })));
const BlogView = lazy(() => import('./views/ContentViews').then((m) => ({ default: m.BlogView })));
const AboutView = lazy(() => import('./views/ContentViews').then((m) => ({ default: m.AboutView })));
const AdminView = lazy(() => import('./views/AdminView').then((m) => ({ default: m.AdminView })));
const LegalDocView = lazy(() => import('./views/LegalViews').then((m) => ({ default: m.LegalDocView })));
const TrackOrderView = lazy(() =>
  import('./views/TrackOrderView').then((m) => ({ default: m.TrackOrderView }))
);

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    fetch('/api/telemetry/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message || 'Render boundary caught error',
        route: `${window.location.pathname} (${info.componentStack?.slice(0, 120) || ''})`,
      }),
    }).catch(() => {});
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-[var(--rh-bg)] text-[var(--rh-ink)] space-y-4">
          <h1 className="font-display text-2xl font-bold">Something interrupted the Haveli view</h1>
          <p className="text-sm text-[var(--rh-ink-muted)] max-w-md">
            Your shopping bag and preferences remain safely saved. Reload to continue.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 min-h-[44px] rounded-lg bg-[var(--rh-primary)] text-white text-sm font-semibold cursor-pointer"
          >
            Reload Storefront
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function NotFoundView({ path }: { path: string }) {
  const { navigate } = useStore();
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
      <p className="text-xs font-mono-num uppercase tracking-wider text-[var(--rh-primary)]">404 · Not Found</p>
      <h1 className="font-display text-3xl font-bold">We could not find &ldquo;{path}&rdquo;</h1>
      <p className="text-sm text-[var(--rh-ink-muted)]">
        Return to the Hawa Mahal courtyard or explore our handcrafted Rajasthani collections.
      </p>
      <div className="flex justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate({ page: 'home' })}
          className="px-5 min-h-[42px] text-xs font-semibold rounded-lg bg-[var(--rh-primary)] text-white cursor-pointer"
        >
          Back to Haveli Home
        </button>
        <button
          type="button"
          onClick={() => navigate({ page: 'shop' })}
          className="px-5 min-h-[42px] text-xs font-semibold rounded-lg border border-[var(--rh-border)] cursor-pointer"
        >
          Open Shop
        </button>
      </div>
    </div>
  );
}

function AppShell() {
  const { route, toast } = useStore();
  const { consent } = useConsent();

  useEffect(() => {
    const cleanup = initTelemetryObservers(() => Boolean(consent?.analytics));
    return cleanup;
  }, [consent?.analytics]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--rh-bg)] text-[var(--rh-ink)] transition-colors duration-200">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[var(--rh-primary)] focus:text-white focus:text-xs focus:font-semibold"
      >
        Skip to main content
      </a>

      <HeaderShell />
      <BreadcrumbNav />
      <SearchModal />
      <CartDrawer />
      <AuthLeadGateModal />

      <main id="main-content" className="flex-1">
        <Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-[var(--rh-ink-muted)]">
              Opening Rangrez Haveli…
            </div>
          }
        >
          {route.page === 'home' && <HomeView />}
          {route.page === 'shop' && <ShopView />}
          {route.page === 'product' && <ProductView slug={route.slug} />}
          {route.page === 'checkout' && <CheckoutView />}
          {route.page === 'wishlist' && <WishlistView sharedIds={route.sharedIds} />}
          {route.page === 'account' && <AccountView />}
          {route.page === 'b2b' && <B2BView />}
          {route.page === 'blog' && <BlogView activeSlug={route.slug} />}
          {route.page === 'about' && <AboutView />}
          {route.page === 'admin' && <AdminView />}
          {route.page === 'track-order' && <TrackOrderView />}
          {route.page === 'legal' && <LegalDocView doc={route.doc} />}
          {route.page === 'not-found' && <NotFoundView path={route.path} />}
        </Suspense>
      </main>

      <Footer />
      <MobileBottomNav />
      <ConsentBanner />

      {toast && (
        <div
          role="status"
          className="fixed bottom-16 md:bottom-6 left-3 right-3 sm:left-auto sm:right-4 z-[60] px-4 py-3 rounded-xl bg-[#2A1410] dark:bg-[#1E2549] text-[#FBF3E4] border border-[#C9A227]/50 text-xs sm:text-sm font-medium shadow-xl text-center sm:text-left"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <ConsentProvider>
        <StoreProvider>
          <AppShell />
        </StoreProvider>
      </ConsentProvider>
    </AppErrorBoundary>
  );
}
