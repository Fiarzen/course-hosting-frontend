import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { BrandLeaf, Leaf } from './components/Leaf';
import Home from './components/Home';
import Courses from './components/Courses';
import Lessons from './components/Lessons';
import Users from './components/Users';
import CreateCourse from './components/CreateCourse';
import CreateLesson from './components/CreateLesson';
import Register from './components/Register';
import Login from './components/Login';
import Profile from './components/Profile';
import CourseDetail from './components/CourseDetail';
import LessonView from './components/LessonView';
import EditLesson from './components/EditLesson';
import AssessmentView from './components/AssessmentView';
import CreateAssessment from './components/CreateAssessment';
import EditAssessment from './components/EditAssessment';
import MyCourses from './components/MyCourses';
import ResetPassword from './components/ResetPassword';
import ForgotPassword from './components/ForgotPassword';
import VerifyEmail from './components/VerifyEmail';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentCancel from './components/PaymentCancel';

// BrowserRouter keeps the old scroll position across navigations; reset it.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function NavLink({ to, label }) {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== '/' && pathname.startsWith(to));
  return (
    <Link
      to={to}
      className="relative px-4 py-2 text-sm tracking-wide transition-colors"
      style={{ color: active ? 'var(--ink)' : 'var(--ink-soft)' }}
    >
      {label}
      <span
        className="absolute left-4 right-4 bottom-1 h-px transition-colors"
        style={{ background: active ? 'var(--moss)' : 'transparent' }}
      />
    </Link>
  );
}

function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative h-6 w-11 rounded-full p-0 transition-colors"
      style={{ border: '1px solid var(--hair-strong)', background: 'transparent' }}
    >
      <span
        className="absolute top-[2px] grid h-[18px] w-[18px] place-items-center rounded-full transition-all"
        style={{
          left: dark ? 22 : 2,
          background: dark ? 'var(--moss-deep)' : 'var(--moss)',
        }}
      >
        <Leaf size={10} strokeWidth={0} tilt={dark ? 30 : -20} color="var(--paper)" />
      </span>
    </button>
  );
}

