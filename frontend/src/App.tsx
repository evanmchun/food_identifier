import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Alert,
  Chip
} from '@mui/material'
import axios from 'axios'

interface Ingredient {
  name: string;
  position: { x: number; y: number };
}

function App() {
  const [image, setImage] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<string>('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setImage(acceptedFiles[0])
      setAnalysis('')
      setIngredients([])
      setError('')
    }
  })

  const parseIngredients = (analysisText: string) => {
    const lines = analysisText.split('\n');
    const ingredients: Ingredient[] = [];
    let currentY = 10;

    lines.forEach((line) => {
      if (line.includes('**') && line.includes(':')) {
        const name = line.replace(/\*\*/g, '').split(':')[0].trim();
        ingredients.push({
          name,
          position: { x: Math.random() * 60 + 10, y: currentY }
        });
        currentY += 20;
      }
    });

    return ingredients;
  };

  const analyzeImage = async () => {
    if (!image) return

    setLoading(true)
    setError('')
    setIngredients([])

    const formData = new FormData()
    formData.append('image', image)

    try {
      console.log('Sending image for analysis:', {
        name: image.name,
        type: image.type,
        size: image.size
      });

      const response = await axios.post('https://food-identifier-unxy.onrender.com/api/analyze-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      })
      
      console.log('Received analysis response:', response.data);
      setAnalysis(response.data.analysis)
      setIngredients(parseIngredients(response.data.analysis))
    } catch (err: any) {
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        code: err.code
      });

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
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Food Identifier
        </Typography>
        
        <Paper
          {...getRootProps()}
          sx={{
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragActive ? '#f0f0f0' : 'white',
            border: '2px dashed #ccc',
            mb: 3
          }}
        >
          <input {...getInputProps()} />
          {image ? (
            <Box sx={{ position: 'relative' }}>
              <img
                src={URL.createObjectURL(image)}
                alt="Uploaded food"
                style={{ maxWidth: '100%', maxHeight: '300px' }}
              />
              {ingredients.map((ingredient, index) => (
                <Chip
                  key={index}
                  label={ingredient.name}
                  sx={{
                    position: 'absolute',
                    top: `${ingredient.position.y}%`,
                    left: `${ingredient.position.x}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 1)',
                    }
                  }}
                />
              ))}
              <Typography variant="body1" sx={{ mt: 2 }}>
                Click to change image
              </Typography>
            </Box>
          ) : (
            <Typography variant="body1">
              Drag and drop an image here, or click to select one
            </Typography>
          )}
        </Paper>

        {image && !loading && (
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <button
              onClick={analyzeImage}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Analyze Image
            </button>
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {analysis && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Detailed Analysis:
            </Typography>
            <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
              {analysis}
            </Typography>
          </Paper>
        )}
      </Box>
    </Container>
  )
}

export default App
