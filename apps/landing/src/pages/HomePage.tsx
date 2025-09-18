import Footer from '../components/Footer';
import {
  HeroSection,
  FeaturesSection,
  ExperienceSection,
  IntegrationSection,
  CTASection,
} from '../components/sections';
import { useMetaTags } from '../hooks/useMetaTags';

const HomePage = () => {
  useMetaTags({
    title: '체크메이트 캘린더 - AI 기반 스마트 일정 관리',
    description:
      '체크메이트 캘린더는 AI가 일정을 자동으로 관리해주는 스마트 캘린더입니다. 자연어로 일정을 추가하고, 구글 캘린더와 동기화하여 효율적으로 시간을 관리하세요.',
    url: 'https://checkmate-calendar.com/',
  });

  return (
    <>
      {/* Hero Section */}
      <HeroSection />

      {/* Features Overview Section */}
      <FeaturesSection />

      {/* Experience Section */}
      <ExperienceSection />

      {/* Integration Section */}
      <IntegrationSection />

      {/* CTA Section */}
      <CTASection />

      {/* 추가 섹션들은 나중에 디자인에 따라 구현 */}
      <Footer />
    </>
  );
};

export default HomePage;
