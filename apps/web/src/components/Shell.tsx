import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppIcon, PRICE_ICON } from './icons';

function roleLabel(role: string) {
  if (role === 'admin')  return 'Quản trị';
  if (role === 'seller') return 'Người bán';
  return 'Người mua';
}

function roleBadgeClass(role: string) {
  if (role === 'admin')  return 'bg-amber-100 text-amber-800';
  if (role === 'seller') return 'bg-purple-100 text-purple-800';
  return 'bg-brand-100 text-brand-700';
}

function navLinkClass(isActive: boolean, isAdmin = false) {
  const base = 'relative rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 ';
  if (isAdmin) {
    return base + (isActive
      ? 'bg-amber-100 text-amber-900'
      : 'text-amber-800/80 hover:bg-amber-50 hover:text-amber-900');
  }
  return base + (isActive
    ? 'bg-brand-100 text-brand-800'
    : 'text-ink/70 hover:bg-brand-50 hover:text-brand-800');
}

function UserAvatar({ name, role }: { name: string; role: string }) {
  const initials = name
    .split(' ')
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  const bgMap: Record<string, string> = {
    admin:  'from-amber-400 to-orange-400',
    seller: 'from-purple-400 to-violet-500',
    buyer:  'from-brand-400 to-brand-600',
  };
  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${bgMap[role] ?? bgMap.buyer} text-xs font-bold text-white shadow-sm`}>
      {initials || '?'}
    </span>
  );
}

export function Shell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  function handleLogout() {
    logout();
    setMobileOpen(false);
    navigate('/', { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-700">
        Bỏ qua điều hướng
      </a>
      {/* ── Header ─────────────────────────────────── */}
      <header className="sticky top-0 z-40 glass border-b border-white/50 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">

          {/* Logo */}
          <Link to="/" className="group flex items-center gap-2.5 shrink-0" onClick={() => setMobileOpen(false)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-md shadow-brand-500/30 transition-transform group-hover:scale-105">
              <AppIcon name="racing" size="sm" alt="Car Marketplace" className="brightness-0 invert" />
            </span>
            <div className="hidden sm:block leading-tight">
              <span className="font-display text-[1.05rem] font-bold tracking-tight text-brand-900">Car Marketplace</span>
              <span className="block text-[0.7rem] text-muted">Buy Sell Cars in one place</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={({ isActive }) => navLinkClass(isActive)} end>Find a car</NavLink>
            {user && (
              <>
                <NavLink to="/favorites" className={({ isActive }) => navLinkClass(isActive)}>Saved</NavLink>
                {user.role === 'seller' && (
                  <>
                    <NavLink to="/seller/listings"    className={({ isActive }) => navLinkClass(isActive)}>Tin của tôi</NavLink>
                    <NavLink to="/seller/orders"      className={({ isActive }) => navLinkClass(isActive)}>
                      <span className="inline-flex items-center gap-1.5">
                        <AppIcon name={PRICE_ICON} size="xs" alt="" /> Payments
                      </span>
                    </NavLink>
                    <NavLink to="/seller/listing/new" className={({ isActive }) => navLinkClass(isActive)}>Sell my car</NavLink>
                  </>
                )}
                {user.role === 'admin' && (
                  <>
                    <NavLink to="/admin/dashboard" className={({ isActive }) => navLinkClass(isActive, true)}>Revenue</NavLink>
                    <NavLink to="/admin/moderation" className={({ isActive }) => navLinkClass(isActive, true)}>Moderation</NavLink>
                    <NavLink to="/admin/car-makes" className={({ isActive }) => navLinkClass(isActive, true)}>Car makes</NavLink>
                    <NavLink to="/admin/sold" className={({ isActive }) => navLinkClass(isActive, true)}>Đã bán</NavLink>
                  </>
                )}
              </>
            )}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link to="/profile" className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-brand-50 transition-colors">
                  <UserAvatar name={user.fullName || user.phone} role={user.role} />
                  <div className="hidden lg:block text-right leading-tight">
                    <span className="block text-sm font-semibold text-ink truncate max-w-[9rem]">{user.fullName || user.phone}</span>
                    <span className={`badge text-[0.65rem] mt-0.5 ${roleBadgeClass(user.role)}`}>{roleLabel(user.role)}</span>
                  </div>
                </Link>
                <button type="button" onClick={handleLogout} className="btn btn-secondary py-1.5 px-3 text-sm">
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn btn-ghost   py-1.5 px-3 text-sm">Đăng nhập</Link>
                <Link to="/register" className="btn btn-primary py-1.5 px-4 text-sm">Đăng ký</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-brand-50 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-main-menu"
          >
            <span className={`block h-0.5 w-5 bg-ink/70 rounded transition-all duration-300 ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-5 bg-ink/70 rounded transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-5 bg-ink/70 rounded transition-all duration-300 ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div id="mobile-main-menu" className="md:hidden border-t border-brand-100/60 bg-white/95 backdrop-blur-md px-4 pb-4 pt-3 animate-slide-down">
            <nav className="flex flex-col gap-1">
              <NavLink to="/" className={({ isActive }) => navLinkClass(isActive) + ' block'} end onClick={() => setMobileOpen(false)}>Find a car</NavLink>
              {user && (
                <>
                  <NavLink to="/favorites"          className={({ isActive }) => navLinkClass(isActive) + ' block'} onClick={() => setMobileOpen(false)}>Saved</NavLink>
                  {user.role === 'seller' && (
                    <>
                      <NavLink to="/seller/listings"    className={({ isActive }) => navLinkClass(isActive) + ' block'} onClick={() => setMobileOpen(false)}>Tin của tôi</NavLink>
                      <NavLink to="/seller/orders"      className={({ isActive }) => navLinkClass(isActive) + ' block'} onClick={() => setMobileOpen(false)}>
                        <span className="inline-flex items-center gap-1.5">
                          <AppIcon name={PRICE_ICON} size="xs" alt="" /> Payments
                        </span>
                      </NavLink>
                      <NavLink to="/seller/listing/new" className={({ isActive }) => navLinkClass(isActive) + ' block'} onClick={() => setMobileOpen(false)}>Sell my car</NavLink>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <NavLink to="/admin/dashboard" className={({ isActive }) => navLinkClass(isActive, true) + ' block'} onClick={() => setMobileOpen(false)}>Revenue</NavLink>
                      <NavLink to="/admin/moderation" className={({ isActive }) => navLinkClass(isActive, true) + ' block'} onClick={() => setMobileOpen(false)}>Moderation</NavLink>
                      <NavLink to="/admin/car-makes" className={({ isActive }) => navLinkClass(isActive, true) + ' block'} onClick={() => setMobileOpen(false)}>Car makes</NavLink>
                      <NavLink to="/admin/sold" className={({ isActive }) => navLinkClass(isActive, true) + ' block'} onClick={() => setMobileOpen(false)}>Đã bán</NavLink>
                    </>
                  )}
                  <NavLink to="/profile" className={({ isActive }) => navLinkClass(isActive) + ' block'} onClick={() => setMobileOpen(false)}>My account</NavLink>
                </>
              )}
            </nav>
            <div className="mt-3 flex flex-col gap-2 border-t border-brand-100 pt-3">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-2 py-1">
                    <UserAvatar name={user.fullName || user.phone} role={user.role} />
                    <div>
                      <p className="text-sm font-semibold text-ink">{user.fullName || user.phone}</p>
                      <p className="text-xs text-muted">{roleLabel(user.role)}</p>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="btn btn-secondary w-full justify-center">Đăng xuất</button>
                </>
              ) : (
                <>
                  <Link to="/login"    className="btn btn-ghost   w-full justify-center" onClick={() => setMobileOpen(false)}>Đăng nhập</Link>
                  <Link to="/register" className="btn btn-primary w-full justify-center" onClick={() => setMobileOpen(false)}>Đăng ký</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Main ─────────────────────────────────────── */}
      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="mt-12 border-t border-brand-100/60 bg-white/70">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="grid gap-8 sm:grid-cols-4">
            <div>
              <Link to="/" className="flex items-center gap-2 w-fit">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 font-display text-base font-bold text-white shadow">C</span>
                <span className="font-display font-bold text-brand-900">Car Marketplace</span>
              </Link>
              <p className="mt-3 text-sm text-muted leading-relaxed">Nen tang mua ban o to da kiem duyet voi giao dien theo huong marketplace hien dai.</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink mb-3">Buy & Sell</h3>
              <ul className="space-y-2 text-sm text-muted">
                <li><Link to="/"                    className="hover:text-brand-700 transition-colors">Find a car</Link></li>
                <li><Link to="/register"            className="hover:text-brand-700 transition-colors">Create account</Link></li>
                <li><Link to="/seller/listing/new"  className="hover:text-brand-700 transition-colors">Sell my car</Link></li>
                <li><Link to="/favorites"           className="hover:text-brand-700 transition-colors">Saved listings</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink mb-3">Tools</h3>
              <ul className="space-y-2 text-sm text-muted">
                <li>Car chooser by budget</li>
                <li>Filter by fuel and gearbox</li>
                <li>Saved cars and profile</li>
                <li>Seller payments tracking</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink mb-3">Platform</h3>
              <ul className="space-y-2 text-sm text-muted">
                <li>API Gateway and microservices</li>
                <li>Auth Listing Payment services</li>
                <li>PostgreSQL Redis RabbitMQ</li>
                <li>React 19 Vite TailwindCSS v4</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-brand-100 pt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
            <span>© 2026 Car Marketplace</span>
            <span>Demo data only · Not a live trading platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
