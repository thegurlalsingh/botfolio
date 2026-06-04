import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { Storage } from '@google-cloud/storage';
import { PrismaService } from 'src/prisma/prisma.service';
import process from 'process';
import { resumeLLMService } from './llm.wrapper';

@Injectable()
export class ResumeService {
  constructor(private prisma: PrismaService, private resume_llm : resumeLLMService) {}
  
  async saveParsedData(userId: string, data: any){
    return this.prisma.$transaction(async (tx) => {
      await tx.experienceTimeline.deleteMany({
        where: {userId}
      });
      await tx.educationTimeLine.deleteMany({
        where: {userId}
      });

      return await tx.user.update({
        where: {id: userId},
        data: {
          name: data.name,
          phone: data.phone,
          location: data.location,
          designation: data.designation,
          skills: data.skills,
          resumeUrl: data.resumeUrl,
          currentStep: 'mcq',
          experienceTimeline: {
            create: data.experienceTimeline.map((exp: any) => ({
              title: exp.title, 
              company: exp.company,
              duration: exp.duration
            })),
          },
          educationTimeLine: {
            create: data.educationTimeLine.map((edu: any) => ({
              college: edu.college,
              degree_name: edu.degree_name,
              from_to: edu.from_to
            })),
          }
        }
      })
    })
  }

  private storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GCP_KEY_FILE,
  });

  private bucket = this.storage.bucket(process.env.GCP_BUCKET!);

  async processResume(file: Express.Multer.File, userId: string) {
    const tempPath = path.join(process.cwd(), `temp_${userId}.pdf`);
    console.log('Starting process of resume processing for user: ', userId);

    try {
      fs.writeFileSync(tempPath, file.buffer);
      console.log('Temp file saved. Uploading to GCP');

      const resumeUrl = await this.uploadToGCP(file, userId);
      console.log('Upload to GCP successful.')

      const text = await this.extractText(tempPath);
      console.log('Extracted data successfully.');

      const parsedData = await this.resume_llm.resumeLLM(text);
      console.log('Got data successfully from LLM');

      await this.saveParsedData(userId, {...parsedData, resumeUrl});
      console.log("Parsed data saved successfully!!");

      return {
        success: true,
        message: "Resume processed and saved successfully!",
        resumeUrl,
        parsedData,
      };
    }
    catch (e) {
      console.log('Error in resume parsing.', e);
      throw e;
    } 
    finally {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  private async extractText(pdfPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(process.cwd(), 'src', 'modules', 'resume', 'pdf_to_text.py');
      const pyprocess = spawn('python3', [pythonScript, pdfPath]);

      let data = '';
      let error = '';

      pyprocess.on('error', (err) => {
        console.log('Failed to start python process of pdf to text: ', err);
        reject(new Error(`Failed to start python process due to error: ${err.message}`));
      });

      pyprocess.stdout.on('data', (chunk) => {
        data += chunk.toString();
      });

      pyprocess.stderr.on('data', (chunk) => {
          console.error('Python Error Log:', chunk.toString());
          error += chunk.toString(); 
      });



      pyprocess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`PDF extraction failed: ${error}`));
        } else {
          resolve(data.trim());
        }
      });
    });
  }

  private async uploadToGCP(file: Express.Multer.File, userId: string): Promise<string> {
    const fileName = `resumes/${userId}_${Date.now()}.pdf`;
    const blob = this.bucket.file(fileName);

    await blob.save(file.buffer);


    return `https://storage.googleapis.com/${process.env.GCP_BUCKET}/${fileName}`;
  }
}