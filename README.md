# Inpenso for Android (React Native / Expo)

Port cross-platform Android dari aplikasi expense tracker open-source **[VintusS/Inpenso](https://github.com/VintusS/Inpenso)** (lisensi MIT).

## Fitur yang Sudah Di-port
- **Home**: Ringkasan *Monthly Cashflow* (Income / Spent / Net), *Budget Progress Bar*, grafik pengeluaran 7 hari terakhir lengkap dengan garis rata-rata harian (*Avg*), *Top 5 Spending by Category*, dan daftar *Recent Transactions* yang bisa di-collapse & tap untuk edit.
- **Analytics (4 sub-tab)**:
  - **Overview**: 6 kartu ringkasan, grafik *Daily Spending*, dan *Category Breakdown*.
  - **Trends**: Grafik tren 6 bulan terakhir, perbandingan kategori bulan ini vs bulan lalu (*MoM*), dan proyeksi pengeluaran bulanan.
  - **Insights**: Statistik utama (*Top Category*, *Most Active Day*), *Smart Insights* otomatis, serta analisis pola *Weekday vs Weekend* dan *Early/Mid/Late Month*.
  - **Budget**: Input budget bulanan, status pemakaian, sisa budget per hari, saran budget otomatis, dan riwayat kepatuhan budget.
- **Transactions**: Pencarian (*Search*), filter tipe (*All / Expenses / Incomes*), filter multi-kategori, pengurutan (*Newest, Oldest, Highest, Lowest, Title A-Z*), pengelompokan per kategori, edit/hapus transaksi, dan **Undo Snackbar**.
- **Category Management**: 11 kategori bawaan + tambah/edit kategori kustom (20 ikon, 12 warna), sembunyikan/pulihkan kategori, ubah urutan, dan reset kategori bawaan ke default.
- **Settings**: Tema **System / Light / Dark**, 12 mata uang (termasuk **IDR / Rp**, USD, EUR, dll.), default kategori, **Export & Import JSON** (kompatibel dengan format JSON Inpenso iOS), dan Reset Data.

## Cara Menjalankan & Build APK

### 1. Preview langsung di HP Android (Expo Go)
```bash
cd /root/inpenso-android
npm start
```
Buka aplikasi **Expo Go** di Android dan scan QR code-nya.

### 2. Build APK otomatis lewat GitHub Actions (Gratis)
Push folder `inpenso-android` ke repo GitHub kamu. Workflow `.github/workflows/build-android.yml` akan otomatis menjalankan `expo prebuild` + `./gradlew assembleRelease` dan menghasilkan file **`app-release.apk`** di tab **Actions → Artifacts**.

### 3. Build APK lewat EAS Build (Expo Cloud)
```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```
