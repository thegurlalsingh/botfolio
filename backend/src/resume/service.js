// Thin service wrapper for persisting a parsed resume via the repository.
import { saveParsedResume } from './repository.js';

export const persistParsedResume = async (userId, parsed, resumeUrl) => {
  return saveParsedResume(userId, parsed, resumeUrl);
};