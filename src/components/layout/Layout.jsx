import { Box } from '@mui/material';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, py: 4, width: '100%', px: 2 }}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
};

export default Layout;