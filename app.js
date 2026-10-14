
/* ================================================================
 * SMART CITY HSU - KERANGKA TAMPILAN
 * Struktur: Header (menu bidang) | Panel kiri | Peta | Panel kanan | Dock
 * Menu & sub-modul didefinisikan di BIDANG di bawah; ubah di sana saja.
 * Belum ada data yang terhubung: semua indikator tampil "—".
 * ================================================================ */

const esc = s => String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const ikon = id => '<svg class="ic"><use href="#' + id + '"/></svg>';
const $ = id => document.getElementById(id);

// ---------- Peta ----------
// Tombol zoom (+/−) sengaja tidak dipasang; zoom lewat scroll mouse atau cubit layar.
const map = L.map("map", { zoomControl: false, preferCanvas: true, zoomSnap: 0.25 }).setView([-2.39, 115.27], 10);

const PETA_DASAR = {
  standar: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution: "&copy; OpenStreetMap contributors", maxZoom: 19 }),
  satelit: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Tiles &copy; Esri", maxZoom: 19 })
};
let dasarAktif = "standar";
PETA_DASAR.standar.addTo(map);

// ---------- Batas wilayah ----------
// Semua garis batas tertutup, jadi dijadikan poligon agar bisa diisi & diklik.
const cincin = f => f.geometry.coordinates.map(c => [c[1], c[0]]);
const fitur = lv => BATAS_HSU_GEOJSON.features.filter(f => f.properties && f.properties.level === lv);

const lapKabupaten = L.layerGroup();
fitur("kabupaten").forEach(f => {
  L.polygon(cincin(f), { color: "#000", weight: 2, opacity: 1, fill: false, interactive: false }).addTo(lapKabupaten);
});
lapKabupaten.addTo(map);
const batasKabupaten = L.polygon(cincin(fitur("kabupaten")[0]), { stroke: false, fill: false, interactive: false });

const lapKecamatan = L.layerGroup();
const poligonKec = {};
const GAYA_KEC = { color: "#0a2a7a", weight: 1.5, opacity: 1, dashArray: "6 4", fillColor: "#27d3ff", fillOpacity: 0 };
fitur("kecamatan").forEach(f => {
  const p = L.polygon(cincin(f), GAYA_KEC).addTo(lapKecamatan);
  poligonKec[f.properties.name] = p;
  p.on("mouseover", () => { if (kecAktif !== f.properties.name) p.setStyle({ fillOpacity: warnaKec[f.properties.name] ? .75 : .18 }); });
  p.on("mouseout", () => { if (kecAktif !== f.properties.name) p.setStyle({ fillOpacity: warnaKec[f.properties.name] ? .55 : 0 }); });
  p.on("click", () => pilihKecamatan(f.properties.name));
});
lapKecamatan.addTo(map);

// Area peta yang benar-benar kosong = layar dikurangi header, panel kiri/kanan, dock, dan legenda.
// Diukur langsung dari elemen di layar, sehingga peta selalu tepat di tengah area kosong itu.
function areaPeta() {
  const W = window.innerWidth, H = window.innerHeight, G = 16;
  const sempit = W <= 820, tutup = document.body.classList.contains("panel-tutup");
  const r = el => el.getBoundingClientRect();
  const atas = r(document.querySelector(".topbar")).bottom + G;
  let bawah = r(document.querySelector(".dock")).top;
  let kiri = 20, kanan = 20;
  if (!sempit && !tutup) {
    const pw = parseFloat(getComputedStyle(document.body).getPropertyValue("--pw")) || 340;
    kiri = kanan = 14 + pw + G;   // jarak panel ke tepi (14px) + lebar panel + celah
  }
  if (sempit && !tutup) bawah = Math.min(bawah, r($("panelKiri")).top);
  // Ruang untuk legenda modul SELALU disisihkan di desktop (tinggi tetap), baik legenda tampil maupun tidak,
  // sehingga letak peta sama persis di semua menu, modul berdata maupun belum.
  if (!sempit) bawah -= 120;
  return { tl: [Math.round(kiri), Math.round(atas)], br: [Math.round(kanan), Math.round(Math.max(H - bawah + G, 20))] };
}
function opsiPandang(extra) {
  const a = areaPeta();
  return Object.assign({ paddingTopLeft: a.tl, paddingBottomRight: a.br, maxZoom: 13 }, extra);
}

