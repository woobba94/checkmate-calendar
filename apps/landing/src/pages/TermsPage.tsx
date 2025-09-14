import Header from '../components/Header';
import Footer from '../components/Footer';

const TermsPage = () => {
  return (
    <>
      <Header />
      <div className="page-container">
        <div className="container">
          <div className="content">
            <h1 className="page-title">서비스 이용약관</h1>

            <section>
              <h2>제1조 (목적)</h2>
              <p>
                이 약관은 캘린더 서비스 이용과 관련하여 회사와 이용자의 권리,
                의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h2>제2조 (서비스 내용)</h2>
              <p>회사는 다음과 같은 서비스를 제공합니다:</p>
              <ul>
                <li>개인 캘린더 관리 서비스</li>
                <li>Google 캘린더 연동 서비스</li>
              </ul>
            </section>

            <section>
              <h2>제3조 (이용자의 의무)</h2>
              <p>
                이용자는 서비스를 선량한 목적으로만 사용해야 하며, 타인의 권리를
                침해하지 않아야 합니다.
              </p>
            </section>

            <section>
              <h2>문의</h2>
              <p>서비스 관련 문의: jwj3199@gmail.com</p>
              <p>전화: 01051003080</p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TermsPage;
