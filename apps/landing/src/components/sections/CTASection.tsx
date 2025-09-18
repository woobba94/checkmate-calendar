import { useRef, useEffect, useState } from 'react';
import { Button } from '../ui/button';
import './CTASection.scss';

const CTASection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.3, // 섹션의 30%가 보일 때 애니메이션 시작
      }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isVisible]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[219px] md:h-[712px] pt-6 md:pt-0 md:flex md:items-center overflow-hidden"
    >
      {/* Background */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background:
            'radial-gradient(59.78% 46.42% at 24.47% 29.73%, rgba(255, 255, 255, 0.00) 0%, rgba(255, 255, 255, 0.20) 100%), linear-gradient(91deg, #5B6BFE 28.86%, #7683FE 104.74%)',
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 max-w-[1024px] mx-auto px-5 md:px-4 w-full h-full flex flex-col md:flex-row items-center md:justify-between">
        {/* Desktop: Left Content, Mobile: Center Content */}
        <div className="flex flex-col items-center md:items-start gap-8 md:gap-14">
          <h2 className="text-xl md:text-5xl leading-none md:leading-normal font-bold text-white text-center md:text-left">
            <span
              className={`cta-section__typing-text ${isVisible ? 'animate' : ''}`}
            >
              {'체크메이트와 함께'.split('').map((char, index) => (
                <span
                  key={index}
                  className="cta-section__typing-char"
                  style={{ animationDelay: `${1 + index * 0.1}s` }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </span>
            <br className="block md:hidden" />
            <span className="cta-section__static-text">
              일정 관리를 시작하세요.
            </span>
          </h2>
          <div className="w-full md:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full md:w-auto"
              onClick={() =>
                (window.location.href = 'https://app.checkmate-calendar.com')
              }
            >
              시작하기
            </Button>
          </div>
        </div>

        {/* Desktop: Right Pattern Banner */}
        <div className="hidden md:block absolute right-0 top-0 h-full w-[163px]">
          <img
            src="/CTA-check-line-vertical.svg"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Mobile: Bottom Pattern Banner */}
      <div className="block md:hidden absolute bottom-0 left-0 right-0 w-full">
        <img
          src="/CTA-check-line-horizontal.svg"
          alt=""
          className="w-full object-cover"
        />
      </div>
    </section>
  );
};

export default CTASection;
