import React from 'react';
import { Typography } from '@mui/material';

function Home() {
  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Hoş Geldiniz
      </Typography>
      <Typography paragraph>
        Bu uygulama, haftalık raporlarınızı oluşturmanıza ve yönetmenize yardımcı olur.
      </Typography>
    </div>
  );
}

export default Home;