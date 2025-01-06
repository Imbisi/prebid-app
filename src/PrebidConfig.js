import React, { useEffect } from "react";
import './App.css'
// Define the ad units
const adUnits = [
  {
    code: "div-gpt-ad-123456",
    mediaTypes: {
      banner: { sizes: [[300, 250], [728, 90]] }
    },
    bids: [
      { bidder: "appnexus", params: { placementId: 13232354 } },
      { bidder: "rubicon", params: { accountId: 1001, siteId: 112233, zoneId: 445566 } }
    ]
  }
];

// OpenRTB validation function
const validateBid = (bid) => {
  const errors = [];

  // 1. Price Validation: Ensure the bid price is a valid positive number
  if (typeof bid.price !== "number" || bid.price <= 0) {
    errors.push("Invalid bid price");
  }

  // 2. Advertiser Domain Validation: Ensure the domain is a valid URL and matches your criteria
  const domainRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+)(\/[^\s]*)?$/;
  if (!domainRegex.test(bid.adomain)) {
    errors.push("Invalid advertiser domain");
  }

  // 3. Creative Compatibility: Ensure the creative size is compatible with the ad unit size
  const adUnitSizes = [[300, 250], [728, 90]]; // Sizes requested for the ad unit
  const creativeSize = [bid.width, bid.height];

  const isSizeCompatible = adUnitSizes.some(
      (size) => size[0] === creativeSize[0] && size[1] === creativeSize[1]
  );
  if (!isSizeCompatible) {
    errors.push("Creative size is not compatible with the requested sizes");
  }

  // 4. Other OpenRTB Fields (e.g., `id`, `ext`): You can add additional validation based on your needs

  return errors;
};

// Load GPT script
const loadGPT = () => {
  if (!window.googletag) {
    window.googletag = { cmd: [] };
  }

  window.googletag.cmd.push(() => {
    if (!window.googletag.pubads) return;

    window.googletag.pubads().enableSingleRequest();
    window.googletag.enableServices();

    if (!window.adSlots) {
      window.adSlots = {};
    }

    if (!window.adSlots["div-gpt-ad-123456"]) {
      window.adSlots["div-gpt-ad-123456"] = window.googletag
          .defineSlot("/123456/test-ad", [300, 250], "div-gpt-ad-123456")
          .addService(window.googletag.pubads());
      window.googletag.display("div-gpt-ad-123456"); // Ensure it is displayed
    }
  });
};


// 🔥 Prebid Analytics Function
const setupPrebidAnalytics = () => {
  if (!window.pbjs) return;

  window.pbjs.que.push(() => {
    window.pbjs.enableAnalytics({
      provider: "ga4",
      options: {
        global: "gtag", // GA4 Global Tag
        trackingId: "G-RFWQLSTCKZ", // Replace with your GA4 ID
        enableDistribution: true
      }
    });

    console.log("✅ Prebid Analytics Enabled");
  });

  // Listen for bid events
  window.pbjs.que.push(() => {
    window.pbjs.onEvent("bidResponse", (bid) => {
      console.log("📊 Bid Response:", bid);
      window.gtag("event", "bid_response", {
        event_category: "Ad Bidding",
        event_label: bid.bidder,
        value: bid.cpm, // Bid CPM Value
      });

      // Validate incoming bid based on OpenRTB
      const validationErrors = validateBid(bid);
      if (validationErrors.length > 0) {
        console.error("Invalid bid:", validationErrors);
        // Optionally, you can reject the bid or apply fallback logic
        return;
      }

      console.log("✅ Valid Bid:", bid);
    });

    window.pbjs.onEvent("auctionEnd", (auction) => {
      console.log("✅ Auction Ended:", auction);
      window.gtag("event", "auction_end", {
        event_category: "Ad Auction",
        event_label: auction.auctionId,
        value: auction.timestamp,
      });
    });

    window.pbjs.onEvent("bidWon", (bid) => {
      console.log("🏆 Winning Bid:", bid);
      window.gtag("event", "bid_won", {
        event_category: "Winning Bid",
        event_label: bid.bidder,
        value: bid.cpm, // Winning bid CPM
      });
    });

    console.log("✅ Prebid Events Tracking Initialized");
  });
};

// Fallback ad loading function
const loadFallbackAd = () => {
  const adSlotElement = document.getElementById("div-gpt-ad-123456");
  if (!adSlotElement) return;

  // Load fallback content in the ad slot
  adSlotElement.innerHTML = "<p>Sorry, no ads are available right now. Please check back later.</p>";
  // You can also add a fallback ad image, such as:
  // adSlotElement.innerHTML = '<img src="fallback-ad-image.jpg" alt="Fallback Ad" />';
};

// Add ad units to pbjs queue and request bids
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

        const adSlot = window.adSlots?.["div-gpt-ad-123456"]; // Optional chaining
        if (adSlot) {
          window.pbjs.setTargetingForGPTAsync();
          window.googletag.cmd.push(() => {
            console.log("✅ Refreshing ad slot...");
            window.googletag.pubads().refresh([adSlot]);
          });
        } else {
          console.warn("⚠️ Ad slot not defined before bid response.");
        }

        // Handle empty bid responses (fallback logic)
        if (!bidResponses || Object.keys(bidResponses).length === 0) {
          console.warn("🚫 No bids received, triggering fallback ad.");
          loadFallbackAd();
        }
      }
    });
  });
};



// Lazy-load ads when they come into view
const lazyLoadAds = () => {
  const adSlotElement = document.getElementById("div-gpt-ad-123456");
  if (!adSlotElement) return;

  const observer = new IntersectionObserver(
      (entries, observerInstance) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log('Ad slot is in view, loading ad...');
            // Trigger GPT ad load (refresh the existing slot)
            window.googletag.cmd.push(() => {
              window.googletag.pubads().refresh([window.adSlots["div-gpt-ad-123456"]]);
            });
            observerInstance.disconnect(); // Stop observing after the ad is loaded
          }
        });
      },
      {
        rootMargin: '0px 0px 200px 0px', // Start loading when ad is 200px from the viewport
        threshold: 0.5 // Trigger when at least 50% of the ad is in view
      }
  );

  observer.observe(adSlotElement);
};

const PrebidConfig = () => {
  useEffect(() => {
    loadGPT(); // Load Google Publisher Tags
    setupPrebidAnalytics(); // Set up Prebid.js Analytics
    requestBids(); // Request bids from Prebid
    lazyLoadAds(); // Lazy-load ads when in view
  }, []);

  return (
      <div>
        {/*<h1>Prebid Analytics with Google Analytics</h1>*/}
        {/* Ad slot */}
        <div id="div-gpt-ad-123456" style={{ width: "300px", height: "250px" }}></div>
      </div>
  );
};

export default PrebidConfig;
