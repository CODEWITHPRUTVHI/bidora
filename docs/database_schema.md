# Bidora Database Schema & ER Diagram

The database is built using **PostgreSQL** with Prisma as the ORM.

## ER Diagram Overview

\`\`\`mermaid
erDiagram
    User ||--o{ Auction : "owns/creates (Seller)"
    User ||--o{ Bid : "places (Buyer)"
    User ||--o{ WalletTransaction : "has"
    User ||--o{ Rating : "receives"
    
    Auction ||--o{ Bid : "receives"
    Auction ||--|| EscrowPayment : "has one"
    Auction ||--|| ShippingDetail : "has one"
    
    Category ||--o{ Auction : "categorizes"
    
    class User {
        String id PK
        String email UK
        String passwordHash
        String role "BUYER | SELLER | ADMIN"
        String verifiedStatus "BASIC | VERIFIED | PREMIUM"
        Float walletBalance
        Float trustScore
        DateTime createdAt
    }

    class Auction {
        String id PK
        String sellerId FK
        String title
        String description
        String categoryId FK
        Float startingPrice
        Float reservePrice
        Float currentHighestBid
        DateTime startTime
        DateTime endTime
        String status "UPCOMING | LIVE | ENDED | PAID | SHIPPED | COMPLETED | DISPUTED"
        String[] imageUrls
        Float shippingCost
    }

    class Bid {
        String id PK
        String auctionId FK
        String bidderId FK
        Float amount
        DateTime createdAt
        Boolean isWinning
    }

    class EscrowPayment {
        String id PK
        String auctionId FK
        String buyerId FK
        String sellerId FK
        Float amount
        Float platformFee "7%"
        String status "HELD | RELEASED | REFUNDED"
    }

    class WalletTransaction {
        String id PK
        String userId FK
        Float amount
        String type "DEPOSIT | WITHDRAWAL | ESCROW_HELD | ESCROW_RELEASED | PAYMENT"
        String status
        DateTime createdAt
    }

    class ShippingDetail {
        String id PK
        String auctionId FK
        String trackingNumber
        String courier
        String status "PENDING | IN_TRANSIT | DELIVERED"
    }
    
    class Rating {
        String id PK
        String fromUserId FK
        String toUserId FK
        String auctionId FK
        Int score "1-5"
        String comment
    }
\`\`\`

## Schema Details

### 1. `users` Table
- Stores both buyers and sellers, distinguished by the `role` enum.
- `walletBalance`: Ensures fast lookups for bidding eligibility without recalculating entire transaction history.
- `trustScore`: Derived from ratings; affects visibility and limits on the platform.

### 2. `auctions` Table
- Core entity. Handles status transitions.
- The `endTime` column is critical for the WebSocket countdown and is updated dynamically (e.g., +10s on anti-sniping events).

### 3. `bids` Table
- Appends every bid. `currentHighestBid` in `auctions` caches the highest `amount` here to optimize read queries for the Live Auction page.

### 4. `escrowPayments` Table
- Separate from wallet transactions to manage the lifecycle of a completed auction.
- Calculates the 7% `platformFee` to ensure the correct final release to the seller.

### 5. `walletTransactions` Table
- An append-only ledger tracking all money movement.
- If a user attempts to withdraw, it checks the sum of completed deposits/escrow releases vs. pending withdrawals.

### 6. `shippingDetails` Table
- Used to trigger the transition from "Payment Pending" -> "Shipped" and ultimately triggers the Escrow release when status hits "DELIVERED".

### 7. `categories` Table
- Static list (e.g., Watches, Sneakers, Trading Cards) used for navigation and SEO metadata.

## Scalability & Indexing Strategies
To handle high bid velocity:
1. **Index on `auctions.status` and `auctions.endTime`**: Fast retrieval of active/live auctions.
2. **Index on `bids.auctionId`**: Rapidly fetch bid history for a live stream.
3. **Compound Index `(auctionId, amount DESC)`** on Bids for quickly validating new bids against the highest.
4. Active connection management (e.g., pgBouncer) combined with Redis to cache live bid state before writing batches to PostgreSQL.
