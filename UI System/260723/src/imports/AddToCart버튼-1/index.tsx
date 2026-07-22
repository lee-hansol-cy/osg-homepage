import imgReflect from "./ad16d9b656aa7f3cccb08749ca49fa1a98f5abd2.png";
import { imgRectangle3 } from "./svg-1zrmc";

function ShadowGroup() {
  return (
    <div className="absolute contents left-[410px] top-[930px]" data-name="shadow group">
      <div className="absolute bg-[rgba(0,0,0,0.25)] blur-[30px] h-[300px] left-[410px] opacity-0 rounded-[160px] top-[930px] w-[2060px]" data-name="button body shadow" />
      <div className="absolute bg-[rgba(204,233,255,0.8)] blur-[30px] h-[230px] left-[470px] opacity-0 rounded-[160px] top-[990px] w-[1940px]" data-name="reflect shadow" />
    </div>
  );
}

function GlossyTextureMask() {
  return (
    <div className="absolute contents left-[440px] top-[810px]" data-name="glossy texture mask">
      <div className="absolute bg-[rgba(204,233,255,0.6)] blur-[30px] h-[230px] left-[500px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-60px_-70px] mask-size-[2000px_300px] rounded-[160px] top-[880px] w-[1880px]" style={{ maskImage: `url("${imgRectangle3}")` }} />
    </div>
  );
}

function BodyGroup() {
  return (
    <div className="absolute contents left-[440px] top-[810px]" data-name="body group">
      <div className="absolute h-[300px] left-[440px] pointer-events-none rounded-[160px] top-[810px] w-[2000px]" data-name="button body">
        <div aria-hidden className="absolute bg-gradient-to-b from-[#80c8ff] inset-0 rounded-[160px] to-[#cce9ff]" />
        <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0px_15px_15px_0px_rgba(204,233,255,0.6),inset_0px_-10px_15px_0px_rgba(128,200,255,0.6)]" />
        <div aria-hidden className="absolute border-2 border-black border-solid inset-0 rounded-[160px]" />
      </div>
      <GlossyTextureMask />
      <div className="-translate-x-1/2 -translate-y-1/2 [word-break:break-word] absolute flex flex-col font-['OSG_Capsules:Light',sans-serif] justify-center leading-[0] left-[1440px] not-italic text-[160px] text-center text-shadow-[0px_30px_15px_rgba(0,0,0,0.25)] text-white top-[929.5px] tracking-[1.6px] whitespace-nowrap">
        <p className="leading-[normal]">Add to Cart</p>
      </div>
      <div className="absolute h-[100px] left-[515px] rounded-bl-[30px] rounded-br-[30px] rounded-tl-[70px] rounded-tr-[70px] top-[820px] w-[1850px]" data-name="reflect">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-bl-[30px] rounded-br-[30px] rounded-tl-[70px] rounded-tr-[70px] size-full" src={imgReflect} />
      </div>
    </div>
  );
}

function ButtonGroup() {
  return (
    <div className="absolute contents left-[410px] top-[810px]" data-name="button group">
      <ShadowGroup />
      <BodyGroup />
    </div>
  );
}

export default function AddToCart() {
  return (
    <div className="bg-white relative size-full" data-name="add to cart 버튼">
      <ButtonGroup />
    </div>
  );
}