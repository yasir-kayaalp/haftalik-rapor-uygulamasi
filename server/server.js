const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Basit veri doğrulama fonksiyonu
const validateData = (item) => {
  return item.week && item.department && item.company && item.kg;
};

async function run() {
  try {
    await client.connect();
    console.log("MongoDB'ye bağlandı");
    const database = client.db("haftalik_rapor");
    const dataCollection = database.collection("data");

    app.post('/api/data', async (req, res) => {
      try {
        console.log('Alınan veri:', req.body);
        if (!validateData(req.body)) {
          return res.status(400).json({ error: 'Geçersiz veri formatı' });
        }
        const result = await dataCollection.insertOne(req.body);
        res.json({ message: 'Veri başarıyla alındı', item: { ...req.body, _id: result.insertedId } });
      } catch (error) {
        console.error('Veri ekleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
      }
    });

    app.get('/api/data', async (req, res) => {
      try {
        const cursor = dataCollection.find({});
        const results = await cursor.toArray();
        res.json(results);
      } catch (error) {
        console.error('Veri getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
      }
    });

    app.put('/api/data/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const updatedData = req.body;
        if (!validateData(updatedData)) {
          return res.status(400).json({ error: 'Geçersiz veri formatı' });
        }
        const result = await dataCollection.updateOne(
          { _id: ObjectId(id) },
          { $set: updatedData }
        );
        if (result.matchedCount === 0) {
          res.status(404).json({ error: 'Güncellenecek veri bulunamadı' });
        } else {
          res.json({ message: 'Veri başarıyla güncellendi', item: { ...updatedData, _id: id } });
        }
      } catch (error) {
        console.error('Veri güncelleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
      }
    });

    app.delete('/api/data/:id', async (req, res) => {
      try {
        const { id } = req.params;
        console.log('Sunucu: Silinecek veri ID:', id);
        const result = await dataCollection.deleteOne({ _id: ObjectId(id) });
        if (result.deletedCount === 0) {
          res.status(404).json({ error: 'Silinecek veri bulunamadı' });
        } else {
          res.json({ message: 'Veri başarıyla silindi' });
        }
      } catch (error) {
        console.error('Veri silme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
      }
    });

  } catch (error) {
    console.error("MongoDB bağlantı hatası:", error);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Sunucu ${port} portunda çalışıyor`);
});