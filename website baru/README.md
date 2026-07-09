# Website Pencatatan Data Penjualan (Flask + SQLite)

## Fitur
- Form input penjualan (tanggal, pelanggan, produk, qty, harga satuan)
- Penyimpanan data ke SQLite via API Flask
- Tabel daftar penjualan + tombol hapus
- Desain warna biru & hijau muda + animasi elemen

## Cara Menjalankan
1) Pastikan Python terpasang.
2) Install dependency:

```bash
pip install flask flask-cors
```

3) Jalankan backend:

```bash
python server.py
```

4) Buka frontend:
- Cara paling mudah: buka `index.html` di browser.
- Backend aktif di: `http://127.0.0.1:5000`

Catatan:
- `app.js` akan memanggil API dari backend.
- Jika browser memblokir request, gunakan backend + akses via http://127.0.0.1:5500 (opsional).


## Catatan
- Data tersimpan di file `app.db` di folder project ini.

