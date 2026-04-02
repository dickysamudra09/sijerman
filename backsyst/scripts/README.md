# 🚀 Deploy & Push to GitHub Scripts

Script otomatis untuk install dependencies, build, dan push ke GitHub untuk deployment ke Vercel.

## 📋 Daftar Isi

- [Windows (PowerShell)](#windows-powershell)
- [Linux/Mac (Bash)](#linuxmac-bash)
- [Manual Steps](#manual-steps)

---

## Windows (PowerShell)

### Cara Menggunakan:

1. **Buka PowerShell** sebagai Administrator
   - Win + R → ketik `powershell` → Enter

2. **Navigasi ke folder project**
   ```powershell
   cd d:\ITDev\fullstack\sijerman\backsyst
   ```

3. **Jalankan script**
   ```powershell
   PowerShell -ExecutionPolicy Bypass -File .\scripts\install-and-deploy.ps1
   ```

### Apa yang dilakukan script:

✅ Menginstall semua dependencies (`npm install`)  
✅ Menjalankan build test (`npm run build`)  
✅ Menampilkan git status  
✅ Stage semua perubahan (`git add -A`)  
✅ Membuat commit dengan custom message  
✅ Push ke GitHub (`git push origin main`)  

### Output contoh:

```
============================================================
Si Jerman - Build & Deploy Script
============================================================

[STEP 1] Installing dependencies...
Running: npm install
✅ Dependencies installed successfully

[STEP 2] Running build test...
✅ Build successful

[STEP 3] Git status...
On branch main
Changes not staged for commit:
...

[STEP 4] Staging all changes...
✅ All changes staged

[STEP 5] Creating commit...
Enter commit message (default: 'Install dnd-kit dependencies for drag-drop'): 
✅ Commit created successfully

[STEP 7] Pushing to GitHub...
Push to origin/main? (y/n) y
✅ Successfully pushed to GitHub!

============================================================
Deployment initiated! Check Vercel for build status.
============================================================
```

---

## Linux/Mac (Bash)

### Cara Menggunakan:

1. **Buka Terminal**

2. **Navigasi ke folder project**
   ```bash
   cd /path/to/sijerman/backsyst
   ```

3. **Jalankan script**
   ```bash
   bash ./scripts/install-and-deploy.sh
   ```

   Atau jika ingin memberikan permission terlebih dahulu:
   ```bash
   chmod +x ./scripts/install-and-deploy.sh
   ./scripts/install-and-deploy.sh
   ```

---

## Manual Steps

Jika tidak ingin menggunakan script, lakukan langkah-langkah berikut secara manual:

### 1. Install Dependencies

```bash
npm install
```

Jika error karena peer dependencies:
```bash
npm ci --legacy-peer-deps
```

### 2. Test Build

```bash
npm run build
```

### 3. Check Git Status

```bash
git status
```

### 4. Stage All Changes

```bash
git add -A
```

### 5. Create Commit

```bash
git commit -m "Install dnd-kit dependencies for drag-drop"
```

### 6. Push to GitHub

```bash
git push origin main
```

---

## 🔧 Troubleshooting

### Error: "Module not found: Can't resolve '@dnd-kit/core'"

**Solusi:**
```bash
npm install
npm run build
git add -A
git commit -m "Install dependencies"
git push origin main
```

### Error: "npm ERR! peer dep missing"

**Solusi:**
```bash
npm ci --legacy-peer-deps
```

### Error: "fatal: not a git repository"

Pastikan Anda di folder project yang benar dan sudah di-initialize sebagai git repository:
```bash
git status
```

### Error: "Permission denied" (Linux/Mac)

Jalankan dengan `bash` explicitly:
```bash
bash ./scripts/install-and-deploy.sh
```

---

## 📝 Notes

- Script akan meminta confirmasi sebelum push
- Custom commit message bisa dimasukkan saat runtime
- Build test optional (jika gagal, script akan tanya apakah lanjut push)
- Pastikan sudah login ke GitHub via credential manager atau SSH

---

## 🌐 Vercel Deployment

Setelah push berhasil:

1. Buka [https://vercel.com](https://vercel.com)
2. Login dengan GitHub account
3. Dashboard akan otomatis mendeteksi push
4. Build akan mulai
5. Tunggu sampai selesai (kurang lebih 3-5 menit)
6. Lihat deployment URL

---

**Happy deploying! 🚀**
