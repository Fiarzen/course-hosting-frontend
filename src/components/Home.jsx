import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="px-4 py-10 sm:px-0">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Welcome to MindLeaf
        </h1>
        <p className="tnpmext-lg text-gray-700 mb-6">
          Browse courses, follow lessons and track your progress.
        </p>
        <div className="flex flex-col sm:flex-row sm:space-x-3 sm:space-y-0 space-y-3">
          <Link
            to="/courses"
            className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-md shadow-sm transition"
          >
            Browse courses
          </Link>
          {!isAuthenticated && (
            <Link
              to="/register"
              className="inline-flex items-center justify-center border border-emerald-200 text-emerald-800 hover:bg-emerald-50 font-medium px-6 py-3 rounded-md transition"
            >
              Create a learning account
            </Link>
          )}
        </div>
        <div className="mt-8 text-sm text-gray-500 leading-relaxed">
          <p className="mb-2">
            Teachers can create courses, upload lessons, and share private links
            with their students.
          </p>
          <p>
            Learners can enroll in courses, watch lessons, and mark them
            complete at their own pace.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;

