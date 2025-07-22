import React from 'react';

const Privacy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">개인정보처리방침</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">수집하는 개인정보</h2>
        <p>본 서비스는 Google 계정 연동을 통해 다음 정보를 수집합니다:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>Google 계정 이메일 주소</li>
          <li>Google 캘린더 데이터 (읽기/쓰기)</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">개인정보 이용목적</h2>
        <ul className="list-disc ml-6">
          <li>캘린더 서비스 제공</li>
          <li>Google 캘린더 연동 기능 제공</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">개인정보 보관기간</h2>
        <p>사용자가 서비스 탈퇴 시까지 보관하며, 탈퇴 시 즉시 삭제됩니다.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">연락처</h2>
        <p>개인정보 관련 문의: jwj3199@gmail.com</p>
      </section>
    </div>
  );
};
export default Privacy;
