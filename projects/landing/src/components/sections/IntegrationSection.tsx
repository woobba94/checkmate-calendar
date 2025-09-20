const IntegrationSection = () => {
  const integrationCards = [
    {
      id: 'calendar-sharing',
      title: '일정 공유 전용 캘린더',
      description:
        '팀원들과 일정을 쉽게 공유하고 협업하세요. 권한 관리를 통해 보기 전용이나 편집 권한을 세밀하게 설정할 수 있습니다.',
      imageAlt: '캘린더 공유 이미지',
    },
    {
      id: 'calendar-sync',
      title: '회사에서 쓰는 캘린더도 연동',
      description:
        '구글 캘린더, 아웃룩 등 기존에 사용하던 캘린더와 실시간으로 동기화됩니다. 여러 캘린더를 하나의 인터페이스에서 편리하게 관리하세요.',
      imageAlt: '캘린더 연동 이미지',
    },
  ];

  return (
    <section className="pt-12 pb-20 md:pt-[50px] md:pb-[200px]">
      <div className="flex flex-col gap-10 md:gap-16 max-w-[1024px] mx-auto px-5 md:px-6">
        {/* 메인 영역 */}
        <div className="flex flex-col gap-6 md:gap-8">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl md:text-5xl leading-normal font-bold md:font-semibold text-foreground">
              분산된 일정들을 하나로 모으세요.
            </h2>
            <p className="text-sm md:text-lg leading-normal font-medium text-muted-foreground">
              다른 사람의 일정 부터, 다른 캘린더에 있는 일정까지.
              <br />
              분산되어 있던 당신의 모든 일정, 간단하게 한번에 보세요.
            </p>
          </div>

          {/* Full-width 이미지 영역 */}
          <div className="w-full h-[200px] md:h-[512px] bg-gray-200 rounded-2xl md:rounded-3xl flex items-center justify-center">
            <span className="text-base md:text-xl font-medium text-gray-500">
              추가 기능 전체 이미지 영역
            </span>
          </div>
        </div>

        {/* 서브 영역 - 데스크톱: 가로 배치, 모바일: 세로 배치 */}
        <div className="flex flex-col md:grid md:grid-cols-2 gap-10 md:gap-8">
          {integrationCards.map((card) => (
            <div key={card.id} className="flex flex-col gap-4 md:gap-5">
              <div className="flex flex-col gap-2 md:gap-3">
                <h3 className="text-lg md:text-2xl leading-none md:leading-tight font-semibold text-foreground">
                  {card.title}
                </h3>
                <p className="text-sm md:text-base leading-normal md:leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </div>
              <div className="h-[180px] md:h-[330px] bg-gray-200 rounded-2xl md:rounded-3xl md:mt-2 flex items-center justify-center">
                <span className="text-sm md:text-base font-medium text-gray-500">
                  {card.imageAlt}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntegrationSection;
