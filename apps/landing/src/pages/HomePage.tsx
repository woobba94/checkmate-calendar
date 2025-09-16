import Footer from '../components/Footer';
import {
  HeroSection,
  FeaturesSection,
  ExperienceSection,
  IntegrationSection,
  CTASection,
} from '../components/sections';

const HomePage = () => {
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
