# Personal Website Project

A modern personal website built with Next.js, featuring a blog, financial dashboard placeholder, and professional portfolio sections.

## 🏗 Project Structure

```
my-personal-website/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── about/             # About page
│   │   │   └── page.tsx
│   │   ├── blog/              # Blog system
│   │   │   ├── [id]/          # Individual blog posts
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx       # Blog listing
│   │   ├── contact/           # Contact page
│   │   │   └── page.tsx
│   │   ├── dashboard/         # Financial dashboard (placeholder)
│   │   │   └── page.tsx
│   │   ├── globals.css        # Global styles + blog formatting
│   │   ├── layout.tsx         # Main layout with nav/footer
│   │   └── page.tsx           # Homepage
│   ├── components/            # Reusable components
│   │   ├── Footer.tsx         # Site footer
│   │   └── Navigation.tsx     # Main navigation
│   └── lib/                   # Utility functions
│       └── blog.ts            # Blog post processing
├── posts/                     # Markdown blog posts
│   ├── getting-started-with-financial-analysis.md
│   ├── building-my-financial-dashboard.md
│   └── understanding-sec-filings.md
├── public/                    # Static assets
├── package.json              # Dependencies
└── README.md                 # This file
```

## 🚀 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Blog**: Markdown with gray-matter + remark
- **Language**: TypeScript
- **Deployment**: Vercel (recommended)

## 📝 Key Features

✅ **Homepage**: Professional landing with hero section  
✅ **About Page**: Bio, experience, skills layout  
✅ **Blog System**: Markdown-based with tags and formatting  
✅ **Dashboard**: Placeholder for financial analysis tools  
✅ **Contact**: Professional contact form  
✅ **Responsive**: Mobile-friendly design  
✅ **SEO**: Proper metadata and structure  

## 🛠 Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📦 Dependencies

### Main Dependencies
- `next`: React framework
- `react` & `react-dom`: React library
- `gray-matter`: Parse markdown frontmatter
- `remark` & `remark-html`: Process markdown content
- `date-fns`: Date formatting utilities

### Dev Dependencies
- `typescript`: TypeScript support
- `tailwindcss`: CSS framework
- `eslint`: Code linting

## 🎯 Content Customization Checklist

### Replace Placeholder Content:
- [ ] Update "Your Name" throughout all files
- [ ] Add real email addresses and social links
- [ ] Replace bio and experience information
- [ ] Add professional photo to homepage
- [ ] Update contact information in footer
- [ ] Write real blog posts

### Files to Update:
- `src/app/layout.tsx` - Site title and meta
- `src/app/page.tsx` - Homepage content  
- `src/app/about/page.tsx` - Bio and experience
- `src/components/Footer.tsx` - Contact links
- `src/components/Navigation.tsx` - Site name

## 🔮 Future Development (Dashboard Phase)

### Planned Financial Dashboard Features:
- SEC Edgar API integration
- Interactive financial charts (Recharts)
- Company financial analysis tools
- Multi-company comparison
- Real-time data visualization

### Additional Libraries to Add Later:
```bash
npm install recharts  # For charts
# SEC API integration dependencies
```

## 🌐 Deployment

### Vercel (Recommended):
1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Deploy automatically

### Environment Variables (for later):
```env
NEXT_PUBLIC_SITE_URL=https://yoursite.com
```

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [SEC Edgar API](https://sec.gov/edgar/sec-api-documentation)
- [Markdown Guide](https://www.markdownguide.org/)

## 🎨 Design Notes

- Color scheme: Blue (#2563eb) primary, gray neutrals
- Typography: Inter font family
- Responsive breakpoints: sm, md, lg (Tailwind defaults)
- Component structure: Atomic design principles

## 🐛 Common Issues & Solutions

### Blog posts not showing:
- Check markdown files are in `/posts` directory
- Verify frontmatter format (title, date, description)
- Ensure file extensions are `.md`

### Styling issues:
- Check Tailwind classes are valid
- Verify global CSS is properly imported
- Clear browser cache

### Build errors:
- Run `npm run build` to check for TypeScript errors
- Verify all imports are correct
- Check file naming conventions

---

**Created**: [Current Date]  
**Last Updated**: [Current Date]  
**Status**: Foundation Complete - Ready for Content Customization