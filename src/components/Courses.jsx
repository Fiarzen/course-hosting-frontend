import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { coursesApi, enrollmentApi, paymentsApi } from "../api/api";
import { formatPrice } from "../utils/pricing";
import { Leaf, Kicker, LeafTag, LeafLoader } from "./Leaf";

function CourseCard({ course, isEnrolled, isAuthenticated, isAdmin, onEnroll, onBuyCard, onBuyPaypal, onToggleFeatured, enrolling, checkingOut, payingWithPaypal, togglingFeatured }) {
  const isPaid = course.isPaid;
  const priceLabel = isPaid ? formatPrice(course.priceCents, course.currency) : "Free";

  return (
    <article className="ml-card ml-lift relative p-8 flex flex-col justify-between min-h-[280px]">
      <span className="absolute top-5 right-5" style={{ color: "var(--moss)", opacity: 0.85 }}>
        <Leaf size={20} tilt={isPaid ? 28 : -22} strokeWidth={0} />
      </span>

      <header>
        <div className="mb-3.5 flex items-center gap-2.5">
          <Kicker className="text-ink-faint normal-case tracking-widest">
            {course.lessons?.length || course.lessonCount || "—"} lessons
          </Kicker>
          {course.featured && <LeafTag>featured</LeafTag>}
        </div>
        <Link to={`/courses/${course.id}`} className="block">
          <h3 className="font-serif text-[26px] leading-tight text-ink mb-2.5 max-w-[85%]">
            {course.title}
          </h3>
        </Link>
        <p className="text-[14.5px] text-ink-soft leading-relaxed max-w-[95%]">
          {course.description || "No description"}
        </p>
      </header>

      <footer className="mt-7 pt-4 flex items-center justify-between gap-3" style={{ borderTop: "1px solid var(--hair)" }}>
        <div className="flex flex-col gap-0.5">
          {course.author && (
            <>
              <span className="text-[13px] text-ink">{course.author.name || course.author.email}</span>
              <span className="text-[11.5px] text-ink-faint">author</span>
            </>
          )}
          {isAdmin && (
            <button
              onClick={(e) => { e.preventDefault(); onToggleFeatured(course.id, !course.featured); }}
              disabled={togglingFeatured[course.id]}
              className="mt-1 text-left text-[11px] text-ink-faint hover:text-ink"
            >
              {togglingFeatured[course.id] ? "saving…" : course.featured ? "unfeature" : "feature on home"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3.5">
          {isAuthenticated && (
            isEnrolled ? (
              <Link to="/profile" className="text-[12px] text-moss-deep flex items-center gap-1.5">
                <Leaf size={11} strokeWidth={0} /> tending
              </Link>
            ) : isPaid ? (
              <div className="flex flex-col gap-1">
                <button
                  onClick={(e) => { e.preventDefault(); onBuyCard(course.id); }}
                  disabled={checkingOut[course.id] || payingWithPaypal[course.id]}
                  className="ml-button-primary text-[11px] py-1.5 px-3"
                >
                  {checkingOut[course.id] ? "redirecting…" : `card · ${priceLabel}`}
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); onBuyPaypal(course.id); }}
                  disabled={checkingOut[course.id] || payingWithPaypal[course.id]}
                  className="ml-button-ghost text-[11px] py-1.5 px-3"
                >
                  {payingWithPaypal[course.id] ? "redirecting…" : "PayPal"}
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.preventDefault(); onEnroll(course.id); }}
                disabled={enrolling[course.id]}
                className="ml-button-primary text-[12px] py-1.5 px-3"
              >
                {enrolling[course.id] ? "enrolling…" : "enroll"}
              </button>
            )
          )}
          <span className="font-serif text-[18px] text-ink">{priceLabel.toLowerCase()}</span>
        </div>
      </footer>
    </article>
  );
}

const lessonCountOf = (course) => course.lessons?.length || course.lessonCount || 0;

