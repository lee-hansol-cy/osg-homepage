import { AddToCartButton, BuyItNowButton } from "./components/add-to-cart-button";

/**
 * A clean 1920 × 1080 presentation canvas:
 * - desktop: 780 × 117px buttons, shown side by side
 * - mobile: 340 × 52px buttons, shown as their real stacked mobile layout
 */
export default function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <section
        aria-label="Purchase button responsive presentation"
        className="grid aspect-video w-full max-w-[1920px] content-center gap-28 bg-white px-[8.333333%]"
      >
        <div className="grid grid-cols-2 gap-10">
          <AddToCartButton height={117} />
          <BuyItNowButton height={117} />
        </div>

        <div className="mx-auto grid w-[340px] gap-3">
          <AddToCartButton height={52} variant="mobile" />
          <BuyItNowButton height={52} variant="mobile" />
        </div>
      </section>
    </main>
  );
}
