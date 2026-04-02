# Quick Reference - Git & Deploy Commands

## 🚀 Fastest Way to Deploy

```bash
# Windows (PowerShell)
PowerShell -ExecutionPolicy Bypass -File .\scripts\install-and-deploy.ps1

# Linux/Mac (Bash)
bash ./scripts/install-and-deploy.sh
```

---

## 📦 Install Dependencies Only

```bash
npm install

# Atau jika ada peer dependency issues:
npm ci --legacy-peer-deps
```

---

## 🔨 Build Locally

```bash
npm run build
```

---

## 📥 Git Add & Commit

### Add all files
```bash
git add -A
```

### Add specific file
```bash
git add src/app/teacher/courses/[id]/modules/page.tsx
```

### Create commit
```bash
git commit -m "Your message here"
```

---

## 📤 Push to GitHub

```bash
# Push to main branch
git push origin main

# Push to specific branch
git push origin branch-name

# Force push (gunakan hati-hati!)
git push origin main --force
```

---

## 🔄 All in One Command

```bash
# Windows (PowerShell)
npm install; npm run build; git add -A; git commit -m "Install dnd-kit dependencies"; git push origin main

# Linux/Mac (Bash)
npm install && npm run build && git add -A && git commit -m "Install dnd-kit dependencies" && git push origin main
```

---

## 🐛 Troubleshooting

### Cek current branch
```bash
git branch
```

### Cek git status
```bash
git status
```

### Reset changes (hati-hati!)
```bash
git reset --hard HEAD
```

### Cek git log
```bash
git log --oneline -5
```

---

## 📝 Recommended Commit Messages

Gunakan pesan yang deskriptif:

- `"Install dnd-kit dependencies for drag-drop"` ✅
- `"Fix: Module dropdown displays lessons"` ✅
- `"Translate all text to Indonesian"` ✅
- `"Feature: Add submenus to module dropdown"` ✅
- `"Refactor: Update component styling"` ✅

**Hindari:**
- `"fix"` ❌
- `"update"` ❌
- `"changes"` ❌

---

## 🔗 Links

- [Vercel Dashboard](https://vercel.com)
- [GitHub Repository](https://github.com/dickysamudra09/sijerman)
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)

---

**Last Updated:** April 2, 2026