function paskanKabupaten(animasi) {
  map.invalidateSize({ pan: false });
  map.fitBounds(batasKabupaten.getBounds(), opsiPandang({ animate: !!animasi }));
}
function paskanKecamatan(nama, animasi) {
  map.invalidateSize({ pan: false });
  const b = poligonKec[nama].getBounds();
  if (animasi) map.flyToBounds(b, opsiPandang({ duration: .8 }));
  else map.fitBounds(b, opsiPandang({ animate: false }));
}
// Pulihkan pandangan: kecamatan terpilih jika ada, selain itu seluruh kabupaten.
function sesuaikanPandangan(animasi) {
  if (kecAktif) paskanKecamatan(kecAktif, animasi); else paskanKabupaten(animasi);
}

// ---------- Label kecamatan (diatur otomatis agar tidak saling menimpa) ----------
const labelKecamatan = [];

// Murni hitungan: items = [{x,y,w,h}] (piksel layar) -> offset [{dx,dy}] tanpa tumpang tindih.
function susunLabel(items) {
  const GAP = 3, terpasang = [], hasil = [];
  const tabrak = (a, b) =>
    Math.abs(a.x - b.x) < (a.w + b.w) / 2 + GAP && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + GAP;
  items.forEach(it => {
    const h = it.h + GAP;
    // Coba geser sedikit ke segala arah; ambil yang paling dekat dengan posisi asal.
    const kandidat = [[0, 0]];
    for (let r = 1; r <= 4; r++) {
      [-1, 0, 1].forEach(iy => [-2, -1, 0, 1, 2].forEach(ix => {
        if (iy === 0 && ix === 0) return;
        kandidat.push([ix * r * 22, iy * r * h]);
      }));
    }
    kandidat.sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]));
    let pilih = kandidat[0];
    for (const [dx, dy] of kandidat) {
      const box = { x: it.x + dx, y: it.y + dy, w: it.w, h: it.h };
      if (!terpasang.some(t => tabrak(box, t))) { pilih = [dx, dy]; break; }
    }
    terpasang.push({ x: it.x + pilih[0], y: it.y + pilih[1], w: it.w, h: it.h });
    hasil.push({ dx: pilih[0], dy: pilih[1] });
  });
  return hasil;
}

function aturLabelKecamatan() {
  if (!labelKecamatan.length) return;
  const font = window.innerWidth <= 820 ? 11 : 13;
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.font = "700 " + font + "px Rajdhani, Arial";
  const items = labelKecamatan.map(l => {
    const p = map.latLngToContainerPoint([l.lat, l.lon]);
    return { x: p.x, y: p.y, w: ctx.measureText(l.name).width + 6, h: font + 4 };
  });
  const urut = items.map((_, i) => i).sort((i, j) => items[i].y - items[j].y || items[i].x - items[j].x);
  const off = susunLabel(urut.map(i => items[i]));
  urut.forEach((i, k) => {
    const el = labelKecamatan[i].marker.getElement();
    if (!el || !el.firstChild) return;
    el.firstChild.style.fontSize = font + "px";
    el.firstChild.style.transform = "translate(-50%,-50%) translate(" + off[k].dx + "px," + off[k].dy + "px)";
  });
}

function muatLabelKecamatan() {
  LABEL_KECAMATAN_HSU.forEach(item => {
    const marker = L.marker([Number(item.lat), Number(item.lon)], {
      icon: L.divIcon({ className: "kml-kecamatan-label", html: "<span>" + esc(item.name) + "</span>", iconSize: [1, 1], iconAnchor: [0, 0] }),
      interactive: false, keyboard: false, zIndexOffset: 1000
    }).addTo(map);
    labelKecamatan.push({ name: item.name, lat: Number(item.lat), lon: Number(item.lon), marker: marker });
  });
  map.on("zoomend moveend", aturLabelKecamatan);
  aturLabelKecamatan();
}

// ---------- Status tampilan ----------
let bidangAktif = null;   // id bidang, null = Beranda
let modulAktif = null;    // indeks modul di bidang aktif
let kecAktif = null;      // nama kecamatan terpilih

