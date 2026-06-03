import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { assessmentsApi } from '../api/api';
import AssessmentForm from './AssessmentForm';
import { LeafLoader } from './Leaf';

function EditAssessment() {
  const navigate = useNavigate();
  const { courseId, assessmentId } = useParams();
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await assessmentsApi.getById(assessmentId);
        setInitial(data);
        setLoadError(null);
      } catch (err) {
        console.error('Failed to load assessment for edit:', err);
        setLoadError('Failed to load assessment. Make sure you are the course author or an admin.');
      } finally {
        setLoading(false);
      }
    };
    if (assessmentId) load();
  }, [assessmentId]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await assessmentsApi.update(assessmentId, payload);
      navigate(`/courses/${courseId}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update assessment.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LeafLoader label="loading assessment" />;

  if (loadError) {
    return (
      <div className="ml-card p-6 my-12 max-w-[760px] mx-auto" role="alert">
        <strong className="font-serif text-ink">A small pause. </strong>
        <span className="text-ink-soft">{loadError}</span>
        <div className="mt-4">
          <button onClick={() => navigate(`/courses/${courseId}`)} className="ml-button-primary">back to course</button>
        </div>
      </div>
    );
  }

  return (
    <AssessmentForm
      heading={{ kicker: 'edit assessment', title: 'Edit assessment.' }}
      initial={initial}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitLabel="save changes"
      onCancel={() => navigate(`/courses/${courseId}`)}
    />
  );
}

export default EditAssessment;
