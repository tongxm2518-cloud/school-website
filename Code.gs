/**
 * ============================================================
 *  สแกนโฟลเดอร์ Google Drive → ส่งออกเป็น JSON ให้เว็บโรงเรียน
 *  ทำครั้งเดียว แล้วหลังจากนั้น "แค่ลากรูปใส่โฟลเดอร์" เว็บอัพเดทเอง
 * ============================================================
 *
 *  กติกาการตั้งชื่อโฟลเดอร์ (สำคัญมาก):
 *
 *  web site personal/
 *  ├── รูปภาพ และกิจกรรม/          ← ROOT ของแกลเลอรี
 *  │   ├── ภาคีเครือข่าย/           ← ชื่อโฟลเดอร์ = "หมวด"
 *  │   │   ├── ภาคีเครือข่าย ปี69/   ← ลงท้าย "ปีNN" = ปี พ.ศ. 25NN
 *  │   │   ├── ภาคีเครือข่าย ปี68/
 *  │   │   └── ภาคีเครือข่าย ปี67/
 *  │   ├── กีฬา/
 *  │   │   └── กีฬา ปี69/
 *  │   └── ...
 *  └── (โฟลเดอร์อื่นๆ เช่น ผลงาน ผอ., ผลงาน ครู, นิเทศ PLC) ← คลังเอกสาร
 *
 *  เพิ่มปีใหม่  = สร้างโฟลเดอร์ "<ชื่อหมวด> ปี70"  → เว็บขึ้นปุ่ม พ.ศ.2570 เอง
 *  ลบปี        = ลบโฟลเดอร์         → ปุ่มปีนั้นหายเอง
 *  เพิ่มหมวดใหม่ = สร้างโฟลเดอร์หมวดใหม่ → ปุ่มหมวดขึ้นเอง
 */

// ====== ตั้งค่า: ใส่ ID โฟลเดอร์แม่ "web site personal" ======
var ROOT_ID = '1wX-3i4DCJXLl36jMeIECX7hw9uw3aNNL';

// ชื่อโฟลเดอร์แกลเลอรี (ต้องตรงกับใน Drive เป๊ะๆ)
var GALLERY_FOLDER_NAME = 'รูปภาพ และกิจกรรม';

// ไอคอนประจำหมวด (ไม่มีในนี้ = ใช้ 📁 / 📷)
var ICONS = {
  'ภาคีเครือข่าย': '🤝', 'ดนตรี': '🎵', 'กีฬา': '🏅',
  'โครงการ กิจกรรม เด่น': '⭐', 'การระดมทุน': '💰',
  'การปรับปรุงภูมิทัศน์': '🌳', 'การก่อสร้าง': '🏗️',
  'ผลงาน ผอ': '🎖️', 'ผลงาน รร': '🏫', 'ผลงาน ครู': '👩‍🏫',
  'ผลงาน นร': '🎒', 'นิเทศ PLC': '📋', 'รางวัลด้านการบริหาร': '🏆',
  'ผลการดำเนินงาน รร': '📈', 'รูปเดี่ยวทางการ ผอ': '👤'
};

// ---------- helper ----------

/** ดึงปี พ.ศ. จากชื่อโฟลเดอร์: "ภาคีเครือข่าย ปี69" → "2569" */
function extractYear(name) {
  var m = String(name).match(/ปี\s*(\d{2,4})\s*$/);
  if (!m) return '';
  var y = m[1];
  if (y.length === 2) return '25' + y;      // 69 → 2569
  if (y.length === 4) return y;             // 2569 → 2569
  return '';
}

/** ตัดส่วน " ปีNN" ออก เหลือชื่อล้วน */
function stripYear(name) {
  return String(name).replace(/\s*ปี\s*\d{2,4}\s*$/, '').trim();
}

function iconFor(cat) {
  var key = String(cat).replace(/\.$/, '').trim();
  return ICONS[key] || '📁';
}

function getChildFolder(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : null;
}

/** หารูปแรกในโฟลเดอร์ มาใช้เป็นภาพหน้าปก */
function firstImageId(folder) {
  var types = [MimeType.JPEG, MimeType.PNG, MimeType.GIF, MimeType.BMP];
  for (var i = 0; i < types.length; i++) {
    var it = folder.getFilesByType(types[i]);
    if (it.hasNext()) return it.next().getId();
  }
  return '';
}

function countImages(folder) {
  var n = 0, it = folder.getFiles();
  while (it.hasNext()) { it.next(); n++; }
  return n;
}

