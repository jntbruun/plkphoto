# PLKPHOTO

Portfolio website for nature photographer Petter L. Krogstad.
Built by [BLUR Design Studio](https://blurdesign.no).

**Stack:** Next.js 15 · TypeScript · Tailwind CSS v4 · next-intl · Resend

---

## Setup

```bash
# Install dependencies
npm install

# Copy env file and fill in values
cp .env.example .env.local

# Import photos (processes /Animal photos/ → /public/images/photos/wildlife/)
npm run import-photos

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | API key from resend.com |
| `CONTACT_TO_EMAIL` | Email address that receives contact form submissions |
| `NEXT_PUBLIC_SITE_URL` | Full site URL, no trailing slash (e.g. `https://plkphoto.no`) |
| `PLAUSIBLE_DOMAIN` | Optional. Plausible Analytics domain |

---

## Adding images

### Wildlife (or any future collection)

1. Create a folder in `Animal photos/your-slug/` and drop the image inside (any filename).
2. Run `npm run import-photos` — this copies the image to `/public/images/photos/wildlife/your-slug.jpg` and regenerates `content/images.generated.ts`.
3. Add an entry to `content/images.metadata.ts` with the slug, title (no+en), location, date, etc.
4. The image will appear in the gallery automatically.

### Nature / Other collections

Not yet populated. When Petter delivers images:
1. Update `scripts/importPhotos.ts` to also process those folders (or copy manually into `/public/images/photos/nature/` / `/public/images/photos/other/`).
2. Follow the same metadata pattern.
3. Update collection covers in `content/collections.ts`.

---

## Writing a blog post

1. Create two MDX files:
   - `content/blog/your-post.no.mdx`
   - `content/blog/your-post.en.mdx`
2. Add an entry to `content/blog.ts` with the slug, title, excerpt, coverImage, and publishedAt.
3. The post appears on `/blog` automatically.

Supported MDX: `##` headings, paragraphs, links, lists, blockquotes.

---

## Translations

UI strings live in `messages/no.json` and `messages/en.json`.
Content (titles, descriptions, alt text) lives in the content files as `{ no: "...", en: "..." }` objects.

Default locale: Norwegian (`/`). English at `/en/`.

---

## Deploy (Vercel)

```bash
vercel --prod
```

Set all env vars in Vercel dashboard before deploying.

Update `NEXT_PUBLIC_SITE_URL` to the live domain once confirmed with Petter.

---

## Phase 2 notes

The data access layer (`content/images.ts`, `content/collections.ts`, `content/blog.ts`) exports stable function signatures (`getPhotos`, `getPhoto`, `getCollections`, etc.). In Phase 2, swap the implementation to Sanity without touching any page components.

Sanity schema should mirror `types/content.ts` exactly.

---

## TODOs for Petter

- [ ] Confirm/correct metadata in `content/images.metadata.ts` (all marked `metadataStatus: 'placeholder'`)
- [ ] Deliver portrait photo for About page
- [ ] Deliver final About page copy
- [ ] Confirm which images are featured on home page
- [ ] Confirm prints + sizes/pricing
- [ ] Deliver Nature and Other collection images
- [ ] Provide Instagram handle (currently placeholder)
- [ ] Confirm contact email (currently placeholder)
- [ ] Confirm domain name
