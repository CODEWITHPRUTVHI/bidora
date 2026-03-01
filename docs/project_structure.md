# Bidora Full Project File Structure

This document outlines the proposed folder structure for the Bidora full-stack application.

\`\`\`text
Bidora/
│
├── frontend/                        # Next.js Application
│   ├── public/                      # Static assets (images, icons)
│   ├── src/
│   │   ├── app/                     # App Router (Next.js 13+)
│   │   │   ├── (auth)/              # Route group for auth pages
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── signup/page.tsx
│   │   │   ├── (dashboard)/         # Route group for dashboard
│   │   │   │   ├── admin/page.tsx
│   │   │   │   ├── buyer/page.tsx
│   │   │   │   └── seller/page.tsx
│   │   │   ├── auctions/            # Auction listing & details
│   │   │   │   ├── [id]/page.tsx    # Dynamic route for single auction
│   │   │   │   └── page.tsx
│   │   │   ├── api/auth/            # NextAuth wrapper API endpoints
│   │   │   ├── layout.tsx           # Main application layout
│   │   │   ├── globals.css          # Tailwind & Global styles
│   │   │   └── page.tsx             # Landing page
│   │   ├── components/              # Reusable UI components
│   │   │   ├── ui/                  # Base components (Buttons, Inputs, Modals)
│   │   │   ├── layout/              # Header, Footer, Sidebar
│   │   │   ├── auction/             # Auction Card, Live Bid Log, Timer
│   │   │   └── shared/              # TrustBadges, RatingStars
│   │   ├── hooks/                   # Custom React hooks (useWebSocket, useAuth)
│   │   ├── lib/                     # Utility functions, axios instances
│   │   ├── types/                   # TypeScript interfaces (Auction, User, Bid)
│   │   └── store/                   # Global state management (Zustand/Redux)
│   ├── tailwind.config.ts           # Tailwind configuration
│   ├── next.config.js               # Next.js config
│   ├── package.json                 # Frontend dependencies
│   └── tsconfig.json                # TypeScript configuration
│
├── backend/                         # Node.js (Express/NestJS) Application
│   ├── prisma/                      # Database ORM
│   │   └── schema.prisma            # Database models
│   ├── src/
│   │   ├── controllers/             # Request handlers
│   │   │   ├── authController.ts
│   │   │   ├── userController.ts
│   │   │   ├── auctionController.ts
│   │   │   ├── bidController.ts
│   │   │   ├── walletController.ts
│   │   │   ├── paymentController.ts
│   │   │   └── adminController.ts
│   │   ├── routes/                  # API route definitions
│   │   │   ├── authRoutes.ts
│   │   │   ├── userRoutes.ts
│   │   │   ├── auctionRoutes.ts
│   │   │   └── paymentRoutes.ts
│   │   ├── middlewares/             # Custom middleware
│   │   │   ├── authMiddleware.ts    # JWT verification
│   │   │   ├── roleMiddleware.ts    # RBAC logic
│   │   │   ├── errorMiddleware.ts   # Global error handling
│   │   │   └── rateLimiter.ts
│   │   ├── services/                # Business logic & 3rd party integrations
│   │   │   ├── authService.ts
│   │   │   ├── auctionService.ts    # Auction state management
│   │   │   ├── websocketService.ts  # Real-time bidding logic
│   │   │   ├── escrowService.ts     # Mock payment processing
│   │   │   ├── shippingService.ts   # Generation of fake labels
│   │   │   └── fraudService.ts      # Basic anomaly detection
│   │   ├── models/                  # (If using Mongoose / raw SQL) or DTOs
│   │   ├── utils/                   # Helpers (logger, date parsing, hashing)
│   │   ├── types/                   # Backend Typescript definitions
│   │   └── server.ts                # Application entry point
│   ├── .env                         # Backend environment vars
│   ├── package.json                 # Backend dependencies
│   └── tsconfig.json
│
├── docs/                            # Documentation
│   ├── api_documentation.md         # API endpoints list
│   ├── database_schema.md           # ER Diagram and schema documentation
│   ├── deployment_guide.md          # Server deployment instructions
│   └── setup_instructions.md        # Local testing setup guide
│
├── docker-compose.yml               # Container orchestration for local dev
├── .env.example                     # Reference environment variables
└── README.md                        # Master project documentation
\`\`\`
