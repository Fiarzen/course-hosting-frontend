import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { coursesApi, enrollmentApi } from "../api/api";

function Courses() {
  const { isAuthenticated, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState({});

  // Check if user can create courses
  const canCreateCourse = user?.role === "CREATOR" || user?.role === "ADMIN";

  useEffect(() => {
    loadCourses();
    if (isAuthenticated) {
      loadEnrolledCourses();
    }
  }, [isAuthenticated]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await coursesApi.getAll();
      setCourses(data);
      setError(null);
    } catch (err) {
      setError(
        "Failed to load courses. Backend may be need time to start, try again in 30 seconds.",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadEnrolledCourses = async () => {
    try {
      const data = await enrollmentApi.getMyCourses();
      const enrolledIds = new Set(data.map((e) => e.course.id));
      setEnrolledCourseIds(enrolledIds);
    } catch (err) {
      console.error("Failed to load enrolled courses:", err);
    }
  };

  const handleEnroll = async (courseId) => {
    setEnrolling({ ...enrolling, [courseId]: true });
    try {
      await enrollmentApi.enrollInCourse(courseId);
      setEnrolledCourseIds(new Set([...enrolledCourseIds, courseId]));
      alert("Successfully enrolled in course!");
    } catch (err) {
      const status = err.response?.status;
      const backendMessage = err.response?.data?.error;

      if (status === 409) {
        alert("You are already enrolled in this course.");
        setEnrolledCourseIds(new Set([...enrolledCourseIds, courseId]));
      } else if (status === 403 && backendMessage?.includes("allowlist")) {
        alert(
          "This course is restricted to an allowlist of users, and your account is not on that list. Please contact the course creator if you believe this is a mistake.",
        );
      } else if (backendMessage) {
        alert(backendMessage);
      } else {
        alert("Failed to enroll in course. Please try again.");
      }

      console.error(err);
    } finally {
      setEnrolling({ ...enrolling, [courseId]: false });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Courses</h2>
        {canCreateCourse && (
          <Link
            to="/courses/create"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-150 ease-in-out"
          >
            + Create Course
          </Link>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No courses found. Create your first course!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
            >
              <div className="p-6">
                <Link to={`/courses/${course.id}`} className="block">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-indigo-600">
                    {course.title}
                  </h3>
                </Link>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {course.description || "No description"}
                </p>
                {course.author && (
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="font-medium">Author:</span>
                    <span className="ml-2">
                      {course.author.name || course.author.email}
                    </span>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-sm text-indigo-600 font-medium">
                    ID: {course.id}
                  </span>
                  {isAuthenticated &&
                    (enrolledCourseIds.has(course.id) ? (
                      <Link
                        to="/profile"
                        className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1 px-3 rounded"
                      >
                        Enrolled
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrolling[course.id]}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-1 px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {enrolling[course.id] ? "Enrolling..." : "Enroll"}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Courses;
