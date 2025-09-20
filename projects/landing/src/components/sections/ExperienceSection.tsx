import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ExperienceSection = () => {
  const [selectedItem, setSelectedItem] = useState<string>('item-1');

  const experienceItems = [
    {
      id: 'item-1',
      label: '일정을 추가하기',
      mobileLabel: '일정 추가',
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea co',
    },
    {
      id: 'item-2',
      label: '이번주를 요약하기',
      mobileLabel: '일정 요약',
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae. Mauris commodo lectus at augue elementum, in faucibus erat mollis. Aliquam erat volutpat. Nulla facilisi.',
    },
    {
      id: 'item-3',
      label: '일정을 삭제하기',
      mobileLabel: '일정 삭제',
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris.',
    },
  ];

  return (
    <section className="py-20 md:py-[200px]">
      <div className="flex flex-col gap-6 max-w-[1024px] mx-auto px-5 md:px-6">
        {/* 헤더 영역 */}
        <div className="flex flex-col gap-3 justify-between">
          <h2 className="text-2xl md:text-5xl leading-normal font-bold md:font-semibold text-foreground">
            간편한 일정 관리를 체험해보세요.
          </h2>
          <div className="h-fit text-sm md:text-lg leading-normal font-medium text-muted-foreground">
            체크메이트의 주요 기능들을 간단히 체험해보세요.{' '}
            <br className="hidden md:block" />더 나은 일정관리의 시작을 경험하실
            수 있습니다.
          </div>
        </div>

        {/* 범용 체험 영역 */}
        <div className="w-full h-[300px] md:h-[512px] bg-gray-200 rounded-3xl" />

        {/* 데스크톱: 기존 아코디언 레이아웃 */}
        <div className="hidden md:grid grid-cols-2 gap-8 mt-8">
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

        {/* 모바일: Tabs 레이아웃 */}
        <div className="block md:hidden mt-6">
          <h3 className="text-xl leading-none font-semibold mb-4">
            체크메이트 AI로
          </h3>
          <Tabs defaultValue="item-1" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              {experienceItems.map((item) => (
                <TabsTrigger
                  key={item.id}
                  value={item.id}
                  className="text-xs font-medium"
                >
                  {item.mobileLabel}
                </TabsTrigger>
              ))}
            </TabsList>
            {experienceItems.map((item) => (
              <TabsContent key={item.id} value={item.id} className="mt-0">
                <div className="h-[80px] mb-4">
                  <p className="text-xs leading-normal text-muted-foreground">
                    {item.content}
                  </p>
                </div>
                <div className="h-[280px] bg-gray-200 rounded-2xl flex items-center justify-center">
                  <span className="text-lg leading-normal font-semibold text-gray-600">
                    {item.label}
                  </span>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
