import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppProvider } from './contexts/AppContext';
import AppRouter from './router/AppRouter';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppProvider>
          <AppRouter />
          <ToastContainer position="top-right" autoClose={5000} />
        </AppProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
