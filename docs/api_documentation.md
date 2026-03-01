# Bidora API Documentation

Base URL: `/api/v1`

## Authentication

### 1. Register User
- **Endpoint:** `POST /auth/register`
- **Body:** `{ "email", "password", "name", "role", "otp" }`
- **Description:** Registers a new user. Role defaults to "Buyer". OTP verification is simulated.

### 2. Login User
- **Endpoint:** `POST /auth/login`
- **Body:** `{ "email", "password" }`
- **Response:** `{ "token", "user": { "id", "role", "verificationStatus" } }`

### 3. Check Fraud (Internal / Middleware)
- **Description:** Prevents login/bids if `user.suspiciousFlags > THRESHOLD`.

---

## Users & Profiles

### 1. Get User Profile
- **Endpoint:** `GET /users/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Returns user profile, wallet balance, and trust rating.

### 2. Update Profile & Apply for Seller Verification
- **Endpoint:** `PUT /users/me`
- **Body:** `{ "bio", "avatarUrl", "requestSellerBadge": true }`

---

## Auctions

### 1. Create Auction (Sellers only)
- **Endpoint:** `POST /auctions`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  \`\`\`json
  {
    "title": "Vintage Role Submariner",
    "description": "Mint condition 1980.",
    "categoryId": 2,
    "images": ["url1", "url2"],
    "startingPrice": 5000,
    "reservePrice": 8000,
    "durationMinutes": 30,
    "shippingCost": 50
  }
  \`\`\`
- **Response:** Created auction object with status "Upcoming" or "Live".

### 2. List Active Auctions
- **Endpoint:** `GET /auctions`
- **Query Params:** `?status=live&category=watches&sort=endingSoon`
- **Response:** Array of active auctions formatted for the UI grid.

### 3. Get Auction Details
- **Endpoint:** `GET /auctions/:id`
- **Response:** Full auction detail, including current highest bid, seller rating, and time remaining.

### 4. Cancel Auction (Admin / Owner pre-bids)
- **Endpoint:** `DELETE /auctions/:id`

---

## Real-Time Bidding (WebSocket)

Bidding happens primarily over WebSocket for real-time updates. However, there is a fallback REST endpoint.

### WebSocket Connection
- **URL:** `ws://api.bidora.com/auctions/:auctionId/stream`
- **Events (Client -> Server):**
  - `PLACE_BID`: `{ "amount": 5500, "userId": "123" }`
- **Events (Server -> Client):**
  - `NEW_BID`: `{ "highestBid": 5500, "bidderId": "123" }`
  - `TIME_EXTENDED`: `{ "newEndTime": "2024-05-10T12:00:10Z" }` *(Anti-sniping logic triggered)*
  - `AUCTION_ENDED`: `{ "winnerId": "123", "finalPrice": 5500 }`

### REST Fallback Bid (If WS fails)
- **Endpoint:** `POST /auctions/:id/bid`
- **Body:** `{ "amount": 5500 }`

---

## Wallet & Escrow (Payments)

### 1. Add Funds to Wallet
- **Endpoint:** `POST /wallet/deposit`
- **Body:** `{ "amount": 1000, "paymentMethodId": "pm_mock123" }`

### 2. Pay for Won Auction (Escrow)
- **Endpoint:** `POST /escrow/pay`
- **Body:** `{ "auctionId": "abc" }`
- **Description:** Moves funds from Buyer wallet -> Escrow. Changes status to "Payment Pending" -> "Paid (Escrow)".

### 3. Release Escrow (Buyer Confirming Delivery)
- **Endpoint:** `POST /escrow/:auctionId/release`
- **Description:** Deducts 7% commission, transfers remaining 93% to Seller wallet.

---

## Shipping Integration

### 1. Upload Tracking Info (Seller)
- **Endpoint:** `POST /shipping/:auctionId/track`
- **Body:** `{ "courier": "FedEx", "trackingNumber": "123456789" }`

---

## Admin Dashboard

### 1. Get Platform Analytics
- **Endpoint:** `GET /admin/analytics`
- **Response:** Total GMV, Revenue from Commission, Active Users, Active Auctions.

### 2. Resolve Dispute
- **Endpoint:** `POST /admin/disputes/:auctionId/resolve`
- **Body:** `{ "resolution": "refund_buyer" | "release_to_seller", "notes": "..." }`
