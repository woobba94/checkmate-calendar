import Header from '../components/Header';
import Footer from '../components/Footer';

const HomePage = () => {
  const handleGetStarted = () => {
    window.location.href = 'https://app.checkmate-calendar.com';
  };

  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container">
            <h1>Welcome to Checkmate Calendar</h1>
            <p>
              A smart calendar solution that helps you manage your time
              efficiently and collaborate seamlessly with your team.
            </p>
            <button onClick={handleGetStarted} className="cta-button">
              Get Started
            </button>
          </div>
        </section>

        {/* 추가 섹션들은 나중에 디자인에 따라 구현 */}
      </main>
      <Footer />
    </>
  );
};

export default HomePage;
