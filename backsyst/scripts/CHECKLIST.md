# ✅ Pre-Deploy Checklist

Gunakan checklist ini sebelum deploy ke Vercel.

---

## 🔧 System Setup

- [ ] Node.js terinstall (v18 atau lebih tinggi)
  ```bash
  node --version
  ```

- [ ] npm terinstall
  ```bash
  npm --version
  ```

- [ ] Git terinstall
  ```bash
  git --version
  ```

- [ ] Git sudah dikonfigurasi
  ```bash
  git config --global user.name
  git config --global user.email
  ```

---

## 📁 Project Setup

- [ ] Sudah di folder project yang benar
  ```bash
  pwd  # atau cd untuk cek lokasi
  ```

- [ ] Folder memiliki file `package.json`
  ```bash
  ls package.json
  ```

- [ ] Folder adalah git repository
  ```bash
  git status
  ```

- [ ] Sudah connect ke remote GitHub
  ```bash
  git remote -v
  ```

---

## 📦 Dependencies

- [ ] Semua dependencies terinstall
  ```bash
  npm install
  ```

- [ ] Tidak ada error atau warning kritis
  ```bash
  npm ls
  ```

- [ ] Verifykan paket @dnd-kit ada
  ```bash
  npm ls @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
  ```

---

## 📝 Code

- [ ] Build berhasil di lokal
  ```bash
  npm run build
  ```

- [ ] Tidak ada TypeScript errors
  - Check terminal output saat `npm run build`

- [ ] Semua import statements valid
  - Terutama untuk @dnd-kit dan Supabase

---

## 🔐 Environment Variables

- [ ] File `.env.local` sudah ada dan berisi:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Owner/Project setup di Vercel

- [ ] Jangan push `.env.local` ke GitHub
  - Vercel akan load dari deployment settings

---

## 🌐 GitHub

- [ ] Sudah login ke GitHub
  ```bash
  git config --global user.name
  ```

- [ ] SSH key atau credentials sudah setup
  ```bash
  ssh -T git@github.com
  ```

- [ ] Branch `main` adalah default branch
  ```bash
  git branch -v
  ```

- [ ] Tidak ada uncommitted changes (optional)
  ```bash
  git status
  ```

---

## 🚀 Vercel Account

- [ ] Login ke [vercel.com](https://vercel.com)
- [ ] Project "sijerman" sudah terhubung ke GitHub
- [ ] Deployment settings sudah dikonfigurasi

---

## 📋 Deploy Steps

**Jika semua checklist ✅, lakukan:**

```bash
# Pilih satu:

# Opsi 1: Gunakan script (Recommended)
PowerShell -ExecutionPolicy Bypass -File .\scripts\install-and-deploy.ps1

# Opsi 2: Manual steps
npm install
npm run build
git add -A
git commit -m "Fix: Install dnd-kit dependencies"
git push origin main
```

---

## 🔍 Verify Deployment

1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Cari project "sijerman"
3. Lihat "Recent Deployments"
4. Status seharusnya "Ready" (hijau)
5. Buka deployment URL untuk test

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| `Module not found: @dnd-kit` | `npm install` → `npm run build` → `git push` |
| `peer dep missing` | `npm ci --legacy-peer-deps` |
| `fatal: not a git repository` | Pastikan di folder project yang benar |
| `fatal: The current branch is behind` | `git pull origin main` kemudian push lagi |
| Build timeout di Vercel | Check terbesar file, jika > 50MB might be issue |
| Port already in use | Kill process atau ganti port di `.env.local` |

---

## ✨ Post-Deploy

- [ ] Cek Vercel deployment success
- [ ] Test aplikasi di public URL
- [ ] Setup custom domain (opsional)
- [ ] Setup monitoring alerts (opsional)

---

**Ready to deploy? Run the script above! 🚀**
