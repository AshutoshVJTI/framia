# Framia AI

Transform your product photos into professional, ready-to-use images with AI.

## Features

- Upload product photos and transform them using AI
- Multiple style options: E-commerce, Lifestyle, Minimalist, Artistic, Social Media
- Compare original and transformed images
- Firebase authentication
- User-specific settings
- Responsive design for mobile and desktop

## Getting Started

### Prerequisites

- Node.js 16.8 or later
- Firebase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/ashutoshvjti/framia.git
cd product-photoshoot
```

2. Install dependencies
```bash
npm install
```

3. Set up Firebase
   - Create a new project in the [Firebase Console](https://console.firebase.google.com/)
   - Enable Google Authentication in the Authentication section
   - Create a web app and get your Firebase configuration
   
4. Create a `.env.local` file with your Firebase configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# OpenAI Configuration (if needed)
OPENAI_API_KEY=your_openai_api_key
```

5. Run the development server
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Authentication Setup

This app uses Firebase Authentication with Google Sign-in. To configure it properly:

1. Go to the Firebase Console
2. Navigate to Authentication > Sign-in method
3. Enable Google provider
4. Add your domain to the authorized domains list
5. Configure OAuth consent screen in Google Cloud Console if prompted

## Deployment

Deploy to Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in the Vercel project settings
4. Deploy

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.

## Acknowledgements

- OpenAI for providing the image generation API
- Next.js team for the amazing framework
- All contributors who participate in this project

## Environment Variables
Copy `.env.example` to `.env.local` and fill in your secrets:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
OPENAI_API_KEY=your-openai-api-key
LEMONSQUEEZY_API_KEY=your-lemonsqueezy-api-key
LEMONSQUEEZY_STORE_ID=your-store-id
LEMONSQUEEZY_WEBHOOK_SECRET=your-webhook-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
REDIS_URL=rediss://:your-upstash-token@your-upstash-host:port
```

## Upstash Redis Integration
- Sign up at [Upstash](https://upstash.com/) and create a Redis database.
- Copy the **Connection URL** (starts with `rediss://`).
- Set `REDIS_URL` in your `.env.local` and in your deployment environment (e.g., Vercel dashboard).
- No code changes are needed; the app will use Redis for rate limiting automatically.

## Production Checklist
- [ ] All secrets in environment variables (see `.env.example`)
- [ ] Using managed Redis (Upstash) and Firebase
- [ ] Security headers and HTTPS enabled
- [ ] All sensitive APIs require authentication
- [ ] Rate limiting in place (Redis)
- [ ] Monitoring/alerts enabled (e.g., Sentry)
- [ ] Tested in staging before going live

## Deployment (Vercel Example)
1. Push your code to GitHub.
2. Connect your repo to Vercel.
3. Set all environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`, etc.
   - `OPENAI_API_KEY`
   - `LEMONSQUEEZY_WEBHOOK_SECRET`
   - `REDIS_URL`
4. Deploy!

## Security
- All API endpoints requiring sensitive actions are authenticated.
- Per-user rate limiting is enforced using Redis.
- Security headers are set in `next.config.mjs`.
- File uploads are validated for type and size.
- No secrets are committed to the repo.

## Local Development
- Install dependencies: `npm install`
- Start Redis locally (or use Upstash): `docker run --name redis -p 6379:6379 -d redis`
- Run the dev server: `npm run dev`
