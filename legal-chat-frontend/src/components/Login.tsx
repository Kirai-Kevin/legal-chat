import { useState, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import axios from 'axios';
import debounce from 'lodash/debounce';

interface LoginProps {
  onLogin: (user: { userId: string; nickname: string }) => void;
}

enum UserRole {
  CLIENT = 'client',
  ATTORNEY = 'attorney',
}

export default function Login({ onLogin }: LoginProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  // Debounce the submit function to prevent rapid requests
  const debouncedSubmit = useCallback(
    debounce(async (formData: { name: string; email: string; role: UserRole }) => {
      try {
        const response = await axios.post(`${backendUrl}/users/register`, formData);
        const { sendbirdUserId: userId, nickname } = response.data;
        onLogin({ userId, nickname });
      } catch (err: unknown) {
        let errorMessage = 'Failed to create user. Please try again.';
        if (axios.isAxiosError(err) && err.response?.status === 429) {
          errorMessage = 'Too many attempts. Please wait a few minutes and try again.';
        }
        setError(errorMessage);
        console.error('Login error:', err);
      } finally {
        setLoading(false);
      }
    }, 1000), // 1 second delay between submissions
    [onLogin, backendUrl]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError('');
    
    debouncedSubmit({ name, email, role });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mt: 8,
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          Legal Chat Login
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select 
              value={role} 
              onChange={(e) => setRole(e.target.value as UserRole)}
              disabled={loading}
            >
              <MenuItem value={UserRole.CLIENT}>Client</MenuItem>
              <MenuItem value={UserRole.ATTORNEY}>Attorney</MenuItem>
            </Select>
          </FormControl>
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
