// Daftar bidang/modul Smart City dan seluruh data indikator. Tambah atau ubah data cukup di file ini.
// Format angka gaya Indonesia (titik ribuan, koma desimal)
function fmtN(n, d) { return Number(n).toLocaleString("id-ID", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }

// ---------- Definisi menu ----------
const BIDANG = [
  { id: "pemerintahan", nama: "Pemerintahan", ikon: "i-gov", sisi: "kiri", modul: [
      ["Layanan Publik Terpadu", "Loket & layanan administrasi"], ["Perizinan Online", "Status dan antrean izin"],
      ["Pengaduan Masyarakat", "Laporan warga & tindak lanjut"], ["Transparansi Anggaran", "APBD dan realisasi"],
      ["Data Perangkat Daerah", "OPD dan kontak layanan"] ] },
  { id: "ekonomi", nama: "Ekonomi", ikon: "i-eco", sisi: "kiri", modul: [
      ["UMKM & Pelaku Usaha", "Sebaran dan jenis usaha"], ["Pasar & Harga Komoditas", "Harga pangan harian"],
      ["Pertanian & Perikanan", "Produksi dan lahan"], ["Pariwisata", "Destinasi dan kunjungan"],
      ["Investasi", "Peluang dan potensi daerah"] ] },
  { id: "kependudukan", nama: "Kependudukan", ikon: "i-people", sisi: "kiri", modul: [
      ["Jumlah & Sebaran Penduduk", "Per kecamatan dan desa"], ["Kelompok Umur", "Piramida penduduk"],
      ["Kemiskinan & Bantuan Sosial", "Penerima dan sebaran"], ["Ketenagakerjaan", "Angkatan kerja dan lowongan"] ] },
  { id: "pendidikan", nama: "Pendidikan", ikon: "i-edu", sisi: "kiri", modul: [
      ["Sebaran Sekolah", "Lokasi dan jenjang"], ["Siswa & Tenaga Pendidik", "Jumlah per sekolah"],
      ["Perpustakaan", "Layanan dan koleksi"], ["Beasiswa", "Program dan penerima"] ] },
  { id: "kesehatan", nama: "Kesehatan", ikon: "i-health", sisi: "kanan", modul: [
      ["Puskesmas & Fasilitas Kesehatan", "Lokasi dan layanan"], ["Surveilans Penyakit", "Kasus per puskesmas"],
      ["Gizi & Stunting", "Status gizi balita"], ["Posyandu", "Sebaran dan kegiatan"] ] },
  { id: "lingkungan", nama: "Lingkungan", ikon: "i-leaf", sisi: "kanan", modul: [
      ["Kualitas Udara", "Indeks dan polutan"], ["Persampahan", "TPS, TPA dan pengangkutan"],
      ["Ruang Terbuka Hijau", "Luas dan sebaran"], ["Kualitas Air Sungai", "Titik pantau"] ] },
  { id: "mobilitas", nama: "Mobilitas", ikon: "i-bus", sisi: "kanan", modul: [
      ["Jaringan Jalan", "Kondisi dan status jalan"], ["Transportasi Umum", "Rute dan armada"],
      ["Lalu Lintas", "Kepadatan dan kejadian"], ["Jembatan & Infrastruktur", "Kondisi dan lokasi"] ] },
  { id: "kebencanaan", nama: "Kebencanaan", ikon: "i-alert", sisi: "kanan", modul: [
      ["Titik Panas & Karhutla", "Hotspot dan patroli"], ["Banjir & Genangan", "Titik dan ketinggian air"],
      ["Kejadian Bencana", "Riwayat dan dampak"], ["Posko & Jalur Evakuasi", "Lokasi dan rute"] ] }
];

// ---------- Data modul ----------
// Urutan DATA[idBidang][n] mengikuti urutan modul pada BIDANG di atas.
// s: "ada" (berisi data) | "tunggu" (menunggu data OPD) | "link" (terhubung ke dashboard lain)
// ind: [label, nilai, keterangan]   grafik: [{judul, labels, values, dec, urut}]   peta: indeks grafik yang mewarnai peta
const KEC  = ["Danau Panggang","Babirik","Sungai Pandan","Amuntai Selatan","Amuntai Tengah","Amuntai Utara","Banjang","Haur Gading","Paminggir","Sungai Tabukan"];
const LUAS = [136.1, 82.0, 59.9, 150.0, 77.1, 37.8, 110.6, 39.0, 192.7, 22.2];   // km², dihitung dari poligon batas pada peta
const POP  = [21548,20598,29324,32177,52441,21732,19165,17413,8495,15542];       // Dukcapil HSU, Semester I 2025
const SEK_SD  = [2162,2104,3020,3339,5203,2061,1937,1746,838,1574];
const SEK_SLA = [1126,1101,1464,1672,2747,1050,954,851,449,758];
const MUDA = [4916,4692,6627,7346,11587,4703,4264,3909,1911,3564];
const PROD = [15304,14536,20563,22581,37123,15260,13501,12110,6102,10861];
const TUA  = [1328,1370,2134,2250,3731,1769,1400,1394,482,1117];
const ANAK = [6395,6158,8611,9574,15229,6150,5537,5049,2527,4594];
const AKTA = [62.28,62.36,72.50,64.24,60.10,63.90,60.08,61.42,63.43,70.00];
const IKD  = [1.97,2.75,4.49,5.11,6.07,3.81,3.18,3.43,1.70,3.01];
const APARAT = [169,261,795,1026,2436,448,332,396,48,152];
const WIRAUS = [5631,4018,7600,9633,16156,6095,5536,4705,1572,4779];
const TANI   = [1661,3041,3554,1973,1633,2494,1974,2064,106,1405];
const NELAYAN= [312,265,15,42,31,5,8,14,1035,12];
const PELAJAR= [2507,2736,3591,5607,7026,2955,2383,2243,1045,2501];
const PENGAJAR=[87,59,89,139,275,83,25,70,35,30];
const NAKES  = [10,11,54,45,112,19,10,19,2,6];
const DISAB  = [27,73,112,95,219,93,86,63,41,52];
const KPD  = POP.map((p, i) => Math.round(p / LUAS[i]));
const RKT  = MUDA.map((m, i) => Math.round((m + TUA[i]) / PROD[i] * 1000) / 10);
const iPad = KPD.indexOf(Math.max.apply(null, KPD));
const SUMBER_DUK = "Dukcapil HSU — Buku Data Agregat Kependudukan Semester I 2025";
const tunggu = (sumber, labels, extra) => Object.assign({ s: "tunggu", ind: labels.map(l => [l, "—"]), sumber: sumber }, extra || {});

const DATA = {
  pemerintahan: [
    { s: "ada", peta: 0, sumber: SUMBER_DUK,
      ind: [["Kepemilikan akta lahir", "63,78%", "dari seluruh penduduk"], ["Kepemilikan KIA", "63,27%", "anak usia 0–17 th"],
            ["Penduduk ber-KK", "99,53%", "80.782 kepala keluarga"], ["Pengguna IKD", "4,10%", "7.073 akun aktif"]],
      grafik: [{ judul: "Kepemilikan akta kelahiran per kecamatan (%)", labels: KEC, values: AKTA, dec: 2 },
               { judul: "Aktivasi Identitas Kependudukan Digital / IKD (%)", labels: KEC, values: IKD, dec: 2 }],
      info: "Wajib KTP-el: 176.686 jiwa. Konsultasi online Dukcapil HSU lewat WhatsApp 0813-5068-5008." },
    tunggu("DPMPTSP HSU / OSS-RBA", ["Izin terbit (NIB/OSS)", "Izin dalam proses", "Rata-rata waktu layanan", "Izin terbanyak per sektor"]),
    tunggu("Kanal pengaduan Pemkab HSU / SP4N-LAPOR!", ["Laporan masuk", "Laporan selesai", "Waktu tanggap rata-rata", "Kategori terbanyak"]),
    { s: "ada", sumber: "Databoks Katadata (olahan data APBD HSU 2026); Perbup HSU No. 4 Tahun 2026 — angka dapat berubah setelah APBD Perubahan",
      ind: [["Pendapatan daerah", "Rp1.343,34 M", "anggaran 2026 (turun 9,06%)"], ["Belanja daerah", "Rp1.761,69 M", "anggaran 2026 (turun 2,08%)"],
            ["Realisasi belanja", "27,68%", "Rp487,69 M s.d. Juni 2026"], ["Transfer ke daerah", "Rp998,29 M", "anggaran 2026 (turun 17,98%)"]],
      grafik: [{ judul: "Realisasi belanja daerah s.d. Juni 2026 (Rp miliar)", dec: 2,
                 labels: ["Belanja pegawai", "Belanja barang & jasa", "Belanja lainnya", "Belanja modal"], values: [211.42, 148.51, 103.95, 23.81] }],
      info: "Belanja modal baru terealisasi Rp23,81 miliar pada semester I." },
    { s: "ada", peta: 0, sumber: SUMBER_DUK + "; jumlah desa/kelurahan sesuai buku agregat tersebut",
      ind: [["Kecamatan", "10"], ["Desa", "214"], ["Kelurahan", "5"], ["Aparatur / pejabat negara", fmtN(6063), "tercatat pada KTP"]],
      grafik: [{ judul: "Penduduk berprofesi aparatur / pejabat negara per kecamatan (jiwa)", labels: KEC, values: APARAT }],
      info: "Daftar OPD, alamat, dan kontak layanan akan ditambahkan setelah data dari bagian organisasi tersedia." }
  ],
  ekonomi: [
    { s: "ada", peta: 0, sumber: SUMBER_DUK + " (berdasarkan pekerjaan di KTP, bukan sensus usaha)",
      ind: [["Wiraswasta tercatat", fmtN(65725), "jiwa"], ["Porsi terhadap penduduk", "27,6%"],
            ["Wiraswasta perempuan", fmtN(18220), "27,7% dari wiraswasta"], ["Terbanyak", "Amuntai Tengah", fmtN(16156) + " jiwa"]],
      grafik: [{ judul: "Penduduk wiraswasta per kecamatan (jiwa)", labels: KEC, values: WIRAUS }],
      info: "Jumlah unit UMKM resmi (NIB, omzet, sektor) menunggu data Dinas Koperasi, UKM dan Perdagangan." },
    tunggu("Disperindag HSU / PIHPS Nasional", ["Harga beras medium", "Harga cabai rawit", "Harga telur ayam", "Harga ikan haruan"]),
    { s: "ada", peta: 0, sumber: SUMBER_DUK,
      ind: [["Petani / peternak", fmtN(19905), "jiwa"], ["Nelayan", fmtN(1739), "jiwa"],
            ["Petani perempuan", "48,2%", fmtN(9602) + " jiwa"], ["Sentra nelayan", "Paminggir", fmtN(1035) + " jiwa (59,5%)"]],
      grafik: [{ judul: "Petani / peternak per kecamatan (jiwa)", labels: KEC, values: TANI },
               { judul: "Nelayan per kecamatan (jiwa)", labels: KEC, values: NELAYAN }],
      info: "Luas panen, produksi padi lebak, dan produksi perikanan menunggu data Dinas Pertanian dan Dinas Perikanan." },
    { s: "tunggu", sumber: "Disbudparpora HSU / BPS", ind: [["Destinasi wisata", "—"], ["Kunjungan wisatawan", "—"], ["Hotel & penginapan", "—"], ["Kegiatan budaya", "—"]],
      profil: ["Candi Agung Amuntai — situs sejarah di Amuntai Tengah", "Itik Alabio — ikon peternakan khas Sungai Pandan",
               "Kawasan rawa dan danau (Danau Panggang, Paminggir) — kerbau rawa dan kerajinan purun"] },
    { s: "ada", sumber: "Databoks Katadata (olahan data APBD HSU 2026)",
      ind: [["Anggaran PAD 2026", "Rp151,85 M", "naik 49,96% dari 2025"], ["Realisasi PAD", "Rp41,34 M", "27,22% s.d. April 2026"],
            ["Porsi PAD", "11,3%", "dari pendapatan daerah"], ["Ketergantungan transfer", "74,3%", "TKD terhadap pendapatan"]],
      grafik: [{ judul: "Realisasi PAD s.d. April 2026 (Rp miliar)", dec: 2,
                 labels: ["Lain-lain PAD yang sah", "Hasil kekayaan daerah dipisahkan", "Pajak daerah", "Retribusi daerah"], values: [19.76, 12.07, 7.18, 2.34] }],
      info: "Peluang investasi, kawasan potensi, dan data realisasi PMA/PMDN menunggu data DPMPTSP." }
  ],
  kependudukan: [
    { s: "ada", peta: 0, sumber: SUMBER_DUK + "; luas wilayah dari poligon peta (±907 km², BPS: 892,7 km²) sehingga kepadatan bisa sedikit berbeda dari publikasi BPS",
      ind: [["Total penduduk", fmtN(238435), "jiwa · Semester I 2025"], ["Laki-laki / Perempuan", "119.504 / 118.931", "rasio jenis kelamin 100,5"],
            ["Kepala keluarga", fmtN(80782), "KK"], ["Terpadat", KEC[iPad], fmtN(KPD[iPad]) + " jiwa/km²"]],
      grafik: [{ judul: "Jumlah penduduk per kecamatan (jiwa)", labels: KEC, values: POP },
               { judul: "Kepadatan penduduk per kecamatan (jiwa/km²)", labels: KEC, values: KPD }],
      info: "Rata-rata kabupaten ±267 jiwa/km². Amuntai Tengah menampung 22% penduduk." },
    { s: "ada", peta: 0, sumber: SUMBER_DUK,
      ind: [["Usia muda 0–14 th", fmtN(53519), "22,4% penduduk"], ["Usia produktif 15–64 th", fmtN(167941), "70,4% penduduk"],
            ["Usia 65 th ke atas", fmtN(16975), "7,1% penduduk"], ["Rasio ketergantungan", "42,0", "per 100 usia produktif"]],
      grafik: [{ judul: "Rasio ketergantungan per kecamatan", labels: KEC, values: RKT, dec: 1 },
               { judul: "Komposisi penduduk menurut kelompok umur (jiwa)", labels: ["Usia muda", "Usia produktif", "Usia 65+"], values: [53519, 167941, 16975] }],
      info: "Rasio ketergantungan tertinggi menandakan kecamatan dengan proporsi anak dan lansia lebih besar." },
    { s: "ada", peta: 0, sumber: "BPS via Databoks Katadata (kemiskinan 2025); " + SUMBER_DUK + " (disabilitas, lansia)",
      ind: [["Tingkat kemiskinan", "4,81%", "2025 · terendah 21 tahun"], ["Penyandang disabilitas", fmtN(861), "jiwa tercatat"],
            ["Disabilitas mental/jiwa", fmtN(506), "kategori terbanyak"], ["Lansia 65 th ke atas", fmtN(16975), "jiwa"]],
      grafik: [{ judul: "Penyandang disabilitas per kecamatan (jiwa)", labels: KEC, values: DISAB }],
      info: "Data penerima bantuan sosial (PKH, BPNT, DTSEN) menunggu data Dinas Sosial." },
    { s: "ada", peta: 0, sumber: SUMBER_DUK + ". \"Belum/tidak bekerja\" mencakup anak, lansia, dan disabilitas — bukan angka pengangguran resmi (TPT) BPS",
      ind: [["Usia produktif 15–64 th", fmtN(167941), "jiwa"], ["Wiraswasta", fmtN(65725), "jiwa"],
            ["Pertanian / peternakan", fmtN(19905), "jiwa"], ["Belum / tidak bekerja", fmtN(70358), "termasuk anak & lansia"]],
      grafik: [{ judul: "Penduduk usia produktif 15–64 th per kecamatan (jiwa)", labels: KEC, values: PROD },
               { judul: "Penduduk menurut pekerjaan di KTP (jiwa)", labels: ["Belum/tidak bekerja", "Wiraswasta", "Lainnya", "Pelajar/mahasiswa", "Pertanian/peternakan", "Aparatur negara", "Nelayan", "Pensiunan", "Tenaga pengajar", "Tenaga kesehatan"],
                 values: [70358, 65725, 39710, 32594, 19905, 6063, 1739, 1128, 892, 288] }],
      info: "TPAK, TPT, dan lowongan kerja menunggu data BPS Sakernas dan Dinas Tenaga Kerja." }
  ],
  pendidikan: [
    { s: "ada", peta: 0, sumber: SUMBER_DUK + " (penduduk menurut kelompok usia sekolah)",
      ind: [["Usia SD", fmtN(23984), "jiwa"], ["Usia SMP", fmtN(12664), "jiwa"], ["Usia SMA", fmtN(12172), "jiwa"], ["Usia perguruan tinggi", fmtN(24782), "jiwa"]],
      grafik: [{ judul: "Penduduk usia SD per kecamatan (jiwa)", labels: KEC, values: SEK_SD },
               { judul: "Penduduk usia SMA per kecamatan (jiwa)", labels: KEC, values: SEK_SLA }],
      info: "Jumlah dan lokasi satuan pendidikan (SD/SMP/SMA/MA) menunggu data Dapodik atau BPS." },
    { s: "ada", peta: 0, sumber: SUMBER_DUK + " (pekerjaan pada KTP: pelajar/mahasiswa dan tenaga pengajar)",
      ind: [["Pelajar / mahasiswa", fmtN(32594), "jiwa tercatat"], ["Tenaga pengajar", fmtN(892), "jiwa tercatat"],
            ["Anak usia 0–18 th", fmtN(69824), "jiwa"], ["Pelajar terbanyak", "Amuntai Tengah", fmtN(7026) + " jiwa"]],
      grafik: [{ judul: "Pelajar / mahasiswa per kecamatan (jiwa)", labels: KEC, values: PELAJAR },
               { judul: "Tenaga pengajar per kecamatan (jiwa)", labels: KEC, values: PENGAJAR }],
      info: "Jumlah guru ASN/non-ASN dan rasio guru–murid menunggu data Dinas Pendidikan." },
    tunggu("Dinas Perpustakaan dan Kearsipan HSU", ["Jumlah koleksi", "Anggota aktif", "Kunjungan per tahun", "Perpustakaan desa"]),
    tunggu("Dinas Pendidikan / Bagian Kesra HSU", ["Program beasiswa", "Jumlah penerima", "Anggaran", "Jenjang sasaran"])
  ],
  kesehatan: [
    { s: "ada", peta: 0, sumber: SUMBER_DUK + ". Angka tenaga kesehatan hanya yang mencantumkan profesinya di KTP, bukan jumlah resmi SDM kesehatan",
      ind: [["Penduduk dilayani", fmtN(238435), "jiwa · 10 kecamatan"], ["Tenaga kesehatan (KTP)", fmtN(288), "jiwa tercatat"],
            ["Lansia 65 th ke atas", fmtN(16975), "sasaran layanan lansia"], ["Anak usia 0–18 th", fmtN(69824), "sasaran layanan anak"]],
      grafik: [{ judul: "Tenaga kesehatan tercatat per kecamatan (jiwa)", labels: KEC, values: NAKES }],
      info: "Jumlah dan lokasi puskesmas, puskesmas pembantu, rumah sakit, dan klinik menunggu data Dinas Kesehatan." },
    tunggu("Dinas Kesehatan HSU (SKDR / SIHA)", ["Kasus DBD", "Kasus TB", "Kasus diare", "Kasus ISPA"]),
    { s: "ada", sumber: "SSGI 2024 (dikutip ANTARA Kalsel, Wabup HSU); Dukcapil HSU Semester I 2025 (balita)",
      ind: [["Prevalensi stunting 2024", "36%", "hasil SSGI"], ["Perubahan", "+8 poin", "dari 28% pada 2023"],
            ["Balita 0–4 tahun", fmtN(13426), "jiwa"], ["Program daerah", "HSU Ceria", "Cegah Stunting Bersama"]],
      grafik: [{ judul: "Prevalensi stunting HSU menurut SSGI (%)", labels: ["2023", "2024"], values: [28, 36], urut: false }],
      info: "Angka SSGI berasal dari survei sampel. Prevalensi per kecamatan/puskesmas (e-PPGBM) menunggu data Dinas Kesehatan." },
    { s: "ada", peta: 0, sumber: SUMBER_DUK + " (penduduk sasaran posyandu)",
      ind: [["Balita 0–4 tahun", fmtN(13426), "jiwa"], ["Usia 0–14 tahun", fmtN(53519), "jiwa"],
            ["Anak usia 0–18 th", fmtN(69824), "jiwa"], ["Lansia 65 th ke atas", fmtN(16975), "jiwa"]],
      grafik: [{ judul: "Penduduk sasaran: anak usia 0–18 th per kecamatan (jiwa)", labels: KEC, values: ANAK }],
      info: "Jumlah posyandu, kader, dan cakupan penimbangan menunggu data Dinas Kesehatan." }
  ],
  lingkungan: [
    { s: "link", sumber: "Dashboard Siaga Karhutla & Kualitas Udara HSU", ind: [["Indeks kualitas udara (AQI)", "—"], ["PM2,5", "—"], ["Kategori", "—"], ["Pembaruan terakhir", "—"]],
      link: { url: "https://web-hsu.github.io/siagakarhutla", teks: "Buka dashboard kualitas udara" },
      info: "Nilai terkini ditampilkan di dashboard Siaga Karhutla agar selalu mengikuti pembaruan data terbaru." },
    tunggu("Dinas Lingkungan Hidup HSU", ["Timbulan sampah per hari", "TPS & TPA", "Sampah terangkut (%)", "Bank sampah aktif"]),
    tunggu("Dinas Lingkungan Hidup / PUPR HSU", ["Luas RTH", "RTH per kapita", "Taman kota", "Hutan kota"]),
    tunggu("Dinas Lingkungan Hidup HSU", ["Titik pemantauan", "Indeks Kualitas Air", "Parameter melampaui baku mutu", "Pemantauan terakhir"])
  ],
  mobilitas: [
    tunggu("Dinas PUPR HSU", ["Panjang jalan kabupaten", "Kondisi baik (%)", "Jalan rusak (km)", "Jalan nasional/provinsi"]),
    tunggu("Dinas Perhubungan HSU", ["Rute angkutan", "Armada", "Terminal", "Dermaga / angkutan sungai"]),
    tunggu("Dinas Perhubungan / Satlantas Polres HSU", ["Kejadian kecelakaan", "Korban", "Titik rawan", "Pelanggaran"]),
    tunggu("Dinas PUPR HSU", ["Jumlah jembatan", "Kondisi baik (%)", "Panjang total", "Perlu perbaikan"])
  ],
  kebencanaan: [
    { s: "link", sumber: "Dashboard Siaga Karhutla HSU", ind: [["Hotspot hari ini", "—"], ["Hotspot bulan ini", "—"], ["Kecamatan terbanyak", "—"], ["Pembaruan terakhir", "—"]],
      link: { url: "https://web-hsu.github.io/siagakarhutla", teks: "Buka dashboard Siaga Karhutla" },
      info: "Sebaran titik panas per kecamatan dan filter tanggal tersedia di dashboard Siaga Karhutla." },
    tunggu("BPBD HSU", ["Titik genangan", "Tinggi muka air", "Desa terdampak", "Pos pantau aktif"]),
    tunggu("BPBD HSU", ["Kejadian tahun ini", "Warga terdampak", "Perkiraan kerugian", "Jenis bencana dominan"]),
    tunggu("BPBD HSU", ["Posko siaga", "Jalur evakuasi", "Kapasitas pengungsian", "Armada siaga"])
  ]
};
