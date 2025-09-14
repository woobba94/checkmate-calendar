import Footer from '../components/Footer';

const PrivacyPage = () => {
  return (
    <>
      <div className="min-h-[calc(100vh-80px)] py-12">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="max-w-[800px] mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-foreground">
              개인정보처리방침
            </h1>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                수집하는 개인정보
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                본 서비스는 Google 계정 연동을 통해 다음 정보를 수집합니다:
              </p>
              <ul className="list-disc list-inside text-muted-foreground leading-relaxed ml-4">
                <li>Google 계정 이메일 주소</li>
                <li>Google 캘린더 데이터 (읽기/쓰기)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                개인정보 이용목적
              </h2>
              <ul className="list-disc list-inside text-muted-foreground leading-relaxed ml-4">
                <li>캘린더 서비스 제공</li>
                <li>Google 캘린더 연동 기능 제공</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                개인정보 보관기간
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                사용자가 서비스 탈퇴 시까지 보관하며, 탈퇴 시 즉시 삭제됩니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                연락처
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                개인정보 관련 문의: jwj3199@gmail.com
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PrivacyPage;
