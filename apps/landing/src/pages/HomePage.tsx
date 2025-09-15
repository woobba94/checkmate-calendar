import Footer from '../components/Footer';
import { HeroSection, FeaturesSection } from '../components/sections';

const HomePage = () => {
  return (
    <>
      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Features Overview Section */}
        <FeaturesSection />

        {/* 추가 섹션들은 나중에 디자인에 따라 구현 */}
      </main>
      <Footer />
    </>
  );
};

export default HomePage;
