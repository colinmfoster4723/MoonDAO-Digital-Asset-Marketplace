import { MARKETPLACE_ADDRESS } from "../../const/config";
import { Web3Button } from "@thirdweb-dev/react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";

interface ClaimAuctionPayoutProps {
  claimable: boolean;
  auctionId: number;
}

export default function ClaimAuctionPayout({
  claimable,
  auctionId,
}: ClaimAuctionPayoutProps) {
  const router = useRouter();

  return (
    <Web3Button
      className="web3-button web3-button-primary"
      contractAddress={MARKETPLACE_ADDRESS}
      action={(marketplace) =>
        marketplace
          .call("collectAuctionPayout", [+auctionId])
          .then(() => router.reload())
      }
      onSuccess={() => {
        router.reload();
        setTimeout(() => {
          toast.success("Successfully claimed!");
        }, 1000);
      }}
      isDisabled={!claimable}
    >
      {claimable ? "Claim Payout" : "No Payout"}
    </Web3Button>
  );
}
