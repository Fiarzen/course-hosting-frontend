import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { coursesApi, enrollmentApi, paymentsApi } from "../api/api";

function formatPrice(priceCents, currency) {
  if (!priceCents || !currency) return null;
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(priceCents / 100);
  } catch {
    return `${currency.toUpperCase()} ${(priceCents / 100).toFixed(2)}`;
  }
}

function Courses() {
  const { isAuthenticated, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState({});
  const [checkingOut, setCheckingOut] = useState({});

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
        "Failed to load courses. Backend may need time to start, try again in 30 seconds.",
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
          "This course is restricted to an allowlist of users, and your account is not on that list.",
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

  const handleBuyNow = async (courseId) => {
    setCheckingOut((prev) => ({ ...prev, [courseId]: true }));
    try {
      const result = await paymentsApi.createCheckoutSession(courseId);
      sessionStorage.setItem("stripeCheckout", JSON.stringify({ courseId }));
      window.location.href = result.checkoutUrl;
    } catch (err) {
      const code = err.response?.data?.code;
      const msg = err.response?.data?.error;
      if (code === "ALREADY_ENROLLED") {
        setEnrolledCourseIds(new Set([...enrolledCourseIds, courseId]));
        alert("You are already enrolled in this course.");
      } else if (msg) {
        alert(msg);
      } else {
        alert("Failed to start checkout. Please try again.");
      }
      console.error(err);
    } finally {
      setCheckingOut((prev) => ({ ...prev, [courseId]: false }));
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
          {courses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            const isPaid = course.isPaid;
            const priceLabel = isPaid
              ? formatPrice(course.priceCents, course.currency)
              : "Free";

            return (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <Link to={`/courses/${course.id}`} className="block flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 hover:text-indigo-600">
                        {course.title}
                      </h3>
                    </Link>
                    <span
                      className={`ml-3 flex-shrink-0 inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                        isPaid
                          ? "bg-amber-100 text-amber-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {priceLabel}
                    </span>
                  </div>
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
                      (isEnrolled ? (
                        <Link
                          to="/profile"
                          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1 px-3 rounded"
                        >
                          Enrolled
                        </Link>
                      ) : isPaid ? (
                        <button
                          onClick={() => handleBuyNow(course.id)}
                          disabled={checkingOut[course.id]}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium py-1 px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {checkingOut[course.id] ? "Redirecting..." : `Buy — ${priceLabel}`}
                        </button>
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
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Courses;
