const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
const REALTY_API_KEY = process.env.REALTYAPI_KEY || "";
const REALTY_API_BASE = "https://auction.realtyapi.io";

function num(...v){for(const x of v){const n=Number(x);if(Number.isFinite(n))return n}return 0}
function scoreDeal(d,filters){const bid=num(d.openingBid,d.price,d.startingBid,d.estimatedValue),value=num(d.estimatedValue,d.marketValue,d.arv,d.value),days=num(d.auctionDays,999);let score=0;if(bid>0&&bid<=filters.maxPrice)score+=30;if(value>=filters.minValue)score+=30;if(days<=filters.auctionDays)score+=15;if(value>bid&&bid>0)score+=15;if(filters.buyingType==="Any"||String(d.buyingType||"").toLowerCase().includes(String(filters.buyingType||"").toLowerCase().split(" ")[0]))score+=10;return Math.min(100,score)}
function normalize(item){const auctionDate=item.auctionDate||item.auction_date||item.saleDate||item.sale_date||item.auction?.date,bid=item.openingBid??item.opening_bid??item.startingBid??item.starting_bid??item.price??item.auction?.startingBid,value=item.estimatedValue??item.estimated_value??item.arv??item.marketValue??item.market_value??item.valuation;return {id:item.listingId||item.listing_id||item.id||item.propertyId||null,address:item.address||item.propertyAddress||item.property_address||[item.street,item.city,item.state,item.zip||item.postalCode].filter(Boolean).join(", "),openingBid:num(bid),estimatedValue:num(value),auctionDate,auctionDays:auctionDate?Math.max(0,Math.ceil((new Date(auctionDate)-new Date())/86400000)):999,strategy:item.buyingType||item.assetType||item.strategy||item.buying_type||"Auction",buyingType:item.buyingType||"",assetType:item.assetType||"",propertyType:item.propertyType||"",beds:num(item.beds,item.bedrooms),baths:num(item.baths,item.bathrooms),sqft:num(item.sqft,item.squareFeet),occupancy:item.occupancy||"",sourceUrl:item.url||item.listingUrl||item.listing_url||(item.listingId?"https://www.auction.com/details/"+item.listingId:""),raw:item}}
async function auctionGet(path,params={}){if(!REALTY_API_KEY)throw new Error("REALTYAPI_KEY is not configured on the server.");const url=new URL(REALTY_API_BASE+path);Object.entries(params).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=="")url.searchParams.set(k,String(v))});const r=await fetch(url,{headers:{"x-realtyapi-key":REALTY_API_KEY,"Accept":"application/json"}});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data?.message||("RealtyAPI request failed ("+r.status+")"));return data}
async function discover(filters){const data=await auctionGet("/search/bylocation",{location:filters.location,resultCount:Math.min(250,filters.limit),sort:"auction_date",availability:"active",buyingType:filters.buyingType,assetType:filters.assetType,propertyType:filters.propertyType,maxPrice:filters.maxPrice,occupancy:filters.occupancy,presale:filters.presale,keywords:filters.keywords});const items=data.results||data.listings||data.searchResults||data.content||data.data||[];return items.map(normalize).map(d=>({...d,score:scoreDeal(d,filters)})).filter(d=>d.score>=filters.minScore).sort((a,b)=>b.score-a.score)}

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
app.get("/api",(_req,res)=>res.json({ok:true,service:"FLIPIT production API",ui:"/",features:["auction discovery","property details","autopilot"]}));
app.get("/api/health",(_req,res)=>res.json({ok:true,service:"FLIPIT production API",dataProvider:REALTY_API_KEY?"RealtyAPI connected":"RealtyAPI key not configured"}));
app.get("/api/property/:id",async(req,res)=>{try{res.json({ok:true,property:await auctionGet("/details/byid",{listingId:req.params.id,enrich:req.query.enrich!=="false"})})}catch(e){res.status(502).json({ok:false,error:e.message})}});
app.post("/api/autopilot/discover",async(req,res)=>{const filters={location:req.body.location||"NJ",maxPrice:Number(req.body.maxPrice||20000),minValue:Number(req.body.minValue||150000),auctionDays:Number(req.body.auctionDays||30),buyingType:req.body.buyingType||"Any",assetType:req.body.assetType||"",propertyType:req.body.propertyType||"house",occupancy:req.body.occupancy||"",presale:req.body.presale===true,keywords:req.body.keywords||"",minScore:Number(req.body.minScore||60),limit:Number(req.body.limit||100)};try{const deals=await discover(filters);res.json({ok:true,provider:"RealtyAPI/Auction.com",filters,count:deals.length,deals})}catch(e){res.status(502).json({ok:false,error:e.message})}});
app.post("/api/autopilot/run",async(req,res)=>{const filters={location:req.body.location||process.env.AUTOPILOT_LOCATION||"NJ",maxPrice:Number(req.body.maxPrice||process.env.AUTOPILOT_MAX_PRICE||20000),minValue:Number(req.body.minValue||process.env.AUTOPILOT_MIN_VALUE||150000),auctionDays:Number(req.body.auctionDays||30),buyingType:req.body.buyingType||"Any",assetType:req.body.assetType||"",propertyType:req.body.propertyType||"house",occupancy:req.body.occupancy||"",presale:req.body.presale===true,minScore:Number(req.body.minScore||60),limit:Number(req.body.limit||100)};try{const deals=await discover(filters);res.json({ok:true,ranAt:new Date().toISOString(),count:deals.length,deals})}catch(e){res.status(502).json({ok:false,error:e.message})}});
app.listen(PORT,()=>console.log("FLIPIT API listening on "+PORT));