function pilihKecamatan(nama) {
  kecAktif = (kecAktif === nama) ? null : nama;
  Object.keys(poligonKec).forEach(n => poligonKec[n].setStyle(gayaKec(n)));
  labelKecamatan.forEach(l => { const el = l.marker.getElement(); if (el) el.classList.toggle("aktif", l.name === kecAktif); });
  gambarPanel();   // panel digambar dulu supaya ukuran area peta yang kosong sudah final
  sesuaikanPandangan(true);
}

function pilihBidang(id) {
  bidangAktif = (bidangAktif === id) ? null : id;
  modulAktif = null;
  gambarMenu();
  gambarPanel();
  $("dkBeranda").classList.toggle("aktif", bidangAktif === null);
  if (document.body.classList.contains("panel-tutup")) {
    document.body.classList.remove("panel-tutup");
    setTimeout(() => { sesuaikanPandangan(true); aturLabelKecamatan(); }, 320);
  }
}

function beranda() {
  bidangAktif = null; modulAktif = null;
  if (kecAktif) { kecAktif = null; Object.keys(poligonKec).forEach(n => poligonKec[n].setStyle(GAYA_KEC)); labelKecamatan.forEach(l => { const el = l.marker.getElement(); if (el) el.classList.remove("aktif"); }); }
  gambarMenu(); gambarPanel(); paskanKabupaten(true);
  $("dkBeranda").classList.add("aktif");
}

// ---------- Menu atas ----------
function gambarMenu() {
  const buat = sisi => BIDANG.filter(b => b.sisi === sisi).map(b =>
    '<button type="button" class="nav-btn' + (b.id === bidangAktif ? " aktif" : "") + '" data-bidang="' + b.id + '" title="' + esc(b.nama) + '">' +
    ikon(b.ikon) + '<span class="tx">' + esc(b.nama) + '</span></button>').join("");
  $("navKiri").innerHTML = buat("kiri");
  $("navKanan").innerHTML = buat("kanan");
  $("dkBeranda").classList.toggle("aktif", bidangAktif === null);
}

// ---------- Panel ----------
function ubinKosong(ikonId, label) {
  return '<div class="tile">' + ikon(ikonId) + '<div><b>—</b><span>' + esc(label) + '</span></div></div>';
}

