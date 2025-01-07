import React, { useEffect, useRef } from "react";
import "../style/App.css";

// Define demand partners (SSPs) with adapters
const adUnits = [
  {
    code: "div-gpt-ad-123456",
    mediaTypes: {
      banner: {
        sizes: [[300, 250], [728, 90]],
      },
    },
    bids: [
      { bidder: "appnexus", params: { placementId: 13144370 } }, // AppNexus Adapter
      { bidder: "rubicon", params: { accountId: 1001, siteId: 112233, zoneId: 445566 } }, // Rubicon Adapter
    ],
  },
];

// Determine dynamic floor price based on size & device
const getFloorPrice = (size) => {
  if (size[0] === 300 && size[1] === 250) return 0.5; // Mobile floor price
  if (size[0] === 728 && size[1] === 90) return 1.0; // Desktop floor price
  return 0.3; // Default floor price
};

// Validate incoming bids using OpenRTB protocol
const validateBid = (bid) => {
  const errors = [];

  // Price Validation
  if (typeof bid.price !== "number" || bid.price <= getFloorPrice([bid.width, bid.height])) {
    errors.push("Invalid or below-floor bid price");
  }

  // Advertiser Domain Validation
  if (!Array.isArray(bid.adomain) || bid.adomain.length === 0) {
    errors.push("Missing advertiser domain");
  }

  return errors;
};

// Load GPT (Google Publisher Tag) script safely
const loadGPT = () => {
  window.googletag = window.googletag || { cmd: [] };

  window.googletag.cmd.push(() => {
    if (window.googletag.pubadsReady) return; // Prevent multiple loads

    window.googletag.pubads().enableSingleRequest();
    window.googletag.enableServices();

    window.adSlots = window.adSlots || {};
    window.adSlots["div-gpt-ad-123456"] = window.googletag
        .defineSlot("/123456/test-ad", [[300, 250], [728, 90]], "div-gpt-ad-123456")
        .addService(window.googletag.pubads());
  });
};

// Setup Prebid.js analytics (Google Analytics)
const setupPrebidAnalytics = () => {
  if (!window.pbjs) return;

  window.pbjs.que.push(() => {
    window.pbjs.enableAnalytics({
      provider: "ga4",
      options: {
        global: "gtag",
        trackingId: "G-RFWQLSTCKZ",
        enableDistribution: true,
      },
    });
    console.log("✅ Prebid Analytics Enabled");
  });

  window.pbjs.que.push(() => {
    window.pbjs.onEvent("bidResponse", (bid) => {
      console.log("📊 Bid Response:", bid);
      window.gtag?.("event", "bid_response", {
        event_category: "Ad Bidding",
        event_label: bid.bidder,
        value: bid.cpm,
      });

      const validationErrors = validateBid(bid);
      if (validationErrors.length > 0) {
        console.error("❌ Invalid bid:", validationErrors);
        return;
      }
    });

    window.pbjs.onEvent("auctionEnd", (auction) => {
      console.log("✅ Auction Ended:", auction);
      window.gtag?.("event", "auction_end", {
        event_category: "Ad Auction",
        event_label: auction.auctionId,
        value: auction.timestamp,
      });
    });

    window.pbjs.onEvent("bidWon", (bid) => {
      console.log("🏆 Winning Bid:", bid);
      window.gtag?.("event", "bid_won", {
        event_category: "Winning Bid",
        event_label: bid.bidder,
        value: bid.cpm,
      });
    });
  });
};

// Load fallback ad if no valid bids received
const loadFallbackAd = (adSlotId) => {
  const adSlotElement = document.getElementById(adSlotId);
  if (!adSlotElement) return;

  adSlotElement.innerHTML = "<p>No ad available, showing fallback ad.</p>";
};

// Request bids and refresh ads
const requestBids = () => {
  if (!window.pbjs || !window.googletag) {
    console.error("🚨 Prebid.js or GPT is not loaded.");
    return;
  }

  window.pbjs.que.push(() => {
    window.pbjs.addAdUnits(adUnits);
    window.pbjs.requestBids({
      bidsBackHandler: (bidResponses) => {
        console.log("📢 Bid responses:", bidResponses);

        const adSlot = window.adSlots?.["div-gpt-ad-123456"];
        if (adSlot && window.pbjs) {
          window.googletag.cmd.push(() => {
            window.pbjs.setTargetingForGPTAsync();
            console.log("✅ Refreshing ad slot...");
            window.googletag.pubads().refresh([adSlot]);
          });
        } else {
          console.warn("⚠️ Ad slot not defined before bid response.");
        }

        if (!bidResponses || Object.keys(bidResponses).length === 0) {
          console.warn("🚫 No bids received, triggering fallback ad.");
          loadFallbackAd("div-gpt-ad-123456");
        }
      },
    });
  });
};

// Lazy-load ads when they come into view
const lazyLoadAds = (adSlotId) => {
  const adSlotElement = document.getElementById(adSlotId);
  if (!adSlotElement) return;

  const observer = new IntersectionObserver(
      (entries, observerInstance) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log(`🔄 ${adSlotId} is in view, loading ad...`);
            window.googletag.cmd.push(() => {
              window.googletag.pubads().refresh([window.adSlots[adSlotId]]);
            });
            observerInstance.disconnect();
          }
        });
      },
      { rootMargin: "0px 0px 200px 0px", threshold: 0.5 }
  );

  observer.observe(adSlotElement);
};

const PrebidConfig = () => {
  const adSlotRef = useRef(null);

  useEffect(() => {
    loadGPT();
    setupPrebidAnalytics();
    if (window.pbjs) {
      requestBids();
    } else {
      console.error("🚨 Prebid.js is not loaded!");
    }
  }, []);

  useEffect(() => {
    console.log("🚀 Attempting to display ad...");
    window.googletag?.cmd.push(() => {
      console.log("✅ googletag.display('div-gpt-ad-123456') has run!");
      window.googletag.display("div-gpt-ad-123456");
    });
  }, []);

  useEffect(() => {
    if (adSlotRef.current) {
      lazyLoadAds("div-gpt-ad-123456");
    }
  }, []);

  return (
      <div>
        <h2>Header Bidding System</h2>
        <div
            id="div-gpt-ad-123456"
            ref={adSlotRef}
            style={{ width: "300px", height: "250px", backgroundColor: "#f4f4f4" }}
        ></div>
      </div>
  );
};

export default PrebidConfig;
