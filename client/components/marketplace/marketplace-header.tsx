import React from "react";

export function MarketplaceHeader() {
  return (
    <div className="flex flex-col gap-1 pb-2">
      <h1 className="font-outfit text-[28px] font-bold tracking-tight text-[#f0f0f8]">
        GPU Marketplace
      </h1>
      <p className="font-inter text-sm text-[#7a7a9a]">
        Find the right GPU for your workload.
      </p>
    </div>
  );
}
export default MarketplaceHeader;
