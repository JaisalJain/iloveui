import { useState } from "react";
import type { DesignState } from "@/registry/schema";
import AtelierProductPage, {
  atelierBag,
  atelierProduct,
  type AtelierBagLine,
  type AtelierProductPageProps,
} from "./component";

// A full page: rendered edge to edge, without a preview canvas.

// The default selection (Steel, 38 mm) as it lands in the bag.
const justAdded: AtelierBagLine = {
  id: "OV-3801-ST-38",
  name: "Méridienne",
  detail: "Steel · 38 mm",
  price: 2176,
  compareAtPrice: 2560,
  quantity: 1,
  maxQuantity: 3,
  thumbnail: "watch",
  tone: "var(--atelier-steel)",
};

// The last Graphite 38 mm was reserved while the client was choosing.
const reserved = {
  ...atelierProduct,
  variants: atelierProduct.variants.map((variant) =>
    variant.id === "OV-3801-GR-38"
      ? { ...variant, stock: 0, soldOutReason: "Reserved by another client a moment ago." }
      : variant,
  ),
};

// Demo behaviour for the live preview: the atelier confirms the hold after 900ms.
const holdPiece = () => new Promise<void>((resolve) => setTimeout(resolve, 900));

/** Starts with the bag open. While it is open the page is held to one screen, as the scroll lock does for a person. */
function OpenBag(props: AtelierProductPageProps) {
  const [open, setOpen] = useState(true);
  return (
    <div className={open ? "h-dvh overflow-hidden" : undefined}>
      <AtelierProductPage {...props} defaultBagOpen onBagOpenChange={setOpen} onAddToBag={holdPiece} />
    </div>
  );
}

export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return <AtelierProductPage key={state} status="loading" onAddToBag={holdPiece} />;
    case "empty":
      return <OpenBag key={state} bag={[]} />;
    case "error":
      return (
        <AtelierProductPage
          key={state}
          product={reserved}
          initialFinishId="graphite"
          initialSizeId="38"
          status="error"
          onAddToBag={holdPiece}
        />
      );
    case "success":
      return <OpenBag key={state} bag={[justAdded, ...atelierBag]} highlightLineId={justAdded.id} />;
    default:
      return <AtelierProductPage key={state} onAddToBag={holdPiece} />;
  }
}
