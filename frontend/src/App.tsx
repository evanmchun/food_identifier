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
      const response = await axios.post('https://food-identifier-unxy.onrender.com/api/analyze-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setAnalysis(response.data.analysis)
    } catch (err) {
      setError('Error analyzing image. Please try again.')
      console.error(err)
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
              Analysis Results:
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
