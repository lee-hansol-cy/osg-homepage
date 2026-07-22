import { AddToCartButton, BuyItNowButton } from "./components/add-to-cart-button";
import { TopBar } from "./components/top-bar";
import heroBackground from "../assets/osg-hero-bg.jpg";

/**
 * A clean 1920 × 1080 presentation canvas:
 * - top bar capsule over the OSG 메인페이지 hero render
 * - desktop: 780 × 117px buttons, shown side by side
 * - mobile: 340 × 52px buttons, shown as their real stacked mobile layout
 */
export default function App() {
  return (
    <main className="min-h-screen bg-white">
      <section aria-label="OSG 메인페이지 top bar" className="relative aspect-video w-full overflow-hidden bg-[#0b0b12]">
        <img src={heroBackground} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-x-0 top-0">
          <TopBar />
        </div>
      </section>

      <section
        aria-label="Purchase button responsive presentation"
        className="mx-auto grid aspect-video w-full max-w-[1920px] content-center gap-28 bg-white px-[8.333333%]"
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
