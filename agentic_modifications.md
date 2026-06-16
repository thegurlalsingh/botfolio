# BotFolio AI Agents Architecture

## Overview

BotFolio is an Agentic Hiring Intelligence Platform that simulates a real-world hiring committee through a collection of specialized AI agents.

Unlike traditional AI interview systems that follow a fixed pipeline, BotFolio dynamically adapts the interview process based on candidate performance, skill profile, and evaluation confidence.

The platform uses multiple autonomous agents that collaborate, share memory, make decisions, and continuously refine candidate assessments before producing a hiring recommendation.

---

# Agent Architecture

## 1. Hiring Orchestrator Agent

### Purpose

Acts as the central decision-maker of the entire hiring workflow.

### Responsibilities

* Initialize candidate assessment
* Maintain candidate state
* Track assessment progress
* Route tasks to specialized agents
* Determine which interview stage should occur next
* Dynamically adjust interview difficulty
* Decide whether additional rounds are required

### Inputs

* Resume profile
* Candidate history
* MCQ scores
* Coding performance
* Video interview evaluations
* Agent reports

### Outputs

* Assessment plan
* Difficulty adjustments
* Agent task assignments

### Example Decisions

Candidate performs exceptionally well in MCQs:

→ Skip beginner questions

→ Proceed to advanced coding evaluation

Candidate performs poorly in communication:

→ Trigger additional behavioral interview round

---

## 2. Candidate Profiling Agent

### Purpose

Creates and maintains a structured understanding of the candidate.

### Responsibilities

* Analyze uploaded resume
* Extract skills
* Extract education
* Extract experience
* Extract projects
* Build candidate skill graph
* Identify expertise areas

### Inputs

* Resume PDF
* Parsed resume text

### Outputs

Candidate Profile

Example:

Skills:

* React
* Next.js
* Node.js
* PostgreSQL

Experience:

* Backend Development
* Full Stack Projects

Strength Areas:

* Web Development
* API Design

Weak Areas:

* System Design
* DevOps

---

## 3. Technical Interview Agent

### Purpose

Conducts adaptive technical assessments.

### Responsibilities

* Generate personalized MCQs
* Generate coding challenges
* Adjust difficulty dynamically
* Focus on weak skill areas
* Validate technical depth

### Inputs

* Candidate profile
* Previous technical performance

### Outputs

* MCQs
* Coding challenges
* Technical evaluation report

### Adaptive Behavior

If candidate scores highly:

→ Move toward advanced system design

→ Increase coding difficulty

If candidate struggles:

→ Focus on fundamentals

→ Generate easier follow-up questions

---

## 4. Behavioral Interview Agent

### Purpose

Evaluates communication, leadership, teamwork, and behavioral traits.

### Responsibilities

* Generate behavioral questions
* Conduct conversational interviews
* Maintain interview memory
* Analyze consistency across responses
* Evaluate soft skills

### Inputs

* Resume profile
* Previous behavioral responses
* Video transcripts

### Outputs

Behavioral Assessment Report

Metrics:

* Communication
* Leadership
* Collaboration
* Problem Solving
* Ownership

### Memory-Based Interviewing

Candidate says:

"I led a team of five developers."

Future question:

"What conflict occurred within the team and how did you resolve it?"

This enables deeper behavioral analysis.

---

## 5. Coding Evaluation Agent

### Purpose

Evaluates candidate programming ability.

### Responsibilities

* Select coding challenges
* Execute code through JDoodle
* Analyze hidden test cases
* Review solution quality
* Estimate complexity

### Inputs

* Candidate code
* Execution results

### Outputs

Coding Report

Metrics:

* Correctness
* Time Complexity
* Space Complexity
* Code Quality
* Optimization

### Future Enhancements

* AST-based code analysis
* Pattern detection
* Brute Force detection
* Dynamic Programming detection
* Design Pattern identification

---

## 6. Evaluation Agent

### Purpose

Acts as the centralized assessment analyst.

### Responsibilities

* Collect evidence from all agents
* Aggregate performance metrics
* Generate candidate skill matrix
* Generate strengths and weaknesses

### Inputs

* Technical report
* Behavioral report
* Coding report
* Resume profile

### Outputs

Unified Candidate Evaluation

Example:

Technical:
8.5/10

Communication:
7.2/10

Leadership:
8.0/10

Coding:
9.1/10

Overall:
8.4/10

---

## 7. Reflection Agent

### Purpose

Evaluates the quality and completeness of the assessment process.

### Responsibilities

* Identify missing evidence
* Detect conflicting evaluations
* Verify confidence levels
* Recommend additional interviews

### Inputs

* All agent reports

### Outputs

Assessment Confidence Report

### Example

MCQ Score:
95%

Coding Score:
92%

Behavioral Evidence:
Insufficient

Decision:

Trigger additional behavioral round.

This agent prevents premature hiring decisions.

---

## 8. Hiring Manager Agent

### Purpose

Simulates a real-world hiring manager.

### Responsibilities

* Review all agent reports
* Analyze overall candidate fit
* Consider strengths and weaknesses
* Make final recommendation

### Inputs

* Evaluation Report
* Reflection Report
* Candidate Profile

### Outputs

Final Hiring Decision

Possible Outcomes:

* Strong Hire
* Hire
* Borderline Hire
* No Hire

### Example

Strong coding ability

Excellent communication

Relevant project experience

Recommendation:

Strong Hire

Reasoning:

Candidate demonstrates both technical depth and strong communication skills suitable for client-facing engineering roles.

---

# Agent Memory System

Every agent has access to a shared Candidate Memory Store.

Stored Information:

* Resume profile
* Previous answers
* Coding submissions
* Video transcripts
* Agent observations
* Assessment history

Benefits:

* Context-aware interviews
* Adaptive questioning
* Consistency checking
* Multi-round assessments

---

# Workflow

Candidate Uploads Resume

↓

Candidate Profiling Agent

↓

Hiring Orchestrator Agent

↓

Technical Interview Agent

↓

Behavioral Interview Agent

↓

Coding Evaluation Agent

↓

Evaluation Agent

↓

Reflection Agent

↓

If More Evidence Needed

→ Return To Appropriate Agent

↓

Hiring Manager Agent

↓

Final Hiring Recommendation

↓

Detailed Candidate Report

---

# Future Agent Enhancements

## Proctoring Agent

Detects:

* Tab switching
* Copy-paste behavior
* Suspicious activity
* Multiple faces on camera

## Benchmarking Agent

Compares candidates against:

* Historical candidates
* Job requirements
* Industry standards

## Recruiter Assistant Agent

Provides recruiters with:

* Candidate summaries
* Interview highlights
* Suggested follow-up questions

## Team Fit Agent

Evaluates compatibility with specific teams based on required skills and communication style.
