# OurDream Companion Experience

An interactive, dark-themed AI companion directory and landing portal for OurDream.ai.

## 🚀 Features

- **Category-First Model Directory**: Organized across Women, Men, and Trans companions. Models only reveal upon selecting a category.
- **Dynamic Character Roster**: 100 verified characters with bios, tags, personalities, and avatars.
- **Dual Direct Actions**: Every character card features instant **Chat** and **Create** action buttons.
- **Affiliate & Tracking Ready**: Integrated with Everflow tracking endpoints for seamless partner attribution.
- **Responsive & Modern UI**: Fast, mobile-first design with touch targets and glassmorphic styling.

## 📁 Repository Structure

```text
├── index.html         # Main landing page & companion directory UI
├── style.css          # Modern dark-theme stylesheet
├── script.js          # Interactive directory & search logic
├── data.js            # Character database & categories array
├── characters.json    # JSON dataset with full model metadata
├── config.json        # Global site & brand configuration
├── chat.html          # Fallback redirect handler
└── _redirects         # Netlify/Cloudflare SPA redirect rules
```

## 🌐 Deployment

This is a static site with zero build steps required. You can deploy it instantly to:
- **Netlify**: Drag-and-drop or connect this Git repository.
- **GitHub Pages**: Go to Settings → Pages → Deploy from branch (`main`).
- **Cloudflare Pages / Vercel**: Connect repository and set root directory to `/`.
