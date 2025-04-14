import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  Box, 
  Typography,
  CircularProgress,
  Alert
} from '@mui/material'
import axios from 'axios'

// Default pasta image and ingredients
const DEFAULT_INGREDIENTS = 'Spaghetti pasta, tomato sauce, fresh basil leaves, herbs';

function App() {
  const [image, setImage] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<string>(DEFAULT_INGREDIENTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [isDefaultImage, setIsDefaultImage] = useState(true)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setImage(file);
      setAnalysis('');
      setError('');
      setIsDefaultImage(false);

      // Automatically analyze the image
      setLoading(true);
      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await axios.post('https://food-identifier-unxy.onrender.com/api/analyze-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        });
        
        setAnalysis(response.data.analysis);
      } catch (err: any) {
        let errorMessage = 'Error analyzing image. Please try again.';
        
        if (err.response?.status === 401) {
          errorMessage = 'Authentication error. Please check the API configuration.';
        } else if (err.response?.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (err.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. Please try again.';
        } else if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
          if (err.response.data.details) {
            errorMessage += `: ${err.response.data.details}`;
          }
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  });

  const extractIngredients = (analysis: string): string => {
    if (isDefaultImage) return DEFAULT_INGREDIENTS;
    
    const lines = analysis.split('\n');
    const ingredients = lines
      .filter(line => line.includes('**'))
      .map(line => line.replace(/\*\*/g, '').split(':')[0].trim());
    return ingredients.join(', ');
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        backgroundColor: '#F5A623',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: 4,
        px: 2
      }}
    >
      <Typography 
        variant="h3" 
        component="h1" 
        sx={{ 
          color: 'white',
          fontWeight: 'bold',
          textAlign: 'center',
          mb: 4,
          fontSize: { xs: '2rem', sm: '3rem' }
        }}
      >
        Identify Your Ingredients
      </Typography>

      <Box
        {...getRootProps()}
        sx={{
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3
        }}
      >
        <input {...getInputProps()} />
        
        <button
          style={{
            padding: '12px 32px',
            fontSize: '1.25rem',
            backgroundColor: '#FFD700',
            color: '#000',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            width: '80%',
            maxWidth: '300px'
          }}
          onClick={() => {
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) fileInput.click();
          }}
        >
          Upload Image
        </button>

        <Box 
          sx={{ 
            width: '100%',
            borderRadius: '20px',
            overflow: 'hidden',
            backgroundColor: 'transparent',
            boxShadow: 'none'
          }}
        >
          <img
            src={image ? URL.createObjectURL(image) : './images/pasta.png'}
            alt="Food"
            style={{ 
              width: '100%',
              height: 'auto',
              display: 'block',
              objectFit: 'cover'
            }}
          />
        </Box>

        {loading && (
          <CircularProgress sx={{ color: 'white' }} />
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              width: '100%',
              borderRadius: '12px'
            }}
          >
            {error}
          </Alert>
        )}

        <Box 
          sx={{ 
            width: '100%',
            backgroundColor: 'white',
            borderRadius: '20px',
            p: 3,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold',
              mb: 1
            }}
          >
            Ingredients:
          </Typography>
          <Typography variant="body1">
            {extractIngredients(analysis)}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default App
