import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { useMetaTags } from '../hooks/useMetaTags';
import { useI18n } from '@/contexts/I18nContext';

const PricingPage = () => {
  const { t } = useI18n();

  useMetaTags({
    title: '가격 - 체크메이트 캘린더',
    description:
      '체크메이트 캘린더의 가격 정보를 확인하세요. 무료 플랜부터 비즈니스 플랜까지 다양한 옵션을 제공합니다.',
    url: 'https://checkmate-calendar.com/pricing',
  });

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: t('@월@'),
      description: t('@개인_사용자를_위한_기본_기능@'),
      features: [
        t('@5개까지_캘린더_스페이스_생성@'),
        t('@공유_무제한@'),
        t('@타_캘린더_연동@'),
        t('@AI_Agent_기본_사용량@'),
      ],
      isPopular: false,
    },
    {
      name: 'Pro',
      price: '$1',
      period: t('@월@'),
      description: t('@개인_사용자를_위한_프리미엄_기능@'),
      features: [
        t('@Free_플랜의_모든_기능@'),
        t('@무제한_캘린더_스페이스@'),
        t('@AI_Agent_10배_확장@'),
        t('@광고_없음@'),
      ],
      isPopular: true,
    },
    {
      name: 'Business',
      price: '$1',
      period: t('@사용자당_월@'),
      description: t('@팀과_조직을_위한_완전한_기능@'),
      features: [
        t('@Pro_플랜의_모든_기능@'),
        t('@어드민_관리_기능@'),
        t('@팀_통계_및_분석@'),
        t('@우선_고객_지원@'),
      ],
      isPopular: false,
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-[1200px] mx-auto px-5 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
              {t('@간단하고_투명한_가격@')}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              {t('@필요한_기능만_선택하세요@')}
            </p>
          </div>
        </section>

        {/* Pricing Plans */}
        <section className="pb-16 md:pb-24">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border p-6 md:p-8 bg-white ${
                    plan.isPopular
                      ? 'border-blue-500 shadow-lg scale-105'
                      : 'border-gray-200'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                        {t('@가장_인기@')}
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-gray-600 ml-1">/{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() =>
                      (window.location.href =
                        'https://app.checkmate-calendar.com')
                    }
                    variant={plan.isPopular ? 'primary' : 'outline'}
                    className="w-full"
                  >
                    {plan.name === 'Free'
                      ? t('@무료로_시작하기@')
                      : t('@시작하기@')}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="p-16 md:pb-24 bg-gray-50">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {t('@자주_묻는_질문@')}
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t('@언제든_플랜을_변경할_수_있나요@')}
                </h3>
                <p className="text-gray-600">
                  {t(
                    '@네_언제든지_플랜을_업그레이드하거나_다운그레이드할_수_있습니다@'
                  )}
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t('@무료_플랜으로_시작할_수_있나요@')}
                </h3>
                <p className="text-gray-600">
                  {t('@물론입니다_무료_플랜으로_시작해서@')}
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t('@비즈니스_플랜은_어떤_기능이_추가되나요@')}
                </h3>
                <p className="text-gray-600">
                  {t('@비즈니스_플랜은_팀_관리를_위한@')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default PricingPage;
