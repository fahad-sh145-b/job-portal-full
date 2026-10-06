# Job Portal (backend + frontend)

## 1. Backend
cd backend
cp .env.example .env      # fill MONGODB_URL, JWT_SECRET, WhatsApp keys
npm install
npm run dev               # http://localhost:4000

## 2. Frontend
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:4000
npm install
npm run dev               # http://localhost:5173

## Flow
- Sign up as "Hire people" -> Dashboard -> add a company -> post a job.
- Sign up as "Find a job" (with WhatsApp number + country code) -> apply.
- Application appears on the dashboard within 15 seconds; candidate gets a WhatsApp confirmation.

## WhatsApp (Meta Cloud API)
1. developers.facebook.com -> create app -> add WhatsApp product.
2. Copy the temporary token (WHATSAPP_TOKEN) and Phone number ID (WHATSAPP_PHONE_ID).
3. In WhatsApp Manager create a template named `application_received` (category Utility) with body:
   Hi {{1}}, your application for {{2}} at {{3}} was submitted successfully.
4. While testing, add your own number as an allowed recipient in the API Setup page.
