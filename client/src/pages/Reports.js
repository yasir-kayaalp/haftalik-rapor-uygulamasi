import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TextField, Button, Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { jsPDF } from "jspdf";
import 'jspdf-autotable';

import { font } from './font';

const Reports = () => {
  const [data, setData] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const [editingId, setEditingId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    console.log('Current data state:', data);
  }, [data]);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/data');
      console.log('Fetched data:', response.data);
      // Her öğe için benzersiz bir id olduğundan emin olalım
      const dataWithIds = response.data.map((item, index) => ({
        ...item,
        id: item.id || `item-${index}`
      }));
      setData(dataWithIds);
    } catch (error) {
      console.error('Veri çekme hatası:', error);
    }
  };

  function getCurrentWeek() {
    const now = new Date();
    const onejan = new Date(now.getFullYear(), 0, 1);
    return Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  }

  const handleWeekChange = (event) => {
    setSelectedWeek(event.target.value);
  };

  // Tarih aralığını hesaplayan yardımcı fonksiyon
  function getWeekDateRange(year, weekNumber) {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = firstDayOfYear.getDay() > 0 ? firstDayOfYear.getDay() - 1 : 6;
    const firstWeekStart = new Date(year, 0, 1 + (7 - daysOffset));
    
    const weekStart = new Date(firstWeekStart.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    
    const formatDate = (date) => {
      return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    
    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  }

  const generatePDF = () => {
    console.log('Generating PDF for week:', selectedWeek);
    const doc = new jsPDF();
    
    // Türkçe karakterler için font ekleme
    doc.addFileToVFS('Roboto-Regular.ttf', font);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');

    // Başlık
    doc.setFontSize(14);
    doc.text(`Hafta ${selectedWeek} Raporu`, 14, 10);
    
    // Tarih aralığını hesapla ve ekle
    const currentYear = new Date().getFullYear();
    const dateRange = getWeekDateRange(currentYear, parseInt(selectedWeek));
    doc.setFontSize(8);
    doc.text(dateRange, 14, 15);

    // Departmanları grupla
    const departments = [...new Set(data.map(item => item.department))];
    
    let startY = 20;
    let totalOrder = 0;
    let totalShipment = 0;

    departments.forEach((department, index) => {
      let tableData;
      
      const filteredData = data.filter(item => 
        item.department === department && 
        item.week.toString() === selectedWeek.toString()
      );

      if (department === 'Sevkiyata Hazır') {
        tableData = [['Şirket', 'KG']];
        filteredData.forEach(item => {
          tableData.push([item.company, item.kg]);
        });
      } else {
        tableData = [['Gün', 'Şirket', 'KG']];
        const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
        
        days.forEach(day => {
          const dayData = filteredData.filter(item => {
            const date = new Date(item.date);
            return days[date.getDay() - 1] === day || (date.getDay() === 0 && day === 'Paz');
          });

          if (dayData.length > 0) {
            const companies = dayData.map(item => item.company).join(' | ');
            const totalKg = dayData.reduce((sum, item) => sum + Number(item.kg), 0);
            tableData.push([day, companies, totalKg.toString()]);
            
            if (department === 'Sipariş') totalOrder += totalKg;
            if (department === 'Sevkiyat') totalShipment += totalKg;
          } else {
            tableData.push([day, '-', '-']);
          }
        });
      }

      // Departman başlığı
      doc.setFontSize(10);
      doc.text(department, 14, startY - 3);

      // Tabloyu çiz
      doc.autoTable({
        startY: startY,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'grid',
        styles: { font: 'Roboto', fontSize: 6, cellPadding: 1 },
        headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: 'bold' },
        columnStyles: department === 'Sevkiyata Hazır' 
          ? { 0: { cellWidth: 130 }, 1: { cellWidth: 30 } }
          : { 0: { cellWidth: 15 }, 1: { cellWidth: 110 }, 2: { cellWidth: 20 } },
        margin: { top: 5 },
      });

      startY = doc.lastAutoTable.finalY + 10;
    });

    // Veri analizi
    doc.setFontSize(10);
    doc.text('Haftalık Analiz', 14, startY + 3);
    doc.setFontSize(7);
    doc.text(`Toplam Sipariş: ${totalOrder} KG | Toplam Sevkiyat: ${totalShipment} KG | Fark: ${totalOrder - totalShipment} KG`, 14, startY + 10);
    
    const fulfillmentRate = totalOrder > 0 ? ((totalShipment / totalOrder) * 100).toFixed(2) : '0.00';
    doc.text(`Karşılama Oranı: %${fulfillmentRate} | En yoğun gün: ${findBusiestDay(data, selectedWeek)}`, 14, startY + 15);

    startY += 20;

    // El yazısı notlar
    doc.setFontSize(8);
    doc.text('EL YAZISI NOTLAR', 14, startY);
    doc.line(14, startY + 3, 196, startY + 3);
    doc.line(14, startY + 10, 196, startY + 10);
    doc.line(14, startY + 17, 196, startY + 17);

    // Footer ve imza
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text('Developed by Yasir Kayaalp', 14, doc.internal.pageSize.height - 10);
      doc.text('Sayfa ' + i + ' / ' + pageCount, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    }

    // İmza
    doc.setFontSize(8);
    doc.text('Hazırlayan: Yasir Kayaalp', doc.internal.pageSize.width - 50, doc.internal.pageSize.height - 20, { align: 'right' });

    // PDF'i indir
    doc.save(`Hafta_${selectedWeek}_Raporu.pdf`);
  };

  // En yoğun günü bulan yardımcı fonksiyon
  function findBusiestDay(data, selectedWeek) {
    const weekData = data.filter(item => item.week.toString() === selectedWeek.toString());
    const dailyTotals = weekData.reduce((acc, item) => {
      const date = new Date(item.date);
      const day = date.toLocaleDateString('tr-TR', { weekday: 'short' });
      acc[day] = (acc[day] || 0) + Number(item.kg);
      return acc;
    }, {});

    const busiestDay = Object.entries(dailyTotals).reduce((a, b) => a[1] > b[1] ? a : b);
    return `${busiestDay[0]} (${busiestDay[1]} KG)`;
  }

  const handleEdit = (item) => {
    console.log('Editing item:', item);
    setEditingId(item.id);
    setEditingItem({ ...item });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (id) => {
    if (!id) {
      console.error('Geçersiz ID');
      return;
    }
    try {
      console.log('Gönderilen veri:', editingItem);
      // Eğer id bir string ve "item-" ile başlıyorsa, bu client-side oluşturulmuş bir id'dir
      if (typeof id === 'string' && id.startsWith('item-')) {
        // Yeni öğe ekleme işlemi
        await axios.post('http://localhost:5000/api/data', editingItem);
      } else {
        // Mevcut öğeyi güncelleme işlemi
        await axios.put(`http://localhost:5000/api/data/${id}`, editingItem);
      }
      setEditingId(null);
      setEditingItem(null);
      fetchData();
    } catch (error) {
      console.error('Güncelleme hatası:', error.response ? error.response.data : error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!id) {
      console.error('Geçersiz ID');
      return;
    }
    if (window.confirm('Bu veriyi silmek istediğinizden emin misiniz?')) {
      try {
        console.log('Silinecek veri ID:', id);
        // Eğer id bir string ve "item-" ile başlıyorsa, bu client-side oluşturulmuş bir id'dir
        if (typeof id === 'string' && id.startsWith('item-')) {
          // Client-side silme işlemi
          setData(prevData => prevData.filter(item => item.id !== id));
        } else {
          // Server-side silme işlemi
          await axios.delete(`http://localhost:5000/api/data/${id}`);
          fetchData();
        }
      } catch (error) {
        console.error('Silme hatası:', error.response ? error.response.data : error.message);
      }
    }
  };

  return (
    <Container>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" >Raporlar</Typography>
        <Box display="flex" alignItems="center">
          <TextField
            label="Hafta"
            type="number"
            value={selectedWeek}
            onChange={handleWeekChange}
            InputProps={{ inputProps: { min: 1, max: 52 } }}
            style={{ marginRight: '10px', marginTop: '30px' }}
          />
          <Button variant="contained" color="primary" onClick={generatePDF}>
            PDF İndir
          </Button>
        </Box>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Hafta</TableCell>
              <TableCell>Departman</TableCell>
              <TableCell>Şirket</TableCell>
              <TableCell>KG</TableCell>
              <TableCell>Not</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  {editingId === row.id ? 
                    <TextField name="week" value={editingItem.week} onChange={handleInputChange} /> : 
                    row.week}
                </TableCell>
                <TableCell>
                  {editingId === row.id ? 
                    <TextField name="department" value={editingItem.department} onChange={handleInputChange} /> : 
                    row.department}
                </TableCell>
                <TableCell>
                  {editingId === row.id ? 
                    <TextField name="company" value={editingItem.company} onChange={handleInputChange} /> : 
                    row.company}
                </TableCell>
                <TableCell>
                  {editingId === row.id ? 
                    <TextField name="kg" value={editingItem.kg} onChange={handleInputChange} /> : 
                    row.kg}
                </TableCell>
                <TableCell>
                  {editingId === row.id ? 
                    <TextField name="note" value={editingItem.note} onChange={handleInputChange} /> : 
                    row.note}
                </TableCell>
                <TableCell>
                  {editingId === row.id ? (
                    <Button onClick={() => handleSave(row.id)}>Kaydet</Button>
                  ) : (
                    <>
                      <IconButton onClick={() => handleEdit(row)}><EditIcon /></IconButton>
                      <IconButton onClick={() => handleDelete(row.id)}><DeleteIcon /></IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Reports;