// ---------- สแกนแกลเลอรี ----------
function buildGallery(root) {
  var out = [];
  var galRoot = getChildFolder(root, GALLERY_FOLDER_NAME);
  if (!galRoot) return out;

  var cats = galRoot.getFolders();
  while (cats.hasNext()) {
    var catFolder = cats.next();
    var cat = catFolder.getName().trim();

    var years = catFolder.getFolders();
    var found = false;

    while (years.hasNext()) {
      var yf = years.next();
      var year = extractYear(yf.getName());
      if (!year) continue;              // ไม่มี "ปีNN" ต่อท้าย → ข้าม
      found = true;
      var n = countImages(yf);
      var cover = firstImageId(yf);
      out.push({
        title: stripYear(yf.getName()) || cat,
        cat:   cat,
        year:  year,
        icon:  iconFor(cat),
        img:   cover ? 'https://drive.google.com/thumbnail?id=' + cover + '&sz=w1000' : '',
        link:  'https://drive.google.com/drive/folders/' + yf.getId(),
        count: n
      });
    }

    // หมวดที่ไม่มีโฟลเดอร์ปีเลย แต่มีรูปวางตรงๆ
    if (!found && countImages(catFolder) > 0) {
      var c2 = firstImageId(catFolder);
      out.push({
        title: cat, cat: cat, year: '', icon: iconFor(cat),
        img: c2 ? 'https://drive.google.com/thumbnail?id=' + c2 + '&sz=w1000' : '',
        link: 'https://drive.google.com/drive/folders/' + catFolder.getId(),
        count: countImages(catFolder)
      });
    }
  }

  // เรียง: ปีใหม่ก่อน แล้วตามชื่อหมวด
  out.sort(function (a, b) {
    if (a.year !== b.year) return b.year.localeCompare(a.year);
    return a.cat.localeCompare(b.cat, 'th');
  });
  return out;
}

// ---------- สแกนคลังเอกสาร (ทุกโฟลเดอร์ที่ไม่ใช่แกลเลอรี) ----------
function buildFiles(root) {
  var out = [];
  var cats = root.getFolders();

  while (cats.hasNext()) {
    var catFolder = cats.next();
    var cat = catFolder.getName().trim();
    if (cat === GALLERY_FOLDER_NAME) continue;   // แกลเลอรีแยกไปแล้ว

    var years = catFolder.getFolders();
    var found = false;

    while (years.hasNext()) {
      var yf = years.next();
      var year = extractYear(yf.getName());
      if (!year) continue;
      found = true;
      out.push({
        name: yf.getName(),
        cat:  cat,
        year: year,
        icon: iconFor(cat),
        link: 'https://drive.google.com/drive/folders/' + yf.getId()
      });
    }

    if (!found) {
      out.push({
        name: cat, cat: cat, year: '', icon: iconFor(cat),
        link: 'https://drive.google.com/drive/folders/' + catFolder.getId()
      });
    }
  }

  out.sort(function (a, b) {
    if (a.cat !== b.cat) return a.cat.localeCompare(b.cat, 'th');
    return String(b.year).localeCompare(String(a.year));
  });
  return out;
}

// ---------- endpoint ----------
function doGet(e) {
  var what     = (e && e.parameter && e.parameter.what)     || 'all';
  var callback = (e && e.parameter && e.parameter.callback) || '';
  var root = DriveApp.getFolderById(ROOT_ID);
  var data;

  if (what === 'gallery')      data = buildGallery(root);
  else if (what === 'files')   data = buildFiles(root);
  else                         data = { gallery: buildGallery(root), files: buildFiles(root) };

  var json = JSON.stringify(data);

  // JSONP — ใช้เมื่อเว็บเรียกข้ามโดเมน (เลี่ยง CORS)
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  // JSON ธรรมดา — ใช้ตอนเปิดดูในเบราว์เซอร์
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------- ทดสอบใน editor: กด Run แล้วดู Execution log ----------
function testScan() {
  var root = DriveApp.getFolderById(ROOT_ID);
  var g = buildGallery(root), f = buildFiles(root);
  Logger.log('แกลเลอรี %s รายการ', g.length);
  g.forEach(function (x) { Logger.log('  [%s] %s — พ.ศ.%s (%s รูป)', x.cat, x.title, x.year, x.count); });
  Logger.log('คลังเอกสาร %s รายการ', f.length);
  f.forEach(function (x) { Logger.log('  [%s] %s — พ.ศ.%s', x.cat, x.name, x.year); });
}
