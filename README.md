# Anzen - AI-Driven Financial Insights Product

Anzen is an AI-powered financial insights platform that leverages Retrieval-Augmented Generation (RAG) and Large Language Models (LLMs) to provide dynamic and up-to-date financial news and data. The product features a globe rendered using 3D models, offering a visually engaging landing page experience. This repository contains the code for the Anzen web app, built using Next.js with TypeScript.

## Demo Video
Watch the full demo on YouTube: 

[![Anzen Demo](https://github.com/user-attachments/assets/da873d6b-94ca-4877-ae4e-c606bfa54dbd)](https://www.youtube.com/watch?v=q4aatJOJMj0)


## Features

- **AI-Driven Insights**: Integrates RAG and LLMs to deliver real-time financial data and news.
- **3D Globe Model**: The landing page hero section includes a dynamic, interactive 3D globe built with Three.js and GLTF models.
- **API Integration**: Fetches financial news based on ticker symbols using a custom-built API.
- **Custom Audio Recording**: Users can record audio as part of the interaction on the platform.
- **Responsive Design**: The application is optimized for performance across different devices.

## Screenshots

### Landing Page
![landing](https://github.com/user-attachments/assets/d9cf208d-00e1-4ab6-b202-9a083148576c)

### Features Overview
![features](https://github.com/user-attachments/assets/336727bf-b2fc-4baa-9b1f-9ed168afacef)


### Insightful Chart Question Answering
![image-chart](https://github.com/user-attachments/assets/1c2a75c9-af12-4bdf-b274-188ef41aaef6)

### AI Summary of Web Scraped Articles
![ai_summary](https://github.com/user-attachments/assets/2cdbed4e-b123-4ea2-b54b-9885ba27474e)



## How to Run the Project

1. **Clone the Repository**:
 ```bash
   git clone https://github.com/your-username/anzen-ai-financial-insights.git
   cd anzen-ai-financial-insights
 ```
   
2. **Install Dependencies:**
   Make sure you have Node.js installed. Then run:
 ``` bash
  npm install
```

3. **Run the Development Server:**
   To start the Next.js development server, run:

  ```bash
  npm run dev
 ```
4. **Server**:
   
   Run Atmecs.ipynb in ./backend
   
6. **Access the App:**
   Once the server is running, you can access the app at:

```bash
http://localhost:3000
```

## Tech Stack
**Framework:** Next.js
**Language:** TypeScript
**3D Model Rendering:** Three.js
**Audio:** Whisper
**Backend:** FastAPI


