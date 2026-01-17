# Life Organizer Guru Website

A modern React website for Life Organizer Guru, featuring e-products, consulting services, and newsletter management.

## Features

- 🏠 **Home Page** - Beautiful landing page with hero section and features
- 📚 **Products Page** - Showcase e-books and planners
- 💼 **Services Page** - Display consulting services
- 📧 **Newsletter Subscription** - Email signup with Supabase integration
- 🔐 **Admin Dashboard** - Protected area for sending newsletters
- 📱 **Responsive Design** - Works on all devices
- 🎨 **Modern UI** - Built with Tailwind CSS

## Tech Stack

- React 19 + TypeScript
- Vite
- React Router
- Tailwind CSS
- Supabase (Database & Edge Functions)
- Resend (Email sending)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration file: `supabase/migrations/001_initial_schema.sql`
3. Get your project URL and anon key from Settings > API

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_PASSWORD=your_secure_admin_password_here
BASE_URL=https://yourdomain.com
```

### 4. Set Up Email Sending (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. In Supabase Dashboard:
   - Go to Edge Functions
   - Create a new function called `send-newsletter`
   - Copy the code from `supabase/functions/send-newsletter/index.ts`
   - Set environment variables:
     - `RESEND_API_KEY` - Your Resend API key
     - `SUPABASE_URL` - Your Supabase project URL
     - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (from Settings > API)
     - `BASE_URL` - Your website URL (for unsubscribe links)

### 5. Update Social Media Links

Edit the following files to add your actual social media URLs:
- `src/components/Footer.tsx`
- `src/pages/Contact.tsx`

Update the contact email in:
- `src/components/Footer.tsx`
- `src/pages/Contact.tsx`
- `src/pages/Services.tsx`

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see your site.

### 7. Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Admin Access

- Navigate to `/admin` to access the admin dashboard
- Use the password set in `VITE_ADMIN_PASSWORD` environment variable
- From the admin dashboard, you can:
  - View all newsletter subscribers
  - Draft and send newsletters to all subscribers
  - Newsletters automatically include unsubscribe links

## Newsletter Features

- **Subscription**: Users can subscribe via the newsletter signup component
- **Unsubscribe**: Each email includes an unsubscribe link that automatically updates the database
- **Admin Dashboard**: Send newsletters to all subscribers with HTML support

## Project Structure

```
src/
  components/     # Reusable components (Navbar, Footer, NewsletterSignup)
  pages/         # Page components (Home, Products, Services, etc.)
  lib/           # Utilities (Supabase client)
```

## Notes

- The admin authentication is currently password-based. For production, consider implementing proper authentication with Supabase Auth.
- Email sending requires a Resend API key. You can also use other email services by modifying the Edge Function.
- Make sure to update all placeholder URLs and email addresses before deploying.

## License

Private project - All rights reserved
# life-organizer-guru
