const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
const REALTY_API_KEY = process.env.REALTYAPI_KEY || "";
const REALTY_API_BASE = "https://auction.realtyapi.io";

function scoreDeal(d, filters) {
  const bid = Number(d.openingBid ?? d.price ?? 0);
  const value = Number(d.estimatedValue ?? d.value ?? d.arv ?? 0);
  const days = Number(d.auctionDays ?? 999);
  let score = 0;
  if (bid <= filters.maxPrice) score += 30;
  if (value >= filters.minValue) score += 30;
  if (days <= filters.auctionDays) score += 20;
  if (String(d.strategy || "").toLowerCase().includes(String(filters.strategy || "").toLowerCase().replace(" deed",""))) score += 10;
  if (value > bid) score += 10;
  return Math.min(100, score);
}

function normalize(item) {
  const auctionDate = item.auctionDate || item.auction_date || item.saleDate || item.sale_date;
  const bid = item.openingBid ?? item.opening_bid ?? item.startingBid ?? item.starting_bid ?? item.price;
  const value = item.estimatedValue ?? item.estimated_value ?? item.arv ?? item.marketValue ?? item.market_value;
  return {
    id: item.listingId || item.listing_id || item.id || null,
    address: item.address || item.propertyAddress || item.property_address || [item.street, item.city, item.state, item.zip].filter(Boolean).join(", "),
    openingBid: Number(bid || 0),
    estimatedValue: Number(value || 0),
    auctionDate,
    auctionDays: auctionDate ? Math.max(0, Math.ceil((new Date(auctionDate) - new Date()) / 86400000)) : 999,
    strategy: item.strategy || item.buyingType || item.buying_type || "Auction",
    sourceUrl: item.url || item.listingUrl || item.listing_url || "",
    raw: item
  };
}

app.get("/api", (_req,res) => res.json({ok:true,service:"FLIPIT production API",ui:"/"}));

app.get("/api/health", (_req,res) => res.json({
  ok:true,
  service:"FLIPIT production API",
  dataProvider: REALTY_API_KEY ? "RealtyAPI connected" : "RealtyAPI key not configured"
}));

app.post("/api/autopilot/discover", async (req,res) => {
  if (!REALTY_API_KEY) return res.status(503).json({ok:false,error:"REALTYAPI_KEY is not configured on the server."});
  const filters = {
    location: req.body.location || "NJ",
    maxPrice: Number(req.body.maxPrice || 20000),
    minValue: Number(req.body.minValue || 150000),
    auctionDays: Number(req.body.auctionDays || 30),
    strategy: req.body.strategy || "Tax Deed",
    limit: Math.min(250, Number(req.body.limit || 100))
  };
  const url = new URL(REALTY_API_BASE + "/search/bylocation");
  url.searchParams.set("location", filters.location);
  url.searchParams.set("resultCount", String(filters.limit));
  url.searchParams.set("sort", "price_low");
  try {
    const r = await fetch(url, { headers: { "x-realtyapi-key": REALTY_API_KEY, "Accept":"application/json" }});
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ok:false,error:data?.message || "RealtyAPI request failed"});
    const items = data.content || data.results || data.listings || data.data || [];
    const deals = items.map(normalize).map(d => ({...d, score:scoreDeal(d,filters)}))
      .filter(d => d.score >= 60)
      .sort((a,b)=>b.score-a.score);
    res.json({ok:true, provider:"RealtyAPI", filters, count:deals.length, deals});
  } catch (e) {
    res.status(502).json({ok:false,error:"Property data provider request failed.",detail:e.message});
  }
});


app.listen(PORT, ()=>console.log("FLIPIT API listening on "+PORT));
