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
    <section className="pt-[50px] pb-[200px]">
      <div className="flex flex-col gap-16 max-w-[1024px] mx-auto">
        {/* 메인 영역 */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h2 className="text-5xl leading-normal font-semibold text-foreground">
              분산된 일정들을 하나로 모으세요.
            </h2>
            <p className="text-lg leading-normal font-medium text-muted-foreground">
              다른 사람의 일정 부터, 다른 캘린더에 있는 일정까지.
              <br />
              분산되어 있던 당신의 모든 일정, 간단하게 한번에 보세요.
            </p>
          </div>

          {/* Full-width 이미지 영역 */}
          <div className="w-full h-[512px] bg-gray-200 flex items-center justify-center">
            <span className="text-xl font-medium text-gray-500">
              추가 기능 전체 이미지 영역
            </span>
          </div>
        </div>

        {/* 서브 영역 - 카드 2개 */}
        <div className="grid grid-cols-2 gap-8">
          {integrationCards.map((card) => (
            <div key={card.id} className="flex flex-col gap-5">
              <div key={card.id} className="flex flex-col gap-3">
                <h3 className="text-2xl leading-tight font-semibold text-foreground">
                  {card.title}
                </h3>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </div>
              <div className="h-[330px] bg-gray-200 mt-2 flex items-center justify-center">
                <span className="text-base font-medium text-gray-500">
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
