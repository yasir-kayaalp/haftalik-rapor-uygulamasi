import React, { useState, useEffect } from 'react';
import { Typography, TextField, Button, Grid, Paper, Snackbar, Select, MenuItem, FormControl, InputLabel, Autocomplete } from '@mui/material';
import axios from 'axios';
import { clients } from '../data/clients';


function DataEntry() {
  const [formData, setFormData] = useState({
    date: '',
    week: '',
    department: '',
    company: '',
    kg: '',
    note: ''
  });

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [departments] = useState(['Sipariş', 'Sevkiyat', 'Boyahane', 'Sevkiyata Hazır']);

  useEffect(() => {
    const today = new Date();
    const currentWeek = getWeekNumber(today);
    setFormData(prevState => ({
      ...prevState,
      date: today.toISOString().split('T')[0],
      week: currentWeek.toString()
    }));
  }, []);

  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'date') {
      const selectedDate = new Date(value);
      const weekNumber = getWeekNumber(selectedDate);
      setFormData({ ...formData, date: value, week: weekNumber.toString() });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/data', formData);
      console.log('Sunucu yanıtı:', response.data);
      setOpenSnackbar(true);
      setFormData({ ...formData, department: '', company: '', kg: '', note: '' });
    } catch (error) {
      console.error('Veri gönderme hatası:', error);
    }
  };

  return (
    <Paper style={{ padding: 16 }}>
      <Typography variant="h5" gutterBottom>
      Günlük Veri Girişi
</Typography>
<form onSubmit={handleSubmit}>
<Grid container spacing={2}>
<Grid item xs={12} sm={6}>
<TextField
fullWidth
label="Tarih"
type="date"
name="date"
value={formData.date}
onChange={handleChange}
InputLabelProps={{ shrink: true }}
/>
</Grid>
<Grid item xs={12} sm={6}>
<TextField
fullWidth
label="Hafta"
type="number"
name="week"
value={formData.week}
InputProps={{ readOnly: true }}
/>
</Grid>
<Grid item xs={12} sm={6}>
<FormControl fullWidth>
<InputLabel>Departman</InputLabel>
<Select
name="department"
value={formData.department}
onChange={handleChange}
>
{departments.map((dept) => (
<MenuItem key={dept} value={dept}>{dept}</MenuItem>
))}
</Select>
</FormControl>
</Grid>
<Grid item xs={12} sm={6}>
<Autocomplete
options={clients}
getOptionLabel={(option) => option}
renderInput={(params) => <TextField {...params} label="Müşteri" />}
value={formData.company || null}
onChange={(event, newValue) => {
setFormData({ ...formData, company: newValue });
}}
fullWidth
/>
</Grid>
<Grid item xs={12} sm={6}>
<TextField
fullWidth
label="KG"
type="number"
name="kg"
value={formData.kg}
onChange={handleChange}
/>
</Grid>
<Grid item xs={12}>
<TextField
fullWidth
label="Not (İsteğe bağlı)"
multiline
rows={4}
name="note"
value={formData.note}
onChange={handleChange}
/>
</Grid>
<Grid item xs={12}>
<Button type="submit" variant="contained" color="primary">
Kaydet
</Button>
</Grid>
</Grid>
</form>
<Snackbar
anchorOrigin={{
vertical: 'bottom',
horizontal: 'left',
}}
open={openSnackbar}
autoHideDuration={3000}
onClose={() => setOpenSnackbar(false)}
message="Veri başarıyla kaydedildi"
/>
</Paper>
);
}
export default DataEntry;