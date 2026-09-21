export const translateChineseToVietnamese = async (chinese: string) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);
  const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=vi&dt=t&q=${encodeURIComponent(chinese)}`;

  try {
    try {
      const response = await fetch(googleUrl, { signal: controller.signal });
      if (!response.ok) throw new Error('Google Translate không khả dụng');

      const data = (await response.json()) as unknown[][];
      const segments = Array.isArray(data[0]) ? data[0] : [];
      const translated = segments
        .filter((segment): segment is unknown[] => Array.isArray(segment))
        .map((segment) => (typeof segment[0] === 'string' ? segment[0] : ''))
        .join('')
        .trim();

      if (translated) return translated;
    } catch {
      const fallbackController = new AbortController();
      const fallbackTimeoutId = window.setTimeout(() => fallbackController.abort(), 8000);
      try {
        const fallbackUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chinese)}&langpair=zh-CN|vi`;
        const response = await fetch(fallbackUrl, { signal: fallbackController.signal });
        if (!response.ok) throw new Error('Không thể dịch câu tiếng Trung');

        const data = (await response.json()) as {
          responseData?: { translatedText?: string };
        };
        const translated = data.responseData?.translatedText?.trim();
        if (translated) return translated;
      } finally {
        window.clearTimeout(fallbackTimeoutId);
      }
    }

    throw new Error('Không thể dịch câu tiếng Trung');
  } finally {
    window.clearTimeout(timeoutId);
  }
};
