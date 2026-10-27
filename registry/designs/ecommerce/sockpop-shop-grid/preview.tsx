import type { DesignState } from "@/registry/definitions";
import SockpopShopGrid, { type SockLine } from "./component";

// The live preview resolves after a believable round trip so Placing order can be seen.
function checkout() {
  return new Promise<void>((resolve) => setTimeout(resolve, 1200));
}

const CART: SockLine[] = [
  { productId: "commuter", pattern: "dot", size: "M", qty: 2 },
  { productId: "lazy-sunday", pattern: "stripe", size: "S", qty: 1 },
];

export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return <SockpopShopGrid key={state} status="loading" />;
    case "empty":
      return <SockpopShopGrid key={state} defaultCartOpen onCheckout={checkout} />;
    case "error":
      return <SockpopShopGrid key={state} defaultCart={CART} defaultCartOpen status="error" onCheckout={checkout} />;
    case "success":
      return <SockpopShopGrid key={state} defaultCartOpen status="success" />;
    default:
      return (
        <SockpopShopGrid key={state} defaultCart={CART} defaultCartOpen defaultCode="SOCKPOP15" onCheckout={checkout} />
      );
  }
}
