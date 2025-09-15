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

  return (
    <section className="py-[200px] bg-muted">
      <div className="flex flex-col gap-6 max-w-[1024px] mx-auto">
        <div className="flex justify-between items-end">
          <h2 className="text-5xl leading-normal font-semibold text-foreground">
            말씀만 하세요,
            <br />
            일정은 체크메이트가
          </h2>
          <div className="h-fit max-w-[498px] text-lg leading-normal font-medium text-muted-foreground">
            여러 캘린더를 하나로, 누구와도 즉시 공유, 음성·프롬프트로 일정
            추가까지 여러 캘린더를 하나로, 누구와도 즉시 공유, 음성·프롬프트로
            일정추가까지여러 캘린더를 하나로, 누구와도 즉시 공유, 음
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
      </div>
    </section>
  );
};

export default FeaturesSection;
