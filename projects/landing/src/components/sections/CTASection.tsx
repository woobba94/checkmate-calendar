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
        threshold: 0.3,
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
      className="relative w-full py-20 md:py-32 overflow-hidden"
    >
      {/* Background */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background:
            'linear-gradient(135deg, #6366F1 0%, #4F46E5 50%, #4338CA 100%)',
        }}
      />

      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 w-full h-full opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Gradient glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl" />

      {/* Content Container */}
      <div className="relative z-10 max-w-[900px] mx-auto px-6 text-center">
        <div className="flex flex-col items-center gap-10">
          <h2 className="text-3xl md:text-5xl lg:text-[3.25rem] leading-tight font-bold text-white tracking-tight">
            <span
              className={`cta-section__typing-text ${isVisible ? 'animate' : ''}`}
            >
              {'오늘부터 시작하면,'.split('').map((char, index) => (
                <span
                  key={index}
                  className="cta-section__typing-char"
                  style={{ animationDelay: `${0.8 + index * 0.06}s` }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </span>
            <br />
            <span className="cta-section__static-text mt-2 inline-block text-white/90">
              다음 약속은 안 까먹습니다.
            </span>
          </h2>

          <p className="text-lg text-white/70 max-w-md">
            가족, 친구, 동료와 함께 쓰는 스마트한 공유 캘린더를 경험하세요.
          </p>

          <Button
            variant="outline"
            size="lg"
            className="px-10 py-4 text-base font-semibold bg-white text-indigo-600 border-0 rounded-xl shadow-xl shadow-black/10 hover:bg-white/95 hover:shadow-2xl transition-all duration-300"
            onClick={() =>
              (window.location.href = 'https://app.checkmate-calendar.com')
            }
          >
            무료로 시작하기
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
