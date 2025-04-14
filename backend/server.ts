import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure CORS
app.use(cors({
  origin: ['https://food-identifier-tau.vercel.app', 'http://localhost:5173'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Add a test route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imageBuffer = req.file.buffer;
    const base64Image = imageBuffer.toString('base64');

    console.log('Sending request to OpenAI...');
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and identify all the food items, ingredients, and any visible toppings or garnishes. Provide a detailed breakdown of what you see."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    console.log('Received response from OpenAI');
    res.json({ analysis: response.choices[0].message.content });
  } catch (error: any) {
    console.error('Error analyzing image:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      type: error.type,
      status: error.status,
      stack: error.stack
    });
    
    // More specific error handling
    if (error.code === 'ENOENT') {
      return res.status(500).json({ 
        error: 'File system error',
        details: 'Could not process the image file'
      });
    }
    
    if (error.response?.status === 401) {
      return res.status(500).json({ 
        error: 'Authentication error',
        details: 'Invalid OpenAI API key'
      });
    }
    
    res.status(500).json({ 
      error: 'Error analyzing image',
      details: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 