function gambarPanel() {
  const kiri = $("panelKiri"), kanan = $("panelKanan");
  const sempit = window.innerWidth <= 820;

  if (!bidangAktif) {
    // ===== BERANDA =====
    const st = ringkasStatus();
    const ik = kecAktif ? KEC.indexOf(kecAktif) : -1;
    const TOTAL_POP = 238435;
    let profil;
    if (ik >= 0) {
      // Kecamatan dipilih: tampilkan profil kecamatan tersebut, bukan kabupaten.
      const urutPop = POP.slice().sort((x, y) => y - x).indexOf(POP[ik]) + 1;
      profil =
        '<section class="kartu"><h2 class="kartu-judul">Profil Kecamatan <small>' + esc(kecAktif) + '</small></h2>' +
          '<div class="ind-row">' +
            '<div class="ind"><b>' + fmtN(POP[ik]) + '</b><span>Penduduk (jiwa)</span></div>' +
            '<div class="ind"><b>±' + fmtN(LUAS[ik], 1) + ' km²</b><span>Luas wilayah</span></div>' +
            '<div class="ind"><b>' + fmtN(DESA[ik]) + '</b><span>Desa + Kelurahan</span></div>' +
            '<div class="ind"><b>' + fmtN(KPD[ik]) + '</b><span>Jiwa per km²</span></div>' +
            '<div class="ind"><b>' + fmtN(POP[ik] / TOTAL_POP * 100, 1) + '%</b><span>Porsi penduduk kabupaten</span></div>' +
            '<div class="ind"><b>' + urutPop + ' / ' + KEC.length + '</b><span>Peringkat jumlah penduduk</span></div>' +
          '</div><p class="catatan sumber">Sumber: Dukcapil HSU Semester I 2025; luas dihitung dari poligon peta; jumlah desa/kelurahan: BPS HSU 2025. Klik kecamatan yang sama lagi untuk kembali ke profil kabupaten.</p></section>';
    } else {
      profil =
        '<section class="kartu"><h2 class="kartu-judul">Profil Wilayah <small>Ringkasan</small></h2>' +
          '<div class="ind-row">' +
            '<div class="ind"><b>' + fmtN(238435) + '</b><span>Penduduk (jiwa)</span></div>' +
            '<div class="ind"><b>±892,7 km²</b><span>Luas wilayah</span></div>' +
            '<div class="ind"><b>' + LABEL_KECAMATAN_HSU.length + '</b><span>Kecamatan</span></div>' +
            '<div class="ind"><b>214 / 5</b><span>Desa / Kelurahan</span></div>' +
            '<div class="ind"><b>267</b><span>Jiwa per km²</span></div>' +
            '<div class="ind"><b>' + BIDANG.length + '</b><span>Bidang Smart City</span></div>' +
          '</div><p class="catatan sumber">Sumber: Dukcapil HSU Semester I 2025; luas wilayah menurut Pemkab/BPS.</p></section>';
    }
    const kecamatan =
      '<section class="kartu"><h2 class="kartu-judul">Kecamatan <small>Pilih untuk zoom</small></h2><ul class="daftar dua">' +
        LABEL_KECAMATAN_HSU.slice().sort((a, b) => a.name.localeCompare(b.name)).map(k =>
          '<li><button type="button" data-kec="' + esc(k.name) + '" class="' + (k.name === kecAktif ? "aktif" : "") + '">' +
          ikon("i-pin") + '<span>' + esc(k.name) + '</span></button></li>').join("") +
      '</ul></section>';
    const bidang =
      '<section class="kartu"><h2 class="kartu-judul">Bidang Smart City <small>Menu</small></h2><div class="grid-bidang">' +
        BIDANG.map(b => '<button type="button" data-bidang="' + b.id + '">' + ikon(b.ikon) + esc(b.nama) + '</button>').join("") +
      '</div><p class="catatan">Pilih salah satu bidang untuk melihat modul, indikator, grafik, dan peta tematik. ' +
        st[0] + ' dari ' + st[1] + ' modul sudah berisi data; sisanya menunggu sambungan data dari OPD terkait.</p></section>';
    // Desktop: menu bidang di kiri; profil wilayah + daftar kecamatan di kanan. HP: panel kanan disembunyikan, jadi semuanya di kiri.
    if (sempit) { kiri.innerHTML = profil + kecamatan; kanan.innerHTML = ""; }
    else { kiri.innerHTML = bidang; kanan.innerHTML = profil + kecamatan; }
    terapkanPeta();
    return;
  }

  // ===== BIDANG TERPILIH =====
  const b = BIDANG.find(x => x.id === bidangAktif);
  if (modulAktif === null) modulAktif = 0;
  const daftarData = DATA[b.id] || [];
  const nAda = daftarData.filter(d => d && d.s !== "tunggu").length;
  kiri.innerHTML =
    '<section class="kartu"><h2 class="kartu-judul">' + esc(b.nama) + ' <small>Modul</small></h2><ul class="daftar">' +
      b.modul.map((m, i) => {
        const s = daftarData[i] ? daftarData[i].s : "tunggu";
        const tag = s === "ada" ? ["ada", "Data"] : s === "link" ? ["link", "Dashboard"] : ["", "Menunggu"];
        return '<li><button type="button" data-modul="' + i + '" class="' + (i === modulAktif ? "aktif" : "") + '">' + ikon("i-item") +
          '<span>' + esc(m[0]) + '<span class="ket">' + esc(m[1]) + '</span></span><span class="tag ' + tag[0] + '">' + tag[1] + '</span></button></li>';
      }).join("") +
    '</ul><p class="catatan">' + nAda + ' dari ' + b.modul.length + ' modul pada bidang ini sudah berisi data. Klik kecamatan pada peta atau grafik untuk membandingkan.</p></section>';

  const detail = detailModul(b, modulAktif);
  if (sempit) { kiri.innerHTML += detail; kanan.innerHTML = ""; } else kanan.innerHTML = detail;
  terapkanPeta();
}


function ringkasStatus() {
  let ada = 0, tot = 0;
  BIDANG.forEach(b => b.modul.forEach((m, i) => { tot++; const d = (DATA[b.id] || [])[i]; if (d && d.s !== "tunggu") ada++; }));
  return [ada, tot];
}

