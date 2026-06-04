import mongoose from "mongoose";

const experienceTimelineSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    company: { type: String, trim: true },
    duration: { type: String, trim: true }
  },
  { _id: false }
);

const degreeTimelineSchema = new mongoose.Schema(
  {
    college: { type: String, trim: true },
    degree_name: { type: String, trim: true },
    from_to: { type: String, trim: true }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["candidate", "hr"],
    default: "candidate"
  },

  refreshToken: {
    type: String,           // we'll store HASHED version
    default: null,
  },
  refreshTokenExpires: {
    type: Date,
    default: null,
  },
  
  phone: {
    type: String,
    trim: true
  },

  location: {
    type: String,
    trim: true
  },

  resumeUrl: {
    type: String
  },

  currentStep: {
    type: String,
    enum: ["info", "mcq", "video", "coding", "completed"],
    default: "info"
  },

  skills: {
    type: [String],
    default: []
  },

  designation: {
    type: String,            // CURRENT ROLE ONLY
    trim: true
  },


  experience: {
    type: String,            // e.g. "2 years"
    trim: true
  },  

  experienceTimeline: {
    type: [experienceTimelineSchema],
    default: []
  },

  degree: {
    type: [degreeTimelineSchema],
    default: []
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  mcqScore: { type: Number },        // out of total questions
  videoScore: { type: Number },      // AI-assessed (0–100)
  codingScore: { type: Number },
});

export default mongoose.model("User", userSchema);
