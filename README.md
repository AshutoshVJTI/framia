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
