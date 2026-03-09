# Bidora: Patentable Technology Candidates

This document outlines the core proprietary algorithms and systems being developed for the Bidora platform. These features are designed to be novel, non-obvious, and highly useful for the high-value social auction space, making them strong candidates for patent protection.

## 1. Dynamic Velocity-Based Anti-Sniping Engine

### The Problem
Traditional online auctions (like eBay) suffer from "bid sniping" – bots or users placing bids in the last milliseconds, preventing fair price discovery. Basic mitigations implement a static time extension (e.g., adding 30 seconds for any bid in the last minute). This is predictable, easily gamed by bots, and often frustrates users if the auction drags on unnecessarily.

### Bidora's Novel Solution
Bidora implements a **Dynamic Extension Logic** based on real-time *Bid Velocity* and *Bidder Density*.

#### Mathematical/Logical Approach
1. **Bid Velocity ($V$):** The number of bids placed across the platform for a specific item within the last $t$ seconds (e.g., 10 seconds).
2. **Bidder Density ($D$):** The number of *unique* bidders who have placed a bid on the item in the last $t$ seconds.
3. **Extension Calculation ($E$):** The time added to the auction clock is calculated dynamically rather than statically.
   * If a single bidder places a last-second bid against a dormant auction ($V=1, D=1$), the extension is short (e.g., 10 seconds)—enough time for the previous highest bidder to react, but preventing unnecessary drag.
   * If multiple bidders are fighting in the last few seconds ($V>5, D>2$), the system predicts high contention and increases the extension period logarithmically (e.g., 45 or 60 seconds) to allow the market to settle.

**Patent Claim Focus:** The algorithmic method of calculating auction time extensions dynamically based on real-time bid frequency and unique participant volume, optimizing for maximum price discovery while preventing infinite auction loops.

---

## 2. Multi-Stage Authenticated Escrow for High-Value Logistics

### The Problem
Standard escrow systems (like those used by basic classifieds) use a binary "Hold Funds -> Release Finds on Delivery" model. For luxury goods (sneakers, watches) where platforms like Culture Circle operate, the risk of "bait and switch" (buyer claims item is fake, or seller ships a fake item) is high.

### Bidora's Novel Solution
A **Tranche-Based Smart-Escrow Protocol** that integrates physical logistics checkpoints into the financial release logic.

#### Logical Workflow
1. **Fund Capture:** Buyer wins auction; funds ($100\%) are captured into a Bidora-managed escrow smart wallet.
2. **Logistics Trigger (Tranche 1):** When the seller provides a valid tracking number and courier API confirms "In Transit", a small percentage (e.g., $10\%$ to cover shipping/insurance) can be optionally released.
3. **Authentication Trigger (Tranche 2):** *For items requiring authentication.* The item is diverted to a Bidora Authentication Center. Upon successful verification, the platform claims its commission fee from the escrow pool automatically.
4. **Delivery Guarantee Trigger (Tranche 3):** The final balance is held until the buyer receives the item and scans a cryptographic NFC/QR tag applied by the authenticator, or a 48-hour challenge window expires.

**Patent Claim Focus:** The system and method of tying automated fractional escrow payouts to multi-party physical logistic events and cryptographic authentication markers in a decentralized or centralized clearinghouse environment.

---

## 3. Real-Time Interaction-Graph Fraud Detection (Shill-Bidding Prevention)

### The Problem
"Shill bidding" is when a seller uses alternate accounts to bid on their own listings to drive up the price. Traditional platforms struggle to catch this without manual review or simple IP matching, which is easily bypassed with VPNs.

### Bidora's Novel Solution
An automated system that constructs a **Real-Time Bidder Interaction Graph** over WebSocket connections to detect coordinated bidding behavior on-the-fly.

#### Analytical Engine
1. **Latency & Cadence Tracking:** The WebSocket server logs the millisecond latency between a legitimate bid and a suspected shill bid. Bots or single-operator dual-devices often exhibit predictable timing cadences.
2. **Interaction Mapping:** The system maps the relationship between User A (Seller) and User B (Bidder). If User B bids on 80% of User A's auctions but wins <5% of them, the Edge Weight between them increases.
3. **Shadow Banning via WebSocket:** If the Interaction Graph scores a pair above a certain threshold during a live auction, the system silently discards the shill bid on the backend. The shill bidder's UI shows their bid as accepted (to prevent them from knowing they are caught), but the main WebSocket broadcasting to *other* clients ignores the bid, protecting genuine buyers.

**Patent Claim Focus:** A method for real-time detection and mitigation of auction fraud using interaction graph analysis and asynchronous WebSocket state manipulation to silently bifurcate auction states for fraudulent actors.
