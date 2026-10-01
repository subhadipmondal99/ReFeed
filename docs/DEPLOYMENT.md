# ReFeed - Deployment Guide

## 1. Deployment Overview

ReFeed uses separate deployment environments for the frontend application and the machine learning API.

```text
                    ReFeed Project
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
       Vercel Frontend          Render ML API
       React + Vite             FastAPI + XGBoost
             │                       │
             │                       │
             └───────────┬───────────┘
                         │
                         ▼
                    Firebase
                Authentication
                  + Firestore