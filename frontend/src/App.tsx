import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Alert
} from '@mui/material'
import axios from 'axios'

function App() {
  const [image, setImage] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<string>('')
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
      setError('')
    }
  })

  const analyzeImage = async () => {
    if (!image) return

    setLoading(true)
    setError('')

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
            <Box>
              <img
                src={URL.createObjectURL(image)}
                alt="Uploaded food"
                style={{ maxWidth: '100%', maxHeight: '300px' }}
              />
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
