import React from 'react';

const Terms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">서비스 이용약관</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">제1조 (목적)</h2>
        <p>
          이 약관은 캘린더 서비스 이용과 관련하여 회사와 이용자의 권리, 의무 및
          책임사항을 규정함을 목적으로 합니다.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">제2조 (서비스 내용)</h2>
        <p>회사는 다음과 같은 서비스를 제공합니다:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>개인 캘린더 관리 서비스</li>
          <li>Google 캘린더 연동 서비스</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">제3조 (이용자의 의무)</h2>
        <p>
          이용자는 서비스를 선량한 목적으로만 사용해야 하며, 타인의 권리를
          침해하지 않아야 합니다.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">01051003080</h2>
        <p>서비스 관련 문의: jwj3199@gmail.com</p>
      </section>
    </div>
  );
};

export default Terms;
