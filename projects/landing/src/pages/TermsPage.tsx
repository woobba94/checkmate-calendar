import Footer from '../components/Footer';
import { useMetaTags } from '../hooks/useMetaTags';

const TermsPage = () => {
  useMetaTags({
    title: '서비스 이용약관 - 체크메이트 캘린더',
    description: '체크메이트 캘린더 서비스 이용약관 및 정책을 확인하세요.',
    url: 'https://checkmate-calendar.com/terms',
  });
  return (
    <>
      <div className="min-h-[calc(100vh-80px)] py-12">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="max-w-[800px] mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-foreground">
              서비스 이용약관
            </h1>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                제1조 (목적)
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                이 약관은 캘린더 서비스 이용과 관련하여 회사와 이용자의 권리,
                의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                제2조 (서비스 내용)
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                회사는 다음과 같은 서비스를 제공합니다:
              </p>
              <ul className="list-disc list-inside text-muted-foreground leading-relaxed ml-4">
                <li>개인 캘린더 관리 서비스</li>
                <li>Google 캘린더 연동 서비스</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                제3조 (이용자의 의무)
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                이용자는 서비스를 선량한 목적으로만 사용해야 하며, 타인의 권리를
                침해하지 않아야 합니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                문의
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                서비스 관련 문의: jwj3199@gmail.com
              </p>
              <p className="text-muted-foreground leading-relaxed">
                전화: 01051003080
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TermsPage;
