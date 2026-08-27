# BotFolio: AI-Powered Hiring Assistant

BotFolio is an end-to-end, automated AI recruitment platform designed to evaluate candidates seamlessly through a 5-step structured pipeline: from resume parsing to job description matching, dynamic MCQ tests, interactive video interviews with speech-to-text evaluation, and sandboxed coding challenges.

---

##  Technology Stack

| Layer | Technology | Key Usage / Details |
| :--- | :--- | :--- |
| **Frontend** | React, React Router Dom | Single Page Application with dynamic state tracking, Tailwind CSS, Monaco Editor (for coding challenges) |
| **Backend** | Node.js, Express | RESTful APIs, rate-limiting, CORS, authentication middleware, subprocess integration for Python scripts |
| **Database & ORM** | PostgreSQL, Prisma | Relational database storage, transactional state tracking, indexing, migrations, and seed scripts |
| **AI & LLM Services** | OpenRouter API (Gemini/Claude) | Customized prompt engineering for MCQ generation, Video question synthesis, response transcription grading, and coding solution evaluation |
| **Speech-to-Text** | Google Cloud Speech-to-Text | Real-time audio extraction and transcription from candidate video responses |
| **Code Execution** | JDoodle API | Sandboxed execution of candidate solutions (JS, Python, C++) against pre-configured test cases |
| **Media Processing** | FFmpeg, Python | Subprocess scripts (`video_to_audio.py` & `pdf_to_text.py`) for audio extraction and document translation |

---

##  Architecture Overview

The platform is designed around a structured, sequential client-server model where state updates dictate flow access (proctoring & step-guards).

```mermaid
graph TD
    A[React Client] -- Auth & State Guards --> B[Express Server]
    B -- Queries --> C[(PostgreSQL Database)]
    B -- Fetch & Evaluate --> D[OpenRouter API]
    B -- Transcribe Audio --> E[Google Cloud Speech-to-Text]
    B -- Compile & Run Code --> F[JDoodle API]
    B -- Run Subprocesses --> G[Python / FFmpeg Scripts]
```

---

##  Database Design (Entity-Relationship Diagram)

The PostgreSQL database schema is managed via Prisma. Here is the relational database layout:

```mermaid
erDiagram
    User {
        String id PK
        String name
        String email UK
        String password
        Role role
        String refreshToken
        DateTime refreshTokenExpires
        String phone
        String location
        String resumeUrl
        Step currentStep
        StringArray skills
        String designation
        String experienceYear
        Float mcqScore
        Float videoScore
        Float codingScore
        DateTime createdAt
    }
    
    ExperienceTimeline {
        String id PK
        String title
        String company
        String duration
        String userId FK
    }

    EducationTimeLine {
        String id PK
        String college
        String degree_name
        String from_to
        String userId FK
    }

    JobDescription {
        String id PK
        String userId FK
        String title
        String content
        DateTime createdAt
        DateTime updatedAt
    }

    McqAttempt {
        String id PK
        String userId FK
        Float score
        Boolean completed
        DateTime createdAt
        DateTime updatedAt
    }

    McqQuestion {
        String id PK
        String attemptId FK
        String question
        StringArray options
        String correct
        String explanation
        String topic
        String difficulty
        String competency
        String candidateAnswer
        Boolean isCorrect
        DateTime createdAt
    }

    VideoInterview {
        String id PK
        String userId FK
        Int currentStep
        Int totalSteps
        Boolean completed
        Float finalScore
        DateTime createdAt
        DateTime updatedAt
    }

    VideoInterviewStep {
        String id PK
        String interviewId FK
        Int stepNumber
        String question
        String videoUrl
        String audioUrl
        String transcript
        Float score
        Float relevance
        Float clarity
        Float confidence
        String feedback
        Boolean completed
        DateTime createdAt
        DateTime updatedAt
    }

    CodingAttempt {
        String id PK
        String userId FK
        String question
        Json testCases
        String code
        String language
        Float score
        String feedback
        Boolean completed
        DateTime createdAt
    }

    User ||--o{ ExperienceTimeline : "has"
    User ||--o{ EducationTimeLine : "has"
    User ||--o{ JobDescription : "uploads"
    User ||--o{ McqAttempt : "takes"
    User ||--o{ VideoInterview : "undergoes"
    User ||--o{ CodingAttempt : "solves"
    
    McqAttempt ||--o{ McqQuestion : "contains"
    VideoInterview ||--o{ VideoInterviewStep : "comprises"
```

---

##  Candidate Pipeline Workflow

Candidates flow sequentially through the 5 steps. Access to any step is strictly guarded based on the `currentStep` stored in the database.

