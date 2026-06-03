import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { assessmentsApi } from '../api/api';
import AssessmentForm from './AssessmentForm';

function CreateAssessment() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await assessmentsApi.create({ courseId: parseInt(courseId, 10), ...payload });
      navigate(`/courses/${courseId}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create assessment.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AssessmentForm
      heading={{ kicker: 'new assessment', title: 'Add an assessment.' }}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitLabel="create assessment"
      onCancel={() => navigate(`/courses/${courseId}`)}
    />
  );
}

export default CreateAssessment;
