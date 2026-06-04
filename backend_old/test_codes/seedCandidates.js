import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../.env')
});

console.log("MONGO_URI =", process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    const candidateAccounts = [
      { email: 'test@gmail.com', password: 'test', name: 'test', role: 'candidate' }
    ];

    for (const acc of candidateAccounts) {
      const existing = await User.findOne({ email: acc.email });
      if (!existing) {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(acc.password, salt);
        await User.create({
          email: acc.email,
          password: hashed,
          name: acc.name,
          role: acc.role,
          currentStep: 'info'  
        });
        console.log(`Added Candidate: ${acc.email}`);
      } else {
        console.log(`Candidate exists: ${acc.email}`);
      }
    }

    mongoose.disconnect();
  })
  .catch(err => console.error(err));