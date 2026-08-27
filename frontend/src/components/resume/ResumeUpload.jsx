// ResumeUpload: handles PDF resume upload, AI parsing, and editable profile form for saving parsed data.
import { useState } from 'react';
import axios from 'axios';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Plus } from 'lucide-react';

export default function ResumeUpload({ onComplete }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const { refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    skills: [],
    designation: '',
    experience: '',
    experienceTimeline: [{ title: '', company: '', duration: '' }],
    degree: [{ college: '', degree_name: '', from_to: '' }],
  });

  const handleFileChange = (e) => {
    const selected = e.target.files[0];

    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setError('');
    } else {
      setError('Please upload a PDF file only.');
      setFile(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const dropped = e.dataTransfer.files[0];

    if (dropped && dropped.type === 'application/pdf') {
      setFile(dropped);
      setError('');
    } else {
      setError('Please drop a PDF file.');
      setFile(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a PDF resume first.');
      return;
    }

    setUploading(true);
    setError('');

    const uploadData = new FormData();
    uploadData.append('resume', file);

    try {
      const res = await axios.post('/user/info_resume', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const parsed = res.data.parsedData || {};
      setParsedData(parsed);

      setFormData({
        name: parsed.name || '',
        phone: parsed.phone || '',
        location: parsed.location || '',
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        designation: parsed.designation || '',
        experience: parsed.experience || '',
        experienceTimeline: Array.isArray(parsed.experienceTimeline) && parsed.experienceTimeline.length > 0
          ? parsed.experienceTimeline
          : [{ title: '', company: '', duration: '' }],
        degree: Array.isArray(parsed.degree) && parsed.degree.length > 0
          ? parsed.degree
          : [{ college: '', degree_name: '', from_to: '' }],
      });

      setIsEditing(true);
    } catch (err) {
      console.error('Resume upload failed:', err);
      setError(err.response?.data?.message || 'Upload & parsing failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError('');

      const response = await axios.post('/user/save-profile', formData);

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to save profile.');
      }

      await refreshUser(response.data.user);
      localStorage.setItem('resumeUploaded', 'true');
      setSaved(true);

      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Save profile failed:', err);
      setSaved(false);
      setError(err.response?.data?.message || err.message || 'Failed to save profile.');
    }
  };

  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experienceTimeline: [...prev.experienceTimeline, { title: '', company: '', duration: '' }],
    }));
  };

  const removeExperience = (index) => {
    setFormData((prev) => ({
      ...prev,
      experienceTimeline: prev.experienceTimeline.filter((_, i) => i !== index),
    }));
  };

  const updateExperience = (index, field, value) => {
    setFormData((prev) => {
      const timeline = [...prev.experienceTimeline];
      timeline[index] = { ...timeline[index], [field]: value };
      return { ...prev, experienceTimeline: timeline };
    });
  };

  const addDegree = () => {
    setFormData((prev) => ({
      ...prev,
      degree: [...prev.degree, { college: '', degree_name: '', from_to: '' }],
    }));
  };

  const removeDegree = (index) => {
    setFormData((prev) => ({
      ...prev,
      degree: prev.degree.filter((_, i) => i !== index),
    }));
  };

  const updateDegree = (index, field, value) => {
    setFormData((prev) => {
      const degree = [...prev.degree];
      degree[index] = { ...degree[index], [field]: value };
      return { ...prev, degree };
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      <h2 className="text-2xl font-bold mb-6 text-white">Upload Resume</h2>

      {!isEditing ? (
        <>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => e.preventDefault()}
            className="border-4 border-dashed border-indigo-300 rounded-2xl p-12 text-center hover:border-indigo-500 transition bg-indigo-50/50"
          >
            <svg className="w-20 h-20 mx-auto text-indigo-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <p className="text-2xl text-gray-700 mb-3">Drop your resume PDF here</p>
            <p className="text-gray-500 mb-6">or</p>
            <label htmlFor="resume-upload" className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-xl bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700 transition">
              Choose PDF File
            </label>
            <input id="resume-upload" type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
          </div>

          {file && (
            <div className="mt-8 p-6 bg-gray-50 rounded-2xl text-center">
              <p className="text-lg text-gray-700 mb-5">
                Selected:
                <strong className="text-indigo-700 ml-2">{file.name}</strong>
              </p>
              <Button size="lg" onClick={handleSubmit} loading={uploading} disabled={uploading}>
                {uploading ? 'Uploading & Parsing...' : 'Upload & Parse Resume'}
              </Button>
            </div>
          )}

          {error && (
            <div className="mt-6 text-red-600 text-center font-medium">{error}</div>
          )}
        </>
      ) : (
        <div className="space-y-8">
          <h3 className="text-2xl font-bold text-center text-green-700">Review & Edit Your Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Full Name" className="w-full px-5 py-3 border rounded-xl" />
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone" className="w-full px-5 py-3 border rounded-xl" />
            <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Location" className="w-full px-5 py-3 border rounded-xl" />
            <input type="text" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} placeholder="Current Designation" className="w-full px-5 py-3 border rounded-xl" />
            <input type="text" value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} placeholder="Total Experience" className="w-full px-5 py-3 border rounded-xl" />
          </div>

          <div>
            <label className="block font-medium mb-2 text-gray-700">Skills</label>
            <input
              type="text"
              value={formData.skills.join(', ')}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              placeholder="React, Node.js, MongoDB"
              className="w-full px-5 py-3 border rounded-xl"
            />
          </div>

          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Work Experience</h3>
              <button type="button" onClick={addExperience} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg">
                <Plus size={18} />
                Add Experience
              </button>
            </div>
            {formData.experienceTimeline.map((exp, index) => (
              <div key={index} className="p-5 border rounded-xl bg-gray-50 relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input value={exp.title} onChange={(e) => updateExperience(index, 'title', e.target.value)} placeholder="Job Title" className="px-4 py-3 border rounded-lg" />
                  <input value={exp.company} onChange={(e) => updateExperience(index, 'company', e.target.value)} placeholder="Company" className="px-4 py-3 border rounded-lg" />
                  <input value={exp.duration} onChange={(e) => updateExperience(index, 'duration', e.target.value)} placeholder="Duration" className="px-4 py-3 border rounded-lg" />
                </div>
                {formData.experienceTimeline.length > 1 && (
                  <button type="button" onClick={() => removeExperience(index)} className="absolute top-3 right-3 text-red-600">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Education</h3>
              <button type="button" onClick={addDegree} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg">
                <Plus size={18} />
                Add Education
              </button>
            </div>
            {formData.degree.map((edu, index) => (
              <div key={index} className="p-5 border rounded-xl bg-gray-50 relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input value={edu.college} onChange={(e) => updateDegree(index, 'college', e.target.value)} placeholder="College / University" className="px-4 py-3 border rounded-lg" />
                  <input value={edu.degree_name} onChange={(e) => updateDegree(index, 'degree_name', e.target.value)} placeholder="Degree" className="px-4 py-3 border rounded-lg" />
                  <input value={edu.from_to} onChange={(e) => updateDegree(index, 'from_to', e.target.value)} placeholder="Duration" className="px-4 py-3 border rounded-lg" />
                </div>
                {formData.degree.length > 1 && (
                  <button type="button" onClick={() => removeDegree(index)} className="absolute top-3 right-3 text-red-600">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="text-center pt-6">
            <Button size="xl" onClick={handleSave} disabled={saved} className="px-12 py-5 text-xl">
              {saved ? 'Profile Saved ✓' : 'Save Profile ✓'}
            </Button>
          </div>

          {saved && (
            <div className="mt-4 text-center text-emerald-600 font-semibold">
              Resume uploaded, parsed and profile saved successfully ✓
            </div>
          )}

          {error && (
            <div className="mt-4 text-red-600 text-center">{error}</div>
          )}
        </div>
      )}
    </div>
  );
}