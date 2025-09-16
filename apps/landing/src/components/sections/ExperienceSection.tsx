import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const ExperienceSection = () => {
  const [selectedItem, setSelectedItem] = useState<string>('item-1');

  const experienceItems = [
    {
      id: 'item-1',
      label: '일정을 추가하기',
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    },
    {
      id: 'item-2',
      label: '이번주를 요약하기',
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae. Mauris commodo lectus at augue elementum, in faucibus erat mollis. Aliquam erat volutpat. Nulla facilisi.',
    },
    {
      id: 'item-3',
      label: '일정을 삭제하기',
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris.',
    },
  ];

  return (
    <section className="py-[200px]">
      <div className="flex flex-col gap-6 max-w-[1024px] mx-auto">
        {/* 헤더 영역 */}
        <div className="flex flex-col gap-3 justify-between">
          <h2 className="text-5xl leading-normal font-semibold text-foreground">
            간편한 일정 관리를 체험해보세요.
          </h2>
          <div className="h-fit text-lg leading-normal font-medium text-muted-foreground">
            체크메이트의 주요 기능들을 간단히 체험해보세요. <br />더 나은
            일정관리의 시작을 경험하실 수 있습니다.
          </div>
        </div>

        {/* 범용 체험 영역 */}
        <div className="w-full h-[512px] bg-gray-200 rounded-3xl" />

        {/* 상세 체험 파트 */}
        <div className="grid grid-cols-2 gap-8 mt-8">
          {/* 좌측 아코디언 영역 */}
          <div>
            <h3 className="text-2xl leading-none font-semibold mb-6">
              체크메이트 AI로
            </h3>
            <Accordion
              type="single"
              collapsible
              value={selectedItem}
              onValueChange={setSelectedItem}
              className="w-full"
            >
              {experienceItems.map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger
                    className={`text-base leading-none font-medium hover:no-underline ${
                      selectedItem === item.id
                        ? 'text-card-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {item.label}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* 우측 상세 체험 영역 */}
          <div className="h-[464px] bg-gray-200 rounded-3xl flex items-center justify-center">
            <span className="text-2xl font-semibold text-gray-600">
              {experienceItems.find((item) => item.id === selectedItem)?.label}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
