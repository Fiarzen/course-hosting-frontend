import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from './context/AuthContext';
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
import MyCourses from './components/MyCourses';
import ResetPassword from './components/ResetPassword';

function App() {
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <Router>
      <div className="branch-theme">
        <nav className="branch-nav shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:h-16">
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="branch-heading branch-nav__brand text-xl sm:text-2xl font-semibold">
                    mindleaf
                  </h1>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md p-2 text-emerald-900 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:hidden"
                  aria-expanded={mobileNavOpen}
                  aria-label="Toggle navigation menu"
                  onClick={() => setMobileNavOpen((open) => !open)}
               >
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    {mobileNavOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
                      />
                    )}
                  </svg>
                </button>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/"
                    className="border-emerald-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Courses
                  </Link>
                  {(user?.role === 'CREATOR' || user?.role === 'ADMIN') && (
                    <Link
                      to="/my-courses"
                      className="border-transparent text-gray-600 hover:border-emerald-300 hover:text-emerald-800 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      My Courses
                    </Link>
                  )}
                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/users"
                      className="border-transparent text-gray-600 hover:border-emerald-300 hover:text-emerald-800 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Users
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 sm:justify-end">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      className="text-sm text-gray-700 hover:text-emerald-900 px-2 py-1"
                    >
                      {user?.name || user?.email}
                      {user?.role && (
                        <span
                          className={`ml-2 px-2 py-1 text-xs branch-pill ${
                            user.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : user.role === 'CREATOR'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-lime-100 text-lime-800'
                          }`}
                        >
                          {user.role}
                        </span>
                      )}
                    </Link>
                    <button
                      onClick={logout}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="text-gray-700 hover:text-emerald-900 px-4 py-2 text-sm font-medium transition duration-150 ease-in-out"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
            {mobileNavOpen && (
              <div className="mt-2 space-y-1 border-t border-emerald-50 pt-2 pb-3 sm:hidden">
                <Link
                  to="/"
                  className="block rounded-md px-3 py-2 text-base font-medium text-emerald-900 hover:bg-emerald-50"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Courses
                </Link>
                {(user?.role === 'CREATOR' || user?.role === 'ADMIN') && (
                  <Link
                    to="/my-courses"
                    className="block rounded-md px-3 py-2 text-base font-medium text-emerald-900 hover:bg-emerald-50"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    My Courses
                  </Link>
                )}
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/users"
                    className="block rounded-md px-3 py-2 text-base font-medium text-emerald-900 hover:bg-emerald-50"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    Users
                  </Link>
                )}
              </div>
            )}
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Courses />} />
            <Route path="/courses/:courseId" element={<CourseDetail />} />
            <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonView />} />
            <Route path="/courses/:courseId/lessons/:lessonId/edit" element={<EditLesson />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/users" element={<Users />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/courses/create" element={<CreateCourse />} />
            <Route path="/lessons/create" element={<CreateLesson />} />
            <Route path="/my-courses" element={<MyCourses />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

