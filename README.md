# Curriculum and Notes

A Next.js website for compiling study resources and notes with a clean, minimal design.

## Features

- Black background with white text
- Roboto Slab font for readability
- Navigation arrows in the top left corner
- Extensible page structure for organizing subjects and notes
- Easy to add new pages and links

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Adding New Pages

### Adding a New Subject

Create a new folder in `app/subjects/`:

```
app/subjects/your-subject-name/page.tsx
```

### Adding New Notes

Create a new folder in `app/notes/`:

```
app/notes/your-notes-name/page.tsx
```

### Linking Between Pages

Use Next.js `Link` component to create links between pages:

```tsx
import Link from 'next/link'

<Link href="/subjects/your-subject">Your Subject</Link>
```

## Project Structure

```
.
├── app/
│   ├── layout.tsx          # Root layout with navigation
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles
│   ├── subjects/           # Subject pages
│   └── notes/              # Notes pages
├── components/
│   └── Navigation.tsx      # Navigation arrows component
└── package.json
```

## Styling

The site uses:
- Black background (`#000000`)
- White text (`#ffffff`)
- Roboto Slab font from Google Fonts
- Minimal, clean design

You can customize the styles in `app/globals.css` and individual page components.

