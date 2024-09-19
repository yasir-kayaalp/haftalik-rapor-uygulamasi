import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Header = () => (
  <AppBar position="static" color="default">
    <Toolbar>
      <Logo style={{ height: '65px', width: 'auto', margin: '10px' }} />
      <Typography variant="h5" style={{ flexGrow: 1, marginLeft: '10px' }}>
        Haftalık Rapor
      </Typography>
      <Button color="inherit" component={Link} to="/">Ana Sayfa</Button>
      <Button color="inherit" component={Link} to="/data-entry">Veri Girişi</Button>
      <Button color="inherit" component={Link} to="/reports">Raporlar</Button>
    </Toolbar>
  </AppBar>
);

export default Header;