const LENGTH_BUCKETS = {
  any: () => true,
  short: (n) => n >= 1 && n <= 3,
  medium: (n) => n >= 4 && n <= 8,
  long: (n) => n >= 9,
};

export function courseMatchesFilters(course, { filter = "all", search = "", lengthFilter = "any" } = {}) {
  if (filter === "free" && course.isPaid) return false;
  if (filter === "paid" && !course.isPaid) return false;
  if (!(LENGTH_BUCKETS[lengthFilter] || LENGTH_BUCKETS.any)(lessonCountOf(course))) return false;
  const q = search.trim().toLowerCase();
  if (q) {
    const title = (course.title || "").toLowerCase();
    const description = (course.description || "").toLowerCase();
    if (!title.includes(q) && !description.includes(q)) return false;
  }
  return true;
}

function Courses() {
  const { isAuthenticated, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState({});
  const [checkingOut, setCheckingOut] = useState({});
  const [payingWithPaypal, setPayingWithPaypal] = useState({});
  const [togglingFeatured, setTogglingFeatured] = useState({});
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [lengthFilter, setLengthFilter] = useState("any");

  const canCreateCourse = user?.role === "CREATOR" || user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    loadCourses();
    if (isAuthenticated) loadEnrolledCourses();
  }, [isAuthenticated]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await coursesApi.getAll();
      setCourses(data);
      setError(null);
    } catch (err) {
      setError("Failed to load courses. The backend may need a moment to wake — try again in 30 seconds.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadEnrolledCourses = async () => {
    try {
      const data = await enrollmentApi.getMyCourses();
      setEnrolledCourseIds(new Set(data.map((e) => e.course.id)));
    } catch (err) {
      console.error("Failed to load enrolled courses:", err);
    }
  };

  const handleEnroll = async (courseId) => {
    setEnrolling((prev) => ({ ...prev, [courseId]: true }));
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
        alert("This course is restricted to an allowlist of users, and your account is not on that list.");
      } else if (backendMessage) {
        alert(backendMessage);
      } else {
        alert("Failed to enroll in course. Please try again.");
      }
      console.error(err);
    } finally {
      setEnrolling((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const handleToggleFeatured = async (courseId, featured) => {
    setTogglingFeatured((prev) => ({ ...prev, [courseId]: true }));
    try {
      const updated = await coursesApi.setFeatured(courseId, featured);
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, featured: updated.featured } : c))
      );
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update featured status. Please try again.");
      console.error(err);
    } finally {
      setTogglingFeatured((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const handlePayPal = async (courseId) => {
    setPayingWithPaypal((prev) => ({ ...prev, [courseId]: true }));
    try {
      const result = await paymentsApi.createPaypalOrder(courseId);
      sessionStorage.setItem("stripeCheckout", JSON.stringify({ courseId }));
      window.location.href = result.approvalUrl;
    } catch (err) {
      const code = err.response?.data?.code;
      const msg = err.response?.data?.error;
      if (code === "ALREADY_ENROLLED") {
        setEnrolledCourseIds(new Set([...enrolledCourseIds, courseId]));
        alert("You are already enrolled in this course.");
      } else if (msg) {
        alert(msg);
      } else {
        alert("Failed to start PayPal checkout. Please try again.");
      }
      console.error(err);
    } finally {
      setPayingWithPaypal((prev) => ({ ...prev, [courseId]: false }));
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
    return <LeafLoader label="loading courses" />;
  }

  if (error) {
    return (
      <div
        className="ml-card p-6 my-12 max-w-page mx-auto"
        role="alert"
        style={{ background: "color-mix(in oklab, var(--moss-wash) 30%, transparent)", borderColor: "var(--moss-soft)" }}
      >
        <strong className="font-serif text-ink">A small pause. </strong>
        <p className="mt-2 text-sm text-ink-soft">{error}</p>
      </div>
    );
  }

  const filters = [
    { key: "all", label: "all courses", count: courses.length },
    { key: "free", label: "free", count: courses.filter((c) => !c.isPaid).length },
    { key: "paid", label: "studio", count: courses.filter((c) => c.isPaid).length },
  ];
  const lengthFilters = [
    { key: "any", label: "any length", hint: null },
    { key: "short", label: "short", hint: "1–3" },
    { key: "medium", label: "medium", hint: "4–8" },
    { key: "long", label: "long", hint: "9+" },
  ];
  const filtered = courses.filter((c) => courseMatchesFilters(c, { filter, search, lengthFilter }));

  return (
    <div className="ml-screen-fade">
      <section className="py-16">
        <div className="flex items-end justify-between gap-6 flex-wrap mb-2">
          <div>
            <Kicker className="mb-4">catalogue</Kicker>
            <h1 className="font-serif text-[clamp(40px,5vw,64px)] leading-tight text-ink tracking-tight2 max-w-[720px]">
              Our available courses.
            </h1>
            <p className="mt-4 text-[16px] text-ink-soft leading-relaxed max-w-[520px]">
              From approved creators.
            </p>
          </div>
          {canCreateCourse && (
            <Link to="/courses/create" className="ml-button-primary">
              new course
              <Leaf size={12} strokeWidth={0} color="var(--moss-soft)" tilt={-20} />
            </Link>
          )}
        </div>
      </section>

      <section className="py-2" style={{ borderTop: "1px solid var(--hair)", borderBottom: "1px solid var(--hair)" }}>
        <div className="flex items-center gap-6 py-3 flex-wrap">
          <div className="flex items-baseline gap-6 flex-wrap">
            {filters.map((f, i) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="flex items-baseline gap-2 py-2 pr-6 text-[14px]"
                  style={{
                    color: active ? "var(--ink)" : "var(--ink-soft)",
                    borderRight: i < filters.length - 1 ? "1px solid var(--hair)" : "none",
                  }}
                >
                  {active && <Leaf size={10} strokeWidth={0} tilt={-20} />}
                  <span>{f.label}</span>
                  <span className="font-mono text-[11px] text-ink-faint">{String(f.count).padStart(2, "0")}</span>
                </button>
              );
            })}
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search courses…"
            aria-label="search courses"
            className="ml-input flex-1 min-w-[180px] sm:max-w-[260px]"
          />
        </div>
        <div className="flex items-baseline gap-6 pb-3 flex-wrap" style={{ borderTop: "1px solid var(--hair)" }}>
          {lengthFilters.map((f, i) => {
            const active = lengthFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setLengthFilter(f.key)}
                className="flex items-baseline gap-2 py-2 pr-6 text-[14px]"
                style={{
                  color: active ? "var(--ink)" : "var(--ink-soft)",
                  borderRight: i < lengthFilters.length - 1 ? "1px solid var(--hair)" : "none",
                }}
              >
                {active && <Leaf size={10} strokeWidth={0} tilt={-20} />}
                <span>{f.label}</span>
                {f.hint && <span className="font-mono text-[11px] text-ink-faint">{f.hint} lessons</span>}
              </button>
            );
          })}
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-ink-faint">
          <Leaf size={40} strokeWidth={1} />
          <p className="mt-4 text-sm">
            {courses.length > 0
              ? "Nothing matches your search or filters. Try clearing them."
              : "No courses found. Try another filter, or check back soon."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3 py-12">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isEnrolled={enrolledCourseIds.has(course.id)}
              isAuthenticated={isAuthenticated}
              isAdmin={isAdmin}
              onEnroll={handleEnroll}
              onBuyCard={handleBuyNow}
              onBuyPaypal={handlePayPal}
              onToggleFeatured={handleToggleFeatured}
              enrolling={enrolling}
              checkingOut={checkingOut}
              payingWithPaypal={payingWithPaypal}
              togglingFeatured={togglingFeatured}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Courses;
