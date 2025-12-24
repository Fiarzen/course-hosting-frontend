import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
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

function App() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-2xl font-bold text-indigo-600">Course Hosting</h1>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/"
                    className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Courses
                  </Link>
                  {(user?.role === 'CREATOR' || user?.role === 'ADMIN') && (
                    <Link
                      to="/my-courses"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      My Courses
                    </Link>
                  )}
                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/users"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Users
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      className="text-sm text-gray-700 hover:text-gray-900 px-2 py-1"
                    >
                      {user?.name || user?.email}
                      {user?.role && (
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          user.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'CREATOR'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {user.role}
                        </span>
                      )}
                    </Link>
                    <button
                      onClick={logout}
                      className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="text-gray-700 hover:text-gray-900 px-4 py-2 text-sm font-medium transition duration-150 ease-in-out"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

