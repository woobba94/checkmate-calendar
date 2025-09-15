import { Button } from '../ui/button';

const HeroSection = () => {
  const handleGetStarted = () => {
    window.location.href = 'https://app.checkmate-calendar.com';
  };

  return (
    <section className="py-32 bg-background">
      <div className="max-w-[1024px] mx-auto px-6">
        <h1 className="text-6xl leading-normal font-bold text-foreground mb-6">
          말씀만 하세요,
          <br />
          일정은 체크메이트가 정리합니다.
        </h1>
        <p className="text-lg leading-normal font-medium text-foreground mb-10">
          여러 캘린더를 하나로, 누구와도 즉시 공유, 음성·프롬프트로 일정
          추가까지
        </p>
        <div className="flex">
          <Button
            onClick={handleGetStarted}
            className="px-8 py-6 text-base font-medium"
            size="lg"
          >
            시작하기
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
