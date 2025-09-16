import { Button } from '../ui/button';

const CTASection = () => {
  return (
    <section className="relative w-full h-[712px] flex items-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background:
            'radial-gradient(59.78% 46.42% at 24.47% 29.73%, rgba(255, 255, 255, 0.00) 0%, rgba(255, 255, 255, 0.20) 100%), linear-gradient(91deg, #5B6BFE 28.86%, #7683FE 104.74%)',
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 max-w-[1024px] mx-auto px-4 w-full h-full flex items-center justify-between">
        {/* Left Content */}
        <div className="flex flex-col gap-14">
          <h2 className="text-5xl leading-normal font-bold text-white">
            체크메이트와 함께
            <br />
            일정관리를 시작하세요.
          </h2>
          <div>
            <Button variant="outline" size="lg">
              시작하기
            </Button>
          </div>
        </div>

        {/* Right Pattern Banner */}
        <div className="absolute right-0 top-0 h-full w-[163px]">
          <img
            src="/CTA Banner.svg"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
};

export default CTASection;