```mermaid
stateDiagram-v2
    [*] --> InfoRound : Resume & JD Upload
    InfoRound --> McqRound : Parse Successful & Save
    McqRound --> VideoRound : MCQ Completed & Submitted
    VideoRound --> CodingRound : 5 Video Questions Done
    CodingRound --> Completed : Solution Submitted
    Completed --> [*] : Results Review
```

### 1. Info / Setup Stage (`info`)
*   **Action:** Candidate uploads their resume in PDF format and inputs the Target Job Description (JD).
*   **Backend Subprocess:** A Python script `pdf_to_text.py` extracts raw text from the PDF.
*   **AI Service:** OpenRouter parses the extracted text into structured JSON fields (name, phone, skills, experience, education, designation).
*   **Result:** Candidate edits the parsed details, saves the profile, and locks the JD. The step updates to `mcq`.

### 2. MCQ Assessment Stage (`mcq`)
*   **Action:** Candidate takes a dynamically generated MCQ test.
*   **AI Service:** OpenRouter synthesizes 10-15 multiple-choice questions matching the candidate's skills and experience against the uploaded job description.
*   **Flow Security:** Questions are timed (30-second limit per question) with automatic submission upon timeout.
*   **Result:** Score is saved, and the step updates to `video`.

### 3. Video Interview Stage (`video`)
*   **Action:** A 5-question conversational interview.
*   **AI Service:** OpenRouter generates relevant behavioral and technical interview questions one by one.
*   **Media Pipeline:**
    1.  The client captures video and audio inputs from the webcam via the browser's MediaRecorder API.
    2.  The raw video (`.webm`) is uploaded to GCP Storage.
    3.  A Python script `video_to_audio.py` extracts the audio channel into an MP3 file using `ffmpeg`.
    4.  The audio is transcribed via the Google Cloud Speech-to-Text API.
    5.  OpenRouter grades the response transcript based on **Relevance**, **Clarity**, and **Confidence**.
*   **Result:** After 5 questions, the overall score is aggregated, and the step updates to `coding`.

### 4. Coding Challenge Stage (`coding`)
*   **Action:** Candidate solves a programming problem matching the required skills.
*   **Editor:** The frontend embeds a Monaco code editor supporting JavaScript, Python, C++, and Java.
*   **Sandbox Compilation:** The code is sent to the Express server, which delegates execution to the **JDoodle API** against configured test cases.
*   **Result:** Code correctness is calculated, final LLM feedback is generated, and the step updates to `completed`.

### 5. Results View Stage (`completed`)
*   **Action:** Candidate sees their final grading panel.
*   **Features:** Overall score breakdown with visual charts, topic-specific MCQ strengths and weaknesses, video communication analysis, and final submitted code.

---

##  Proctoring and Security Guardrails

To ensure evaluation integrity, the system implements several proctoring layers:
*   **Step Guards:** React Router guards (`StepGuard.jsx`, `ProtectedRoute.jsx`) check user authentication state and block access to URLs matching future or skipped pipeline stages.
*   **Proctored Layout:** Enforces full-screen mode, blocks window focus shifting (blur/visibility checks), restricts clipboard copying/cutting/pasting, and blocks common developer tool shortcuts (F12, Cmd+Option+I, etc.).
*   **Rate Limiting:** Protects key endpoints (e.g., authentication) from denial-of-service and brute force attempts.

---

##  Setup and Installation

### Prerequisites
*   Node.js (v18+)
*   Python (v3.9+) with `pip`
*   FFmpeg installed on the host system
*   PostgreSQL running database instance

### 1. Environment Configuration

Create a `.env` file inside the `backend` folder:
```env
PORT=5050
DATABASE_URL="postgresql://username:password@localhost:5432/botfolio_db?schema=public"
JWT_SECRET="your_jwt_secret"
OPENROUTER_API_KEY="your_openrouter_api_key"
OPENROUTER_MODEL="google/gemini-2.5-flash"
GCP_KEY_FILE="./gcp-key.json"
JDOODLE_CLIENT_ID="your_jdoodle_client_id"
JDOODLE_CLIENT_SECRET="your_jdoodle_client_secret"
```

Configure Google Cloud credentials in `backend/gcp-key.json` for Cloud Storage and Speech-to-Text.

### 2. Backend Setup
1.  Navigate to the backend folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Install Python dependencies:
    ```bash
    pip install ffmpeg-python PyPDF2
    ```
4.  Run Prisma Migrations:
    ```bash
    npx prisma migrate dev --name init
    ```
5.  Seed Database (optional):
    ```bash
    node prisma/seed.js
    ```
6.  Start the server:
    ```bash
    npm run dev
    ```

### 3. Frontend Setup
1.  Navigate to the frontend folder:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start development server:
    ```bash
    npm run dev
    ```

The application will be accessible at http://localhost:5173, communicating with the backend at http://localhost:5050.
