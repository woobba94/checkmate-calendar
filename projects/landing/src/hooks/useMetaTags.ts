import { useEffect } from 'react';

interface MetaTags {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  keywords?: string;
}

export const useMetaTags = ({
  title = '체크메이트 캘린더 - AI 기반 스마트 일정 관리',
  description = '체크메이트 캘린더는 AI가 일정을 자동으로 관리해주는 스마트 캘린더입니다. 자연어로 일정을 추가하고, 구글 캘린더와 동기화하여 효율적으로 시간을 관리하세요.',
  image = 'https://checkmate-calendar.com/og-image.svg',
  url = 'https://checkmate-calendar.com/',
  keywords = '체크메이트 캘린더, Checkmate Calendar, AI 캘린더, 스마트 일정관리, 구글 캘린더 동기화, 자연어 일정 추가, AI 일정 관리',
}: MetaTags) => {
  useEffect(() => {
    // Update title
    document.title = title;

    // Helper function to update or create meta tag
    const updateMetaTag = (selector: string, content: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        const attributes = selector.match(/\[([^=]+)="([^"]+)"\]/);
        if (attributes) {
          element.setAttribute(attributes[1], attributes[2]);
        }
        document.head.appendChild(element);
      }
      if (selector.includes('property=')) {
        element.setAttribute('content', content);
      } else {
        element.content = content;
      }
    };

    // Update meta tags
    updateMetaTag('meta[name="title"]', title);
    updateMetaTag('meta[name="description"]', description);
    updateMetaTag('meta[name="keywords"]', keywords);

    // Update Open Graph tags
    updateMetaTag('meta[property="og:title"]', title);
    updateMetaTag('meta[property="og:description"]', description);
    updateMetaTag('meta[property="og:image"]', image);
    updateMetaTag('meta[property="og:url"]', url);

    // Update Twitter tags
    updateMetaTag('meta[property="twitter:title"]', title);
    updateMetaTag('meta[property="twitter:description"]', description);
    updateMetaTag('meta[property="twitter:image"]', image);
    updateMetaTag('meta[property="twitter:url"]', url);

    // Update canonical URL
    let canonical = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }, [title, description, image, url, keywords]);
};
