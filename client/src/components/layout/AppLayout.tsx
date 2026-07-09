import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarDays, Map, Menu,
  Stethoscope, History
} from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/doctors', icon: Users, label: 'Doctors' },
  { to: '/plan', icon: CalendarDays, label: 'Plan' },
  { to: '/visits', icon: History, label: 'Visits' },
  { to: '/more', icon: Menu, label: 'More' },
];

export function AppLayout() {
  const location = useLocation();

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Sidebar Navigation — visible on tablet/laptop */}
      <nav className="sidebar-nav">
        <div className="nav-brand">
          <Stethoscope size={20} className="text-white" />
        </div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={clsx('nav-item', isActive(to) && 'active')}
          >
            <Icon size={20} strokeWidth={isActive(to) ? 2.5 : 1.8} />
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
        <div className="flex-1" />
        <NavLink
          to="/map"
          className={clsx('nav-item', isActive('/map') && 'active')}
        >
          <Map size={20} strokeWidth={isActive('/map') ? 2.5 : 1.8} />
          <span className="nav-label">Map</span>
        </NavLink>
      </nav>

      {/* Main content */}
      <main className="main-with-sidebar">
        <div className="app-container">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation — phone only */}
      <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-50 glass border-t border-navy-700/50 safe-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto h-[64px]">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={clsx(
                'flex flex-col items-center justify-center gap-1 w-16 py-2 rounded-xl transition-all duration-200 min-h-0',
                isActive(to) ? 'text-teal-400' : 'text-navy-500 hover:text-navy-300',
              )}
            >
              <Icon
                size={22}
                strokeWidth={isActive(to) ? 2.5 : 1.8}
                className={clsx(
                  'transition-transform duration-200',
                  isActive(to) && 'scale-110',
                )}
              />
              <span className={clsx('text-[10px] font-medium leading-none', isActive(to) && 'font-semibold')}>
                {label}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
