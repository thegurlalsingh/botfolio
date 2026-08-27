// Prisma logic for saving a parsed resume onto the user's profile, replacing timeline records.
import prisma from '../db/prisma.js';

const cleanString = (value) => {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const cleanSkills = (skills) => {
  if (!Array.isArray(skills)) {
    return [];
  }

  return [
    ...new Set(
      skills.filter((skill) => typeof skill === 'string')
        .map((skill) => skill.trim())
        .filter(Boolean)
    )
  ];
};

const cleanExperienceTimeline = (timeline) => {
  if (!Array.isArray(timeline)) {
    return [];
  }

  return timeline.map((item) => ({
    title: cleanString(item.title),
    company: cleanString(item.company),
    duration: cleanString(item.duration)
  }));
};

const cleanEducationTimeline = (degrees) => {
  if (!Array.isArray(degrees)) {
    return [];
  }

  return degrees.map((item) => ({
    college: cleanString(item.college),
    degree_name: cleanString(item.degree_name),
    from_to: cleanString(item.from_to)
  }));
};

export const saveParsedResume = async (userId, parsed, resumeUrl) => {
  const experienceTimeline = cleanExperienceTimeline(parsed.experienceTimeline);
  const educationTimeLine = cleanEducationTimeline(parsed.degree);

  const jd = await prisma.jobDescription.findFirst({ where: { userId } });
  const nextStep = jd ? 'mcq' : 'info';

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(cleanString(parsed.name) ? { name: cleanString(parsed.name) } : {}),
      ...(cleanString(parsed.phone) ? { phone: cleanString(parsed.phone) } : {}),
      ...(cleanString(parsed.location) ? { location: cleanString(parsed.location) } : {}),
      ...(cleanString(parsed.designation) ? { designation: cleanString(parsed.designation) } : {}),
      ...(cleanString(parsed.experience) ? { experienceYear: cleanString(parsed.experience) } : {}),
      skills: cleanSkills(parsed.skills),
      resumeUrl,
      currentStep: nextStep,
      experienceTimeline: {
        deleteMany: {},
        create: experienceTimeline
      },
      educationTimeLine: {
        deleteMany: {},
        create: educationTimeLine
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      location: true,
      resumeUrl: true,
      skills: true,
      designation: true,
      experienceYear: true,
      currentStep: true,
      experienceTimeline: true,
      educationTimeLine: true,
    }
  });
};