function App() {
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = window.localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      window.localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      window.localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen">
        <nav className="ml-nav">
          <div className="mx-auto max-w-page px-6 sm:px-10">
            <div className="flex h-16 items-center justify-between gap-6">
              <Link to="/" className="flex items-center gap-2.5">
                <BrandLeaf size={15} />
                <span className="font-serif text-[20px] tracking-tight2 text-ink">mindleaf</span>
              </Link>

              <button
                type="button"
                className="rounded p-2 text-ink-soft sm:hidden"
                aria-expanded={mobileNavOpen}
                aria-label="Toggle navigation"
                onClick={() => setMobileNavOpen((o) => !o)}
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  {mobileNavOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />}
                </svg>
              </button>

              <div className="hidden sm:flex items-center">
                <NavLink to="/" label="home" />
                <NavLink to="/courses" label="courses" />
                {isAuthenticated && <NavLink to="/profile" label="library" />}
                {(user?.role === 'CREATOR' || user?.role === 'ADMIN') && <NavLink to="/my-courses" label="studio" />}
                {user?.role === 'ADMIN' && <NavLink to="/users" label="people" />}
              </div>

              <div className="hidden sm:flex items-center gap-4">
                <ThemeToggle dark={isDarkMode} onToggle={() => setIsDarkMode((v) => !v)} />
                {isAuthenticated ? (
                  <div className="flex items-center gap-4">
                    <Link to="/profile" className="flex items-center gap-2 text-sm text-ink-soft">
                      <span className="grid h-7 w-7 place-items-center rounded-full text-xs text-moss-deep"
                            style={{ background: 'var(--moss-wash)', border: '1px solid var(--hair)' }}>
                        {(user?.name || user?.email || '?')[0]?.toLowerCase()}
                      </span>
                      {user?.name?.split(' ')[0]?.toLowerCase() || 'you'}
                    </Link>
                    <button onClick={logout} className="text-sm text-ink-faint hover:text-ink transition-colors">
                      sign out
                    </button>
                  </div>
                ) : (
                  <>
                    <Link to="/login" className="text-sm text-ink-soft">sign in</Link>
                    <Link to="/register" className="ml-button-primary">
                      begin
                      <Leaf size={12} strokeWidth={0} color="var(--moss-soft)" tilt={-20} />
                    </Link>
                  </>
                )}
              </div>
            </div>

            {mobileNavOpen && (
              <div className="border-t pb-3 pt-2 sm:hidden" style={{ borderColor: 'var(--hair)' }}>
                <Link to="/" onClick={() => setMobileNavOpen(false)} className="block rounded px-3 py-2 text-sm text-ink-soft">home</Link>
                <Link to="/courses" onClick={() => setMobileNavOpen(false)} className="block rounded px-3 py-2 text-sm text-ink-soft">courses</Link>
                {isAuthenticated && <Link to="/profile" onClick={() => setMobileNavOpen(false)} className="block rounded px-3 py-2 text-sm text-ink-soft">library</Link>}
                {(user?.role === 'CREATOR' || user?.role === 'ADMIN') && <Link to="/my-courses" onClick={() => setMobileNavOpen(false)} className="block rounded px-3 py-2 text-sm text-ink-soft">studio</Link>}
                {user?.role === 'ADMIN' && <Link to="/users" onClick={() => setMobileNavOpen(false)} className="block rounded px-3 py-2 text-sm text-ink-soft">people</Link>}
                <div className="mt-2 flex items-center justify-between border-t px-3 pt-3" style={{ borderColor: 'var(--hair)' }}>
                  <span className="text-sm text-ink-faint">{isDarkMode ? 'dark' : 'light'} mode</span>
                  <ThemeToggle dark={isDarkMode} onToggle={() => setIsDarkMode((v) => !v)} />
                </div>
                {!isAuthenticated && (
                  <>
                    <Link to="/login" onClick={() => setMobileNavOpen(false)} className="block rounded px-3 py-2 text-sm text-ink-soft">sign in</Link>
                    <Link to="/register" onClick={() => setMobileNavOpen(false)} className="block rounded px-3 py-2 text-sm text-moss-deep">begin — create an account</Link>
                  </>
                )}
                {isAuthenticated && (
                  <button onClick={() => { setMobileNavOpen(false); logout(); }} className="block w-full text-left rounded px-3 py-2 text-sm text-ink-soft">
                    sign out
                  </button>
                )}
              </div>
            )}
          </div>
        </nav>

        <main className="mx-auto max-w-page py-10 px-6 sm:px-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:courseId" element={<CourseDetail />} />
            <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonView />} />
            <Route path="/courses/:courseId/lessons/:lessonId/edit" element={<EditLesson />} />
            <Route path="/courses/:courseId/assessments/create" element={<CreateAssessment />} />
            <Route path="/courses/:courseId/assessments/:assessmentId" element={<AssessmentView />} />
            <Route path="/courses/:courseId/assessments/:assessmentId/edit" element={<EditAssessment />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/users" element={<Users />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/courses/create" element={<CreateCourse />} />
            <Route path="/lessons/create" element={<CreateLesson />} />
            <Route path="/my-courses" element={<MyCourses />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
          </Routes>
        </main>

        <footer style={{ borderTop: '1px solid var(--hair)' }} className="mt-20 px-6 py-10 sm:px-10">
          <div className="mx-auto flex max-w-page items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <BrandLeaf size={13} />
              <span className="font-serif text-base text-ink">mindleaf</span>
              <span className="ml-3 font-mono text-[11px] tracking-widest text-ink-faint">est. 2025</span>
            </div>
            <div className="flex gap-7 text-sm text-ink-soft">
              <Link to="/courses">catalogue</Link>
              <Link to="/register">teach a course</Link>
              <a href="mailto:hello@mindleaf.studio">contact</a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
