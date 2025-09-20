import { useEffect, useRef } from 'react';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

const FeaturesSection = () => {
  const features = [
    {
      id: 1,
      description: '귀찮았던 일정 등록을\n간편하게 관리해보세요.',
    },
    {
      id: 2,
      description: '나뿐만 아니라\n다른 사람도 함께요.',
    },
    {
      id: 3,
      description: '다른 캘린더의 일정도\n얼마든지 불러오세요.',
    },
  ];

  // Swiper pagination 스타일 조정을 위한 ref
  const swiperRef = useRef<any>(null);

  useEffect(() => {
    // 모바일에서만 스와이퍼 pagination 스타일 조정
    const updatePaginationStyle = () => {
      if (window.innerWidth <= 768 && swiperRef.current) {
        const pagination =
          swiperRef.current.querySelector('.swiper-pagination');
        if (pagination) {
          pagination.style.bottom = '20px';
        }
      }
    };

    updatePaginationStyle();
    window.addEventListener('resize', updatePaginationStyle);
    return () => window.removeEventListener('resize', updatePaginationStyle);
  }, []);

  return (
    <section className="py-20 md:py-[200px] bg-muted">
      <div className="flex flex-col gap-6 max-w-[1024px] mx-auto px-5 md:px-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:gap-0">
          <h2 className="text-2xl md:text-5xl leading-normal font-bold md:font-semibold text-foreground">
            말씀만 하세요,
            <br />
            일정은 체크메이트가
          </h2>
          <div className="h-fit md:max-w-[498px] text-sm md:text-lg leading-normal font-medium text-muted-foreground">
            여러 캘린더를 하나로, 누구와도 즉시 공유, 음성·프롬프트로 일정
            추가까지 여러 캘린더를 하나로, 누구와도 즉시 공유, 음성·프롬프트로
            일정추가까지여러 캘린더를 하나로, 누구와도 즉시 공유, 음
          </div>
        </div>

        {/* 데스크톱: 기존 그리드 레이아웃 */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-2">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="flex flex-col justify-end p-6 rounded-3xl h-[336px]"
              style={{
                background:
                  'linear-gradient(0deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.08) 100%), var(--base-muted, #F3F4F6)',
              }}
            >
              <p className="text-2xl leading-normal font-medium text-card-foreground whitespace-pre-line">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* 모바일: 스와이퍼 */}
        <div className="block md:hidden -mx-5" ref={swiperRef}>
          <Swiper
            modules={[Pagination]}
            spaceBetween={10}
            slidesPerView={1}
            centeredSlides={false}
            pagination={{
              clickable: true,
              bulletClass: 'swiper-pagination-bullet',
              bulletActiveClass: 'swiper-pagination-bullet-active',
              renderBullet: (_, className) => {
                return `<span class="${className}" style="width: 8px; height: 8px; background: ${
                  className.includes('active') ? '#000' : '#ccc'
                }; margin: 0 4px;"></span>`;
              },
            }}
            className="!pb-12 !px-5"
          >
            {features.map((feature) => (
              <SwiperSlide key={feature.id}>
                <div
                  className="flex flex-col justify-end p-6 rounded-3xl h-[280px]"
                  style={{
                    background:
                      'linear-gradient(0deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.08) 100%), var(--base-muted, #F3F4F6)',
                  }}
                >
                  <p className="text-xl leading-normal font-medium text-card-foreground whitespace-pre-line">
                    {feature.description}
                  </p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
