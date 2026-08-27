// JdUpload: form component for uploading a job description by title and content text.
import { useState } from 'react';
import axios from 'axios';

export default function JdUpload({ onComplete }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      setStatus('error');
      return;
    }

    if (content.trim().length < 20) {
      setStatus('error');
      return;
    }

    try {
      setStatus('loading');

      await axios.post('/jd/upload', {
        title: title.trim() || null,
        content: content.trim(),
      });

      localStorage.setItem('jdUploaded', 'true');
      setStatus('success');

      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('JD upload failed:', err);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-white">
        Upload Job Description
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border rounded-lg"
        />
        <textarea
          rows={10}
          placeholder="Paste your job description here (minimum 20 characters)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-3 border rounded-lg"
          required
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="w-full py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {status === 'loading' ? 'Uploading...' : status === 'success' ? 'Uploaded ✓' : 'Upload Job Description'}
        </button>
        {status === 'success' && (
          <p className="text-green-600 text-center font-medium">
            Job description uploaded successfully ✓
          </p>
        )}
        {status === 'error' && (
          <p className="text-red-600 text-center font-medium">
            Please enter a valid job description.
          </p>
        )}
      </form>
    </div>
  );
}