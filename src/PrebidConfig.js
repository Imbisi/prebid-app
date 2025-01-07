import React, { useEffect, useRef } from "react";
import "./App.css";

// Define the ad units
const adUnitSizes = [[300, 250], [728, 90]]; // Sizes requested for the ad unit
const adUnits = [
  {
    code: "div-gpt-ad-123456",
    mediaTypes: {
      banner: { sizes: adUnitSizes },
    },
    bids: [
      { bidder: "appnexus", params: { placementId: 13144370 } },
      { bidder: "rubicon", params: { accountId: 1001, siteId: 112233, zoneId: 445566 } },
    ],
  },
];

// OpenRTB validation function
const validateBid = (bid) => {
  const errors = [];

  // 1. Price Validation: Ensure the bid price is a valid positive number
  if (typeof bid.price !== "number" || bid.price <= 0) {
    errors.push("Invalid bid price");
  }

  // 2. Advertiser Domain Validation: Ensure the domain is valid
  const domainRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+)(\/[^\s]*)?$/;
  if (!domainRegex.test(bid.adomain)) {
    errors.push("Invalid advertiser domain");
  }

  // 3. Creative Compatibility Check
  const creativeSize = [bid.width, bid.height];
  const isSizeCompatible = adUnitSizes.some(
      (size) => size[0] === creativeSize[0] && size[1] === creativeSize[1]
  );
  if (!isSizeCompatible) {
    errors.push("Creative size is not compatible with the requested sizes");
  }

  return errors;
};

// Load GPT script safely
const loadGPT = () => {
  window.googletag = window.googletag || { cmd: [] };

  window.googletag.cmd.push(() => {
    if (!window.googletag.pubads || window.adSlots?.["div-gpt-ad-123456"]) return;

    window.googletag.pubads().enableSingleRequest();
    window.googletag.enableServices();

    window.adSlots = window.adSlots || {};
    window.adSlots["div-gpt-ad-123456"] = window.googletag
        .defineSlot("/123456/test-ad", [300, 250], "div-gpt-ad-123456")
        .addService(window.googletag.pubads());
  });
};

// Setup Prebid Analytics
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
      console.log("✅ Valid Bid:", bid);
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

    console.log("✅ Prebid Events Tracking Initialized");
  });
};

// Load fallback ad
const loadFallbackAd = (adSlotRef) => {
  const adSlotElement = document.getElementById("div-gpt-ad-123456");
  if (!adSlotElement) return;

  adSlotElement.innerHTML = "<p>Sorry, no ads are available right now. Please check back later.</p>";

};

// Request bids and refresh ads
const requestBids = () => {
  if (!window.pbjs || !window.googletag) {
    console.error("🚨 Prebid.js or Google Tag Manager is not loaded.");
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
          loadFallbackAd();
        }
      },
    });
  });
};

// Lazy-load ads when they come into view
const lazyLoadAds = (adSlotRef) => {
  if (!adSlotRef.current) return;

  const observer = new IntersectionObserver(
      (entries, observerInstance) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log("🔄 Ad slot is in view, loading ad...");
            window.googletag.cmd.push(() => {
              window.googletag.pubads().refresh([window.adSlots["div-gpt-ad-123456"]]);
            });
            observerInstance.disconnect();
          }
        });
      },
      { rootMargin: "0px 0px 200px 0px", threshold: 0.5 }
  );

  observer.observe(adSlotRef.current);
};

const PrebidConfig = () => {
  const adSlotRef = useRef(null);

  useEffect(() => {
    loadGPT();
    setupPrebidAnalytics();
    requestBids();
    lazyLoadAds(adSlotRef);
  }, []);

  useEffect(() => {
    console.log("🚀 Attempting to display ad...");
    window.googletag?.cmd.push(() => {
      console.log("✅ googletag.display('div-gpt-ad-123456') has run!");
      window.googletag.display("div-gpt-ad-123456");
    });
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