function gambarGrafik(g) {
  const idx = g.labels.map((_, i) => i);
  const urut = g.urut === false ? idx : idx.slice().sort((a, c) => g.values[c] - g.values[a]);
  const maks = Math.max.apply(null, g.values) || 1;
  let sorot = "";
  const ik = g.labels.indexOf(kecAktif);
  if (kecAktif && ik >= 0)
    sorot = '<div class="sorot">' + esc(kecAktif) + ': <b>' + fmtN(g.values[ik], g.dec) + '</b> · peringkat ' + (urut.indexOf(ik) + 1) + ' dari ' + g.labels.length + '</div>';
  return '<div class="gr-blok"><div class="gr-judul">' + esc(g.judul) + '</div>' + sorot + '<div class="bars">' +
    urut.map(i => {
      const nm = g.labels[i], kec = KEC.indexOf(nm) >= 0;
      return '<div class="bar-row' + (nm === kecAktif ? " aktif" : "") + (kec ? " klik" : "") + '"' + (kec ? ' data-kec="' + esc(nm) + '"' : "") + '>' +
        '<span class="bn" title="' + esc(nm) + '">' + esc(nm) + '</span>' +
        '<span class="bt"><i style="width:' + Math.max(2, g.values[i] / maks * 100).toFixed(1) + '%"></i></span>' +
        '<span class="bv">' + fmtN(g.values[i], g.dec) + '</span></div>';
    }).join("") + '</div></div>';
}

function detailModul(b, i) {
  const d = (DATA[b.id] || [])[i], m = b.modul[i];
  if (!d) return '<section class="kartu"><h2 class="kartu-judul">Indikator Utama <small>' + esc(m[0]) + '</small></h2><div class="kosong">Data belum tersedia.</div></section>';
  let h = '<section class="kartu"><h2 class="kartu-judul">Indikator Utama <small>' + esc(m[0]) + '</small></h2><div class="ind-row">' +
    d.ind.map(x => '<div class="ind"><b>' + esc(x[1]) + '</b><span>' + esc(x[0]) + '</span>' + (x[2] ? '<em>' + esc(x[2]) + '</em>' : "") + '</div>').join("") +
    '</div>' + (d.info ? '<p class="catatan">' + esc(d.info) + '</p>' : "") + '</section>';
  if (d.grafik) {
    h += '<section class="kartu"><h2 class="kartu-judul">Grafik <small>' + (d.peta !== undefined ? "Peta tematik aktif" : "Perbandingan") + '</small></h2>' +
      d.grafik.map(gambarGrafik).join("") + '<p class="catatan sumber">Sumber: ' + esc(d.sumber) + '</p></section>';
  } else {
    h += '<section class="kartu"><h2 class="kartu-judul">Status Data <small>' + (d.s === "link" ? "Dashboard" : "Menunggu") + '</small></h2>';
    if (d.s === "link") h += '<a class="btn-link" href="' + d.link.url + '" target="_blank" rel="noopener">' + esc(d.link.teks) + ' ↗</a>';
    else h += '<div class="kosong kecil">Data belum terhubung.<br>Indikator di atas akan terisi setelah data dari OPD tersedia.</div>';
    if (d.profil) h += '<ul class="profil" style="margin-top:10px">' + d.profil.map(p => '<li>' + esc(p) + '</li>').join("") + '</ul>';
    h += '<p class="catatan sumber">Sumber data: ' + esc(d.sumber) + '</p></section>';
  }
  return h;
}


