import { Web3Button } from "@thirdweb-dev/react";
import { MARKETPLACE_ADDRESS, MOONEY_DECIMALS } from "../../const/config";
import toastStyle from "../../lib/utils/toastConfig";
import { toast } from "react-hot-toast";
import { useMemo, useState } from "react";
import Skeleton from "../Layout/Skeleton";
import { CurrListing } from "../../lib/marketplace/marketplace-utils";
import { useRouter } from "next/router";
import { MarketplaceV3 } from "@thirdweb-dev/sdk";

type BuyOrBidProps = {
  marketplace: MarketplaceV3 | undefined;
  walletAddress: string | undefined;
  winningBid: string | undefined;
  currListing: CurrListing | undefined;
};

export default function BuyOrBid({
  marketplace,
  walletAddress,
  winningBid,
  currListing,
}: BuyOrBidProps) {
  const router = useRouter();
  const [bidValue, setBidValue] = useState<number>(0);

  const isOwner = useMemo(() => {
    if (walletAddress && currListing?.listing?.creatorAddress)
      return (
        walletAddress?.toLowerCase() ===
        currListing?.listing?.creatorAddress.toLowerCase()
      );
  }, [walletAddress, currListing]);

  async function createBidOrOffer() {
    let txResult;
    if (!currListing || !marketplace) return;
    try {
      if (currListing.type === "auction") {
        txResult = await marketplace?.englishAuctions.makeBid(
          currListing.listing?.auctionId,
          bidValue
        );
      } else {
        throw new Error("No valid auction listing found for this NFT");
      }
      setTimeout(() => {
        router.reload();
        toast(`Bid success!`, {
          icon: "✅",
          style: toastStyle,
          position: "bottom-center",
        });
      }, 1000);
      return txResult;
    } catch (err: any) {
      toast.error(`Bid failed! Reason: ${err?.reason}`);
    }
  }

  async function buyListing() {
    let txResult;
    if (!currListing || !marketplace) return;
    try {
      if (currListing.type === "direct") {
        txResult = await marketplace.directListings.buyFromListing(
          currListing.listing.listingId,
          1,
          walletAddress
        );
      } else {
        txResult = await marketplace.englishAuctions.buyoutAuction(
          currListing.listing.auctionId
        );
        await marketplace.englishAuctions.executeSale(
          currListing.listing.auctionId
        );
      }
      setTimeout(() => {
        router.reload();
        toast(`Purchase success!`, {
          icon: "✅",
          style: toastStyle,
          position: "bottom-center",
        });
      }, 1000);
      return txResult;
    } catch (err: any) {
      toast(`Purchase failed! Reason: ${err?.reason}`, {
        icon: "❌",
        style: toastStyle,
        position: "bottom-center",
      });
    }
  }

  return (
    <>
      {currListing && !currListing.listing?.creatorAddress ? (
        <Skeleton width="100%" height="164" />
      ) : (
        <>
          {/*Web3 connect button and template in case of listed by user address*/}
          {isOwner ? (
            <div className="ml-3 italic pt-1 opacity-80">
              This listing was created by you.
            </div>
          ) : (
            <>
              <Web3Button
                contractAddress={MARKETPLACE_ADDRESS}
                action={async () => await buyListing()}
                className={`connect-button`}
              >
                {`Buy for ${
                  currListing?.listing.pricePerToken / MOONEY_DECIMALS ||
                  currListing?.listing.buyoutBidAmount / MOONEY_DECIMALS
                } (MOONEY)`}
              </Web3Button>

              {currListing &&
                walletAddress &&
                currListing.type === "auction" && (
                  <>
                    <div className="flex items-center justify-center m-0 my-4">
                      <p className="text-sm leading-6 text-white text-opacity-60 m-0">
                        or
                      </p>
                    </div>
                    <input
                      className="block border border-white w-[98%] py-3 px-4 bg-black bg-opacity-70 border-opacity-60 rounded-lg mb-4 ml-[2px]"
                      placeholder={
                        currListing.type === "auction" &&
                        winningBid &&
                        +winningBid > 0
                          ? String(+winningBid / MOONEY_DECIMALS)
                          : currListing.listing
                          ? String(
                              +currListing.listing.minimumBidAmount /
                                MOONEY_DECIMALS
                            )
                          : "0"
                      }
                      type="number"
                      step={0.000001}
                      onChange={(e: any) => {
                        setBidValue(e.target.value);
                      }}
                    />

                    <Web3Button
                      contractAddress={MARKETPLACE_ADDRESS}
                      action={async () => await createBidOrOffer()}
                      className={`connect-button`}
                    >
                      Place bid
                    </Web3Button>
                  </>
                )}
            </>
          )}
        </>
      )}
    </>
  );
}