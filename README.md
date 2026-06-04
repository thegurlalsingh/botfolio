# BotFolio – Intelligent Hiring Assistant Backend

BotFolio is an AI-powered recruitment platform built with **NestJS**, **PostgreSQL**, and **Prisma ORM**. It automates candidate evaluation through resume analysis, personalized MCQs, video interviews, and coding assessments using Large Language Models (LLMs) and cloud-based processing services.

## System Architecture

```mermaid
flowchart LR

    Client[Frontend Application]

    subgraph Backend["NestJS Backend"]
        Controllers[Controllers]
        Services[Business Services]
        AI[AI Layer<br/>LLM Wrappers + Global LLM Service]

        Controllers --> Services
        Services --> AI
    end

    subgraph Storage
        DB[(PostgreSQL)]
        GCS[[Google Cloud Storage]]
    end

    subgraph Processing
        PDF[pdf_to_text.py]
        AUDIO[video_to_audio.py]
        LLM[llm.py]
    end

    subgraph External_APIs["External Services"]
        Speech[Google Speech-to-Text]
        JDoodle[JDoodle API]
        OpenRouter[OpenRouter API]
    end

    Client --> Controllers

    Services --> DB
    Services --> GCS

    Services -.-> PDF
    Services -.-> AUDIO
    AI -.-> LLM

    Services --> Speech
    Services --> JDoodle
    LLM --> OpenRouter
```

## Core Components

| Component             | Responsibility                                       |
| --------------------- | ---------------------------------------------------- |
| Frontend              | Candidate-facing assessment portal                   |
| NestJS Backend        | REST APIs, orchestration, and business logic         |
| PostgreSQL + Prisma   | Persistent storage and ORM layer                     |
| Google Cloud Storage  | Resume PDFs, interview videos, and audio assets      |
| Python Workers        | PDF parsing, audio extraction, and LLM integration   |
| OpenRouter            | Resume analysis, question generation, and evaluation |
| Google Speech-to-Text | Video interview transcription                        |
| JDoodle               | Secure code execution environment                    |



## Database Schema

The relational schema tracks candidate progress across all assessment stages and stores evaluation artifacts generated during each step.

<p align="center">
  <img src="https://github.com/user-attachments/assets/b6dc1965-441b-4b21-b6d9-b46bd75f6b9e" width="450" alt="Database Schema"/>
</p>


## Candidate Evaluation Workflow

### 1. Resume Analysis

* Candidate uploads a PDF resume.
* Resume is stored in Google Cloud Storage.
* `pdf_to_text.py` extracts textual content.
* The LLM converts raw text into structured profile information:

  * Skills
  * Experience
  * Previous companies
  * Job roles
  * Education
* Extracted information is persisted in PostgreSQL.

### 2. Personalized MCQ Assessment

* The system checks for existing unfinished attempts.
* If none exist, the LLM generates personalized technical MCQs based on the candidate's profile.
* Answers are evaluated automatically.
* Scores are recorded and candidate progress advances.

### 3. Video Interview Assessment

* The LLM generates a resume-specific interview question.
* Candidate records and uploads a video response.
* Video is stored in Google Cloud Storage.
* `video_to_audio.py` extracts audio from the uploaded file.
* Google Speech-to-Text generates a transcript.
* The transcript is evaluated by the LLM for:

  * Relevance
  * Communication skills
  * Clarity
  * Confidence
  * Overall performance


### 4. Coding Assessment

* The LLM selects an appropriate coding problem based on the candidate's skill profile.
* Candidate submits code through an integrated coding environment.
* JDoodle executes submissions securely.
* Hidden test cases are evaluated automatically.
* The LLM analyzes:

  * Time complexity
  * Space complexity
  * Code quality
  * Solution approach

Upon successful completion, the assessment is marked as **Completed**.


## Getting Started

### Prerequisites

* Node.js 18+
* Python 3.x
* PostgreSQL
* FFmpeg
* Google Cloud credentials


## Environment Configuration

Create a `.env` file:

```env
PORT=3000

DATABASE_URL="postgresql://user:password@localhost:5432/hiring_db?schema=public"

# Authentication
JWT_SECRET="your-jwt-access-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"

# Google Cloud
GCP_PROJECT_ID="your-gcp-project-id"
GCP_KEY_FILE="path/to/gcp-key.json"
GCP_BUCKET="your-gcp-bucket-name"

# OpenRouter
OPENROUTER_API_KEY="your-openrouter-api-key"

# JDoodle
JDOODLE_CLIENT_ID="your-jdoodle-client-id"
JDOODLE_CLIENT_SECRET="your-jdoodle-client-secret"
```

## Installation

### Install Dependencies

```bash
npm install

pip install pdfplumber ffmpeg-python openai
```

### Run Database Migrations

```bash
npx prisma migrate dev
```

### Seed Sample User

```bash
npx ts-node prisma/seedUser.ts
```

### Start the Server

```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

## Future Enhancements

### Real-Time Video Assessment

* Replace batch WebM uploads with chunked video streaming.
* Integrate WebRTC/RTMP pipelines for real-time interview processing.
* Enable live speech-to-text transcription during interviews.
* Perform real-time response validation and scoring.

### Assessment Integrity & Proctoring

* Active tab-switch detection.
* Camera and microphone availability checks.
* AI-powered copy-paste detection during coding assessments.
* Suspicious activity monitoring and flagging.
* Browser focus and session monitoring.

### Reliability & Scalability

* Introduce BullMQ-based background processing.
* Add retry policies for:

  * OpenRouter LLM requests
  * Google Speech-to-Text jobs
  * Media processing tasks
* Implement job queues for long-running evaluation workflows.
* Improve fault tolerance and recovery mechanisms.

### Advanced Evaluation

* Adaptive question generation based on previous responses.
* Multi-round conversational interviews.
* Skill-gap analysis and candidate benchmarking.
* AI-generated hiring recommendations and detailed feedback reports.

```