// ---------- Peta tematik (pewarnaan kecamatan mengikuti grafik modul aktif) ----------
let warnaKec = {};
function skala(t) {
  const a = [27, 79, 156], c = [39, 211, 255], e = [255, 210, 74];
  const [p, q, u] = t < .5 ? [a, c, t * 2] : [c, e, (t - .5) * 2];
  return "rgb(" + p.map((v, k) => Math.round(v + (q[k] - v) * u)).join(",") + ")";
}
function gayaKec(n) {
  if (n === kecAktif) return { color: "#ffd24a", weight: 2.5, dashArray: null, fillColor: "#ffd24a", fillOpacity: .15 };
  return warnaKec[n] ? Object.assign({}, GAYA_KEC, { fillColor: warnaKec[n], fillOpacity: .55 }) : GAYA_KEC;
}
function gayaSemua() {
  Object.keys(poligonKec).forEach(n => poligonKec[n].setStyle(gayaKec(n)));
  labelKecamatan.forEach(l => { const el = l.marker.getElement(); if (el) el.classList.toggle("aktif", l.name === kecAktif); });
}
function terapkanPeta() {
  warnaKec = {};
  const leg = $("legPeta");
  let g = null;
  if (bidangAktif && modulAktif !== null) {
    const b = BIDANG.find(x => x.id === bidangAktif), d = (DATA[b.id] || [])[modulAktif];
    if (d && d.peta !== undefined && d.grafik) g = d.grafik[d.peta];
  }
  if (g) {
    const mn = Math.min.apply(null, g.values), mx = Math.max.apply(null, g.values);
    g.labels.forEach((n, i) => { warnaKec[n] = skala(mx === mn ? .5 : (g.values[i] - mn) / (mx - mn)); });
    leg.style.display = "flex";
    leg.innerHTML = '<b>' + esc(g.judul) + '</b><span class="grad"></span><span class="lr"><i>' + fmtN(mn, g.dec) + '</i><i>' + fmtN(mx, g.dec) + '</i></span>';
  } else leg.style.display = "none";
  gayaSemua();
}

// ---------- Interaksi ----------
document.addEventListener("click", e => {
  const bd = e.target.closest("[data-bidang]");
  if (bd) { pilihBidang(bd.dataset.bidang); return; }
  const kc = e.target.closest("[data-kec]");
  if (kc) { pilihKecamatan(kc.dataset.kec); return; }
  const md = e.target.closest("[data-modul]");
  if (md) { modulAktif = Number(md.dataset.modul); gambarPanel(); return; }
  if (!e.target.closest("#popLayer") && !e.target.closest("#dkLayer")) $("popLayer").classList.remove("tampil");
});

$("dkBeranda").addEventListener("click", beranda);
$("dkLayer").addEventListener("click", () => {
  const pop = $("popLayer"); pop.classList.toggle("tampil"); $("dkLayer").classList.toggle("aktif", pop.classList.contains("tampil"));
});
$("dkPanel").addEventListener("click", () => {
  document.body.classList.toggle("panel-tutup");
  setTimeout(() => { sesuaikanPandangan(true); aturLabelKecamatan(); }, 320);
});
$("dkFull").addEventListener("click", () => {
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  } catch (_) {}
});

document.querySelectorAll('input[name="dasar"]').forEach(r => r.addEventListener("change", () => {
  map.removeLayer(PETA_DASAR[dasarAktif]); dasarAktif = r.value; PETA_DASAR[dasarAktif].addTo(map).bringToBack();
}));
function sakelar(cb, aksi) { $(cb).addEventListener("change", e => aksi(e.target.checked)); }
sakelar("cbKab", on => on ? lapKabupaten.addTo(map) : map.removeLayer(lapKabupaten));
sakelar("cbKec", on => on ? lapKecamatan.addTo(map) : map.removeLayer(lapKecamatan));
sakelar("cbLabel", on => document.body.classList.toggle("tanpa-label", !on));

// ---------- Jam (WITA) ----------
function ketukJam() {
  const d = new Date();
  $("jam").textContent = d.toLocaleTimeString("id-ID", { timeZone: "Asia/Makassar", hour12: false }).replace(/\./g, ":");
  $("tgl").textContent = d.toLocaleDateString("id-ID", { timeZone: "Asia/Makassar", weekday: "long", day: "2-digit", month: "long", year: "numeric" }) + " WITA";
}

// ---------- Mulai ----------
function init() {
  gambarMenu(); gambarPanel();
  muatLabelKecamatan();
  paskanKabupaten(false);
  ketukJam(); setInterval(ketukJam, 1000);
  let sempitLama = window.innerWidth <= 820;
  window.addEventListener("resize", () => { sesuaikanPandangan(false); aturLabelKecamatan(); const s = window.innerWidth <= 820; if (s !== sempitLama) { sempitLama = s; gambarPanel(); } });
  setTimeout(() => { sesuaikanPandangan(false); aturLabelKecamatan(); }, 300);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
